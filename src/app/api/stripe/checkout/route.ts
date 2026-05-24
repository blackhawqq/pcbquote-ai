import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCheckoutSession, createPortalSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId, action } = await req.json();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Manage existing subscription via Stripe portal
  if (action === "portal") {
    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }
    const portal = await createPortalSession(user.stripeCustomerId, `${appUrl}/subscription`);
    return NextResponse.json({ url: portal.url });
  }

  // New subscription checkout
  if (!priceId) return NextResponse.json({ error: "Price ID required" }, { status: 400 });

  const checkout = await createCheckoutSession({
    userId: user.id,
    email: user.email,
    priceId,
    successUrl: `${appUrl}/subscription?success=true`,
    cancelUrl: `${appUrl}/subscription?canceled=true`,
  });

  return NextResponse.json({ url: checkout.url });
}
