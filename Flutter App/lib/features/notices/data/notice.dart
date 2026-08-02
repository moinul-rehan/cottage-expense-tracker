/// A notice-board entry. Mirrors the `notices` table in Supabase.
class Notice {
  final String id;
  final String cottageId;
  final String userId;
  final String title;
  final String body;
  final bool isPinned;
  final DateTime createdAt;
  final String authorName;
  final String? authorAvatar;

  const Notice({
    required this.id,
    required this.cottageId,
    required this.userId,
    required this.title,
    required this.body,
    required this.isPinned,
    required this.createdAt,
    required this.authorName,
    this.authorAvatar,
  });

  factory Notice.fromMap(Map<String, dynamic> map) {
    // The query joins profiles to get author info.
    final profile = map['profiles'] as Map<String, dynamic>?;
    final firstName = profile?['first_name'] as String? ?? '';
    final lastName = profile?['last_name'] as String? ?? '';
    final displayName = lastName.isNotEmpty
        ? lastName
        : (firstName.isNotEmpty ? firstName : 'Member');

    return Notice(
      id: map['id'] as String,
      cottageId: map['cottage_id'] as String,
      userId: map['user_id'] as String,
      title: map['title'] as String? ?? '',
      body: map['body'] as String? ?? '',
      isPinned: map['is_pinned'] as bool? ?? false,
      createdAt: DateTime.parse(map['created_at'] as String),
      authorName: displayName,
      authorAvatar: profile?['avatar_url'] as String?,
    );
  }
}
