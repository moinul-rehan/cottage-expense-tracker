import 'package:flutter/material.dart';
import '../theme.dart';

enum StatTone { blue, green, orange, red }

/// Mirrors the web app's StatCard component in
/// src/app/(house)/dashboard/page.tsx.
class StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? hint;
  final StatTone tone;
  final bool paid;

  const StatCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.hint,
    this.tone = StatTone.blue,
    this.paid = false,
  });

  (Color bg, Color fg) _colors(CottageSurface surface) {
    switch (tone) {
      case StatTone.blue:
        return (surface.toneBlueBg, surface.toneBlueFg);
      case StatTone.green:
        return (surface.toneGreenBg, surface.toneGreenFg);
      case StatTone.orange:
        return (surface.toneOrangeBg, surface.toneOrangeFg);
      case StatTone.red:
        return (surface.toneRedBg, surface.toneRedFg);
    }
  }

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    final (bg, fg) = _colors(surface);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: fg, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          label,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 13, color: surface.mutedForeground),
                        ),
                      ),
                      if (paid) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0x1A059669),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Text(
                            'Paid',
                            style: TextStyle(fontSize: 11, color: Color(0xFF059669), fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: surface.foreground),
                  ),
                  if (hint != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      hint!,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 12, color: surface.mutedForeground),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
