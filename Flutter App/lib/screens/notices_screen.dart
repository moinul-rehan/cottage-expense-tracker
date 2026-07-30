import 'package:flutter/material.dart';
import '../widgets/app_scaffold.dart';
import '_placeholder_body.dart';

/// Mirrors the "Notices" tab of the web app's mobile bottom nav
/// (src/app/(house)/notice-board). Content lands in a later phase.
class NoticesScreen extends StatelessWidget {
  const NoticesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppScaffold(
      title: 'Notices',
      showLogout: false,
      body: PlaceholderBody(icon: Icons.push_pin_rounded, label: 'Notice board coming soon'),
    );
  }
}
