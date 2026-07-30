import 'package:flutter/material.dart';
import '../theme.dart';

/// Shared "not built yet" body for tabs that only need nav wiring for now.
class PlaceholderBody extends StatelessWidget {
  final IconData icon;
  final String label;

  const PlaceholderBody({super.key, required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 40, color: surface.mutedForeground),
          const SizedBox(height: 12),
          Text(label, style: TextStyle(color: surface.mutedForeground)),
        ],
      ),
    );
  }
}
