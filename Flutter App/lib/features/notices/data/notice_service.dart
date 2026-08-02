import 'notice.dart';
import '../../../core/services/supabase_service.dart';

/// CRUD operations for the notice board.
class NoticeService {
  final _client = SupabaseService.client;

  /// Fetch all notices for the cottage, newest first, with author info.
  Future<List<Notice>> getNotices(String cottageId) async {
    final rows = await _client
        .from('notices')
        .select('*, profiles!notices_user_id_fkey(first_name, last_name, avatar_url)')
        .eq('cottage_id', cottageId)
        .order('is_pinned', ascending: false)
        .order('created_at', ascending: false);

    return (rows as List)
        .map((r) => Notice.fromMap(r as Map<String, dynamic>))
        .toList();
  }

  /// Create a new notice.
  Future<void> createNotice({
    required String cottageId,
    required String userId,
    required String title,
    required String body,
  }) async {
    await _client.from('notices').insert({
      'cottage_id': cottageId,
      'user_id': userId,
      'title': title,
      'body': body,
      'is_pinned': false,
    });
  }

  /// Delete a notice (only own notices).
  Future<void> deleteNotice(String noticeId) async {
    await _client.from('notices').delete().eq('id', noticeId);
  }

  /// Toggle the pinned state of a notice.
  Future<void> togglePin(String noticeId, bool pinned) async {
    await _client.from('notices').update({'is_pinned': pinned}).eq('id', noticeId);
  }
}
