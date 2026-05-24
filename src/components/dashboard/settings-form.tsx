"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/use-toast";
import { User, Building2, Globe, Shield } from "lucide-react";

interface UserSettings {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  phone: string | null;
  country: string | null;
  timezone: string;
  currency: string;
  language: string;
}

export function SettingsForm({ user }: { user: UserSettings }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user.name ?? "",
    companyName: user.companyName ?? "",
    phone: user.phone ?? "",
    country: user.country ?? "",
    currency: user.currency,
    language: user.language,
    currentPassword: "",
    newPassword: "",
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        companyName: form.companyName,
        phone: form.phone,
        country: form.country,
        currency: form.currency,
        language: form.language,
      }),
    });
    if (res.ok) {
      toast({ title: "Settings saved" });
    } else {
      toast({ title: "Save failed", variant: "destructive" });
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Profile */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Full Name</label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Smith" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <Input value={user.email} disabled className="opacity-60" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
              <Input value={form.country} onChange={(e) => update("country", e.target.value)} placeholder="United States" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" /> Company
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Name</label>
            <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="Acme Electronics" />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Default Currency</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
            >
              {["USD", "EUR", "GBP", "JPY", "CNY", "CAD", "AUD", "INR", "TRY"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Language</label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.language}
              onChange={(e) => update("language", e.target.value)}
            >
              {[["en", "English"], ["tr", "Türkçe"], ["de", "Deutsch"], ["zh", "中文"], ["ja", "日本語"]].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" variant="gradient" loading={saving}>Save Settings</Button>
    </form>
  );
}
