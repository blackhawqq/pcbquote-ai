// S3 with local filesystem fallback for development
// On Vercel (no S3): files are processed in-memory only; no permanent storage

import path from "path";
import fs from "fs/promises";

const USE_S3 = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_S3_BUCKET);
const IS_VERCEL = !!process.env.VERCEL;
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

async function ensureLocalDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  userId: string
): Promise<{ key: string; url: string }> {
  if (USE_S3) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { v4: uuidv4 } = await import("uuid");
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const ext = originalName.split(".").pop();
    const key = `uploads/${userId}/${uuidv4()}.${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }));
    return { key, url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}` };
  }

  // On Vercel without S3: return a placeholder (file is parsed in-memory, not stored)
  if (IS_VERCEL) {
    const { v4: uuidv4 } = await import("uuid");
    const ext = originalName.split(".").pop();
    const key = `uploads/${userId}/${uuidv4()}.${ext}`;
    return { key, url: "" }; // No permanent URL; specs extracted from buffer
  }

  // Local dev fallback — write to public/uploads
  const { v4: uuidv4 } = await import("uuid");
  const ext = originalName.split(".").pop();
  const filename = `${uuidv4()}.${ext}`;
  const dir = path.join(LOCAL_UPLOAD_DIR, userId);
  await ensureLocalDir(dir);
  await fs.writeFile(path.join(dir, filename), buffer);
  const key = `uploads/${userId}/${filename}`;
  const url = `/uploads/${userId}/${filename}`;
  return { key, url };
}

export async function uploadPdf(buffer: Buffer, userId: string, quoteId: string): Promise<string> {
  if (USE_S3) {
    const { S3Client, PutObjectCommand, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const s3 = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    const key = `pdfs/${userId}/${quoteId}.pdf`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    }));
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }), { expiresIn: 86400 });
  }

  // On Vercel without S3: return data URL so PDF is still downloadable
  if (IS_VERCEL) {
    const base64 = buffer.toString("base64");
    return `data:application/pdf;base64,${base64}`;
  }

  // Local dev fallback
  const dir = path.join(LOCAL_UPLOAD_DIR, "pdfs", userId);
  await ensureLocalDir(dir);
  await fs.writeFile(path.join(dir, `${quoteId}.pdf`), buffer);
  return `/uploads/pdfs/${userId}/${quoteId}.pdf`;
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  if (USE_S3) {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const s3 = new S3Client({ region: process.env.AWS_REGION! });
    return getSignedUrl(s3, new GetObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }), { expiresIn: 3600 });
  }
  return `/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  if (!USE_S3) {
    const localPath = path.join(process.cwd(), "public", key);
    await fs.unlink(localPath).catch(() => {});
    return;
  }
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({ region: process.env.AWS_REGION! });
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key }));
}
