import 'package:supabase_flutter/supabase_flutter.dart';

/// Values must match the web app's NEXT_PUBLIC_SUPABASE_URL /
/// NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.local in the Next.js project).
/// The anon key is safe to ship in a client build -- it's the same one the
/// website already exposes to every browser; access is enforced by
/// Postgres RLS, not by keeping this value secret.
///
/// Pass real values at build/run time instead of hardcoding them, e.g.:
///   flutter run \
///     --dart-define=SUPABASE_URL=https://xxxx.supabase.co \
///     --dart-define=SUPABASE_ANON_KEY=sb_publishable_xxxx
const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const _supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

class SupabaseService {
  SupabaseService._();

  static Future<void> initialize() async {
    assert(
      _supabaseUrl.isNotEmpty && _supabaseAnonKey.isNotEmpty,
      'SUPABASE_URL and SUPABASE_ANON_KEY must be passed via --dart-define. '
      'See lib/services/supabase_service.dart for the exact flag names.',
    );
    await Supabase.initialize(url: _supabaseUrl, anonKey: _supabaseAnonKey);
  }

  static SupabaseClient get client => Supabase.instance.client;

  static User? get currentUser => client.auth.currentUser;

  static Session? get currentSession => client.auth.currentSession;

  static Future<void> signOut() => client.auth.signOut();
}
