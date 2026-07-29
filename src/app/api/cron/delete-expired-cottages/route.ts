import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Runs once a day via Vercel Cron (see vercel.json). Deletes any cottage
 * whose 7-day cancellation window (set by requestCottageDeletion in
 * settings/cottage/actions.ts) has passed. The actual row deletion cascades
 * through every child table via migration 0033's ON DELETE CASCADE -- no
 * manual cleanup needed here.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const { data: expired, error } = await admin
    .from("cottages")
    .select("id, name")
    .not("deletion_requested_at", "is", null)
    .lte("deletion_requested_at", cutoff);

  if (error) {
    return NextResponse.json({ error: "Could not query expired cottages." }, { status: 500 });
  }

  const results = await Promise.allSettled(
    (expired ?? []).map((cottage) => admin.from("cottages").delete().eq("id", cottage.id))
  );

  return NextResponse.json({
    checked: expired?.length ?? 0,
    deleted: results.filter((r) => r.status === "fulfilled").length,
  });
}
