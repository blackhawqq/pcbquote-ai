import { Metadata } from "next";
import Link from "next/link";
import {
  Cpu, Zap, Shield, BarChart3, FileUp, Clock,
  CheckCircle, ArrowRight, Star, Globe, Users, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "PCBQuote AI — Instant AI-Powered PCB Manufacturing Quotes",
};

const STATS = [
  { label: "Quotes Generated", value: "50,000+" },
  { label: "Avg. Quote Time", value: "< 3s" },
  { label: "Cost Accuracy", value: "±8%" },
  { label: "Countries Served", value: "45+" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Instant AI Estimation",
    description: "Upload Gerber files or enter specs manually. Get accurate manufacturing cost breakdowns in under 3 seconds.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: FileUp,
    title: "Gerber File Upload",
    description: "Drag-and-drop your Gerber ZIP files. Our AI parses layer count, dimensions, via density, and trace widths automatically.",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
  },
  {
    icon: BarChart3,
    title: "Full Cost Breakdown",
    description: "Material, fabrication, assembly, testing, packaging, and shipping — every cost component itemized and explained.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: Shield,
    title: "DFM Analysis",
    description: "IPC-2221 compliant Design for Manufacturability scoring. Catch costly design errors before they reach the factory floor.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Clock,
    title: "Lead Time Prediction",
    description: "AI-calculated production lead times based on board complexity, layer count, and assembly requirements.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Globe,
    title: "Multi-Currency & Language",
    description: "Quote in USD, EUR, GBP, JPY, CNY, and more. Interface available in 12 languages for global teams.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    description: "Perfect for evaluating PCBQuote AI",
    badge: null,
    features: [
      "5 quotes per month",
      "Manual parameter input",
      "Basic cost breakdown",
      "Watermarked PDF export",
      "Email support",
    ],
    cta: "Get Started Free",
    href: "/register",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For serious engineers and small manufacturers",
    badge: "Most Popular",
    features: [
      "Unlimited quotes",
      "Gerber file upload & parsing",
      "Full DFM analysis",
      "Unwatermarked PDF export",
      "CSV & JSON export",
      "REST API access",
      "Priority email support",
    ],
    cta: "Start Pro Trial",
    href: "/register?plan=pro",
    variant: "gradient" as const,
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    description: "For OEM factories and manufacturing companies",
    badge: null,
    features: [
      "Everything in Pro",
      "Multi-user team accounts",
      "White-label quoting",
      "ERP/MES integration (CSV/API)",
      "Custom pricing engine",
      "Volume discount modeling",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    href: "/contact",
    variant: "outline" as const,
    highlight: false,
  },
];

const TESTIMONIALS = [
  {
    name: "Marcus Chen",
    role: "Hardware Lead, Luminary Electronics",
    text: "PCBQuote AI saved us 4 hours per week on manual quoting. The DFM analysis caught a trace width issue that would have cost us $8k in failed boards.",
    stars: 5,
  },
  {
    name: "Sarah Müller",
    role: "PCB Design Engineer, BerlinTech",
    text: "The Gerber parser is incredibly accurate. We upload our files and get a quote with full cost breakdown instantly. Game changer for our pricing workflow.",
    stars: 5,
  },
  {
    name: "James Okafor",
    role: "CEO, NigeriaBoard Manufacturing",
    text: "We white-labeled PCBQuote AI for our customers. The API integration was seamless and our quote response time went from days to seconds.",
    stars: 5,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PCBQuote <span className="text-primary">AI</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" variant="gradient">
              <Link href="/register">Start Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-100" />
        <div className="absolute inset-0 bg-hero-gradient" />

        <div className="container relative z-10 text-center">
          <Badge variant="info" className="mb-6 px-4 py-1.5 text-sm">
            <Zap className="h-3 w-3 mr-1" /> AI-Powered PCB Quoting — Now in Beta
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            PCB Quotes in{" "}
            <span className="text-gradient">3 Seconds</span>
            <br />
            Not 3 Days
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Upload your Gerber files or enter specs manually. PCBQuote AI instantly calculates
            material costs, manufacturing complexity, assembly pricing, lead times, and DFM warnings.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" variant="gradient" className="animate-pulse-glow">
              <Link href="/register">
                Get Instant Quote Free <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="#features">See How It Works</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {STATS.map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Quote Smarter</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              From Gerber parsing to DFM analysis — PCBQuote AI handles the entire quoting workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="glass hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="pt-6">
                    <div className={`inline-flex p-3 rounded-lg ${feature.bg} mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-secondary/20">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground">Start free. Scale as you grow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105"
                    : "border-border bg-card"
                }`}
              >
                {plan.badge && (
                  <Badge variant="pro" className="absolute -top-3 left-1/2 -translate-x-1/2 px-4">
                    {plan.badge}
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button asChild variant={plan.variant} className="w-full">
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Reviews</Badge>
            <h2 className="text-4xl font-bold mb-4">Trusted by Engineers Worldwide</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="glass">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-sky-500/10 to-blue-600/10 border-y border-border">
        <div className="container text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Quote Smarter?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join 2,000+ engineers and manufacturers who use PCBQuote AI to save time and win more business.
          </p>
          <Button asChild size="xl" variant="gradient">
            <Link href="/register">
              Start for Free — No Credit Card Required <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <span className="font-bold">PCBQuote AI</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
            </div>
            <p className="text-sm text-muted-foreground">© 2024 PCBQuote AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
