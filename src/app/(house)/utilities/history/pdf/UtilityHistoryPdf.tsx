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
  cell: { padding: 5, flex: 1 },
  cellRight: { padding: 5, flex: 1, textAlign: "right" },
  headerCell: { padding: 5, flex: 1, fontWeight: 700, color: COLORS.primary },
  headerCellRight: { padding: 5, flex: 1, fontWeight: 700, color: COLORS.primary, textAlign: "right" },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, fontSize: 8, color: COLORS.muted, textAlign: "center" },
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

export function UtilityHistoryPdf({
  monthKey,
  expenses,
  memberDeposits,
  cottageDeposits,
}: {
  monthKey: string;
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
  return (
    <Document>
      {/* Page 1 — Utility Expense History */}
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

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Cottage · Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 2 — Member Deposit History */}
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
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Cottage · Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>

      {/* Page 3 — Cottage Deposit History */}
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
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Cottage · Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
