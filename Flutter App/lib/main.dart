import 'package:flutter/material.dart';
import 'screens/login_screen.dart';
import 'services/supabase_service.dart';
import 'theme.dart';
import 'widgets/bottom_nav_shell.dart';

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
      theme: buildCottageTheme(Brightness.light),
      darkTheme: buildCottageTheme(Brightness.dark),
      themeMode: ThemeMode.system,
      debugShowCheckedModeBanner: false,
      home: SupabaseService.currentSession != null ? const BottomNavShell() : const LoginScreen(),
    );
  }
}
