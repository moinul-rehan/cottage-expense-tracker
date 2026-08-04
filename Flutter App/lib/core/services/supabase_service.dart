import 'package:supabase_flutter/supabase_flutter.dart';

const _supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const _supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');

class SupabaseService {
  SupabaseService._();

  static String? initializationError;
  static bool get isInitialized => initializationError == null && _isInitDone;
  static bool _isInitDone = false;

  static Future<void> initialize() async {
    if (_supabaseUrl.isEmpty || _supabaseAnonKey.isEmpty) {
      initializationError =
          'SUPABASE_URL or SUPABASE_ANON_KEY is empty.\n\n'
          'Please ensure you run the app with the correct configurations:\n'
          'flutter run --dart-define-from-file=env.json';
      return;
    }
    try {
      await Supabase.initialize(
        url: _supabaseUrl,
        publishableKey: _supabaseAnonKey,
      );
      _isInitDone = true;
    } catch (e) {
      initializationError = 'Failed to initialize Supabase:\n$e';
    }
  }

  static SupabaseClient get client {
    if (!isInitialized) {
      throw StateError('Supabase has not been initialized. Details: $initializationError');
    }
    return Supabase.instance.client;
  }

  static User? get currentUser => isInitialized ? client.auth.currentUser : null;

  static Session? get currentSession => isInitialized ? client.auth.currentSession : null;

  static Future<void> signOut() async {
    if (isInitialized) {
      await client.auth.signOut();
    }
  }
}
