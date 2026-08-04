"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

export async function approveCottage(cottageId: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: cottage } = await admin.from("cottages").select("name, status").eq("id", cottageId).single();
  if (!cottage || cottage.status !== "pending") return;

  await admin
    .from("cottages")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", cottageId);

  const { data: superAdmin } = await admin
    .from("profiles")
    .select("email")
    .eq("cottage_id", cottageId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (superAdmin?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cottagee.me";
    await sendEmail({
      to: superAdmin.email,
      subject: `${cottage.name} is approved 🎉`,
      html: `
<div style="margin:0; padding:0; background-color:#F4F4F6; font-family: Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F6; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px; width:100%;">
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
          <tr>
            <td style="background-color:#FFFFFF; border:1px solid #E4E5E8; border-radius:20px; padding: 40px;">
              <div style="display:inline-block; padding: 6px 12px; background-color:#ECFDF5; border:1px solid #A7F3D0; border-radius:100px; margin-bottom: 20px;">
                <span style="font-size:12px; font-weight:600; color:#059669; letter-spacing:0.02em;">🎉 Application Approved</span>
              </div>
              <h1 style="margin:0 0 12px; font-size:20px; font-weight:600; color:#17191E; letter-spacing:-0.01em;">
                Your Cottage is Ready!
              </h1>
              <p style="margin:0 0 16px; font-size:14px; line-height:1.65; color:#7A818D;">
                Great news! <strong>${cottage.name}</strong> has been reviewed and approved by our team.
              </p>
              <p style="margin:0 0 28px; font-size:14px; line-height:1.65; color:#7A818D;">
                You and your housemates can now sign in, track expenses, manage meals, and collaborate seamlessly.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px; background-color:#DE7356;">
                    <a href="${appUrl}/login"
                       style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:10px;">
                      Sign in to your Cottage
                    </a>
                  </td>
                </tr>
              </table>
              <div style="margin:32px 0 0; padding-top:24px; border-top:1px solid #E4E5E8;">
                <p style="margin:0 0 6px; font-size:12px; color:#AEB2BA;">
                  Or paste this link into your browser:
                </p>
                <p style="margin:0; font-size:12px; line-height:1.6; word-break:break-all;">
                  <a href="${appUrl}/login" style="color:#DE7356; text-decoration:none;">${appUrl}/login</a>
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 8px 0;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#AEB2BA;">
                Have questions? Reply directly to this email or contact support.
              </p>
              <p style="margin:8px 0 0; font-size:12px; color:#AEB2BA;">
                © 2026 Cottage
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`,
    });
  }

  revalidatePath(`/platform-admin/cottages/${cottageId}`);
  revalidatePath("/platform-admin");
}

export async function rejectCottage(cottageId: string, reason: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const { data: cottage } = await admin.from("cottages").select("name, status").eq("id", cottageId).single();
  if (!cottage || cottage.status !== "pending") return;

  await admin
    .from("cottages")
    .update({ status: "rejected", rejected_at: new Date().toISOString(), rejected_reason: reason.trim() || null })
    .eq("id", cottageId);

  const { data: superAdmin } = await admin
    .from("profiles")
    .select("email")
    .eq("cottage_id", cottageId)
    .eq("role", "super_admin")
    .maybeSingle();

  if (superAdmin?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cottagee.me";
    const trimmedReason = reason.trim();
    await sendEmail({
      to: superAdmin.email,
      subject: `Update regarding ${cottage.name}`,
      html: `
<div style="margin:0; padding:0; background-color:#F4F4F6; font-family: Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F6; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px; width:100%;">
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
          <tr>
            <td style="background-color:#FFFFFF; border:1px solid #E4E5E8; border-radius:20px; padding: 40px;">
              <div style="display:inline-block; padding: 6px 12px; background-color:#FEF2F2; border:1px solid #FCA5A5; border-radius:100px; margin-bottom: 20px;">
                <span style="font-size:12px; font-weight:600; color:#DC2626; letter-spacing:0.02em;">Application Update</span>
              </div>
              <h1 style="margin:0 0 12px; font-size:20px; font-weight:600; color:#17191E; letter-spacing:-0.01em;">
                Application Status Update
              </h1>
              <p style="margin:0 0 20px; font-size:14px; line-height:1.65; color:#7A818D;">
                Thank you for your interest in Cottage. Unfortunately, your application for <strong>${cottage.name}</strong> could not be approved at this time.
              </p>
              ${
                trimmedReason
                  ? `<div style="background-color:#F9FAFB; border:1px solid #E5E7EB; border-radius:12px; padding:16px; margin-bottom:24px;">
                <p style="margin:0 0 4px; font-size:12px; font-weight:600; color:#4B5563; text-transform:uppercase; letter-spacing:0.05em;">Reason from Admin:</p>
                <p style="margin:0; font-size:14px; line-height:1.6; color:#1F2937;">${trimmedReason}</p>
              </div>`
                  : ""
              }
              <p style="margin:0 0 28px; font-size:14px; line-height:1.65; color:#7A818D;">
                If you believe this was an error or would like to re-apply, please contact our support team.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px; background-color:#17191E;">
                    <a href="mailto:support@cottagee.me"
                       style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:600; color:#FFFFFF; text-decoration:none; border-radius:10px;">
                      Contact Support
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 8px 0;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#AEB2BA;">
                © 2026 Cottage. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>`,
    });
  }

  revalidatePath(`/platform-admin/cottages/${cottageId}`);
  revalidatePath("/platform-admin");
}

export async function updateCottagePlan(cottageId: string, plan: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin.from("cottages").update({ plan }).eq("id", cottageId);
  revalidatePath(`/platform-admin/cottages/${cottageId}`);
}

export async function updateCottageSubscriptionStatus(cottageId: string, subscriptionStatus: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin.from("cottages").update({ subscription_status: subscriptionStatus }).eq("id", cottageId);
  revalidatePath(`/platform-admin/cottages/${cottageId}`);
}

export async function suspendCottage(cottageId: string, reason: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin
    .from("cottages")
    .update({ suspended_at: new Date().toISOString(), suspended_reason: reason.trim() || null })
    .eq("id", cottageId);
  revalidatePath(`/platform-admin/cottages/${cottageId}`);
  revalidatePath("/platform-admin");
}

export async function reactivateCottage(cottageId: string) {
  await requirePlatformAdmin();
  const admin = createAdminClient();
  await admin.from("cottages").update({ suspended_at: null, suspended_reason: null }).eq("id", cottageId);
  revalidatePath(`/platform-admin/cottages/${cottageId}`);
  revalidatePath("/platform-admin");
}

export type DeleteCottageState = { error?: string } | undefined;

export async function deleteCottage(
  _prevState: DeleteCottageState,
  formData: FormData
): Promise<DeleteCottageState> {
  await requirePlatformAdmin();
  const admin = createAdminClient();

  const cottageId = String(formData.get("cottage_id") ?? "");
  const confirmName = String(formData.get("confirm_name") ?? "").trim();

  const { data: cottage } = await admin.from("cottages").select("name").eq("id", cottageId).single();
  if (!cottage) return { error: "Cottage not found." };
  if (confirmName !== cottage.name) return { error: "Name doesn't match -- type it exactly as shown." };

  const { error } = await admin.from("cottages").delete().eq("id", cottageId);
  if (error) return { error: "Could not delete the Cottage." };

  redirect("/platform-admin");
}
