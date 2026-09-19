import 'package:flutter/material.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/models/customer.dart';

class CustomerProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  List<Customer> _customers = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Customer> get customers => List.unmodifiable(_customers);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  CustomerProvider(this._apiClient);

  Future<void> fetchCustomers({String? search}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/customers${search != null && search.isNotEmpty ? '?search=$search' : ''}');
      if (response['success'] == true) {
        _customers = (response['data'] as List)
            .map((e) => Customer.fromJson(e))
            .toList();
      } else {
        _errorMessage = response['error'] ?? 'Failed to load customers';
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

  Future<bool> createCustomer({
    required String name,
    String? email,
    String? phone,
    String? physicalAddress,
    String? kraPin,
    String customerType = 'retail',
    double creditLimit = 0,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/customers', body: {
        'name': name,
        'email': email,
        'phone': phone,
        'physical_address': physicalAddress,
        'kra_pin': kraPin,
        'customer_type': customerType,
        'credit_limit': creditLimit,
      });

      if (response['success'] == true) {
        _customers.insert(0, Customer.fromJson(response['data']));
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to create customer';
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

  Future<bool> updateCustomer(Customer customer) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.put('/customers/${customer.id}', body: customer.toJson());

      if (response['success'] == true) {
        final updated = Customer.fromJson(response['data']);
        final index = _customers.indexWhere((c) => c.id == updated.id);
        if (index != -1) {
          _customers[index] = updated;
        }
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to update customer';
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

  Future<bool> deleteCustomer(Customer customer) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.delete('/customers/${customer.id}');

      if (response['success'] == true) {
        _customers.removeWhere((c) => c.id == customer.id);
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to delete customer';
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

  Customer? findById(int id) {
    final index = _customers.indexWhere((c) => c.id == id);
    return index != -1 ? _customers[index] : null;
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
