import 'package:flutter/material.dart';
import '../services/supabase_service.dart';
import '../screens/login_screen.dart';
import '../theme.dart';

/// Shared top bar for authenticated screens -- Cottage wordmark + logout.
/// Phase 2 can extend this into a bottom nav / drawer once more screens exist.
class AppScaffold extends StatelessWidget {
  final String title;
  final Widget body;

  const AppScaffold({super.key, required this.title, required this.body});

  Future<void> _logout(BuildContext context) async {
    await SupabaseService.signOut();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.home_rounded, color: CottageColors.primary, size: 22),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => _logout(context),
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: body,
    );
  }
}
