import 'package:flutter/material.dart';

/// Tamin premium palette — navy / jade / champagne (matches web console).
class TaminColors {
  static const navy = Color(0xFF0B1F33);
  static const forest = Color(0xFF132A3E);
  static const teal = Color(0xFF0F766E);
  static const mint = Color(0xFF14B8A6);
  static const champagne = Color(0xFFF5E6C8);
  static const gold = Color(0xFFC9A227);
  static const paper = Color(0xFFF3F6F8);
  static const ink = Color(0xFF0F172A);
  static const mute = Color(0xFF64748B);
  static const line = Color(0xFFD8E0E8);
  static const surface = Color(0xFFFFFFFF);
}

ThemeData buildTaminTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: TaminColors.paper,
    colorScheme: ColorScheme.fromSeed(
      seedColor: TaminColors.teal,
      primary: TaminColors.teal,
      secondary: TaminColors.gold,
      surface: TaminColors.surface,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: TaminColors.navy,
      foregroundColor: TaminColors.champagne,
      elevation: 0,
      centerTitle: false,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: TaminColors.teal,
      foregroundColor: Colors.white,
    ),
    cardTheme: CardTheme(
      color: TaminColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: TaminColors.line),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: TaminColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: TaminColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: TaminColors.teal, width: 1.5),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: TaminColors.teal,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: TaminColors.surface,
      indicatorColor: TaminColors.teal.withOpacity(0.12),
      labelTextStyle: WidgetStateProperty.all(
        const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      ),
    ),
  );

  return base.copyWith(
    textTheme: base.textTheme.apply(
      bodyColor: TaminColors.ink,
      displayColor: TaminColors.ink,
    ),
  );
}
