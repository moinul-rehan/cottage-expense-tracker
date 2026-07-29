import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';
import 'screens/login_screen.dart';
import 'services/supabase_service.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SupabaseService.initialize();
  runApp(const CottageApp());
}

class CottageApp extends StatelessWidget {
  const CottageApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cottage',
      theme: buildCottageTheme(),
      debugShowCheckedModeBanner: false,
      home: SupabaseService.currentSession != null ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
