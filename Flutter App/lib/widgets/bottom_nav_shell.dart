import 'package:flutter/material.dart';
import '../screens/dashboard_screen.dart';
import '../screens/meal_screen.dart';
import '../screens/menu_screen.dart';
import '../screens/notices_screen.dart';
import '../screens/utilities_screen.dart';
import '../theme.dart';

class _NavTabData {
  final IconData icon;
  final String label;
  final WidgetBuilder builder;
  const _NavTabData({required this.icon, required this.label, required this.builder});
}

final _tabs = <_NavTabData>[
  _NavTabData(icon: Icons.dashboard_rounded, label: 'Home', builder: (_) => const DashboardScreen()),
  _NavTabData(icon: Icons.push_pin_rounded, label: 'Notices', builder: (_) => const NoticesScreen()),
  _NavTabData(icon: Icons.restaurant_rounded, label: 'Meal', builder: (_) => const MealScreen()),
  _NavTabData(icon: Icons.bolt_rounded, label: 'Utilities', builder: (_) => const UtilitiesScreen()),
  _NavTabData(icon: Icons.menu_rounded, label: 'Menu', builder: (_) => const MenuScreen()),
];

/// Root shell once a member is signed in: an [IndexedStack] of the tab
/// screens under a floating pill nav bar, mirroring the shape/behaviour of
/// the web app's MobileBottomNav (dark pill, active tab pops into a filled
/// brand-colored circle) using the existing Cottage brand color.
class BottomNavShell extends StatefulWidget {
  const BottomNavShell({super.key});

  @override
  State<BottomNavShell> createState() => _BottomNavShellState();
}

class _BottomNavShellState extends State<BottomNavShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: [for (final tab in _tabs) tab.builder(context)],
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        child: _FloatingNavBar(
          index: _index,
          onTap: (i) => setState(() => _index = i),
        ),
      ),
    );
  }
}

class _FloatingNavBar extends StatelessWidget {
  final int index;
  final ValueChanged<int> onTap;

  const _FloatingNavBar({required this.index, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return Container(
      height: 64,
      decoration: BoxDecoration(
        color: surface.navBackground,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      clipBehavior: Clip.none,
      child: Row(
        children: [
          for (var i = 0; i < _tabs.length; i++)
            Expanded(child: _NavTab(data: _tabs[i], active: i == index, onTap: () => onTap(i))),
        ],
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  final _NavTabData data;
  final bool active;
  final VoidCallback onTap;

  const _NavTab({required this.data, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return InkWell(
      onTap: onTap,
      customBorder: const StadiumBorder(),
      child: Center(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutBack,
          margin: EdgeInsets.only(top: active ? 28 : 0),
          width: active ? 56 : 36,
          height: active ? 56 : 36,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active ? CottageColors.primary : Colors.transparent,
            boxShadow: active ? [BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 10, offset: const Offset(0, 4))] : null,
            border: active ? Border.all(color: surface.navBackground, width: 4) : null,
          ),
          child: Icon(
            data.icon,
            size: active ? 24 : 20,
            color: active ? CottageColors.primaryForeground : surface.navInactive,
          ),
        ),
      ),
    );
  }
}
