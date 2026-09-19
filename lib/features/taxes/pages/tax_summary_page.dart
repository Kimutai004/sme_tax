import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/widgets/loading_widget.dart';

class TaxSummaryPage extends StatefulWidget {
  const TaxSummaryPage({super.key});
  @override
  State<TaxSummaryPage> createState() => _TaxSummaryPageState();
}

class _TaxSummaryPageState extends State<TaxSummaryPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tax Summary'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: const Center(child: Text('Tax Summary Page')),
    );
  }
}
