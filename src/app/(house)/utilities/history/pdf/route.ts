import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentProfile } from "@/lib/data/dal";
import { createClient } from "@/lib/supabase/server";
import { getActiveMonthKey } from "@/lib/data/months";
import { getMonthlyExpenseHistory, getUtilityDepositHistory } from "@/lib/data/finance";
import { UtilityHistoryPdf } from "./UtilityHistoryPdf";

export async function GET() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const monthKey = await getActiveMonthKey(supabase, profile.cottage_id);

  const [{ data: members }, expenses, deposits] = await Promise.all([
    supabase.from("profiles").select("id, first_name, last_name").eq("is_active", true).order("last_name"),
    getMonthlyExpenseHistory(supabase, monthKey),
    getUtilityDepositHistory(supabase, profile.cottage_id, monthKey),
  ]);

  const membersById = new Map((members ?? []).map((m) => [m.id, m]));
  const memberDeposits = deposits
    .filter((d) => d.source_type === "member")
    .map((d) => ({ ...d, member: d.user_id ? (membersById.get(d.user_id) ?? null) : null }));
  const cottageDeposits = deposits.filter((d) => d.source_type === "addition");

  const buffer = await renderToBuffer(
    UtilityHistoryPdf({
      monthKey,
      expenses,
      memberDeposits,
      cottageDeposits,
    })
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="utility-history-${monthKey}.pdf"`,
    },
  });
}
