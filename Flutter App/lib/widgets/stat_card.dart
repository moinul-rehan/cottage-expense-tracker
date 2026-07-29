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

  (Color bg, Color fg) get _colors {
    switch (tone) {
      case StatTone.blue:
        return (CottageColors.toneBlueBg, CottageColors.toneBlueFg);
      case StatTone.green:
        return (CottageColors.toneGreenBg, CottageColors.toneGreenFg);
      case StatTone.orange:
        return (CottageColors.toneOrangeBg, CottageColors.toneOrangeFg);
      case StatTone.red:
        return (CottageColors.toneRedBg, CottageColors.toneRedFg);
    }
  }

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _colors;
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
                          style: const TextStyle(fontSize: 13, color: CottageColors.mutedForeground),
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
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: CottageColors.foreground),
                  ),
                  if (hint != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      hint!,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12, color: CottageColors.mutedForeground),
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
