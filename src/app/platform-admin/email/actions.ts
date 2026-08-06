"use server";

import { requirePlatformAdmin } from "@/lib/platform-admin";
import { sendEmail } from "@/lib/email";

export type SendEmailInput = {
  recipientEmails: string[];
  templateType: "approved" | "rejected" | "custom";
  cottageName?: string;
  subject: string;
  headline: string;
  bodyText: string;
  buttonText?: string;
  buttonUrl?: string;
  rejectionReason?: string;
};

export async function sendAdminCustomEmail(input: SendEmailInput) {
  await requirePlatformAdmin();

  // De-duplicate case-insensitively (a user picked from the list and typed
  // into the free-text field could easily collide).
  const seen = new Set<string>();
  const recipientEmails = input.recipientEmails
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
    .filter((e) => {
      const key = e.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const subject = input.subject.trim();
  const headline = input.headline.trim();
  const bodyText = input.bodyText.trim();
  const rejectionReason = (input.rejectionReason || "").trim();

  if (!recipientEmails.length) {
    return { error: "At least one recipient is required." };
  }
  if (!subject) {
    return { error: "Subject line is required." };
  }
  if (!headline) {
    return { error: "Headline is required." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cottagee.me";
  const buttonText = (input.buttonText || "").trim();
  const buttonUrl = (input.buttonUrl || "").trim() || appUrl;

  let badgeHtml = "";
  let buttonHtml = "";

  if (input.templateType === "approved") {
    badgeHtml = `
      <div style="display:inline-block; padding: 6px 12px; background-color:#ECFDF5; border:1px solid #A7F3D0; border-radius:100px; margin-bottom: 20px;">
        <span style="font-size:12px; font-weight:600; color:#059669; letter-spacing:0.02em;">🎉 Application Approved</span>
      </div>`;
    buttonHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-radius:10px; background-color:#DE7356;">
            <a href="${appUrl}/login" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:10px;">
              Sign in to your Cottage
            </a>
          </td>
        </tr>
      </table>`;
  } else if (input.templateType === "rejected") {
    badgeHtml = `
      <div style="display:inline-block; padding: 6px 12px; background-color:#FEF2F2; border:1px solid #FCA5A5; border-radius:100px; margin-bottom: 20px;">
        <span style="font-size:12px; font-weight:600; color:#DC2626; letter-spacing:0.02em;">Application Update</span>
      </div>`;
    buttonHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-radius:10px; background-color:#17191E;">
            <a href="mailto:support@cottagee.me" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:10px;">
              Contact Support
            </a>
          </td>
        </tr>
      </table>`;
  } else {
    badgeHtml = `
      <div style="display:inline-block; padding: 6px 12px; background-color:#F3F4F6; border:1px solid #E5E7EB; border-radius:100px; margin-bottom: 20px;">
        <span style="font-size:12px; font-weight:600; color:#374151; letter-spacing:0.02em;">📢 Platform Announcement</span>
      </div>`;
    if (buttonText) {
      buttonHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          <td style="border-radius:10px; background-color:#DE7356;">
            <a href="${buttonUrl}" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:10px;">
              ${buttonText}
            </a>
          </td>
        </tr>
      </table>`;
    }
  }

  const formattedParagraphs = bodyText
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin:0 0 16px; font-size:14px; line-height:1.65; color:#7A818D;">${p.replace(
          /\n/g,
          "<br/>"
        )}</p>`
    )
    .join("");

  const reasonHtml =
    input.templateType === "rejected" && rejectionReason
      ? `
      <div style="background-color:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px; padding:16px; margin-bottom:24px;">
        <p style="margin:0 0 4px; font-size:12px; font-weight:600; color:#4B5563; text-transform:uppercase; letter-spacing:0.05em;">Reason from Admin:</p>
        <p style="margin:0; font-size:14px; line-height:1.6; color:#1F2937;">${rejectionReason}</p>
      </div>`
      : "";

  const html = `
<div style="margin:0; padding:0; background-color:#F4F4F6; font-family: Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F6; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px; width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding: 0 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <img src="${appUrl}/logo.png" width="28" height="28" alt="Cottage" style="display:block; width:28px; height:28px; border-radius:7px;" />
                  </td>
                  <td style="vertical-align:middle; padding-left:10px; font-size:16px; font-weight:600; color:#17191E; letter-spacing:-0.01em;">
                    Cottage
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#FFFFFF; border:1px solid #E4E5E8; border-radius:20px; padding: 40px;">
              ${badgeHtml}

              <h1 style="margin:0 0 12px; font-size:20px; font-weight:600; color:#17191E; letter-spacing:-0.01em;">
                ${headline}
              </h1>

              ${formattedParagraphs}

              ${reasonHtml}

              ${buttonHtml}

              <div style="margin:32px 0 0; padding-top:24px; border-top:1px solid #E4E5E8;">
                <p style="margin:0 0 6px; font-size:12px; color:#AEB2BA;">
                  Or paste this link into your browser:
                </p>
                <p style="margin:0; font-size:12px; line-height:1.6; word-break:break-all;">
                  <a href="${buttonUrl}" style="color:#DE7356; text-decoration:none;">${buttonUrl}</a>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 8px 0;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#AEB2BA;">
                Sent from Cottage Support. Reply directly to this email if you have questions.
              </p>
              <p style="margin:8px 0 0; font-size:12px; color:#AEB2BA;">
                © 2026 Cottage. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;

  // One send per recipient (not a single `to: [...]` call) so each
  // recipient's address stays private from the others. sendEmail() never
  // throws (see its doc comment) - a missing API key or a bad address just
  // silently no-ops that one send rather than surfacing per-recipient here.
  await Promise.all(recipientEmails.map((to) => sendEmail({ to, subject, html })));
  return { success: true, sentCount: recipientEmails.length };
}
