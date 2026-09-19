class AppValidators {
  static String? validateRequired(String? value, [String? fieldName]) {
    if (value == null || value.trim().isEmpty) {
      return '${fieldName ?? 'This field'} is required';
    }
    return null;
  }

  static String? validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) return null;
    final phoneRegex = RegExp(r'^(\+?254|0)[17]\d{8}$');
    if (!phoneRegex.hasMatch(value.replaceAll(RegExp(r'\s+'), ''))) {
      return 'Please enter a valid Kenyan phone number (e.g. 0712345678)';
    }
    return null;
  }

  static String? validateKraPin(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'KRA PIN is required';
    }
    // KRA PIN format: P followed by 9 digits, e.g., P123456789
    final kraRegex = RegExp(r'^[PRC]\d{9}$');
    if (!kraRegex.hasMatch(value.replaceAll(RegExp(r'\s+'), ''))) {
      return 'Please enter a valid KRA PIN (e.g., P123456789)';
    }
    return null;
  }

  static String? validateAmount(String? value) {
    if (value == null || value.isEmpty) {
      return 'Amount is required';
    }
    final num = double.tryParse(value);
    if (num == null) {
      return 'Please enter a valid amount';
    }
    if (num < 0) {
      return 'Amount cannot be negative';
    }
    return null;
  }

  static String? validateNumber(String? value, [String? fieldName]) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'This field'} is required';
    }
    final num = double.tryParse(value);
    if (num == null) {
      return 'Please enter a valid number';
    }
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  }
}
