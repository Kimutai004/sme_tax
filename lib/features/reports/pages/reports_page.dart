import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/utils/formatters.dart';
import 'package:sme_tax/providers/product_provider.dart';
import 'package:sme_tax/providers/customer_provider.dart';
import 'package:sme_tax/providers/tax_provider.dart';

class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});

  @override
  State<ReportsPage> createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: const Text('Business Reports'),
      ),
      body: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSection(
              title: 'Sales Overview',
              icon: Icons.attach_money,
              color: AppColors.taxGreen,
              child: _buildSalesCard(),
            ),
            const SizedBox(height: 24),
            _buildSection(
              title: 'Customer Overview',
              icon: Icons.people,
              color: AppColors.taxBlue,
              child: _buildCustomerCard(),
            ),
            const SizedBox(height: 24),
            _buildSection(
              title: 'Product Overview',
              icon: Icons.inventory_2,
              color: AppColors.taxBlue,
              child: _buildProductCard(),
            ),
            const SizedBox(height: 24),
            _buildSection(
              title: 'VAT Return Summary',
              icon: Icons.receipt_long,
              color: AppColors.taxOrange,
              child: _buildVatCard(),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required IconData icon,
    required Color color,
    required Widget child,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 8),
          Text(title,
              style: const TextStyle(
                  fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        ]),
        const SizedBox(height: 8),
        child,
      ],
    );
  }

  Widget _buildSalesCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: const Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            _ReportRow(label: 'Total Sales', value: 'KES 0.00'),
            Divider(height: 24),
            _ReportRow(label: 'Total VAT Collected', value: 'KES 0.00'),
            Divider(height: 24),
            _ReportRow(label: 'Total Invoices', value: '0'),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerCard() {
    final customerProvider = context.watch<CustomerProvider>();
    final customers = customerProvider.customers;
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _ReportRow(label: 'Total Customers', value: customers.length.toString()),
            const SizedBox(height: 8),
            if (customers.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('No customers yet',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              )
            else
              Column(
                children: customers.take(5).map((c) {
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: AppColors.taxBlue.withOpacity(0.1),
                      child: Text(
                        c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                        style: const TextStyle(
                            color: AppColors.taxBlue, fontWeight: FontWeight.bold),
                      ),
                    ),
                    title: Text(c.name),
                    subtitle: Text(c.email ?? c.phone ?? 'No contact',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard() {
    final productProvider = context.watch<ProductProvider>();
    final products = productProvider.products;
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _ReportRow(label: 'Total Products', value: products.length.toString()),
            const SizedBox(height: 8),
            if (products.isEmpty)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('No products yet',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              )
            else
              Column(
                children: products.take(5).map((p) {
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.inventory_2, color: AppColors.taxGreen, size: 20),
                    title: Text(p.name),
                    trailing: Text(
                      AppFormatters.currency.format(p.unitPrice),
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  );
                }).toList(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildVatCard() {
    final taxProvider = context.watch<TaxProvider>();
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _ReportRow(
              label: 'Output Tax (VAT on Sales)',
              value: AppFormatters.currency.format(taxProvider.outputTax),
            ),
            const Divider(height: 24),
            _ReportRow(
              label: 'Input Tax (VAT on Purchases)',
              value: AppFormatters.currency.format(taxProvider.inputTax),
            ),
            const Divider(height: 24),
            _ReportRow(
              label: 'Net VAT Payable',
              value: AppFormatters.currency.format(taxProvider.vatPayable),
              isBold: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _ReportRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;

  const _ReportRow({required this.label, required this.value, this.isBold = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(label,
              style: TextStyle(
                  color: isBold ? AppColors.textPrimary : AppColors.textSecondary,
                  fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        ),
        Text(value,
            style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isBold ? AppColors.primary : AppColors.textPrimary)),
      ],
    );
  }
}