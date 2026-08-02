import 'package:flutter/material.dart';
import '../data/notice.dart';
import '../data/notice_service.dart';
import '../../../core/models/profile.dart';
import '../../dashboard/data/dashboard_service.dart';
import '../../../core/theme/theme.dart';
import '../../../core/widgets/app_scaffold.dart';
import '../../../core/widgets/cottage_bottom_sheet.dart';
import '../../../core/widgets/empty_state.dart';

/// Full notice-board screen with pinned notices, CRUD, and pull-to-refresh.
class NoticesScreen extends StatefulWidget {
  const NoticesScreen({super.key});

  @override
  State<NoticesScreen> createState() => _NoticesScreenState();
}

class _NoticesScreenState extends State<NoticesScreen> {
  final _noticeService = NoticeService();
  final _dashService = DashboardService();
  late Future<_NoticesData> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<_NoticesData> _load() async {
    final profile = await _dashService.getCurrentProfile();
    final notices = await _noticeService.getNotices(profile.cottageId);
    return _NoticesData(profile: profile, notices: notices);
  }

  void _refresh() => setState(() => _future = _load());

  void _showAddNotice(Profile profile) {
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();

    showCottageSheet(
      context: context,
      builder: (_) => CottageSheetContent(
        title: 'New Notice',
        children: [
          TextField(
            controller: titleCtrl,
            decoration: const InputDecoration(labelText: 'Title'),
            textCapitalization: TextCapitalization.sentences,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: bodyCtrl,
            decoration: const InputDecoration(labelText: 'Body'),
            maxLines: 4,
            textCapitalization: TextCapitalization.sentences,
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: () async {
              if (titleCtrl.text.trim().isEmpty) return;
              Navigator.pop(context);
              await _noticeService.createNotice(
                cottageId: profile.cottageId,
                userId: profile.id,
                title: titleCtrl.text.trim(),
                body: bodyCtrl.text.trim(),
              );
              _refresh();
            },
            child: const Text('Post Notice'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: 'Notices',
      showLogout: false,
      body: FutureBuilder<_NoticesData>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline, size: 40, color: CottageColors.destructive),
                  const SizedBox(height: 12),
                  Text('Could not load notices.\n${snapshot.error}', textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _refresh, child: const Text('Retry')),
                ],
              ),
            );
          }

          final data = snapshot.data!;
          final pinned = data.notices.where((n) => n.isPinned).toList();
          final regular = data.notices.where((n) => !n.isPinned).toList();

          return Stack(
            children: [
              if (data.notices.isEmpty)
                EmptyState(
                  icon: Icons.push_pin_rounded,
                  title: 'No notices yet',
                  subtitle: 'Post a notice to share with your cottage members.',
                  action: ElevatedButton.icon(
                    onPressed: () => _showAddNotice(data.profile),
                    icon: const Icon(Icons.add),
                    label: const Text('New Notice'),
                  ),
                )
              else
                RefreshIndicator(
                  onRefresh: () async => _refresh(),
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      if (pinned.isNotEmpty) ...[
                        _SectionLabel('Pinned'),
                        const SizedBox(height: 8),
                        ...pinned.map((n) => _NoticeCard(
                              notice: n,
                              isOwn: n.userId == data.profile.id,
                              onDelete: () async {
                                await _noticeService.deleteNotice(n.id);
                                _refresh();
                              },
                              onTogglePin: () async {
                                await _noticeService.togglePin(n.id, !n.isPinned);
                                _refresh();
                              },
                            )),
                        const SizedBox(height: 16),
                      ],
                      if (regular.isNotEmpty) ...[
                        _SectionLabel('Recent'),
                        const SizedBox(height: 8),
                        ...regular.map((n) => _NoticeCard(
                              notice: n,
                              isOwn: n.userId == data.profile.id,
                              onDelete: () async {
                                await _noticeService.deleteNotice(n.id);
                                _refresh();
                              },
                              onTogglePin: () async {
                                await _noticeService.togglePin(n.id, !n.isPinned);
                                _refresh();
                              },
                            )),
                      ],
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              Positioned(
                right: 16,
                bottom: 16,
                child: FloatingActionButton(
                  onPressed: () => _showAddNotice(data.profile),
                  backgroundColor: CottageColors.primary,
                  foregroundColor: CottageColors.primaryForeground,
                  child: const Icon(Icons.add),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _NoticesData {
  final Profile profile;
  final List<Notice> notices;
  const _NoticesData({required this.profile, required this.notices});
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w600,
        color: context.surface.mutedForeground,
        letterSpacing: 0.5,
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  final Notice notice;
  final bool isOwn;
  final VoidCallback onDelete;
  final VoidCallback onTogglePin;

  const _NoticeCard({
    required this.notice,
    required this.isOwn,
    required this.onDelete,
    required this.onTogglePin,
  });

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    final surface = context.surface;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: surface.accent,
                    backgroundImage:
                        notice.authorAvatar != null ? NetworkImage(notice.authorAvatar!) : null,
                    child: notice.authorAvatar == null
                        ? Text(
                            notice.authorName.isNotEmpty ? notice.authorName[0].toUpperCase() : '?',
                            style: TextStyle(
                              color: surface.accentForeground,
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          notice.authorName,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: surface.foreground,
                          ),
                        ),
                        Text(
                          _timeAgo(notice.createdAt),
                          style: TextStyle(fontSize: 11, color: surface.mutedForeground),
                        ),
                      ],
                    ),
                  ),
                  if (notice.isPinned)
                    Icon(Icons.push_pin, size: 16, color: CottageColors.primary),
                  if (isOwn)
                    PopupMenuButton<String>(
                      iconSize: 20,
                      onSelected: (v) {
                        if (v == 'delete') onDelete();
                        if (v == 'pin') onTogglePin();
                      },
                      itemBuilder: (_) => [
                        PopupMenuItem(
                          value: 'pin',
                          child: Text(notice.isPinned ? 'Unpin' : 'Pin'),
                        ),
                        const PopupMenuItem(
                          value: 'delete',
                          child: Text('Delete', style: TextStyle(color: CottageColors.destructive)),
                        ),
                      ],
                    ),
                ],
              ),
              if (notice.title.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  notice.title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: surface.foreground,
                  ),
                ),
              ],
              if (notice.body.isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  notice.body,
                  style: TextStyle(fontSize: 14, color: surface.foreground, height: 1.5),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
