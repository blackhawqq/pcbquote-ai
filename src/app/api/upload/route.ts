import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/s3";
import { gerberParser } from "@/engine/gerber-parser";
import { rateLimit } from "@/lib/redis";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
  "text/plain",
];
const ALLOWED_EXTENSIONS = [".zip", ".gbr", ".ger", ".gtl", ".gbl", ".gbs", ".gts", ".drl", ".txt"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await rateLimit(`upload:${session.user.id}`, 10, 60000);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { error: "Invalid file type. Supported: ZIP, GBR, GER, GTL, GBL, DRL" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { key, url } = await uploadFile(buffer, file.name, file.type || "application/octet-stream", session.user.id);

  // Attempt Gerber parsing for pre-filled specs
  let parsedSpecs = null;
  if (ext === ".zip") {
    try {
      parsedSpecs = await gerberParser.parseZip(buffer);
    } catch (_) {
      // Non-fatal — user fills in manually
    }
  }

  return NextResponse.json({
    success: true,
    file: {
      url,
      key,
      name: file.name,
      size: file.size,
    },
    parsedSpecs,
  });
}
