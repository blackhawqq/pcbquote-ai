import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quote = await prisma.quote.findFirst({
    where: {
      OR: [{ id: params.id }, { referenceNo: params.id }],
      ...(session.user.role === "USER" ? { userId: session.user.id } : {}),
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      quoteId: quote.id,
      action: "QUOTE_VIEWED",
      metadata: JSON.stringify({ referenceNo: quote.referenceNo }),
    },
  });

  return NextResponse.json({ quote });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quote = await prisma.quote.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.quote.delete({ where: { id: quote.id } });

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const quote = await prisma.quote.findFirst({
    where: {
      OR: [{ id: params.id }, { referenceNo: params.id }],
      userId: session.user.id,
    },
  });

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });

  try {
    const { generateQuotePdf } = await import("@/engine/pdf-generator");
    const { uploadPdf } = await import("@/lib/s3");

    const isWatermarked = !user?.subscription || user.subscription.plan === "FREE";
    const pdfData = {
      ...quote,
      dfmWarnings: JSON.parse(quote.dfmWarnings || "[]"),
      optimizationSuggestions: JSON.parse(quote.optimizationSuggestions || "[]"),
      manufacturingNotes: JSON.parse(quote.manufacturingNotes || "[]"),
      user: { name: session.user.name ?? null, email: session.user.email, companyName: null },
    };

    const pdfBuffer = await generateQuotePdf(pdfData as Parameters<typeof generateQuotePdf>[0], isWatermarked);
    const pdfUrl = await uploadPdf(pdfBuffer, session.user.id, quote.id);

    await prisma.quote.update({
      where: { id: quote.id },
      data: { pdfUrl, pdfGeneratedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        quoteId: quote.id,
        action: "EXPORT",
        metadata: JSON.stringify({ type: "PDF" }),
      },
    });

    return NextResponse.json({ pdfUrl });
  } catch (err) {
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
