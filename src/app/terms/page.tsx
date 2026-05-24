import Link from "next/link";
import { Cpu } from "lucide-react";

export const metadata = {
  title: "Terms of Service — PCBQuote AI",
  description: "Terms and conditions for using PCBQuote AI.",
};

export default function TermsPage() {
  const lastUpdated = "May 24, 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">PCBQuote <span className="text-primary">AI</span></span>
          </Link>
          <Link href="/register" className="text-sm text-primary hover:underline">
            Back to sign up
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using PCBQuote AI ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              PCBQuote AI is a software-as-a-service platform that provides AI-powered printed circuit board (PCB) manufacturing cost estimation, design-for-manufacturability (DFM) analysis, Gerber file parsing, and manufacturer price comparisons. The cost estimates provided are for informational purposes only and do not constitute binding quotes from any manufacturer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You must create an account to use the Service. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Maintaining the confidentiality of your account credentials.</li>
              <li>All activity that occurs under your account.</li>
              <li>Providing accurate and complete registration information.</li>
              <li>Notifying us immediately of any unauthorized use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Subscription Plans and Billing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              PCBQuote AI offers both free and paid subscription tiers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Free Plan:</strong> Limited to 5 quotes per month with basic features.</li>
              <li><strong className="text-foreground">Pro Plan:</strong> $29/month or $290/year. Includes 50 quotes/month, AI market analysis, and PDF reports.</li>
              <li><strong className="text-foreground">Enterprise Plan:</strong> $99/month or $990/year. Includes unlimited quotes, API access, and priority support.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by applicable law. You may cancel your subscription at any time; access continues until the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the Service for any unlawful purpose or in violation of these Terms.</li>
              <li>Attempt to reverse-engineer, decompile, or disassemble any part of the Service.</li>
              <li>Upload files containing malware, viruses, or malicious code.</li>
              <li>Scrape, crawl, or systematically extract data from the Service.</li>
              <li>Resell or sublicense access to the Service without written permission.</li>
              <li>Use the Service to compete directly with PCBQuote AI.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service, including its original content, features, and functionality, is and will remain the exclusive property of PCBQuote AI. Your Gerber files and uploaded content remain your property. By uploading files, you grant PCBQuote AI a limited license to process and analyze them solely to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. PCBQuote AI does not warrant that cost estimates will be accurate, that the Service will be uninterrupted or error-free, or that results obtained from the Service will be accurate or reliable. Cost estimates are approximations and actual manufacturing costs may vary significantly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, PCBQuote AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities arising from your use of the Service. Our total liability for any claim shall not exceed the amount you paid us in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at our sole discretion, with or without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or a prominent notice on the Service. Continued use of the Service after changes become effective constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising under these Terms shall be resolved through binding arbitration or in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:keskin3084@gmail.com" className="text-primary hover:underline">
                keskin3084@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
          <Link href="/" className="hover:text-foreground hover:underline">Home</Link>
        </div>
      </main>
    </div>
  );
}
