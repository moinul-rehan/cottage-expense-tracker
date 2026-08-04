import 'package:flutter/material.dart';
import '../../../core/theme/theme.dart';
import '../data/dashboard_data.dart';

/// Vertical restyle of the "Utility overview" `StatCard` grid this screen
/// used to render as a 1-3 column grid -- same four metrics
/// (`cottageBalance`/`totalUtilityExpense`/`outstandingFromMembers`/
/// `collectedThisMonth` from [DashboardData]), same tone colors from
/// [CottageSurface], just laid out as a single-column list of rows per the
/// Rento Figma kit's mobile home screen.
class UtilityExpenseList extends StatelessWidget {
  final DashboardData data;
  const UtilityExpenseList({super.key, required this.data});

  String _tk(double value) => '${value.toStringAsFixed(2)} tk';

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    final rows = [
      _Row(
        icon: Icons.account_balance_wallet_outlined,
        bg: surface.toneBlueBg,
        fg: surface.toneBlueFg,
        label: 'Cottage Balance',
        value: _tk(data.cottageBalance),
      ),
      _Row(
        icon: Icons.receipt_long_outlined,
        bg: surface.toneOrangeBg,
        fg: surface.toneOrangeFg,
        label: 'Total Utility Expense',
        value: _tk(data.totalUtilityExpense),
      ),
      _Row(
        icon: Icons.payments_outlined,
        bg: surface.toneRedBg,
        fg: surface.toneRedFg,
        label: 'Outstanding From Members',
        value: _tk(data.outstandingFromMembers),
      ),
      _Row(
        icon: Icons.payments_outlined,
        bg: surface.toneGreenBg,
        fg: surface.toneGreenFg,
        label: 'Collected This Month',
        value: _tk(data.collectedThisMonth),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Utility Expense', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: surface.foreground)),
        const SizedBox(height: 12),
        for (int i = 0; i < rows.length; i++) ...[
          rows[i],
          if (i < rows.length - 1) const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _Row extends StatelessWidget {
  final IconData icon;
  final Color bg;
  final Color fg;
  final String label;
  final String value;

  const _Row({required this.icon, required this.bg, required this.fg, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: surface.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: surface.border),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: fg, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label, style: TextStyle(fontSize: 13, color: surface.mutedForeground)),
          ),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: surface.foreground)),
        ],
      ),
    );
  }
}
