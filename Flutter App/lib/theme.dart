import 'package:flutter/material.dart';

/// Mirrors the CSS custom properties in the web app's src/app/globals.css
/// :root block, so the native app reads as the same product.
class CottageColors {
  CottageColors._();

  static const background = Color(0xFFF4F4F6);
  static const foreground = Color(0xFF17191E);
  static const card = Color(0xFFFFFFFF);
  static const primary = Color(0xFFDE7356);
  static const primaryForeground = Color(0xFFFFFFFF);
  static const secondary = Color(0xFFF4F4F6);
  static const muted = Color(0xFFE4E5E8);
  static const mutedForeground = Color(0xFF7A818D);
  static const accent = Color(0xFFFBEAE5);
  static const accentForeground = Color(0xFFDE7356);
  static const destructive = Color(0xFFFF4F4F);
  static const border = Color(0xFFE4E5E8);

  // Dashboard stat-card tones (src/app/(house)/dashboard/page.tsx's
  // statCardTones), each as a 15%-opacity tint + its solid icon color.
  static const toneBlueBg = Color(0xFFFBEAE5);
  static const toneBlueFg = Color(0xFFDE7356);
  static const toneGreenBg = Color(0x2663B64E); // #63B64E at 15% alpha
  static const toneGreenFg = Color(0xFF63B64E);
  static const toneOrangeBg = Color(0x26FA9033);
  static const toneOrangeFg = Color(0xFFFA9033);
  static const toneRedBg = Color(0x26FF4F4F);
  static const toneRedFg = Color(0xFFFF4F4F);
}

ThemeData buildCottageTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: CottageColors.primary,
    primary: CottageColors.primary,
    onPrimary: CottageColors.primaryForeground,
    surface: CottageColors.card,
    error: CottageColors.destructive,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: CottageColors.background,
    fontFamily: 'Roboto',
    cardTheme: const CardThemeData(
      color: CottageColors.card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
        side: BorderSide(color: CottageColors.border),
      ),
      margin: EdgeInsets.zero,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: CottageColors.card,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: CottageColors.border),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: CottageColors.primary,
        foregroundColor: CottageColors.primaryForeground,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: CottageColors.background,
      foregroundColor: CottageColors.foreground,
      elevation: 0,
      centerTitle: false,
    ),
    textTheme: const TextTheme(
      bodyMedium: TextStyle(color: CottageColors.foreground),
      titleLarge: TextStyle(color: CottageColors.foreground, fontWeight: FontWeight.w700),
    ),
  );
}
