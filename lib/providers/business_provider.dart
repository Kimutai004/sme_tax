import 'package:flutter/material.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/models/user.dart';

class BusinessProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  Business? _business;
  bool _isLoading = false;
  String? _errorMessage;

  Business? get business => _business;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  BusinessProvider(this._apiClient);

  Future<bool> createBusiness({
    required String name,
    required String kraPin,
    String? physicalAddress,
    String? postalAddress,
    String? email,
    String? phone,
    String? businessType,
    String? industry,
    bool vatRegistered = false,
    String? vatNumber,
    String currency = 'KES',
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/business', body: {
        'name': name,
        'kra_pin': kraPin,
        'physical_address': physicalAddress,
        'postal_address': postalAddress,
        'email': email,
        'phone': phone,
        'business_type': businessType,
        'industry': industry,
        'vat_registered': vatRegistered,
        'vat_number': vatNumber,
        'currency': currency,
      });

      if (response['success'] == true) {
        _business = Business.fromJson(response['business']);
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to create business';
      notifyListeners();
      return false;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    }
  }

  Future<void> fetchBusiness() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiClient.get('/business');
      if (response['success'] == true) {
        _business = Business.fromJson(response['business']);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateBusiness({
    String? name,
    String? kraPin,
    String? physicalAddress,
    String? postalAddress,
    String? email,
    String? phone,
    String? businessType,
    String? industry,
    bool? vatRegistered,
    String? vatNumber,
    String? currency,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.put('/business', body: {
        if (name != null) 'name': name,
        if (kraPin != null) 'kra_pin': kraPin,
        if (physicalAddress != null) 'physical_address': physicalAddress,
        if (postalAddress != null) 'postal_address': postalAddress,
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        if (businessType != null) 'business_type': businessType,
        if (industry != null) 'industry': industry,
        if (vatRegistered != null) 'vat_registered': vatRegistered,
        if (vatNumber != null) 'vat_number': vatNumber,
        if (currency != null) 'currency': currency,
      });

      if (response['success'] == true) {
        _business = Business.fromJson(response['business']);
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to update business';
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
