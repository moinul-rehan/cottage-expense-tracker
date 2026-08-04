import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/models/profile.dart';
import '../../../core/theme/theme.dart';
import '../../notices/data/notice.dart';
import '../../notices/data/notice_service.dart';
import '../../notices/data/notice_types.dart';
import '../../notices/presentation/notices_screen.dart';

/// "Pin Notice" section: a sticky-note-styled card for the single top
/// pinned notice, styled after the Rento Figma kit's mobile home screen.
///
/// Reuses the exact same data flow as
/// lib/features/notices/presentation/pinned_notices_section.dart (same
/// `NoticeService`, same `visibleTo`/`effectivelyPinned`/`sortForDisplay`
/// filtering from lib/features/notices/data/notice_types.dart) rather than
/// re-fetching separately -- this widget only differs in how it renders the
/// single highest-priority result.
class PinNoticeCard extends StatefulWidget {
  final Profile profile;
  const PinNoticeCard({super.key, required this.profile});

  @override
  State<PinNoticeCard> createState() => _PinNoticeCardState();
}

class _PinNoticeCardState extends State<PinNoticeCard> {
  final _service = NoticeService();
  late Future<Notice?> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<Notice?> _load() async {
    final notices = await _service.getNotices(widget.profile.cottageId);
    final visible = notices.where(
      (n) => n.visibleTo(profileId: widget.profile.id, isSuperAdmin: widget.profile.isSuperAdmin),
    );
    final pinned = visible.where((n) => n.status == NoticeStatus.published && n.effectivelyPinned).toList();
    final sorted = sortNoticesForDisplay(pinned);
    return sorted.isEmpty ? null : sorted.first;
  }

  void _openNotices() => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const NoticesScreen()));

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.push_pin_outlined, size: 20, color: surface.foreground),
            const SizedBox(width: 8),
            Text('Pin Notice', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: surface.foreground)),
          ],
        ),
        const SizedBox(height: 14),
        FutureBuilder<Notice?>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const SizedBox(height: 140, child: Center(child: CircularProgressIndicator()));
            }
            final notice = snapshot.data;
            if (notice == null) {
              return Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: surface.muted.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: surface.border),
                ),
                child: Center(
                  child: Text('No pinned notices right now.', style: TextStyle(color: surface.mutedForeground, fontSize: 13)),
                ),
              );
            }
            return _StickyNote(notice: notice, onTap: _openNotices);
          },
        ),
      ],
    );
  }
}

class _StickyNote extends StatelessWidget {
  final Notice notice;
  final VoidCallback onTap;

  const _StickyNote({required this.notice, required this.onTap});

  String _fmt(DateTime d) => '${d.day}/${d.month}/${d.year}';

  @override
  Widget build(BuildContext context) {
    final meta = kNoticeTypeMeta[notice.type]!;
    final priorityMeta = kPriorityMeta[notice.priority]!;
    final degrees = noticeTilt(notice.id);

    return Transform.rotate(
      angle: degrees * math.pi / 180,
      child: GestureDetector(
        onTap: onTap,
        child: Padding(
          // Room for the note to rotate without its shadow clipping.
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCE7EF),
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 10, offset: const Offset(0, 5)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(meta.icon, size: 14, color: meta.chipFg),
                        const SizedBox(width: 6),
                        Text(
                          meta.label,
                          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: meta.chipFg, letterSpacing: 0.3),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      notice.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF3F1D2E)),
                    ),
                    if (notice.description.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        notice.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12.5, color: Color(0x993F1D2E)),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Text(
                      '${priorityMeta.label} · Cottage · published ${_fmt(notice.publishAt)}',
                      style: const TextStyle(fontSize: 10.5, color: Color(0x803F1D2E)),
                    ),
                    Text(
                      'Expires ${_fmt(notice.expiresAt)}',
                      style: const TextStyle(fontSize: 10.5, color: Color(0x803F1D2E)),
                    ),
                  ],
                ),
              ),
              // "Washi tape" accent overlapping the top edge.
              Positioned(
                top: -2,
                left: 24,
                child: Transform.rotate(
                  angle: -6 * math.pi / 180,
                  child: Container(
                    width: 56,
                    height: 18,
                    decoration: BoxDecoration(
                      color: priorityMeta.pinColor.withValues(alpha: 0.55),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
