import 'package:flutter/material.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/widgets/app_text_field.dart';
import 'package:sme_tax/models/customer.dart';

class CustomerFormPage extends StatefulWidget {
  final int businessId;
  final Customer? editCustomer;
  const CustomerFormPage({super.key, required this.businessId, this.editCustomer});

  @override
  State<CustomerFormPage> createState() => _CustomerFormPageState();
}

class _CustomerFormPageState extends State<CustomerFormPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Customer'), backgroundColor: Colors.white, elevation: 1),
      body: const Center(child: Text('Customer Form')),
    );
  }
}
