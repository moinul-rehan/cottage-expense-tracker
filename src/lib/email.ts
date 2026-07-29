import "server-only";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

// Falls back to Resend's shared test sender if the real domain isn't
// verified in Resend yet -- that address only delivers to the Resend
// account owner's own inbox, so set RESEND_FROM_EMAIL once cottagee.me is
// verified for real cross-member delivery.
const fromAddress = process.env.RESEND_FROM_EMAIL || "Cottage <onboarding@resend.dev>";

/**
 * Best-effort transactional email. Never throws -- a missing API key or a
 * failed send must not break whatever action triggered it, same discipline
 * as sendPushToUsers in src/lib/data/push.ts.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) return;
  try {
    await resend.emails.send({ from: fromAddress, to, subject, html });
  } catch {
    // Swallow -- see doc comment above.
  }
}
