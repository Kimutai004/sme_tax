import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/app.dart';
import 'package:sme_tax/providers/auth_provider.dart';
import 'package:sme_tax/providers/business_provider.dart';
import 'package:sme_tax/providers/customer_provider.dart';
import 'package:sme_tax/providers/product_provider.dart';
import 'package:sme_tax/providers/invoice_provider.dart';
import 'package:sme_tax/providers/tax_provider.dart';
import 'package:sme_tax/providers/notification_provider.dart';
import 'package:sme_tax/core/network/api_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Load saved API base URL before starting the app
  await ApiClient.loadSavedBaseUrl();
  runApp(const SMEApp());
}
