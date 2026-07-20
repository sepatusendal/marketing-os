import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Best-effort email send — never throws. Amends PRD D10 (docs/marketingos-prd.md):
 * notifications are in-app plus email. An email provider outage must not break
 * the mutation or the in-app Notification row, so failures are swallowed here.
 */
export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  body: string;
}) {
  if (!resend || !process.env.EMAIL_FROM) {
    console.warn("RESEND_API_KEY/EMAIL_FROM not configured — skipping email send.");
    return;
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      text: params.body,
    });
  } catch (err) {
    console.error("Failed to send notification email:", err);
  }
}
