import 'package:flutter/material.dart';
import 'package:sme_tax/features/auth/pages/login_page.dart';
import 'package:sme_tax/features/auth/pages/register_page.dart';
import 'package:sme_tax/features/auth/pages/business_setup_page.dart';
import 'package:sme_tax/features/dashboard/pages/dashboard_page.dart';
import 'package:sme_tax/features/customers/pages/customer_list_page.dart';
import 'package:sme_tax/features/customers/pages/customer_form_page.dart';
import 'package:sme_tax/features/products/pages/product_list_page.dart';
import 'package:sme_tax/features/products/pages/product_form_page.dart';
import 'package:sme_tax/features/invoices/pages/invoice_list_page.dart';
import 'package:sme_tax/features/invoices/pages/invoice_detail_page.dart';
import 'package:sme_tax/features/invoices/pages/invoice_form_page.dart';
import 'package:sme_tax/features/taxes/pages/tax_summary_page.dart';
import 'package:sme_tax/features/reports/pages/reports_page.dart';
import 'package:sme_tax/features/notifications/pages/notifications_page.dart';

class AppRoutes {
  static const String login = '/login';
  static const String register = '/register';
  static const String businessSetup = '/business-setup';
  static const String dashboard = '/dashboard';
  static const String customerList = '/customers';
  static const String customerForm = '/customers/form';
  static const String customerDetail = '/customers/detail';
  static const String productList = '/products';
  static const String productForm = '/products/form';
  static const String invoiceList = '/invoices';
  static const String invoiceDetail = '/invoices/detail';
  static const String invoiceForm = '/invoices/form';
  static const String taxSummary = '/taxes';
  static const String taxObligationDetail = '/taxes/obligation';
  static const String reports = '/reports';
  static const String notificationsPage = '/notifications';

  static final Map<String, WidgetBuilder> routes = {
    login: (context) => const LoginPage(),
    register: (context) => const RegisterPage(),
    businessSetup: (context) => const BusinessSetupPage(),
    dashboard: (context) => const DashboardPage(),
    customerList: (context) => const CustomerListPage(),
    customerForm: (context) => const CustomerFormPage(),
    productList: (context) => const ProductListPage(),
    productForm: (context) => const ProductFormPage(),
    invoiceList: (context) => const InvoiceListPage(),
    invoiceForm: (context) => const InvoiceFormPage(),
    invoiceDetail: (context) => const InvoiceDetailPage(),
    taxSummary: (context) => const TaxSummaryPage(),
    reports: (context) => const ReportsPage(),
    notificationsPage: (context) => const NotificationsPage(),
  };
}
