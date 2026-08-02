import 'package:flutter/material.dart';
import '../../../core/models/profile.dart';
import '../data/utility_models.dart';
import '../../dashboard/data/dashboard_service.dart';
import '../../menu/data/member_service.dart';
import '../data/utility_service.dart';
import '../../../core/theme/theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/widgets/cottage_bottom_sheet.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/responsive_utils.dart';

/// Full utility-expenses screen with tabs for Expenses, Deposits, and Member Dues.
class UtilitiesScreen extends StatefulWidget {
  const UtilitiesScreen({super.key});

  static final utilitiesScreenKey = GlobalKey<_UtilitiesScreenState>();

  @override
  State<UtilitiesScreen> createState() => _UtilitiesScreenState();
}

class _UtilitiesScreenState extends State<UtilitiesScreen> with SingleTickerProviderStateMixin {
  final _utilityService = UtilityService();
  final _dashService = DashboardService();
  final _memberService = MemberService();
  
  _UtilityData? _currentData;

  void triggerAction(String action) {
    final data = _currentData;
    if (data == null) return;
    if (action == 'utility-expense') {
      _showAddExpense(data);
    } else if (action == 'member-deposit' || action == 'cottage-deposit') {
      _showAddDeposit(data);
    }
  }
  late TabController _tabController;
  late Future<_UtilityData> _future;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _future = _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<_UtilityData> _load() async {
    final profile = await _dashService.getCurrentProfile();
    final monthKey = await _dashService.getActiveMonthKey(profile.cottageId);
    final members = await _memberService.getActiveMembers(profile.cottageId);
    final expenses = await _utilityService.getExpenses(monthKey);
    final deposits = await _utilityService.getDeposits(profile.cottageId, monthKey);
    final dues = await _utilityService.getMemberDues(profile.cottageId, monthKey, members);

    return _UtilityData(
      profile: profile,
      monthKey: monthKey,
      members: members,
      expenses: expenses,
      deposits: deposits,
      dues: dues,
    );
  }

  void _refresh() => setState(() => _future = _load());

