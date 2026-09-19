import 'package:flutter/material.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/models/user.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _errorMessage;
  bool _requiresBusinessSetup = false;

  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get requiresBusinessSetup => _requiresBusinessSetup;

  AuthProvider() {
    _checkExistingSession();
  }

  Future<void> _checkExistingSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      final client = await ApiClient.create();
      final response = await client.get('/auth/me');
      if (response['success'] == true) {
        _user = User.fromJson(response['user']);
        _isAuthenticated = true;
        _requiresBusinessSetup = _user?.business == null;
      }
    } on ApiException catch (e) {
      if (e is! ApiUnauthorizedException) {
        _errorMessage = e.message;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.login(email, password);
      if (response['success'] == true && response['token'] != null) {
        await ApiClient.saveToken(response['token']);
        ApiClient.sharedToken = response['token'];
        _user = User.fromJson(response['user']);
        _isAuthenticated = true;
        _requiresBusinessSetup = _user?.business == null;
        _errorMessage = null;
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Login failed';
      notifyListeners();
      return false;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register(String name, String email, String password, String? phone) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.register(name, email, password, phone);
      if (response['success'] == true && response['token'] != null) {
        await ApiClient.saveToken(response['token']);
        ApiClient.sharedToken = response['token'];
        _user = User.fromJson(response['user']);
        _isAuthenticated = true;
        _requiresBusinessSetup = true;
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Registration failed';
      notifyListeners();
      return false;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchProfile() async {
    try {
      final response = await _apiClient.get('/auth/me');
      if (response['success'] == true) {
        _user = User.fromJson(response['user']);
        _requiresBusinessSetup = _user?.business == null;
        notifyListeners();
      }
    } catch (e) {
      // Silent error, will be handled by auth check
    }
  }

  Future<void> logout() async {
    await _apiClient.logout();
    ApiClient.sharedToken = null;
    _user = null;
    _isAuthenticated = false;
    _requiresBusinessSetup = false;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
