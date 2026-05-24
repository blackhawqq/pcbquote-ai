import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendSubscriptionConfirmEmail } from "@/lib/email";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(invoice);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: session.customer as string },
  });
}

async function handleSubscriptionUpdate(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  if (!userId) return;

  const priceId = sub.items.data[0]?.price.id ?? "";

  let plan: "FREE" | "PRO" | "ENTERPRISE" = "FREE";
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
    plan = "PRO";
  } else if (priceId === process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID) {
    plan = "ENTERPRISE";
  }

  const status = mapStripeStatus(sub.status);

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plan,
      status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      plan,
      status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUBSCRIPTION_CHANGED",
      metadata: JSON.stringify({ plan, status, subscriptionId: sub.id }),
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && status === "ACTIVE") {
    sendSubscriptionConfirmEmail(user.email, user.name ?? "there", plan).catch(() => {});
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  if (!userId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: "CANCELED", canceledAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "SUBSCRIPTION_CHANGED",
      metadata: JSON.stringify({ event: "CANCELED", subscriptionId: sub.id }),
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (!sub) return;

  await prisma.invoice.create({
    data: {
      userId: sub.userId,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: "PAID",
      pdfUrl: invoice.invoice_pdf,
      invoiceUrl: invoice.hosted_invoice_url,
      periodStart: new Date((invoice.period_start) * 1000),
      periodEnd: new Date((invoice.period_end) * 1000),
    },
  });
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: "PAST_DUE" },
  });
}

function mapStripeStatus(status: string): "ACTIVE" | "INACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "UNPAID" {
  const map: Record<string, "ACTIVE" | "INACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELED" | "UNPAID"> = {
    active: "ACTIVE",
    trialing: "TRIALING",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "INACTIVE",
    incomplete_expired: "INACTIVE",
  };
  return map[status] ?? "INACTIVE";
}

