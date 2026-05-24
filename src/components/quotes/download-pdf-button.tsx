"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/use-toast";

interface Props {
  quoteId: string;
  existingPdfUrl?: string | null;
}

export function DownloadPdfButton({ quoteId, existingPdfUrl }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    // If PDF already generated, open it directly
    if (existingPdfUrl) {
      const a = document.createElement("a");
      a.href = existingPdfUrl;
      a.download = `quote-${quoteId.slice(-8).toUpperCase()}.pdf`;
      a.target = "_blank";
      a.click();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "PDF generation failed",
          description: err.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }
      const data = await res.json();
      if (!data.pdfUrl) {
        toast({ title: "PDF not available", description: "Please try again.", variant: "destructive" });
        return;
      }
      // Download the file
      const a = document.createElement("a");
      a.href = data.pdfUrl;
      a.download = `quote-${quoteId.slice(-8).toUpperCase()}.pdf`;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: "PDF downloaded", description: "Your quote report is ready." });
    } catch {
      toast({
        title: "Download failed",
        description: "Could not reach the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      {loading
        ? <Loader2 className="h-4 w-4 animate-spin" />
        : <Download className="h-4 w-4" />}
      {loading ? "Generating PDF…" : "Download PDF"}
    </Button>
  );
}
