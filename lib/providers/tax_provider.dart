import 'package:flutter/material.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/models/tax_obligation.dart';

class TaxProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  TaxSummary? _taxSummary;
  List<TaxObligation> _obligations = [];
  bool _isLoading = false;
  String? _errorMessage;

  TaxSummary? get taxSummary => _taxSummary;
  List<TaxObligation> get obligations => List.unmodifiable(_obligations);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Convenience accessors for the current period tax figures.
  double get outputTax => _taxSummary?.outputTax ?? 0;
  double get inputTax => _taxSummary?.inputTax ?? 0;
  double get vatPayable => _taxSummary?.vatPayable ?? 0;
  double get vatRefundable => _taxSummary?.vatRefundable ?? 0;
  double get netVat => _taxSummary?.netVat ?? 0;

  TaxProvider(this._apiClient);

  Future<void> fetchTaxSummary() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/taxes/summary');
      if (response['success'] == true) {
        _taxSummary = TaxSummary.fromJson(response);
      } else {
        _errorMessage = response['error'] ?? 'Failed to load tax summary';
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

  Future<void> fetchObligations() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/taxes/obligations');
      if (response['success'] == true) {
        _obligations = (response['data'] as List)
            .map((e) => TaxObligation.fromJson(e))
            .toList();
      } else {
        _errorMessage = response['error'] ?? 'Failed to load obligations';
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

  Future<bool> fileObligation(int obligationId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.put('/taxes/obligations/$obligationId/file');
      if (response['success'] == true) {
        final obligation = TaxObligation.fromJson(response['data']);
        final index = _obligations.indexWhere((o) => o.id == obligation.id);
        if (index != -1) {
          _obligations[index] = obligation;
        }
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to file obligation';
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

  Future<Map<String, dynamic>> calculateVatForAmount(double amount, {double rate = 16.0, bool exempt = false}) async {
    return await _apiClient.post('/taxes/calculate', body: {
      'amount': amount,
      'vatRate': rate,
      'vatExempt': exempt,
    });
  }

  Future<bool> generateObligations() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/taxes/generate-obligations');
      if (response['success'] == true) {
        await fetchObligations(); // Refresh
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to generate obligations';
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

  TaxObligation? findById(int id) {
    final index = _obligations.indexWhere((o) => o.id == id);
    return index != -1 ? _obligations[index] : null;
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
