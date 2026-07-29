"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUsers } from "@/lib/data/notifications";

export type SubmitFeedbackState = { error?: string; success?: boolean } | undefined;

export async function submitFeedback(
  _prevState: SubmitFeedbackState,
  formData: FormData
): Promise<SubmitFeedbackState> {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const imageUrl = String(formData.get("image_url") ?? "").trim() || null;

  if (!title) return { error: "Give your feedback a title." };
  if (!description) return { error: "Describe the bug or feedback." };

  const { error } = await supabase.from("developer_feedback").insert({
    cottage_id: profile.cottage_id,
    user_id: profile.id,
    title,
    description,
    image_url: imageUrl,
  });

  if (error) return { error: `Could not submit feedback: ${error.message}` };

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("cottage_id", profile.cottage_id)
    .eq("role", "super_admin")
    .eq("is_active", true);

  await notifyUsers(
    supabase,
    profile.cottage_id,
    (admins ?? []).map((a) => a.id).filter((id) => id !== profile.id),
    {
      type: "feedback_submitted",
      title: `New feedback: ${title}`,
      body: description.slice(0, 140),
      link: "/feedback",
    }
  );

  revalidatePath("/feedback");
  return { success: true };
}
