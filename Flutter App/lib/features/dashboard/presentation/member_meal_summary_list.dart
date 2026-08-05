import 'package:flutter/material.dart';
import '../../../core/theme/theme.dart';
import '../data/dashboard_data.dart';

/// "Member Meal Summary" section added to the Figma spec's second revision:
/// one bordered card per member (avatar/name header, then a Total Meal /
/// Deposit / Meal Cost / Balance 2x2 stat grid) instead of the grid of
/// small `_MemberMealCard`s this screen used to render. Same
/// [MemberMealRow] data (see `getMemberMealSummary` in
/// src/lib/data/meal.ts), just restyled.
class MemberMealSummaryList extends StatelessWidget {
  final List<MemberMealRow> rows;
  const MemberMealSummaryList({super.key, required this.rows});

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    if (rows.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Member Meal Summary',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: surface.foreground),
        ),
        const SizedBox(height: 16),
        for (int i = 0; i < rows.length; i++) ...[
          _MemberCard(row: rows[i]),
          if (i < rows.length - 1) const SizedBox(height: 10),
        ],
      ],
    );
  }
}

class _MemberCard extends StatelessWidget {
  final MemberMealRow row;
  const _MemberCard({required this.row});

  String _tk(double v) => '${v.toStringAsFixed(2)} tk';
  String _count(double v) => v.toStringAsFixed(v % 1 == 0 ? 0 : 1).padLeft(2, '0');

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    final balancePositive = row.balance >= 0;
    final initial = row.firstName.isNotEmpty ? row.firstName[0].toUpperCase() : '?';

    void showDetails(BuildContext context) {
      showModalBottomSheet(
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (ctx) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SizedBox(
                      width: 44,
                      height: 44,
                      child: row.avatarUrl != null && row.avatarUrl!.isNotEmpty
                          ? Image.network(
                              row.avatarUrl!,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => _Initial(initial: initial),
                            )
                          : _Initial(initial: initial),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        row.displayName,
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: surface.foreground),
                      ),
                      Text('Meal Summary Breakdown', style: TextStyle(fontSize: 13, color: surface.mutedForeground)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Total Meals Taken'),
                trailing: Text(_count(row.meals), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Total Deposit Amount'),
                trailing: Text(_tk(row.deposit), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Total Calculated Cost'),
                trailing: Text(_tk(row.cost), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Net Meal Balance'),
                trailing: Text(
                  _tk(row.balance),
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: balancePositive ? const Color(0xFF289029) : CottageColors.destructive,
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: () => showDetails(context),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: surface.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: surface.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: SizedBox(
                    width: 50,
                    height: 50,
                    child: row.avatarUrl != null && row.avatarUrl!.isNotEmpty
                        ? Image.network(
                            row.avatarUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => _Initial(initial: initial),
                          )
                        : _Initial(initial: initial),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    row.displayName,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: surface.foreground),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _Stat(label: 'Total Meal', value: _count(row.meals), surface: surface)),
                Expanded(child: _Stat(label: 'Deposit', value: _tk(row.deposit), surface: surface)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _Stat(label: 'Meal Cost', value: _tk(row.cost), surface: surface)),
                Expanded(
                  child: _Stat(
                    label: 'Balance',
                    value: _tk(row.balance),
                    surface: surface,
                    valueColor: balancePositive ? const Color(0xFF289029) : CottageColors.destructive,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final CottageSurface surface;
  final Color? valueColor;

  const _Stat({required this.label, required this.value, required this.surface, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 16, color: surface.mutedForeground)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: valueColor ?? surface.foreground)),
      ],
    );
  }
}

class _Initial extends StatelessWidget {
  final String initial;
  const _Initial({required this.initial});

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return Container(
      color: surface.accent,
      alignment: Alignment.center,
      child: Text(initial, style: TextStyle(color: surface.accentForeground, fontWeight: FontWeight.w600, fontSize: 18)),
    );
  }
}
