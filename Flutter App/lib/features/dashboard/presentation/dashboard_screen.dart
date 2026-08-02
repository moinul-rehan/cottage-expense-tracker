import 'package:flutter/material.dart';
import '../data/dashboard_data.dart';
import '../data/dashboard_service.dart';
import '../../../core/models/profile.dart';
import '../../../core/theme/theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/widgets/stat_card.dart';
import '../../../core/widgets/responsive_utils.dart';

/// Phase 1 scope only: the "Utility overview", "Your utility summary",
/// "Meal overview" stat-card rows and the "Member meal summary" grid from
/// src/app/(house)/dashboard/page.tsx. Pinned notices, bazaar duty, and the
/// utility breakdown/invoice-share dialog are deferred to a later phase.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _service = DashboardService();
  late Future<(Profile, DashboardData)> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<(Profile, DashboardData)> _load() async {
    final profile = await _service.getCurrentProfile();
    final data = await _service.load(profile);
    return (profile, data);
  }

  void _retry() {
    setState(() => _future = _load());
  }

  String _tk(double value) => '${value.toStringAsFixed(2)} tk';

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Cottage',
      showLogout: false,
      body: FutureBuilder<(Profile, DashboardData)>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 40, color: CottageColors.destructive),
                    const SizedBox(height: 12),
                    Text('Could not load the dashboard.\n${snapshot.error}', textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _retry, child: const Text('Retry')),
                  ],
                ),
              ),
            );
          }

          final (profile, data) = snapshot.data!;
          final surface = context.surface;
          final columns = context.gridColumns;
          final padding = context.responsivePadding;

          return RefreshIndicator(
            onRefresh: () async => _retry(),
            child: ListView(
              padding: EdgeInsets.all(padding),
              children: [
                Text(
                  'Welcome, ${profile.displayName}',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: surface.foreground),
                ),
                const SizedBox(height: 4),
                Text(
                  "Here's where things stand for ${data.monthKey}.",
                  style: TextStyle(fontSize: 13, color: surface.mutedForeground),
                ),
                const SizedBox(height: 24),

                _SectionTitle('Utility overview'),
                const SizedBox(height: 12),
                _ResponsiveCardGrid(
                  columns: columns,
                  children: [
                    StatCard(
                      icon: Icons.account_balance_wallet_outlined,
                      tone: StatTone.blue,
                      label: 'Cottage Balance',
                      value: _tk(data.cottageBalance),
                      hint: 'Previous + deposits - cottage-paid expenses',
                    ),
                    StatCard(
                      icon: Icons.receipt_long_outlined,
                      tone: StatTone.orange,
                      label: 'Total Utility Expense',
                      value: _tk(data.totalUtilityExpense),
                      hint: 'All shared expenses this month',
                    ),
                    StatCard(
                      icon: Icons.payments_outlined,
                      tone: StatTone.red,
                      label: 'Outstanding From Members',
                      value: _tk(data.outstandingFromMembers),
                      hint: "Sum of every member's Remaining Due",
                    ),
                    StatCard(
                      icon: Icons.payments_outlined,
                      tone: StatTone.green,
                      label: 'Collected This Month',
                      value: _tk(data.collectedThisMonth),
                      hint: 'Member Utility Deposits received',
                    ),
                  ],
                ),

                const SizedBox(height: 24),
                _SectionTitle('Your utility summary'),
                const SizedBox(height: 12),
                _ResponsiveCardGrid(
                  columns: columns,
                  children: [
                    StatCard(
                      icon: Icons.receipt_long_outlined,
                      tone: StatTone.blue,
                      label: 'Assigned Cost',
                      value: _tk(data.myAssignedCost),
                      hint: 'Your utility costs this month',
                    ),
                    StatCard(
                      icon: Icons.payments_outlined,
                      tone: StatTone.green,
                      label: 'Paid',
                      value: _tk(data.myDue.paid),
                      hint: 'Deposits credited toward your due',
                    ),
                    StatCard(
                      icon: Icons.account_balance_wallet_outlined,
                      tone: data.myDue.due > 0 ? StatTone.red : StatTone.orange,
                      label: data.myDue.due < 0 ? 'Advance Balance' : 'Remaining Due',
                      value: _tk(data.myDue.due.abs()),
                      hint: 'Assigned Cost minus Paid',
                      paid: data.myAssignedCost > 0 && data.myDue.due <= 0,
                    ),
                  ],
                ),

                const SizedBox(height: 24),
                _SectionTitle('Meal overview'),
                const SizedBox(height: 12),
                _ResponsiveCardGrid(
                  columns: columns,
                  children: [
                    StatCard(
                      icon: Icons.restaurant_outlined,
                      tone: StatTone.blue,
                      label: 'Meal rate',
                      value: data.mealRate.toStringAsFixed(2),
                      hint: 'Total bazaar / total meals',
                    ),
                    StatCard(
                      icon: Icons.restaurant_outlined,
                      tone: StatTone.green,
                      label: 'Total meals',
                      value: data.totalMeals.toStringAsFixed(data.totalMeals % 1 == 0 ? 0 : 1),
                    ),
                    StatCard(
                      icon: Icons.shopping_basket_outlined,
                      tone: StatTone.orange,
                      label: 'Total bazaar',
                      value: data.totalBazaar.toStringAsFixed(2),
                    ),
                  ],
                ),

                const SizedBox(height: 24),
                _SectionTitle('Member meal summary'),
                const SizedBox(height: 12),
                if (data.memberMealRows.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text('No meal data yet.', style: TextStyle(color: surface.mutedForeground)),
                    ),
                  )
                else
                  _ResponsiveCardGrid(
                    columns: columns,
                    children: data.memberMealRows
                        .map((row) => _MemberMealCard(row: row, tk: _tk))
                        .toList(),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Lays out children in a responsive grid: 1 column on phones, 2+ on tablets.
class _ResponsiveCardGrid extends StatelessWidget {
  final int columns;
  final List<Widget> children;

  const _ResponsiveCardGrid({required this.columns, required this.children});

  @override
  Widget build(BuildContext context) {
    if (columns <= 1) {
      return Column(
        children: [
          for (int i = 0; i < children.length; i++) ...[
            children[i],
            if (i < children.length - 1) const SizedBox(height: 12),
          ],
        ],
      );
    }

    final rows = <Widget>[];
    for (int i = 0; i < children.length; i += columns) {
      final rowChildren = <Widget>[];
      for (int j = 0; j < columns; j++) {
        if (i + j < children.length) {
          rowChildren.add(Expanded(child: children[i + j]));
        } else {
          rowChildren.add(const Expanded(child: SizedBox.shrink()));
        }
        if (j < columns - 1) rowChildren.add(const SizedBox(width: 12));
      }
      rows.add(Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: rowChildren,
      ));
      if (i + columns < children.length) rows.add(const SizedBox(height: 12));
    }
    return Column(children: rows);
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: context.surface.foreground),
    );
  }
}

