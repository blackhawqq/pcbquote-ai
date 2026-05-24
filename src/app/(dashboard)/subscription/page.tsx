"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, Zap, Crown, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/use-toast";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    icon: Zap,
    iconColor: "text-muted-foreground",
    features: [
      "5 quotes per month",
      "Manual parameter input",
      "Basic cost breakdown",
      "Watermarked PDF export",
    ],
    priceId: { monthly: null, yearly: null },
  },
  {
    key: "PRO",
    name: "Pro",
    price: { monthly: 49, yearly: 39 },
    icon: Crown,
    iconColor: "text-sky-400",
    badge: "Most Popular",
    features: [
      "Unlimited quotes",
      "Gerber file upload & parsing",
      "Full DFM analysis",
      "Unwatermarked PDF export",
      "CSV & JSON export",
      "REST API access (100k req/mo)",
      "Priority support",
    ],
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY ?? "price_pro_monthly",
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY ?? "price_pro_yearly",
    },
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: { monthly: 199, yearly: 159 },
    icon: Building2,
    iconColor: "text-purple-400",
    features: [
      "Everything in Pro",
      "Multi-user team accounts",
      "White-label quoting",
      "ERP/MES integration",
      "Custom pricing engine",
      "Volume discount modeling",
      "Dedicated account manager",
      "99.9% SLA",
    ],
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY ?? "price_enterprise_monthly",
      yearly: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY ?? "price_enterprise_yearly",
    },
  },
];

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(priceId: string | null, planKey: string) {
    if (!priceId || planKey === "FREE") return;
    setLoading(planKey);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    });

    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      toast({ title: "Error", description: data.error, variant: "destructive" });
    }
    setLoading(null);
  }

  async function handleManage() {
    setLoading("portal");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "portal" }),
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
    }
    setLoading(null);
  }

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your PCBQuote AI plan</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center gap-4 justify-center">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billing === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling("yearly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${billing === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Yearly <Badge variant="success" className="text-xs">Save 20%</Badge>
        </button>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const price = plan.price[billing];
          const priceId = plan.priceId[billing];
          const isCurrentPlan = false; // TODO: check against user's actual plan

          return (
            <Card key={plan.key} className={`glass flex flex-col relative ${plan.key === "PRO" ? "border-primary/50 shadow-lg shadow-primary/10" : ""}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="pro" className="px-4">{plan.badge}</Badge>
                </div>
              )}
              <CardContent className="pt-8 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-muted-foreground text-sm">/{billing === "yearly" ? "mo, billed yearly" : "month"}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.key === "FREE" ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant={plan.key === "PRO" ? "gradient" : "outline"}
                    className="w-full"
                    loading={loading === plan.key}
                    onClick={() => handleSubscribe(priceId, plan.key)}
                  >
                    Subscribe to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Manage existing subscription */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Manage Subscription</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Update payment method, view invoices, or cancel via the Stripe billing portal
              </p>
            </div>
            <Button
              variant="outline"
              loading={loading === "portal"}
              onClick={handleManage}
              className="gap-2 shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
              Billing Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
