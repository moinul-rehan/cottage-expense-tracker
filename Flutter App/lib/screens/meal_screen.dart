import 'package:flutter/material.dart';
import '../widgets/app_scaffold.dart';
import '_placeholder_body.dart';

/// Mirrors the "Meal" tab of the web app's mobile bottom nav
/// (src/app/(house)/meal). Content lands in a later phase.
class MealScreen extends StatelessWidget {
  const MealScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppScaffold(
      title: 'Meal',
      showLogout: false,
      body: PlaceholderBody(icon: Icons.restaurant_rounded, label: 'Meal tracking coming soon'),
    );
  }
}
