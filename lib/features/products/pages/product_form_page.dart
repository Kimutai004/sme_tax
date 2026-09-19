import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/widgets/loading_widget.dart';
import 'package:sme_tax/core/widgets/app_button.dart';
import 'package:sme_tax/core/widgets/app_text_field.dart';

class ProductFormPage extends StatefulWidget {
  const ProductFormPage({super.key});

  @override
  State<ProductFormPage> createState() => _ProductFormPageState();
}

class _ProductFormPageState extends State<ProductFormPage> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Product Form'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: const Center(child: Text('Page: Product Form')),
    );
  }
}
