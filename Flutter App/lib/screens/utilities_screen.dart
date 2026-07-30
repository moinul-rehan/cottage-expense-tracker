import 'package:flutter/material.dart';
import '../widgets/app_scaffold.dart';
import '_placeholder_body.dart';

/// Mirrors the "Utilities" tab of the web app's mobile bottom nav
/// (src/app/(house)/utilities). Content lands in a later phase.
class UtilitiesScreen extends StatelessWidget {
  const UtilitiesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppScaffold(
      title: 'Utilities',
      showLogout: false,
      body: PlaceholderBody(icon: Icons.bolt_rounded, label: 'Utility expenses coming soon'),
    );
  }
}
