class Customer {
  final int? id;
  final int businessId;
  final String name;
  final String? email;
  final String? phone;
  final String? physicalAddress;
  final String? kraPin;
  final String customerType;
  final double creditLimit;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Customer({
    this.id,
    required this.businessId,
    required this.name,
    this.email,
    this.phone,
    this.physicalAddress,
    this.kraPin,
    this.customerType = 'retail',
    this.creditLimit = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      businessId: json['business_id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'],
      phone: json['phone'],
      physicalAddress: json['physical_address'],
      kraPin: json['kra_pin'],
      customerType: json['customer_type'] ?? 'retail',
      creditLimit: (json['credit_limit'] ?? 0).toDouble(),
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'business_id': businessId,
      'name': name,
      'email': email,
      'phone': phone,
      'physical_address': physicalAddress,
      'kra_pin': kraPin,
      'customer_type': customerType,
      'credit_limit': creditLimit,
    };
  }

  Customer copyWith({String? name, String? email, String? phone}) {
    return Customer(
      id: id,
      businessId: businessId,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      physicalAddress: physicalAddress,
      kraPin: kraPin,
      customerType: customerType,
      creditLimit: creditLimit,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }
}
