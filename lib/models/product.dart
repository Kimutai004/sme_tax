class Product {
  final int? id;
  final int businessId;
  final String name;
  final String? description;
  final String? sku;
  final String unitOfMeasure;
  final double unitPrice;
  final double costPrice;
  final double stockQuantity;
  final double vatRate;
  final bool vatExempt;
  final String? category;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Product({
    this.id,
    required this.businessId,
    required this.name,
    this.description,
    this.sku,
    this.unitOfMeasure = 'piece',
    required this.unitPrice,
    this.costPrice = 0,
    this.stockQuantity = 0,
    this.vatRate = 16.0,
    this.vatExempt = false,
    this.category,
    this.createdAt,
    this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      businessId: json['business_id'] ?? 0,
      name: json['name'] ?? '',
      description: json['description'],
      sku: json['sku'],
      unitOfMeasure: json['unit_of_measure'] ?? 'piece',
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      costPrice: (json['cost_price'] ?? 0).toDouble(),
      stockQuantity: (json['stock_quantity'] ?? 0).toDouble(),
      vatRate: (json['vat_rate'] ?? 16.0).toDouble(),
      vatExempt: json['vat_exempt'] == 1 || json['vat_exempt'] == true,
      category: json['category'],
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'business_id': businessId,
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
    };
  }

  Product copyWith({double? unitPrice, double? stockQuantity, bool? vatExempt}) {
    return Product(
      id: id,
      businessId: businessId,
      name: name,
      description: description,
      sku: sku,
      unitOfMeasure: unitOfMeasure,
      unitPrice: unitPrice ?? this.unitPrice,
      costPrice: costPrice,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      vatRate: vatRate,
      vatExempt: vatExempt ?? this.vatExempt,
      category: category,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
