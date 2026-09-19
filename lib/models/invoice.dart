import 'customer.dart';

class InvoiceItem {
  final int? id;
  final int? productId;
  final String? productName;
  final String? description;
  final double quantity;
  final double unitPrice;
  final double vatRate;
  final double vatAmount;
  final double lineTotal;

  InvoiceItem({
    this.id,
    this.productId,
    this.productName,
    this.description,
    required this.quantity,
    required this.unitPrice,
    this.vatRate = 16.0,
    required this.vatAmount,
    required this.lineTotal,
  });

  factory InvoiceItem.fromJson(Map<String, dynamic> json) {
    return InvoiceItem(
      id: json['id'],
      productId: json['product_id'],
      productName: json['product_name'],
      description: json['description'],
      quantity: (json['quantity'] ?? 0).toDouble(),
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      vatRate: (json['vat_rate'] ?? 16.0).toDouble(),
      vatAmount: (json['vat_amount'] ?? 0).toDouble(),
      lineTotal: (json['line_total'] ?? 0).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'description': description,
      'quantity': quantity,
      'unit_price': unitPrice,
      'vat_rate': vatRate,
      'vat_amount': vatAmount,
      'line_total': lineTotal,
    };
  }

  static InvoiceItem fromProduct({
    required String description,
    required double quantity,
    required double unitPrice,
    double vatRate = 16.0,
    int? productId,
  }) {
    final lineTotal = double.parse((quantity * unitPrice).toStringAsFixed(2));
    final vatAmount = double.parse((lineTotal * vatRate / 100).toStringAsFixed(2));
    return InvoiceItem(
      productId: productId,
      description: description,
      quantity: quantity,
      unitPrice: unitPrice,
      vatRate: vatRate,
      vatAmount: vatAmount,
      lineTotal: lineTotal,
    );
  }
}


class Invoice {
  final int? id;
  final int businessId;
  final String invoiceNumber;
  final int? customerId;
  final Customer? customer;
  final DateTime? invoiceDate;
  final DateTime? dueDate;
  final String status;
  final double subtotal;
  final double vatAmount;
  final double totalAmount;
  final double amountPaid;
  final double balance;
  final String? notes;
  final String? paymentMethod;
  final String? etimsInvoiceId;
  final String? etimsStatus;
  final List<InvoiceItem> items;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Invoice({
    this.id,
    required this.businessId,
    required this.invoiceNumber,
    this.customerId,
    this.customer,
    this.invoiceDate,
    this.dueDate,
    this.status = 'draft',
    required this.subtotal,
    required this.vatAmount,
    required this.totalAmount,
    this.amountPaid = 0,
    required this.balance,
    this.notes,
    this.paymentMethod,
    this.etimsInvoiceId,
    this.etimsStatus,
    this.items = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) {
    return Invoice(
      id: json['id'],
      businessId: json['business_id'] ?? 0,
      invoiceNumber: json['invoice_number'] ?? '',
      customerId: json['customer_id'],
      customer: json['customer'] != null ? Customer.fromJson(json['customer']) : null,
      invoiceDate: json['invoice_date'] != null ? DateTime.parse(json['invoice_date']) : null,
      dueDate: json['due_date'] != null ? DateTime.parse(json['due_date']) : null,
      status: json['status'] ?? 'draft',
      subtotal: (json['subtotal'] ?? 0).toDouble(),
      vatAmount: (json['vat_amount'] ?? 0).toDouble(),
      totalAmount: (json['total_amount'] ?? 0).toDouble(),
      amountPaid: (json['amount_paid'] ?? 0).toDouble(),
      balance: (json['balance'] ?? 0).toDouble(),
      notes: json['notes'],
      paymentMethod: json['payment_method'],
      etimsInvoiceId: json['etims_invoice_id'],
      etimsStatus: json['etims_status'],
      items: json['items'] != null
          ? (json['items'] as List).map((e) => InvoiceItem.fromJson(e)).toList()
          : [],
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'business_id': businessId,
      'invoice_number': invoiceNumber,
      'customer_id': customerId,
      'invoice_date': invoiceDate?.toIso8601String(),
      'due_date': dueDate?.toIso8601String(),
      'status': status,
      'subtotal': subtotal,
      'vat_amount': vatAmount,
      'total_amount': totalAmount,
      'balance': balance,
      'notes': notes,
      'payment_method': paymentMethod,
      'items': items.map((e) => e.toJson()).toList(),
    };
  }

  bool get isEtimsSubmitted => etimsInvoiceId != null && etimsStatus == 'approved';
  bool get isEtimsPending => etimsStatus == null || etimsStatus == 'pending' || etimsStatus == 'processing';
  bool get isEtimsFailed => etimsStatus == 'error' || etimsStatus == 'rejected';
  bool get isDraft => status == 'draft';
  bool get isIssued => status == 'issued' || status == 'paid';
  bool get isPaid => status == 'paid';
  bool get isOverdue => dueDate != null && dueDate!.isBefore(DateTime.now()) && balance > 0;

  Invoice copyWith({String? status, double? amountPaid, String? paymentMethod}) {
    final newAmountPaid = amountPaid ?? this.amountPaid;
    final newBalance = (totalAmount - newAmountPaid).clamp(0, totalAmount);
    return Invoice(
      id: id,
      businessId: businessId,
      invoiceNumber: invoiceNumber,
      customerId: customerId,
      customer: customer,
      invoiceDate: invoiceDate,
      dueDate: dueDate,
      status: status ?? this.status,
      subtotal: subtotal,
      vatAmount: vatAmount,
      totalAmount: totalAmount,
      amountPaid: newAmountPaid,
      balance: newBalance,
      notes: notes,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      etimsInvoiceId: etimsInvoiceId,
      etimsStatus: etimsStatus,
      items: items,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}

