import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class AppFormatters {
  static final NumberFormat currency = NumberFormat.currency(locale: 'en_KE', symbol: 'KES ');
  static final NumberFormat compactCurrency = NumberFormat.compactCurrency(locale: 'en_KE', symbol: 'KES ', decimalDigits: 0);
  static final NumberFormat number = NumberFormat.decimalPattern('en_KE');
  static final NumberFormat percent = NumberFormat.percentPattern('en_KE');

  static String formatDate(DateTime date) {
    return DateFormat.yMMMd('en_KE').format(date);
  }

  static String formatDateLong(DateTime date) {
    return DateFormat.yMMMMd('en_KE').format(date);
  }

  static String formatDateTime(DateTime date) {
    return DateFormat.yMMMd('en_KE').add_jm().format(date);
  }

  static String formatTimeAgo(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 365) {
      return '${date.year}/${date.month}/${date.day}';
    } else if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return '$months month${months > 1 ? 's' : ''} ago';
    } else if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }
}
