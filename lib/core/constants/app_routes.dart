import 'package:flutter/material.dart';
import 'package:sme_tax/features/auth/pages/login_page.dart';
import 'package:sme_tax/features/auth/pages/register_page.dart';
import 'package:sme_tax/features/main/main_screen.dart';
import 'package:sme_tax/features/dashboard/pages/dashboard_page.dart';
import 'package:sme_tax/features/customers/pages/customer_list_page.dart';
import 'package:sme_tax/features/customers/pages/customer_form_page.dart';
import 'package:sme_tax/features/products/pages/product_list_page.dart';
import 'package:sme_tax/features/products/pages/product_form_page.dart';
import 'package:sme_tax/features/taxes/pages/tax_summary_page.dart';
import 'package:sme_tax/features/reports/pages/reports_page.dart';
import 'package:sme_tax/features/notifications/pages/notifications_page.dart';
import 'package:sme_tax/features/auth/pages/business_setup_page.dart';

class AppRoutes {
  static const String login = '/login';
  static const String register = '/register';
  static const String dashboard = '/dashboard';
  static const String main = '/main';
  static const String customers = '/customers';
  static const String customerForm = '/customer-form';
  static const String products = '/products';
  static const String productForm = '/product-form';
  static const String taxes = '/taxes';
  static const String reports = '/reports';
  static const String notifications = '/notifications';
  static const String businessSetup = '/business-setup';

  static final Map<String, WidgetBuilder> routes = {
    login: (context) => const LoginPage(),
    register: (context) => const RegisterPage(),
    dashboard: (context) => const DashboardPage(),
    main: (context) => const MainScreen(),
    customers: (context) => const CustomerListPage(),
    products: (context) => const ProductListPage(),
    taxes: (context) => const TaxSummaryPage(),
    reports: (context) => const ReportsPage(),
    notifications: (context) => const NotificationsPage(),
    businessSetup: (context) => const BusinessSetupPage(),
  };
}




