import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PCBQuote AI — Intelligent PCB Manufacturing Cost Estimation",
    template: "%s | PCBQuote AI",
  },
  description:
    "AI-powered PCB size and manufacturing cost estimation. Instant quotes for PCB fabrication, assembly, and testing. Trusted by engineers and manufacturers worldwide.",
  keywords: ["PCB quote", "PCB manufacturing cost", "PCB estimation", "Gerber quote", "PCB assembly"],
  authors: [{ name: "PCBQuote AI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "PCBQuote AI",
    description: "Instant AI-powered PCB manufacturing quotes",
    siteName: "PCBQuote AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "PCBQuote AI",
    description: "Instant AI-powered PCB manufacturing quotes",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
