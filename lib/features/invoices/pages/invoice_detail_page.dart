import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/widgets/loading_widget.dart';
import 'package:sme_tax/core/widgets/app_button.dart';
import 'package:sme_tax/core/widgets/app_text_field.dart';

class InvoiceDetailPage extends StatefulWidget {
  const InvoiceDetailPage({super.key});

  @override
  State<InvoiceDetailPage> createState() => _InvoiceDetailPageState();
}

class _InvoiceDetailPageState extends State<InvoiceDetailPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Invoice Detail'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: const Center(child: Text('Page: Invoice Detail')),
    );
  }
}
