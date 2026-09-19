class AppNotification {
  final int? id;
  final int userId;
  final int? businessId;
  final String title;
  final String message;
  final String type;
  final bool read;
  final int? relatedId;
  final String? relatedType;
  final DateTime? createdAt;

  AppNotification({
    this.id,
    required this.userId,
    this.businessId,
    required this.title,
    required this.message,
    this.type = 'info',
    this.read = false,
    this.relatedId,
    this.relatedType,
    this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'],
      userId: json['user_id'] ?? 0,
      businessId: json['business_id'],
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'info',
      read: json['read'] == 1 || json['read'] == true,
      relatedId: json['related_id'],
      relatedType: json['related_type'],
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : null,
    );
  }

  AppNotification copyWith({bool? read}) {
    return AppNotification(
      id: id,
      userId: userId,
      businessId: businessId,
      title: title,
      message: message,
      type: type,
      read: read ?? this.read,
      relatedId: relatedId,
      relatedType: relatedType,
      createdAt: createdAt,
    );
  }
}