class _MemberMealCard extends StatelessWidget {
  final MemberMealRow row;
  final String Function(double) tk;

  const _MemberMealCard({required this.row, required this.tk});

  @override
  Widget build(BuildContext context) {
    final balancePositive = row.balance >= 0;
    final surface = context.surface;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: surface.accent,
                  backgroundImage: row.avatarUrl != null ? NetworkImage(row.avatarUrl!) : null,
                  child: row.avatarUrl == null
                      ? Text(
                          row.firstName.isNotEmpty ? row.firstName[0].toUpperCase() : '?',
                          style: TextStyle(color: surface.accentForeground, fontWeight: FontWeight.w600),
                        )
                      : null,
                ),
                const SizedBox(width: 10),
                Text(row.displayName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _Field(label: 'Total meals', value: row.meals.toStringAsFixed(row.meals % 1 == 0 ? 0 : 1))),
                Expanded(child: _Field(label: 'Deposit', value: tk(row.deposit))),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _Field(label: 'Meal cost', value: tk(row.cost))),
                Expanded(
                  child: _Field(
                    label: 'Balance',
                    value: tk(row.balance),
                    valueColor: balancePositive ? const Color(0xFF059669) : CottageColors.destructive,
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

class _Field extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _Field({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: surface.mutedForeground)),
        const SizedBox(height: 2),
        Text(
          value,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: valueColor ?? surface.foreground),
        ),
      ],
    );
  }
}
