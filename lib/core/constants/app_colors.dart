import 'package:flutter/material.dart';

class AppColors {
  // Primary brand colors
  static const Color primary = Color(0xFF0D6EFD);
  static const Color primaryDark = Color(0xFF0A58CA);
  static const Color primaryLight = Color(0xFF75A8F8);

  // Kenyan flag inspired colors for national identity
  static const Color kenyaBlack = Color(0xFF000000);
  static const Color kenyaRed = Color(0xFFD90429);
  static const Color kenyaGreen = Color(0xFF0FA64C);
  static const Color kenyaWhite = Color(0xFFFFFFFF);

  // Accent colors for tax/compliance
  static const Color taxBlue = Color(0xFF0D6EFD);
  static const Color taxGreen = Color(0xFF0CB798);
  static const Color taxOrange = Color(0xFFFC9003);

  // Status colors (Kenyan tax compliant)
  static const Color compliant = Color(0xFF0CB798);
  static const Color warning = Color(0xFFFF9F00);
  static const Color error = Color(0xFFDC354B);
  static const Color info = Color(0xFF17A2B8);

  // Background and surface colors
  static const Color background = Color(0xFFF5F7FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFDEE2E6);
  static const Color divider = Color(0xFFE4E7EB);

  // Text colors
  static const Color textPrimary = Color(0xFF212529);
  static const Color textSecondary = Color(0xFF6C757D);
  static const Color textTertiary = Color(0xFF9DA7B3);
  static const Color textDisabled = Color(0xFFCED4DA);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient kenyFlagGradient = LinearGradient(
    colors: [kenyaGreen, kenyaRed],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
