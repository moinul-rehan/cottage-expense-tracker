import 'package:flutter/material.dart';
import '../widgets/app_scaffold.dart';
import '_placeholder_body.dart';

/// Mirrors the "Menu" tab of the web app's mobile bottom nav
/// (Members / Months / Contacts / Settings). Sign out lives here for now;
/// individual sections land in a later phase.
class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppScaffold(
      title: 'Menu',
      body: PlaceholderBody(icon: Icons.menu_rounded, label: 'Members, months & settings coming soon'),
    );
  }
}
