import 'package:flutter/material.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/models/notification.dart';

class NotificationProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  List<AppNotification> _notifications = [];
  List<AppNotification> _unreadNotifications = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<AppNotification> get notifications => List.unmodifiable(_notifications);
  List<AppNotification> get unreadNotifications => List.unmodifiable(_unreadNotifications);
  int get unreadCount => _unreadNotifications.length;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  NotificationProvider(this._apiClient);

  Future<void> fetchNotifications() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/notifications');
      if (response['success'] == true) {
        _notifications = (response['data'] as List)
            .map((e) => AppNotification.fromJson(e))
            .toList();
        _unreadNotifications = _notifications.where((n) => !n.read).toList();
      } else {
        _errorMessage = response['error'] ?? 'Failed to load notifications';
      }
    } on ApiException catch (e) {
      _errorMessage = e.message;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchUnread() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/notifications/unread');
      if (response['success'] == true) {
        _unreadNotifications = (response['data'] as List)
            .map((e) => AppNotification.fromJson(e))
            .toList();
      } else {
        _errorMessage = response['error'] ?? 'Failed to load notifications';
      }
    } on ApiException catch (e) {
      _errorMessage = e.message;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> markRead(int id) async {
    try {
      final response = await _apiClient.put('/notifications/$id/read');
      if (response['success'] == true) {
        final index = _notifications.indexWhere((n) => n.id == id);
        if (index != -1) {
          _notifications[index] = _notifications[index].copyWith(read: true);
        }
        _unreadNotifications.removeWhere((n) => n.id == id);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> markAllRead() async {
    try {
      final response = await _apiClient.put('/notifications/read-all');
      if (response['success'] == true) {
        _notifications = _notifications.map((n) => n.copyWith(read: true)).toList();
        _unreadNotifications = [];
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> generateReminders() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/notifications/generate-reminders');
      if (response['success'] == true) {
        await fetchNotifications();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to generate reminders';
      notifyListeners();
      return false;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
