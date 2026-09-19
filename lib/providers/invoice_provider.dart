import 'package:flutter/material.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/models/invoice.dart';
import 'package:sme_tax/models/customer.dart';
import 'package:sme_tax/models/product.dart';

class InvoiceProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  List<Invoice> _invoices = [];
  bool _isLoading = false;
  String? _errorMessage;
  Invoice? _currentInvoice;

  List<Invoice> get invoices => List.unmodifiable(_invoices);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Invoice? get currentInvoice => _currentInvoice;

  InvoiceProvider(this._apiClient);

  Future<void> fetchInvoices({String? status, int? customerId, String? search}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final List<String> params = [];
      if (status != null && status.isNotEmpty) params.add('status=$status');
      if (customerId != null) params.add('customerId=$customerId');
      if (search != null && search.isNotEmpty) params.add('search=$search');

      final endpoint = '/invoices${params.isNotEmpty ? '?${params.join('&')}' : ''}';
      final response = await _apiClient.get(endpoint);

      if (response['success'] == true) {
        _invoices = (response['data'] as List).map((e) => Invoice.fromJson(e)).toList();
      } else {
        _errorMessage = response['error'] ?? 'Failed to load invoices';
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

  Future<void> fetchInvoice(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.get('/invoices/$id');
      if (response['success'] == true) {
        _currentInvoice = Invoice.fromJson(response['data']);
      } else {
        _errorMessage = response['error'] ?? 'Failed to load invoice';
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

  Future<Map<String, dynamic>?> createInvoice({
    int? customerId,
    DateTime? invoiceDate,
    DateTime? dueDate,
    required List<InvoiceItem> items,
    String? notes,
    String? paymentMethod,
    bool submitToEtimis = true,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    _currentInvoice = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/invoices', body: {
        if (customerId != null) 'customerId': customerId,
        'invoiceDate': invoiceDate?.toIso8601String(),
        'dueDate': dueDate?.toIso8601String(),
        'items': items.map((item) => {
          'product_id': item.productId,
          'description': item.description,
          'quantity': item.quantity,
          'unit_price': item.unitPrice,
          'vat_rate': item.vatRate,
          'vat_exempt': false,
        }).toList(),
        'notes': notes,
        'payment_method': paymentMethod,
        'submitToEtimis': submitToEtimis,
      });

      if (response['success'] == true) {
        _currentInvoice = Invoice.fromJson(response['data']);
        _invoices.insert(0, _currentInvoice!);
        notifyListeners();
        return response;
      }
      _errorMessage = response['error'] ?? 'Failed to create invoice';
      notifyListeners();
      return response;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }



  Future<bool> updateInvoiceStatus(int invoiceId, String status, {double? amountPaid, String? paymentMethod}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final Map<String, dynamic> body = {'status': status};
      if (amountPaid != null) body['amount_paid'] = amountPaid;
      if (paymentMethod != null) body['payment_method'] = paymentMethod;

      final response = await _apiClient.put('/invoices/$invoiceId', body: body);

      if (response['success'] == true) {
        final invoice = Invoice.fromJson(response['data']);
        final index = _invoices.indexWhere((i) => i.id == invoice.id);
        if (index != -1) { _invoices[index] = invoice; }
        if (_currentInvoice?.id == invoice.id) { _currentInvoice = invoice; }
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to update invoice';
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

  Future<Map<String, dynamic>?> retryEtimisSubmission(int invoiceId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/invoices/$invoiceId/retry-etims');
      if (response['success'] == true) {
        final invoice = Invoice.fromJson(response['data']);
        final index = _invoices.indexWhere((i) => i.id == invoice.id);
        if (index != -1) { _invoices[index] = invoice; }
        if (_currentInvoice?.id == invoice.id) { _currentInvoice = invoice; }
        notifyListeners();
        return response;
      }
      notifyListeners();
      return response;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteInvoice(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.delete('/invoices/$id');
      if (response['success'] == true) {
        _invoices.removeWhere((i) => i.id == id);
        if (_currentInvoice?.id == id) { _currentInvoice = null; }
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to delete invoice';
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

  Future<Map<String, dynamic>> getInvoiceStats() async {
    return await _apiClient.get('/invoices/stats');
  }

  Invoice? findById(int id) {
    final index = _invoices.indexWhere((i) => i.id == id);
    return index != -1 ? _invoices[index] : null;
  }

  static double calculateVat(double amount, {double rate = 16.0, bool exempt = false}) {
    if (exempt) return 0;
    return double.parse((amount * rate / 100).toStringAsFixed(2));
  }

  static double calculateInvoiceTotal(List<InvoiceItem> items) {
    double subtotal = 0;
    double vat = 0;
    for (final item in items) {
      subtotal += item.quantity * item.unitPrice;
      vat += item.vatAmount;
    }
    return double.parse((subtotal + vat).toStringAsFixed(2));
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void clearCurrentInvoice() {
    _currentInvoice = null;
    notifyListeners();
  }
}