  void _showAddExpense(_UtilityData data) {
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String? category;
    final now = DateTime.now();
    String selectedDate = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

    showCottageSheet(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheetState) => CottageSheetContent(
          title: 'Add Expense',
          children: [
            TextField(
              controller: amountCtrl,
              decoration: const InputDecoration(labelText: 'Amount (tk)'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descCtrl,
              decoration: const InputDecoration(labelText: 'Description'),
              textCapitalization: TextCapitalization.sentences,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: category,
              decoration: const InputDecoration(labelText: 'Category'),
              items: const [
                DropdownMenuItem(value: 'electricity', child: Text('Electricity')),
                DropdownMenuItem(value: 'gas', child: Text('Gas')),
                DropdownMenuItem(value: 'water', child: Text('Water')),
                DropdownMenuItem(value: 'internet', child: Text('Internet')),
                DropdownMenuItem(value: 'house_rent', child: Text('House Rent')),
                DropdownMenuItem(value: 'maintenance', child: Text('Maintenance')),
                DropdownMenuItem(value: 'other', child: Text('Other')),
              ],
              onChanged: (v) => setSheetState(() => category = v),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: ctx,
                  initialDate: now,
                  firstDate: DateTime(now.year - 1),
                  lastDate: now,
                );
                if (picked != null) {
                  setSheetState(() {
                    selectedDate =
                        '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
                  });
                }
              },
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Date'),
                child: Text(selectedDate),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                final amount = double.tryParse(amountCtrl.text) ?? 0;
                if (amount <= 0) return;
                Navigator.pop(context);
                await _utilityService.addExpense(
                  cottageId: data.profile.cottageId,
                  amount: amount,
                  expenseDate: selectedDate,
                  description: descCtrl.text.trim(),
                  category: category,
                );
                _refresh();
              },
              child: const Text('Add Expense'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddDeposit(_UtilityData data) {
    final amountCtrl = TextEditingController();
    String? selectedUserId = data.profile.id;

    showCottageSheet(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheetState) => CottageSheetContent(
          title: 'Add Deposit',
          children: [
            DropdownButtonFormField<String>(
              initialValue: selectedUserId,
              decoration: const InputDecoration(labelText: 'Member'),
              items: data.members
                  .map((m) => DropdownMenuItem(value: m.id, child: Text(m.displayName)))
                  .toList(),
              onChanged: (v) => setSheetState(() => selectedUserId = v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              decoration: const InputDecoration(labelText: 'Amount (tk)'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                final amount = double.tryParse(amountCtrl.text) ?? 0;
                if (selectedUserId == null || amount <= 0) return;
                Navigator.pop(context);
                await _utilityService.addDeposit(
                  cottageId: data.profile.cottageId,
                  userId: selectedUserId!,
                  monthKey: data.monthKey,
                  amount: amount,
                );
                _refresh();
              },
              child: const Text('Add Deposit'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;

    return AppScaffold(
      title: 'Utilities',
      showLogout: false,
      body: FutureBuilder<_UtilityData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 40, color: CottageColors.destructive),
                  const SizedBox(height: 12),
                  Text('Could not load utilities.\n${snapshot.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _refresh, child: const Text('Retry')),
                ],
              ),
            );
          }

          final data = snapshot.data!;
          _currentData = data;

          return Column(
            children: [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: context.responsivePadding, vertical: 8),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: surface.accent,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        data.monthKey,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: surface.accentForeground,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Container(
                margin: EdgeInsets.symmetric(horizontal: context.responsivePadding),
                decoration: BoxDecoration(
                  color: surface.secondary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicator: BoxDecoration(
                    color: surface.card,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4),
                    ],
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  dividerHeight: 0,
                  labelColor: surface.foreground,
                  unselectedLabelColor: surface.mutedForeground,
                  labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  tabs: const [
                    Tab(text: 'Expenses'),
                    Tab(text: 'Deposits'),
                    Tab(text: 'Dues'),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _ExpensesTab(data: data, onRefresh: _refresh, onAdd: () => _showAddExpense(data)),
                    _DepositsTab(data: data, onRefresh: _refresh, onAdd: () => _showAddDeposit(data)),
                    _DuesTab(data: data, onRefresh: _refresh),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _UtilityData {
  final Profile profile;
  final String monthKey;
  final List<Profile> members;
  final List<Expense> expenses;
  final List<UtilityDeposit> deposits;
  final List<MemberUtilityDue> dues;

  const _UtilityData({
    required this.profile,
    required this.monthKey,
    required this.members,
    required this.expenses,
    required this.deposits,
    required this.dues,
  });
}

String _categoryIcon(String? category) {
  switch (category) {
    case 'electricity': return '⚡';
    case 'gas': return '🔥';
    case 'water': return '💧';
    case 'internet': return '🌐';
    case 'house_rent': return '🏠';
    case 'maintenance': return '🔧';
    default: return '📦';
  }
}

class _ExpensesTab extends StatelessWidget {
  final _UtilityData data;
  final VoidCallback onRefresh;
  final VoidCallback onAdd;

  const _ExpensesTab({required this.data, required this.onRefresh, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    if (data.expenses.isEmpty) {
      return EmptyState(
        icon: Icons.receipt_long_rounded,
        title: 'No expenses this month',
        subtitle: 'Add shared cottage expenses here.',
        action: ElevatedButton.icon(
          onPressed: onAdd,
          icon: const Icon(Icons.add),
          label: const Text('Add Expense'),
        ),
      );
    }

    final surface = context.surface;
    final total = data.expenses.fold<double>(0, (s, e) => s + e.amount);

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: () async => onRefresh(),
          child: ListView(
            padding: EdgeInsets.symmetric(horizontal: context.responsivePadding, vertical: 8),
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: surface.toneOrangeBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Expenses', style: TextStyle(color: surface.toneOrangeFg, fontWeight: FontWeight.w600)),
                    Text('${total.toStringAsFixed(2)} tk',
                        style: TextStyle(color: surface.toneOrangeFg, fontWeight: FontWeight.w700, fontSize: 16)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              ...data.expenses.map((e) => Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: surface.accent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(child: Text(_categoryIcon(e.category), style: const TextStyle(fontSize: 20))),
                      ),
                      title: Text(
                        '${e.amount.toStringAsFixed(2)} tk',
                        style: TextStyle(fontWeight: FontWeight.w600, color: surface.foreground),
                      ),
                      subtitle: Text(
                        [e.description ?? '', e.category ?? ''].where((s) => s.isNotEmpty).join(' · '),
                        style: TextStyle(fontSize: 12, color: surface.mutedForeground),
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: Text(e.expenseDate, style: TextStyle(fontSize: 12, color: surface.mutedForeground)),
                    ),
                  )),
              const SizedBox(height: 80),
            ],
          ),
        ),
        Positioned(
          right: 16, bottom: 16,
          child: FloatingActionButton(
            onPressed: onAdd,
            backgroundColor: CottageColors.primary,
            foregroundColor: CottageColors.primaryForeground,
            heroTag: 'addExpense',
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}

class _DepositsTab extends StatelessWidget {
  final _UtilityData data;
  final VoidCallback onRefresh;
  final VoidCallback onAdd;

  const _DepositsTab({required this.data, required this.onRefresh, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    if (data.deposits.isEmpty) {
      return EmptyState(
        icon: Icons.payments_rounded,
        title: 'No deposits this month',
        subtitle: 'Record member utility payments here.',
        action: ElevatedButton.icon(
          onPressed: onAdd,
          icon: const Icon(Icons.add),
          label: const Text('Add Deposit'),
        ),
      );
    }

    final surface = context.surface;
    final total = data.deposits.fold<double>(0, (s, d) => s + d.amount);

    return Stack(
      children: [
        RefreshIndicator(
          onRefresh: () async => onRefresh(),
          child: ListView(
            padding: EdgeInsets.symmetric(horizontal: context.responsivePadding, vertical: 8),
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: surface.toneGreenBg, borderRadius: BorderRadius.circular(12)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Collected', style: TextStyle(color: surface.toneGreenFg, fontWeight: FontWeight.w600)),
                    Text('${total.toStringAsFixed(2)} tk',
                        style: TextStyle(color: surface.toneGreenFg, fontWeight: FontWeight.w700, fontSize: 16)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              ...data.deposits.map((d) => Card(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(color: surface.toneGreenBg, borderRadius: BorderRadius.circular(12)),
                        child: Icon(Icons.payments_outlined, color: surface.toneGreenFg, size: 20),
                      ),
                      title: Text('${d.amount.toStringAsFixed(2)} tk',
                          style: TextStyle(fontWeight: FontWeight.w600, color: surface.foreground)),
                      subtitle: Text(d.memberName ?? 'Member',
                          style: TextStyle(fontSize: 12, color: surface.mutedForeground)),
                    ),
                  )),
              const SizedBox(height: 80),
            ],
          ),
        ),
        Positioned(
          right: 16, bottom: 16,
          child: FloatingActionButton(
            onPressed: onAdd,
            backgroundColor: CottageColors.primary,
            foregroundColor: CottageColors.primaryForeground,
            heroTag: 'addDeposit',
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}

class _DuesTab extends StatelessWidget {
  final _UtilityData data;
  final VoidCallback onRefresh;

  const _DuesTab({required this.data, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    if (data.dues.isEmpty) {
      return const EmptyState(
        icon: Icons.account_balance_wallet_rounded,
        title: 'No due information',
        subtitle: 'Utility adjustments will appear here once configured.',
      );
    }

    final surface = context.surface;

    return RefreshIndicator(
      onRefresh: () async => onRefresh(),
      child: ListView(
        padding: EdgeInsets.symmetric(horizontal: context.responsivePadding, vertical: 8),
        children: data.dues.map((due) {
          final isPaid = due.total > 0 && due.due <= 0;
          final hasDebt = due.due > 0;
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
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
                        backgroundImage: due.avatarUrl != null ? NetworkImage(due.avatarUrl!) : null,
                        child: due.avatarUrl == null
                            ? Text(due.memberName.isNotEmpty ? due.memberName[0].toUpperCase() : '?',
                                style: TextStyle(color: surface.accentForeground, fontWeight: FontWeight.w600))
                            : null,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(due.memberName,
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: surface.foreground)),
                      ),
                      if (isPaid)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                              color: const Color(0x1A059669), borderRadius: BorderRadius.circular(999)),
                          child: const Text('Paid',
                              style: TextStyle(fontSize: 11, color: Color(0xFF059669), fontWeight: FontWeight.w600)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(child: _DueField(label: 'Rent', value: '${due.rent.toStringAsFixed(0)} tk', surface: surface)),
                    Expanded(child: _DueField(label: 'Expenses', value: '${due.expenses.toStringAsFixed(0)} tk', surface: surface)),
                  ]),
                  const SizedBox(height: 8),
                  Row(children: [
                    Expanded(child: _DueField(label: 'Paid', value: '${due.paid.toStringAsFixed(0)} tk', surface: surface)),
                    Expanded(
                      child: _DueField(
                        label: hasDebt ? 'Remaining' : 'Advance',
                        value: '${due.due.abs().toStringAsFixed(0)} tk',
                        surface: surface,
                        valueColor: hasDebt ? CottageColors.destructive : const Color(0xFF059669),
                      ),
                    ),
                  ]),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _DueField extends StatelessWidget {
  final String label;
  final String value;
  final CottageSurface surface;
  final Color? valueColor;

  const _DueField({required this.label, required this.value, required this.surface, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 11, color: surface.mutedForeground)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: valueColor ?? surface.foreground)),
      ],
    );
  }
}
