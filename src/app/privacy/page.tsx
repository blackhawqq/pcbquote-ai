import Link from "next/link";
import { Cpu } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — PCBQuote AI",
  description: "How PCBQuote AI collects, uses, and protects your data.",
};

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10">Last updated: {lastUpdated}</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              PCBQuote AI ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service at pcbquote-ai.vercel.app. Please read this policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>

            <h3 className="text-base font-semibold mb-2 mt-4">Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Account information:</strong> Name, email address, company name, and password when you register.</li>
              <li><strong className="text-foreground">PCB specifications:</strong> Board dimensions, layer count, material specs, and other technical parameters you enter.</li>
              <li><strong className="text-foreground">Uploaded files:</strong> Gerber files and related PCB design files you upload for analysis.</li>
              <li><strong className="text-foreground">Payment information:</strong> Billing details processed securely by Stripe. We never store full card numbers.</li>
              <li><strong className="text-foreground">Communications:</strong> Messages you send us via email or support channels.</li>
            </ul>

            <h3 className="text-base font-semibold mb-2 mt-4">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Usage data:</strong> Pages visited, features used, quote history, and interaction patterns.</li>
              <li><strong className="text-foreground">Device information:</strong> IP address, browser type, operating system, and device identifiers.</li>
              <li><strong className="text-foreground">Log data:</strong> Server logs including timestamps, request paths, and error reports.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>To provide, operate, and maintain the Service.</li>
              <li>To process PCB quote calculations and return results to you.</li>
              <li>To process payments and manage your subscription.</li>
              <li>To send transactional emails (quote confirmations, billing receipts, account alerts).</li>
              <li>To improve and personalize the Service based on usage patterns.</li>
              <li>To detect and prevent fraud, abuse, and security incidents.</li>
              <li>To comply with legal obligations.</li>
              <li>To respond to your support requests and communications.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              We do not sell your personal data to third parties. We do not use your uploaded Gerber files or PCB specifications for any purpose other than providing the Service to you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Service providers:</strong> Trusted third parties that help operate our Service (Vercel for hosting, Neon for database, Stripe for payments, Anthropic for AI analysis). These providers are contractually obligated to protect your data.</li>
              <li><strong className="text-foreground">Legal requirements:</strong> When required by law, court order, or government authority.</li>
              <li><strong className="text-foreground">Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, with advance notice to you.</li>
              <li><strong className="text-foreground">With your consent:</strong> For any other purpose with your explicit consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your account data for as long as your account is active or as needed to provide the Service. Quote data is retained indefinitely to allow you to review your history. Uploaded Gerber files are processed in memory and are not permanently stored on our servers. You may request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures including SSL/TLS encryption for data in transit, encrypted database storage, hashed passwords (bcrypt), and access controls. However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use session cookies to maintain your login state and authentication tokens. We do not use tracking cookies or third-party advertising cookies. You can control cookies through your browser settings; however, disabling cookies may affect the functionality of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Depending on your location, you may have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong className="text-foreground">Deletion:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong className="text-foreground">Portability:</strong> Request your data in a structured, machine-readable format.</li>
              <li><strong className="text-foreground">Objection:</strong> Object to processing of your data in certain circumstances.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:keskin3084@gmail.com" className="text-primary hover:underline">keskin3084@gmail.com</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service is not directed to children under 16 years of age. We do not knowingly collect personal information from children under 16. If we learn that we have collected such information, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service may contain links to third-party websites such as PCB manufacturer websites. We are not responsible for the privacy practices of those sites. We encourage you to review their privacy policies before providing any information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated "Last updated" date and, where appropriate, by email notification. Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-3 p-4 rounded-lg border border-border bg-muted/30">
              <p className="text-foreground font-medium">PCBQuote AI</p>
              <p className="text-muted-foreground">Email:{" "}
                <a href="mailto:keskin3084@gmail.com" className="text-primary hover:underline">
                  keskin3084@gmail.com
                </a>
              </p>
              <p className="text-muted-foreground">Website: pcbquote-ai.vercel.app</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground hover:underline">Terms of Service</Link>
          <Link href="/" className="hover:text-foreground hover:underline">Home</Link>
        </div>
      </main>
    </div>
  );
}
