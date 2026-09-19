import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sme_tax/core/constants/app_colors.dart';
import 'package:sme_tax/core/widgets/app_button.dart';
import 'package:sme_tax/core/widgets/app_text_field.dart';
import 'package:sme_tax/core/utils/validators.dart';
import 'package:sme_tax/features/main/main_screen.dart';
import 'package:sme_tax/providers/auth_provider.dart';
import 'package:fluttertoast/fluttertoast.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      Fluttertoast.showToast(msg: 'Passwords do not match', backgroundColor: AppColors.error, textColor: Colors.white);
      return;
    }

    final auth = context.read<AuthProvider>();
    final success = await auth.register(
      _nameController.text.trim(),
      _emailController.text.trim(),
      _passwordController.text,
      _phoneController.text.isEmpty ? null : _phoneController.text.trim(),
    );

    if (success) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const MainScreen()),
        (route) => false,
      );
    } else if (auth.errorMessage != null) {
      Fluttertoast.showToast(msg: auth.errorMessage!, backgroundColor: AppColors.error, textColor: Colors.white);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppColors.textPrimary,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Icon(Icons.person_add, size: 40, color: Colors.white),
                ),
                const SizedBox(height: 16),
                const Text('Create Account', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Register to start managing your eTIMS compliance', style: TextStyle(fontSize: 14, color: AppColors.textSecondary), textAlign: TextAlign.center),
                const SizedBox(height: 24),
                Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          AppTextField(labelText: 'Full Name', hintText: 'John Doe', controller: _nameController, prefixIcon: Icons.person, validator: (v) => AppValidators.validateRequired(v, 'Name')),
                          const SizedBox(height: 16),
                          AppTextField(labelText: 'Email Address', hintText: 'john@example.com', controller: _emailController, keyboardType: TextInputType.emailAddress, prefixIcon: Icons.email_outlined, validator: AppValidators.validateEmail),
                          const SizedBox(height: 16),
                          AppTextField(labelText: 'Phone Number', hintText: '0712345678', controller: _phoneController, keyboardType: TextInputType.phone, prefixIcon: Icons.phone, validator: AppValidators.validatePhone),
                          const SizedBox(height: 16),
                          AppTextField(labelText: 'Password', hintText: 'Min 6 characters', controller: _passwordController, obscureText: _obscurePassword, prefixIcon: Icons.lock_outline, suffixIcon: IconButton(icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: AppColors.textSecondary), onPressed: () => setState(() => _obscurePassword = !_obscurePassword)), validator: AppValidators.validatePassword),
                          const SizedBox(height: 16),
                          AppTextField(labelText: 'Confirm Password', hintText: 'Re-enter password', controller: _confirmPasswordController, obscureText: _obscureConfirm, prefixIcon: Icons.lock_outline, suffixIcon: IconButton(icon: Icon(_obscureConfirm ? Icons.visibility_off : Icons.visibility, color: AppColors.textSecondary), onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm)), validator: AppValidators.validatePassword),
                          const SizedBox(height: 24),
                          auth.isLoading ? const AppButton(text: 'Creating Account...', isLoading: true) : AppButton(text: 'Create Account', onPressed: _register),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Already have an account? '),
                    TextButton(onPressed: () => Navigator.of(context).pop(()), child: const Text('Sign In')),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
