import 'package:flutter/material.dart';
import 'package:sme_tax/core/constants/app_colors.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});
  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  final List<Widget> _pages = [
    const _Placeholder('Dashboard'),
    const _Placeholder('Invoices'),
    const _Placeholder('Customers'),
    const _Placeholder('Products'),
    const _Placeholder('Taxes'),
    const _Placeholder('Reports'),
    const _Placeholder('Notifications'),
  ];
  final List<BottomNavigationBarItem> _items = [
    const BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
    const BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Invoices'),
    const BottomNavigationBarItem(icon: Icon(Icons.people), label: 'Customers'),
    const BottomNavigationBarItem(icon: Icon(Icons.category), label: 'Products'),
    const BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet), label: 'Taxes'),
    const BottomNavigationBarItem(icon: Icon(Icons.analytics), label: 'Reports'),
    const BottomNavigationBarItem(icon: Icon(Icons.notifications), label: 'Notifications'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
        items: _items,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textSecondary,
      ),
    );
  }
}

class _Placeholder extends StatelessWidget {
  final String title;
  const _Placeholder(this.title);
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: Center(child: Text(title, style: const TextStyle(fontSize: 24))),
    );
  }
}
