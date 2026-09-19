import 'dart:convert';

class User {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final Business? business;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.business,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'business_owner',
      business: json['business'] != null ? Business.fromJson(json['business']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role,
      'business': business?.toJson(),
    };
  }

  User copyWith({String? name, String? phone, Business? business}) {
    return User(
      id: id,
      name: name ?? this.name,
      email: email,
      phone: phone ?? this.phone,
      role: role,
      business: business ?? this.business,
    );
  }
}

class Business {
  final int? id;
  final int userId;
  final String name;
  final String kraPin;
  final String? physicalAddress;
  final String? postalAddress;
  final String? email;
  final String? phone;
  final String? businessType;
  final String? industry;
  final bool vatRegistered;
  final String? vatNumber;
  final String currency;
  final bool etimsEnabled;

  Business({
    this.id,
    required this.userId,
    required this.name,
    required this.kraPin,
    this.physicalAddress,
    this.postalAddress,
    this.email,
    this.phone,
    this.businessType,
    this.industry,
    this.vatRegistered = false,
    this.vatNumber,
    this.currency = 'KES',
    this.etimsEnabled = true,
  });

  factory Business.fromJson(Map<String, dynamic> json) {
    return Business(
      id: json['id'],
      userId: json['user_id'] ?? 0,
      name: json['name'] ?? '',
      kraPin: json['kra_pin'] ?? '',
      physicalAddress: json['physical_address'],
      postalAddress: json['postal_address'],
      email: json['email'],
      phone: json['phone'],
      businessType: json['business_type'],
      industry: json['industry'],
      vatRegistered: json['vat_registered'] == 1 || json['vat_registered'] == true,
      vatNumber: json['vat_number'],
      currency: json['currency'] ?? 'KES',
      etimsEnabled: json['etims_enabled'] == 1 || json['etims_enabled'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'kra_pin': kraPin,
      'physical_address': physicalAddress,
      'postal_address': postalAddress,
      'email': email,
      'phone': phone,
      'business_type': businessType,
      'industry': industry,
      'vat_registered': vatRegistered,
      'vat_number': vatNumber,
      'currency': currency,
      'etims_enabled': etimsEnabled,
    };
  }
}
