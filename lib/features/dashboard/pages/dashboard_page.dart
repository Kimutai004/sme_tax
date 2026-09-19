import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/network/api_client.dart';
import 'package:sme_tax/providers/auth_provider.dart';
import 'package:sme_tax/providers/invoice_provider.dart';
import 'package:sme_tax/providers/tax_provider.dart';
import 'package:sme_tax/providers/notification_provider.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InvoiceProvider>().getInvoiceStats();
      context.read<TaxProvider>().fetchTaxSummary();
      context.read<TaxProvider>().fetchObligations();
      context.read<NotificationProvider>().fetchUnread();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: const Text('SME-TAX Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {},
          ),
        ],
      ),
      body: const Center(child: Text('Dashboard Content')),
    );
  }
}
