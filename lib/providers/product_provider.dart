import 'package:flutter/material.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/models/product.dart';

class ProductProvider extends ChangeNotifier {
  final ApiClient _apiClient;
  List<Product> _products = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Product> get products => List.unmodifiable(_products);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  ProductProvider(this._apiClient);

  Future<void> fetchProducts({String? search, String? category}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      String endpoint = '/products';
      final List<String> params = [];
      if (search != null && search.isNotEmpty) params.add('search=$search');
      if (category != null && category.isNotEmpty) params.add('category=$category');
      if (params.isNotEmpty) endpoint += '?${params.join('&')}';

      final response = await _apiClient.get(endpoint);
      if (response['success'] == true) {
        _products = (response['data'] as List)
            .map((e) => Product.fromJson(e))
            .toList();
      } else {
        _errorMessage = response['error'] ?? 'Failed to load products';
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

  Future<bool> createProduct({
    required String name,
    String? description,
    String? sku,
    String unitOfMeasure = 'piece',
    required double unitPrice,
    double costPrice = 0,
    double stockQuantity = 0,
    double vatRate = 16.0,
    bool vatExempt = false,
    String? category,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post('/products', body: {
        'name': name,
        'description': description,
        'sku': sku,
        'unit_of_measure': unitOfMeasure,
        'unit_price': unitPrice,
        'cost_price': costPrice,
        'stock_quantity': stockQuantity,
        'vat_rate': vatRate,
        'vat_exempt': vatExempt,
        'category': category,
      });

      if (response['success'] == true) {
        _products.insert(0, Product.fromJson(response['data']));
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to create product';
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

  Future<bool> updateProduct(Product product) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.put('/products/${product.id}', body: product.toJson());

      if (response['success'] == true) {
        final updated = Product.fromJson(response['data']);
        final index = _products.indexWhere((p) => p.id == updated.id);
        if (index != -1) {
          _products[index] = updated;
        }
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to update product';
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

  Future<bool> deleteProduct(Product product) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.delete('/products/${product.id}');

      if (response['success'] == true) {
        _products.removeWhere((p) => p.id == product.id);
        notifyListeners();
        return true;
      }
      _errorMessage = response['error'] ?? 'Failed to delete product';
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

  Product? findById(int id) {
    final index = _products.indexWhere((p) => p.id == id);
    return index != -1 ? _products[index] : null;
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
