import path from "node:path";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { formatDate } from "@/lib/format-date";
import { formatMonthKey } from "@/lib/data/months";
import { UTILITY_CATEGORY_LABELS } from "@/lib/utility-categories";

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

Font.register({
  family: "Noto Sans Bengali",
  fonts: [
    { src: path.join(process.cwd(), "public", "fonts", "NotoSansBengali-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(process.cwd(), "public", "fonts", "NotoSansBengali-Bold.ttf"), fontWeight: "bold" },
  ],
});

const COLORS = {
  primary: "#DE7356",
  foreground: "#17191E",
  muted: "#7A818D",
  border: "#E4E5E8",
  headerBg: "#FBEAE5",
  green: "#63B64E",
  red: "#FF4F4F",
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: COLORS.foreground, fontFamily: "Noto Sans Bengali" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  logo: { width: 24, height: 24, borderRadius: 6 },
  brand: { fontSize: 14, fontWeight: 700, color: COLORS.primary },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: COLORS.muted, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `1px solid ${COLORS.border}`,
  },
  table: { display: "flex", width: "auto" },
  row: { flexDirection: "row", borderBottom: `1px solid ${COLORS.border}` },
  headerRow: { flexDirection: "row", backgroundColor: COLORS.headerBg },
  totalRow: { flexDirection: "row", borderTop: `1px solid ${COLORS.foreground}`, fontWeight: 700 },
  cell: { padding: 5, flex: 1 },
  cellRight: { padding: 5, flex: 1, textAlign: "right" },
  headerCell: { padding: 5, flex: 1, fontWeight: 700, color: COLORS.primary },
  headerCellRight: { padding: 5, flex: 1, fontWeight: 700, color: COLORS.primary, textAlign: "right" },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 8, color: COLORS.muted, textAlign: "center" },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  statCard: {
    width: "48%",
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    padding: 10,
  },
  statLabel: { fontSize: 8, color: COLORS.muted, marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 700 },
  statHint: { fontSize: 7, color: COLORS.muted, marginTop: 3 },
  memberCard: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  memberHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  memberName: { fontSize: 11, fontWeight: 700 },
  paidBadge: { fontSize: 7, color: COLORS.green, fontWeight: 700 },
  lineRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  lineLabel: { color: COLORS.muted },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
    marginTop: 4,
    borderTop: `1px solid ${COLORS.border}`,
  },
  summaryFinalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 2 },
});

type MemberRef = { first_name: string; last_name: string | null } | null;

function name(m: MemberRef) {
  if (!m) return "—";
  return [m.first_name, m.last_name].filter(Boolean).join(" ");
}

function BrandHeader() {
  return (
    <View style={styles.brandRow}>
      <Image src={LOGO_PATH} style={styles.logo} />
      <Text style={styles.brand}>Cottage</Text>
    </View>
  );
}

function Footer() {
  return (
    <Text
      style={styles.footer}
      render={({ pageNumber, totalPages }) => `Cottage · Page ${pageNumber} of ${totalPages}`}
      fixed
    />
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {hint && <Text style={styles.statHint}>{hint}</Text>}
    </View>
  );
}

type MemberStatement = {
  id: string;
  name: string;
  lines: { label: string; amount: number }[];
  assignedCost: number;
  paid: number;
  due: number;
};

