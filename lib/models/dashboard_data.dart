/// Dashboard data model that aggregates data from multiple API endpoints
class DashboardData {
  final MonthlySales monthlySales;
  final int customerCount;
  final int productCount;
  final double outstandingBalance;
  final double vatPayable;
  final List<RecentInvoice> recentInvoices;
  final List<UpcomingObligation> upcomingObligations;
  final int unreadNotifications;

  DashboardData({
    required this.monthlySales,
    required this.customerCount,
    required this.productCount,
    required this.outstandingBalance,
    required this.vatPayable,
    required this.recentInvoices,
    required this.upcomingObligations,
    required this.unreadNotifications,
  });

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;

    return DashboardData(
      monthlySales: MonthlySales.fromJson(data['monthly_sales'] ?? {}),
      customerCount: data['customer_count'] ?? 0,
      productCount: data['product_count'] ?? 0,
      outstandingBalance: (data['outstanding_balance'] ?? 0).toDouble(),
      vatPayable: (data['vat_payable'] ?? 0).toDouble(),
      recentInvoices: (data['recent_invoices'] as List?)?
          .map((e) => RecentInvoice.fromJson(e)).toList() ?? [],
      upcomingObligations: (data['upcoming_obligations'] as List?)?
          .map((e) => UpcomingObligation.fromJson(e)).toList() ?? [],
      unreadNotifications: data['unread_notifications'] ?? 0,
    );
  }
}

class MonthlySales {
  final double total;
  final double vat;
  final int count;

  MonthlySales({required this.total, required this.vat, required this.count});

  factory MonthlySales.fromJson(Map<String, dynamic> json) {
    return MonthlySales(
      total: (json['total'] ?? 0).toDouble(),
      vat: (json['vat'] ?? 0).toDouble(),
      count: json['count'] ?? 0,
    );
  }
}

class RecentInvoice {
  final int id;
  final String invoiceNumber;
  final double totalAmount;
  final String status;

  RecentInvoice({required this.id, required this.invoiceNumber, required this.totalAmount, required this.status});

  factory RecentInvoice.fromJson(Map<String, dynamic> json) {
    return RecentInvoice(
      id: json['id'] ?? 0,
      invoiceNumber: json['invoice_number'] ?? '',
      totalAmount: (json['total_amount'] ?? 0).toDouble(),
      status: json['status'] ?? 'draft',
    );
  }
}

class UpcomingObligation {
  final int id;
  final String taxType;
  final String? period;
  final double calculatedAmount;
  final DateTime? dueDate;

  UpcomingObligation({
    required this.id,
    required this.taxType,
    this.period,
    required this.calculatedAmount,
    this.dueDate,
  });

  factory UpcomingObligation.fromJson(Map<String, dynamic> json) {
    return UpcomingObligation(
      id: json['id'] ?? 0,
      taxType: json['tax_type'] ?? 'vat',
      period: json['period'],
      calculatedAmount: (json['calculated_amount'] ?? 0).toDouble(),
      dueDate: json['due_date'] != null ? DateTime.parse(json['due_date']) : null,
    );
  }
}
