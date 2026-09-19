import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/widgets/loading_widget.dart';
import 'package:sme_tax/models/customer.dart';
import 'package:sme_tax/providers/customer_provider.dart';

class CustomerListPage extends StatefulWidget {
  const CustomerListPage({super.key});
  @override
  State<CustomerListPage> createState() => _CustomerListPageState();
}

class _CustomerListPageState extends State<CustomerListPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadCustomers());
  }

  Future<void> _loadCustomers({String? search}) async {
    await context.read<CustomerProvider>().fetchCustomers(search: search);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _navigateToForm([Customer? customer]) {
    // Navigator.of(context).push(
    //   MaterialPageRoute(builder: (_) => CustomerFormPage(customer: customer)),
    // ).then((_) => _loadCustomers());
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CustomerProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customers'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: _buildBody(provider),
    );
  }

  Widget _buildBody(CustomerProvider provider) {
    if (provider.isLoading) {
      return const LoadingWidget(message: 'Loading customers...');
    }

    if (provider.customers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.people_outline, size: 64, color: AppColors.textTertiary),
            const SizedBox(height: 16),
            Text('No customers yet', style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
            const SizedBox(height: 8),
            Text('Tap + to add your first customer', style: TextStyle(color: AppColors.textTertiary)),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add),
              label: const Text('Add Customer'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: TextField(
            controller: _searchController,
            decoration: const InputDecoration(
              hintText: 'Search',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
            onSubmitted: (_) => _loadCustomers(),
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: provider.customers.length,
            itemBuilder: (context, i) {
              final customer = provider.customers[i];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  child: Text(
                    customer.name.isNotEmpty ? customer.name[0].toUpperCase() : '?',
                    style: const TextStyle(color: AppColors.primary),
                  ),
                ),
                title: Text(customer.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                subtitle: Text(
                  customer.phone ?? customer.email ?? 'No contact info',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                onTap: () => _navigateToForm(customer),
              );
            },
          ),
        ),
      ],
    );
  }
}
