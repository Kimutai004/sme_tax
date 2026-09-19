import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/widgets/loading_widget.dart';
import 'package:sme_tax/core/widgets/app_button.dart';
import 'package:sme_tax/core/widgets/app_text_field.dart';

class InvoicesPage extends StatefulWidget {
  const InvoicesPage({super.key});

  @override
  State<InvoicesPage> createState() => _InvoicesPageState();
}

class _InvoicesPageState extends State<InvoicesPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Invoices'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: const Center(child: Text('Page: Invoices')),
    );
  }
}
