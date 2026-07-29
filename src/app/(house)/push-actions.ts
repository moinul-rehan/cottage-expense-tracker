"use server";

import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";

export async function saveSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  await supabase.from("push_subscriptions").upsert(
    {
      cottage_id: profile.cottage_id,
      user_id: profile.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
}

export async function deleteSubscription(endpoint: string) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", profile.id);
}
