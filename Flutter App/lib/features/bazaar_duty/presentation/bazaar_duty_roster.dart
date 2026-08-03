import 'package:flutter/material.dart';
import '../data/bazaar_duty_models.dart';
import '../../../core/models/profile.dart';
import '../../../core/theme/theme.dart';

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

String _formatDate(String iso) {
  try {
    final parts = iso.split('-');
    if (parts.length < 3) return iso;
    final month = int.tryParse(parts[1]) ?? 1;
    final day = int.tryParse(parts[2]) ?? 1;
    if (month < 1 || month > 12) return iso;
    return '${_months[month - 1]} $day';
  } catch (_) {
    return iso;
  }
}

/// Every member's upcoming/current bazaar duty, one shared roster instead of
/// each member only seeing their own -- a compact list of avatar rows.
/// Mirrors BazaarDutyRoster in
/// src/app/(house)/dashboard/BazaarDutyRoster.tsx.
class BazaarDutyRoster extends StatelessWidget {
  final List<BazaarDuty> duties;
  final Map<String, Profile> membersById;
  final String currentUserId;

  const BazaarDutyRoster({
    super.key,
    required this.duties,
    required this.membersById,
    required this.currentUserId,
  });

  @override
  Widget build(BuildContext context) {
    if (duties.isEmpty) return const SizedBox.shrink();
    final surface = context.surface;

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: surface.accent,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.shopping_basket_outlined, size: 18, color: surface.accentForeground),
                ),
                const SizedBox(width: 10),
                Text(
                  'Bazaar Duty Roster',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: surface.foreground),
                ),
              ],
            ),
            const SizedBox(height: 8),
            for (final d in duties) _DutyRow(duty: d, member: membersById[d.userId], isMe: d.userId == currentUserId),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

class _DutyRow extends StatelessWidget {
  final BazaarDuty duty;
  final Profile? member;
  final bool isMe;

  const _DutyRow({required this.duty, required this.member, required this.isMe});

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    final status = bazaarDutyStatus(duty.startDate, duty.endDate);
    final name = member?.displayName ?? 'Member';
    final initial = (member?.firstName.isNotEmpty ?? false) ? member!.firstName[0].toUpperCase() : '?';

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isMe ? surface.accent.withValues(alpha: 0.6) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: surface.accent,
            backgroundImage: member?.avatarUrl != null && member!.avatarUrl!.isNotEmpty
                ? NetworkImage(member!.avatarUrl!)
                : null,
            child: member?.avatarUrl == null || member!.avatarUrl!.isEmpty
                ? Text(initial, style: TextStyle(color: surface.accentForeground, fontWeight: FontWeight.w600, fontSize: 13))
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500, color: surface.foreground),
                      ),
                    ),
                    if (isMe)
                      Text(' (you)', style: TextStyle(fontSize: 13, color: surface.mutedForeground)),
                  ],
                ),
                Text(
                  '${_formatDate(duty.startDate)} – ${_formatDate(duty.endDate)}'
                  '${duty.note != null && duty.note!.isNotEmpty ? " · ${duty.note}" : ""}',
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11.5, color: surface.mutedForeground),
                ),
              ],
            ),
          ),
          if (status == BazaarDutyStatus.active) _StatusBadge(text: 'On duty', color: const Color(0xFF059669)),
          if (status == BazaarDutyStatus.today) _StatusBadge(text: 'Today', color: const Color(0xFFFA9033)),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String text;
  final Color color;

  const _StatusBadge({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
    );
  }
}