export function UtilityHistoryPdf({
  monthKey,
  cottageBalance,
  totalUtilityExpense,
  outstandingFromMembers,
  collectedThisMonth,
  categoryTotals,
  memberStatements,
  expenses,
  memberDeposits,
  cottageDeposits,
}: {
  monthKey: string;
  cottageBalance: number;
  totalUtilityExpense: number;
  outstandingFromMembers: number;
  collectedThisMonth: number;
  categoryTotals: { category: string; amount: number }[];
  memberStatements: MemberStatement[];
  expenses: {
    id: string;
    category: string;
    amount: number;
    description: string | null;
    expense_date: string;
    payment_source: string;
    payer: MemberRef;
  }[];
  memberDeposits: {
    id: string;
    deposit_date: string;
    amount: number;
    note: string | null;
    member: MemberRef;
  }[];
  cottageDeposits: {
    id: string;
    deposit_date: string;
    amount: number;
    note: string | null;
  }[];
}) {
  const categoryTotalSum = categoryTotals.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Document>
      {/* Page 1 — Overview + Expense Type Summary */}
      <Page size="A4" style={styles.page}>
        <BrandHeader />
        <Text style={styles.title}>Utility Report — {formatMonthKey(monthKey)}</Text>
        <Text style={styles.subtitle}>Full overview of cottage balance, expenses, collections and member utility records.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statGrid}>
            <StatCard
              label="Cottage Balance"
              value={`${cottageBalance.toFixed(2)} tk`}
              hint="Previous + deposits − cottage-paid expenses"
            />
            <StatCard
              label="Total Utility Expense"
              value={`${totalUtilityExpense.toFixed(2)} tk`}
              hint="All shared expenses this month"
            />
            <StatCard
              label="Outstanding From Members"
              value={`${outstandingFromMembers.toFixed(2)} tk`}
              hint="Sum of every member's Remaining Due"
            />
            <StatCard
              label="Collected This Month"
              value={`${collectedThisMonth.toFixed(2)} tk`}
              hint="Member Utility Deposits received"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expense Type Summary</Text>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Category</Text>
              <Text style={styles.headerCellRight}>Total Amount</Text>
            </View>
            {categoryTotals.map((c) => (
              <View style={styles.row} key={c.category}>
                <Text style={styles.cell}>{c.category}</Text>
                <Text style={styles.cellRight}>{c.amount.toFixed(2)} tk</Text>
              </View>
            ))}
            {!categoryTotals.length && (
              <Text style={{ padding: 8, color: COLORS.muted }}>No member utility statement lines recorded.</Text>
            )}
            {!!categoryTotals.length && (
              <View style={styles.totalRow}>
                <Text style={styles.cell}>Total</Text>
                <Text style={styles.cellRight}>{categoryTotalSum.toFixed(2)} tk</Text>
              </View>
            )}
          </View>
        </View>

        <Footer />
      </Page>

      {/* Page 2+ — Member Utility Statements */}
      <Page size="A4" style={styles.page}>
        <BrandHeader />
        <Text style={styles.title}>Member Utility Statements — {formatMonthKey(monthKey)}</Text>
        <Text style={styles.subtitle}>Every cost line, discount and manual adjustment that distributes money to members.</Text>

        {memberStatements.map((m) => {
          const isPaid = m.assignedCost > 0 && m.due <= 0;
          return (
            <View style={styles.memberCard} key={m.id} wrap={false}>
              <View style={styles.memberHeader}>
                <Text style={styles.memberName}>{m.name}</Text>
                {isPaid && <Text style={styles.paidBadge}>PAID</Text>}
              </View>
              {m.lines.map((l, i) => (
                <View style={styles.lineRow} key={i}>
                  <Text style={styles.lineLabel}>{l.label}</Text>
                  <Text style={{ color: l.amount >= 0 ? COLORS.red : COLORS.green }}>
                    {l.amount >= 0 ? "+" : "−"}
                    {Math.abs(l.amount).toFixed(2)} tk
                  </Text>
                </View>
              ))}
              {!m.lines.length && <Text style={{ color: COLORS.muted, paddingVertical: 2 }}>No statement lines yet.</Text>}
              <View style={styles.summaryRow}>
                <Text style={{ fontWeight: 700 }}>Assigned Cost</Text>
                <Text style={{ fontWeight: 700 }}>{m.assignedCost.toFixed(2)} tk</Text>
              </View>
              <View style={styles.summaryFinalRow}>
                <Text style={{ color: COLORS.muted }}>Paid</Text>
                <Text style={{ color: COLORS.muted }}>{m.paid.toFixed(2)} tk</Text>
              </View>
              <View style={styles.summaryFinalRow}>
                <Text style={{ fontWeight: 700, color: m.due < 0 ? COLORS.green : COLORS.red }}>
                  {m.due < 0 ? "Advance Balance" : "Remaining Due"}
                </Text>
                <Text style={{ fontWeight: 700, color: m.due < 0 ? COLORS.green : COLORS.red }}>
                  {Math.abs(m.due).toFixed(2)} tk
                </Text>
              </View>
            </View>
          );
        })}
        {!memberStatements.length && <Text style={{ padding: 8, color: COLORS.muted }}>No active members yet.</Text>}

        <Footer />
      </Page>

      {/* Page 3 — Utility Expense History */}
      <Page size="A4" style={styles.page}>
        <BrandHeader />
        <Text style={styles.title}>Utility Expense History — {formatMonthKey(monthKey)}</Text>
        <Text style={styles.subtitle}>Read-only record of every utility expense for the month.</Text>

        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Category</Text>
              <Text style={styles.headerCell}>Description</Text>
              <Text style={styles.headerCell}>Payment Source</Text>
              <Text style={styles.headerCellRight}>Amount</Text>
            </View>
            {expenses.map((e) => (
              <View style={styles.row} key={e.id}>
                <Text style={styles.cell}>{formatDate(e.expense_date)}</Text>
                <Text style={styles.cell}>{UTILITY_CATEGORY_LABELS[e.category] ?? e.category}</Text>
                <Text style={styles.cell}>{e.description ?? "—"}</Text>
                <Text style={styles.cell}>
                  {e.payment_source === "cottage_balance"
                    ? "Cottage Balance"
                    : e.payment_source === "member"
                      ? "Member" + (e.payer ? " — " + name(e.payer) : "")
                      : "None"}
                </Text>
                <Text style={styles.cellRight}>{e.amount.toFixed(2)} tk</Text>
              </View>
            ))}
            {!expenses.length && <Text style={{ padding: 8, color: COLORS.muted }}>No utility expenses recorded.</Text>}
          </View>
        </View>

        <Footer />
      </Page>

      {/* Page 4 — Member Deposit History */}
      <Page size="A4" style={styles.page}>
        <BrandHeader />
        <Text style={styles.title}>Member Deposit History — {formatMonthKey(monthKey)}</Text>
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Member</Text>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Note</Text>
              <Text style={styles.headerCellRight}>Amount</Text>
            </View>
            {memberDeposits.map((d) => (
              <View style={styles.row} key={d.id}>
                <Text style={styles.cell}>{name(d.member)}</Text>
                <Text style={styles.cell}>{formatDate(d.deposit_date)}</Text>
                <Text style={styles.cell}>{d.note ?? "—"}</Text>
                <Text style={styles.cellRight}>{d.amount.toFixed(2)} tk</Text>
              </View>
            ))}
            {!memberDeposits.length && (
              <Text style={{ padding: 8, color: COLORS.muted }}>No member utility deposits recorded.</Text>
            )}
          </View>
        </View>
        <Footer />
      </Page>

      {/* Page 5 — Cottage Deposit History */}
      <Page size="A4" style={styles.page}>
        <BrandHeader />
        <Text style={styles.title}>Cottage Deposit History — {formatMonthKey(monthKey)}</Text>
        <View style={styles.section}>
          <View style={styles.table}>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Note</Text>
              <Text style={styles.headerCellRight}>Amount</Text>
            </View>
            {cottageDeposits.map((d) => (
              <View style={styles.row} key={d.id}>
                <Text style={styles.cell}>{formatDate(d.deposit_date)}</Text>
                <Text style={styles.cell}>{d.note ?? "—"}</Text>
                <Text style={styles.cellRight}>{d.amount.toFixed(2)} tk</Text>
              </View>
            ))}
            {!cottageDeposits.length && (
              <Text style={{ padding: 8, color: COLORS.muted }}>No cottage deposits recorded.</Text>
            )}
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
