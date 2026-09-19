import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/features/dashboard/pages/dashboard_page.dart';
import 'package:sme_tax/features/auth/pages/login_page.dart';
import 'package:sme_tax/features/auth/pages/business_setup_page.dart';
import 'package:sme_tax/features/main/main_screen.dart';
import 'package:sme_tax/providers/auth_provider.dart';
import 'package:sme_tax/providers/business_provider.dart';
import 'package:sme_tax/providers/customer_provider.dart';
import 'package:sme_tax/providers/product_provider.dart';
import 'package:sme_tax/providers/invoice_provider.dart';
import 'package:sme_tax/providers/tax_provider.dart';
import 'package:sme_tax/providers/notification_provider.dart';

class SMEApp extends StatelessWidget {
  const SMEApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          final apiClient = ApiClient();
          return MultiProvider(
            providers: [
              ChangeNotifierProvider(
                lazy: false,
                create: (_) => BusinessProvider(apiClient),
              ),
              ChangeNotifierProvider(
                lazy: false,
                create: (_) => CustomerProvider(apiClient),
              ),
              ChangeNotifierProvider(
                lazy: false,
                create: (_) => ProductProvider(apiClient),
              ),
              ChangeNotifierProvider(
                lazy: false,
                create: (_) => InvoiceProvider(apiClient),
              ),
              ChangeNotifierProvider(
                lazy: false,
                create: (_) => TaxProvider(apiClient),
              ),
              ChangeNotifierProvider(
                lazy: false,
                create: (_) => NotificationProvider(apiClient),
              ),
            ],
            child: MaterialApp(
              title: 'SME-TAX',
              debugShowCheckedModeBanner: false,
              theme: ThemeData(
                useMaterial3: true,
                colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
                appBarTheme: const AppBarTheme(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black87,
                  elevation: 1,
                ),
                bottomNavigationBarTheme: BottomNavigationBarThemeData(
                  selectedItemColor: Colors.indigo,
                  unselectedItemColor: Colors.grey[600],
                ),
              ),
                            home: auth.isAuthenticated
                  ? (auth.requiresBusinessSetup
                      ? const BusinessSetupPage()
                      : const MainScreen())
                  : const LoginPage(),
            ),
          );
        },
      ),
    );
    }
}


