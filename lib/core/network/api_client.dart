import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static String _baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  /// Set the base URL for the API client. Useful for configuring the correct
  /// URL when running on a physical device instead of an emulator.
  /// For physical devices, use your computer's local network IP address
  /// (e.g., http://192.168.1.100:3000/api/v1)
  static void setBaseUrl(String url) {
    _baseUrl = url;
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString('api_base_url', url);
    });
  }

  /// Get the current base URL
  static String getBaseUrl() {
    return _baseUrl;
  }

  /// Load saved base URL from persistent storage
  static Future<void> loadSavedBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUrl = prefs.getString('api_base_url');
    if (savedUrl != null && savedUrl.isNotEmpty) {
      _baseUrl = savedUrl;
    }
  }

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  /// Global token shared across all ApiClient instances
  static String? sharedToken;

  String? _token;

  ApiClient([String? token]) : _token = token ?? sharedToken;

  static Future<ApiClient> create() async {
    final token = await _storage.read(key: 'auth_token');
    return ApiClient(token);
  }

  static Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  static Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
  }

  Future<http.Response> _request(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
  }) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    final Map<String, String> requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

        if (_token != null || sharedToken != null) {
      requestHeaders['Authorization'] = 'Bearer ${_token ?? sharedToken}';
    }

    if (headers != null) {
      requestHeaders.addAll(headers);
    }

    http.Response response;

    try {
      if (method == 'GET') {
        response = await http.get(url, headers: requestHeaders).timeout(
          const Duration(seconds: 30),
        );
      } else if (method == 'POST') {
        response = await http.post(
          url,
          headers: requestHeaders,
          body: body != null ? jsonEncode(body) : null,
        ).timeout(const Duration(seconds: 30));
      } else if (method == 'PUT') {
        response = await http.put(
          url,
          headers: requestHeaders,
          body: body != null ? jsonEncode(body) : null,
        ).timeout(const Duration(seconds: 30));
      } else if (method == 'DELETE') {
        response = await http.delete(
          url,
          headers: requestHeaders,
        ).timeout(const Duration(seconds: 30));
      } else {
        throw Exception('Method not supported: $method');
      }
    } catch (e) {
      throw ApiNetworkException('Network error: ${e.toString()}');
    }

    if (response.statusCode >= 400) {
      _handleErrorResponse(response);
    }

    return response;
  }

  void _handleErrorResponse(http.Response response) {
    final body = jsonDecode(response.body);
    final message = body['error'] ?? body['message'] ?? 'Unknown error';
    final statusCode = response.statusCode;

    if (statusCode == 401) {
      throw ApiUnauthorizedException(message);
    } else if (statusCode == 404) {
      throw ApiNotFoundException(message);
    } else {
      throw ApiException(message, statusCode);
    }
  }

  // Generic methods
  Future<Map<String, dynamic>> get(String endpoint) async {
    final response = await _request('GET', endpoint);
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> post(String endpoint, {Map<String, dynamic>? body}) async {
    final response = await _request('POST', endpoint, body: body);
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> put(String endpoint, {Map<String, dynamic>? body}) async {
    final response = await _request('PUT', endpoint, body: body);
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> delete(String endpoint) async {
    final response = await _request('DELETE', endpoint);
    return jsonDecode(response.body);
  }

  // Auth-specific methods
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _request('POST', '/auth/login', body: {
      'email': email,
      'password': password,
    });
    final data = jsonDecode(response.body);
    if (data['token'] != null) {
      await _storage.write(key: 'auth_token', value: data['token']);
      _token = data['token'];
    }
    return data;
  }

  Future<Map<String, dynamic>> register(String name, String email, String password, String? phone) async {
    final response = await _request('POST', '/auth/register', body: {
      'name': name,
      'email': email,
      'password': password,
      'phone': phone,
    });
    final data = jsonDecode(response.body);
    if (data['token'] != null) {
      await _storage.write(key: 'auth_token', value: data['token']);
      _token = data['token'];
    }
    return data;
  }

  Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    _token = null;
  }
}

// Exception classes
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => 'ApiException: $message';
}

class ApiUnauthorizedException extends ApiException {
  ApiUnauthorizedException(String message) : super(message, 401);
}

class ApiNotFoundException extends ApiException {
  ApiNotFoundException(String message) : super(message, 404);
}

class ApiNetworkException extends ApiException {
  ApiNetworkException(String message) : super(message, 0);
}
