import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: "Free",
    quotesPerMonth: parseInt(process.env.FREE_QUOTES_PER_MONTH ?? "5"),
    apiAccess: false,
    teamCollaboration: false,
    csvExport: false,
    whiteLabel: false,
    prioritySupport: false,
    watermarkedPdf: true,
  },
  PRO: {
    name: "Pro",
    quotesPerMonth: -1, // unlimited
    apiAccess: true,
    teamCollaboration: false,
    csvExport: true,
    whiteLabel: false,
    prioritySupport: false,
    watermarkedPdf: false,
    monthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
  ENTERPRISE: {
    name: "Enterprise",
    quotesPerMonth: -1,
    apiAccess: true,
    teamCollaboration: true,
    csvExport: true,
    whiteLabel: true,
    prioritySupport: true,
    watermarkedPdf: false,
    monthlyPriceId: process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID,
    yearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export async function createCheckoutSession({
  userId,
  email,
  priceId,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    client_reference_id: userId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { userId },
    },
    allow_promotion_codes: true,
  });
  return session;
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}
