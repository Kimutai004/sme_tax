class TaxObligation {
  final int? id;
  final int businessId;
  final String taxType;
  final String? period;
  final DateTime? periodStart;
  final DateTime? periodEnd;
  final double calculatedAmount;
  final double paidAmount;
  final String status;
  final DateTime? dueDate;
  final bool filed;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  TaxObligation({
    this.id,
    required this.businessId,
    required this.taxType,
    this.period,
    this.periodStart,
    this.periodEnd,
    required this.calculatedAmount,
    this.paidAmount = 0,
    this.status = 'pending',
    this.dueDate,
    this.filed = false,
    this.createdAt,
    this.updatedAt,
  });

  factory TaxObligation.fromJson(Map<String, dynamic> json) {
    return TaxObligation(
      id: json['id'],
      businessId: json['business_id'] ?? 0,
      taxType: json['tax_type'] ?? 'vat',
      period: json['period'],
      periodStart: json['period_start'] != null ? DateTime.parse(json['period_start']) : null,
      periodEnd: json['period_end'] != null ? DateTime.parse(json['period_end']) : null,
      calculatedAmount: (json['calculated_amount'] ?? 0).toDouble(),
      paidAmount: (json['paid_amount'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      dueDate: json['due_date'] != null ? DateTime.parse(json['due_date']) : null,
      filed: json['filed'] == 1 || json['filed'] == true,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'business_id': businessId,
      'tax_type': taxType,
      'period': period,
      'calculated_amount': calculatedAmount,
      'due_date': dueDate?.toIso8601String(),
    };
  }

  bool get isOverdue => dueDate != null && dueDate!.isBefore(DateTime.now()) && !filed;
  bool get isDueSoon => dueDate != null && !filed && DateTime.now().isBefore(dueDate!) && dueDate!.difference(DateTime.now()).inDays <= 7;
  bool get isFiled => filed;
}

class TaxSummary {
  final double outputTax;
  final double inputTax;
  final double vatPayable;
  final double vatRefundable;
  final double netVat;
  final Map<String, dynamic> period;
  final List<TaxObligation> upcomingObligations;
  final List<TaxObligation> recentFilings;

  TaxSummary({
    required this.outputTax,
    required this.inputTax,
    required this.vatPayable,
    required this.vatRefundable,
    required this.netVat,
    required this.period,
    required this.upcomingObligations,
    required this.recentFilings,
  });

  factory TaxSummary.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    return TaxSummary(
      outputTax: (data['output_tax'] ?? 0).toDouble(),
      inputTax: (data['input_tax'] ?? 0).toDouble(),
      vatPayable: (data['vat_payable'] ?? 0).toDouble(),
      vatRefundable: (data['vat_refundable'] ?? 0).toDouble(),
      netVat: (data['net_vat'] ?? 0).toDouble(),
      period: Map<String, dynamic>.from(data['current_period'] ?? data['period'] ?? {}),
      upcomingObligations: (data['upcoming_obligations'] as List?)?.map((e) => TaxObligation.fromJson(e)).toList() ?? [],
      recentFilings: (data['recent_filings'] as List?)?.map((e) => TaxObligation.fromJson(e)).toList() ?? [],
    );
  }
}
