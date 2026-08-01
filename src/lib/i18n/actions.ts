"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import type { Lang } from "./dictionary";

export async function setLanguage(lang: Lang) {
  if (lang !== "en" && lang !== "bn") return;
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  await supabase.from("profiles").update({ language: lang }).eq("id", profile.id);
  revalidatePath("/", "layout");
}
