import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/widgets/loading_widget.dart';
import 'package:sme_tax/core/widgets/app_button.dart';
import 'package:sme_tax/core/widgets/app_text_field.dart';

class BusinessSetupPage extends StatefulWidget {
  const BusinessSetupPage({super.key});

  @override
  State<BusinessSetupPage> createState() => _BusinessSetupPageState();
}

class _BusinessSetupPageState extends State<BusinessSetupPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Business Setup'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: const Center(child: Text('Page: Business Setup')),
    );
  }
}
