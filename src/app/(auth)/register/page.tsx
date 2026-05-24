"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cpu, Mail, Lock, User, Building2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/use-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters required.", variant: "destructive" });
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      toast({ title: "Registration failed", description: data.error, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Auto sign in
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
  }

  const PERKS = [
    "5 free quotes to get started",
    "Gerber file upload & parsing",
    "DFM analysis & warnings",
    "PDF quote generation",
    "No credit card required",
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-sky-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-size opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16">
            <Cpu className="h-7 w-7 text-sky-400" />
            <span className="text-2xl font-bold text-white">PCBQuote <span className="text-sky-400">AI</span></span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">
            Start quoting PCBs instantly
          </h2>
          <ul className="space-y-4">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3 text-sky-100">
                <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative z-10 bg-white/10 rounded-2xl p-6 backdrop-blur border border-white/20">
          <p className="text-sky-100 italic text-sm mb-3">
            "PCBQuote AI reduced our quoting time from 2 hours to 3 seconds. Incredible tool."
          </p>
          <div className="text-white font-semibold text-sm">Marcus Chen</div>
          <div className="text-sky-300 text-xs">Hardware Lead, Luminary Electronics</div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PCBQuote <span className="text-primary">AI</span></span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground mb-8">Free forever. No credit card required.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="John Smith"
                  className="pl-10"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="engineer@company.com"
                  className="pl-10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Company Name <span className="text-muted-foreground">(optional)</span></label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Acme Electronics"
                  className="pl-10"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  className="pl-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading} variant="gradient">
              Create Free Account
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By signing up you agree to our{" "}
              <Link href="/terms" className="underline hover:text-foreground">Terms</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
