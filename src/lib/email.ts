// Email with graceful fallback when SMTP is not configured

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

async function sendMail(to: string, subject: string, html: string) {
  if (!SMTP_CONFIGURED) {
    console.log(`[Email skipped — SMTP not configured]\nTo: ${to}\nSubject: ${subject}`);
    return;
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await sendMail(email, "Welcome to PCBQuote AI", `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#0EA5E9">Welcome to PCBQuote AI, ${name}!</h1>
      <p>Your account is ready. Start getting instant PCB manufacturing quotes.</p>
      <a href="${APP_URL}/dashboard" style="background:#0EA5E9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">Go to Dashboard</a>
    </div>
  `);
}

export async function sendQuoteReadyEmail(email: string, name: string, referenceNo: string, totalCost: number, currency: string) {
  await sendMail(email, `Your PCB Quote #${referenceNo} is Ready`, `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#0EA5E9">Your Quote is Ready</h1>
      <p>Hi ${name}, your PCB manufacturing quote has been processed.</p>
      <p><strong>Reference:</strong> #${referenceNo}</p>
      <p><strong>Total Cost:</strong> ${currency} ${totalCost.toFixed(2)}</p>
      <a href="${APP_URL}/quotes/${referenceNo}" style="background:#0EA5E9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">View Full Quote</a>
    </div>
  `);
}

export async function sendSubscriptionConfirmEmail(email: string, name: string, plan: string) {
  await sendMail(email, `PCBQuote AI ${plan} Plan Activated`, `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h1 style="color:#00C853">${plan} Plan Activated!</h1>
      <p>Hi ${name}, your ${plan} subscription is now active.</p>
      <a href="${APP_URL}/dashboard" style="background:#0EA5E9;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">Start Using PCBQuote AI</a>
    </div>
  `);
}
