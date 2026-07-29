/// One member's row in the "Member meal summary" grid. See
/// getMemberMealSummary in src/lib/data/meal.ts.
class MemberMealRow {
  final String id;
  final String firstName;
  final String? lastName;
  final String? avatarUrl;
  final double meals;
  final double deposit;
  final double cost;
  double get balance => deposit - cost;

  MemberMealRow({
    required this.id,
    required this.firstName,
    this.lastName,
    this.avatarUrl,
    required this.meals,
    required this.deposit,
    required this.cost,
  });

  String get displayName => (lastName?.isNotEmpty ?? false) ? lastName! : (firstName.isNotEmpty ? firstName : 'Member');
}

/// A member's utility due for the active month. See getMonthlyDues in
/// src/lib/data/finance.ts.
class MemberDue {
  final double rent;
  final double expenses;
  final double paid;
  final double due;

  const MemberDue({required this.rent, required this.expenses, required this.paid, required this.due});

  static const zero = MemberDue(rent: 0, expenses: 0, paid: 0, due: 0);
}

/// Everything the Dashboard screen renders, assembled by DashboardService.
class DashboardData {
  final String monthKey;
  final double cottageBalance;
  final double totalUtilityExpense;
  final double outstandingFromMembers;
  final double collectedThisMonth;
  final MemberDue myDue;
  final double mealRate;
  final double totalMeals;
  final double totalBazaar;
  final List<MemberMealRow> memberMealRows;

  const DashboardData({
    required this.monthKey,
    required this.cottageBalance,
    required this.totalUtilityExpense,
    required this.outstandingFromMembers,
    required this.collectedThisMonth,
    required this.myDue,
    required this.mealRate,
    required this.totalMeals,
    required this.totalBazaar,
    required this.memberMealRows,
  });

  double get myAssignedCost => myDue.rent + myDue.expenses;
}
