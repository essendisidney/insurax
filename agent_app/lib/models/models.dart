enum SyncStatus { pending, syncing, synced, failed }

enum LeadStatus { open, contacted, quoted, converted }

class Product {
  const Product({
    required this.id,
    required this.code,
    required this.name,
    required this.line,
    required this.minContribution,
    required this.maxSumCovered,
    required this.wakalaRate,
    required this.baseRate,
    required this.ratingBasis,
    required this.frequencies,
    required this.isMicro,
  });

  final String id;
  final String code;
  final String name;
  final String line;
  final double minContribution;
  final double maxSumCovered;
  final double wakalaRate;
  final double baseRate;
  final String ratingBasis; // flat | age_band | sum_covered
  final List<String> frequencies;
  final bool isMicro;

  Map<String, dynamic> toJson() => {
        'id': id,
        'code': code,
        'name': name,
        'line': line,
        'minContribution': minContribution,
        'maxSumCovered': maxSumCovered,
        'wakalaRate': wakalaRate,
        'baseRate': baseRate,
        'ratingBasis': ratingBasis,
        'frequencies': frequencies,
        'isMicro': isMicro,
      };

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        code: j['code'] as String,
        name: j['name'] as String,
        line: j['line'] as String,
        minContribution: (j['minContribution'] as num).toDouble(),
        maxSumCovered: (j['maxSumCovered'] as num).toDouble(),
        wakalaRate: (j['wakalaRate'] as num).toDouble(),
        baseRate: (j['baseRate'] as num).toDouble(),
        ratingBasis: j['ratingBasis'] as String,
        frequencies: (j['frequencies'] as List).cast<String>(),
        isMicro: j['isMicro'] as bool,
      );
}

class Lead {
  Lead({
    required this.id,
    required this.name,
    required this.phone,
    required this.productLine,
    required this.status,
    required this.notes,
    required this.createdAt,
    this.synced = true,
  });

  final String id;
  String name;
  String phone;
  String productLine;
  LeadStatus status;
  String notes;
  final DateTime createdAt;
  bool synced;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'productLine': productLine,
        'status': status.name,
        'notes': notes,
        'createdAt': createdAt.toIso8601String(),
        'synced': synced,
      };

  factory Lead.fromJson(Map<String, dynamic> j) => Lead(
        id: j['id'] as String,
        name: j['name'] as String,
        phone: j['phone'] as String,
        productLine: j['productLine'] as String,
        status: LeadStatus.values.firstWhere(
          (e) => e.name == j['status'],
          orElse: () => LeadStatus.open,
        ),
        notes: j['notes'] as String? ?? '',
        createdAt: DateTime.parse(j['createdAt'] as String),
        synced: j['synced'] as bool? ?? true,
      );
}

class LocalQuote {
  LocalQuote({
    required this.id,
    required this.participantName,
    required this.phone,
    required this.productId,
    required this.productName,
    required this.sumCovered,
    required this.frequency,
    required this.base,
    required this.wakala,
    required this.tabarru,
    required this.levies,
    required this.total,
    required this.uwDecision,
    required this.createdAt,
    this.synced = false,
  });

  final String id;
  final String participantName;
  final String phone;
  final String productId;
  final String productName;
  final double sumCovered;
  final String frequency;
  final double base;
  final double wakala;
  final double tabarru;
  final double levies;
  final double total;
  final String uwDecision;
  final DateTime createdAt;
  bool synced;

  Map<String, dynamic> toJson() => {
        'id': id,
        'participantName': participantName,
        'phone': phone,
        'productId': productId,
        'productName': productName,
        'sumCovered': sumCovered,
        'frequency': frequency,
        'base': base,
        'wakala': wakala,
        'tabarru': tabarru,
        'levies': levies,
        'total': total,
        'uwDecision': uwDecision,
        'createdAt': createdAt.toIso8601String(),
        'synced': synced,
      };

  factory LocalQuote.fromJson(Map<String, dynamic> j) => LocalQuote(
        id: j['id'] as String,
        participantName: j['participantName'] as String,
        phone: j['phone'] as String,
        productId: j['productId'] as String,
        productName: j['productName'] as String,
        sumCovered: (j['sumCovered'] as num).toDouble(),
        frequency: j['frequency'] as String,
        base: (j['base'] as num).toDouble(),
        wakala: (j['wakala'] as num).toDouble(),
        tabarru: (j['tabarru'] as num).toDouble(),
        levies: (j['levies'] as num).toDouble(),
        total: (j['total'] as num).toDouble(),
        uwDecision: j['uwDecision'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
        synced: j['synced'] as bool? ?? false,
      );
}

class Collection {
  Collection({
    required this.id,
    required this.participantName,
    required this.phone,
    required this.amount,
    required this.method,
    required this.createdAt,
    this.reference,
    this.synced = false,
  });

  final String id;
  final String participantName;
  final String phone;
  final double amount;
  final String method; // mpesa_stk | cash | ussd
  final String? reference;
  final DateTime createdAt;
  bool synced;

  Map<String, dynamic> toJson() => {
        'id': id,
        'participantName': participantName,
        'phone': phone,
        'amount': amount,
        'method': method,
        'reference': reference,
        'createdAt': createdAt.toIso8601String(),
        'synced': synced,
      };

  factory Collection.fromJson(Map<String, dynamic> j) => Collection(
        id: j['id'] as String,
        participantName: j['participantName'] as String,
        phone: j['phone'] as String,
        amount: (j['amount'] as num).toDouble(),
        method: j['method'] as String,
        reference: j['reference'] as String?,
        createdAt: DateTime.parse(j['createdAt'] as String),
        synced: j['synced'] as bool? ?? false,
      );
}

class LocalClaim {
  LocalClaim({
    required this.id,
    required this.policyHint,
    required this.participantName,
    required this.phone,
    required this.description,
    required this.lossDate,
    required this.createdAt,
    this.synced = false,
  });

  final String id;
  final String policyHint;
  final String participantName;
  final String phone;
  final String description;
  final DateTime lossDate;
  final DateTime createdAt;
  bool synced;

  Map<String, dynamic> toJson() => {
        'id': id,
        'policyHint': policyHint,
        'participantName': participantName,
        'phone': phone,
        'description': description,
        'lossDate': lossDate.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'synced': synced,
      };

  factory LocalClaim.fromJson(Map<String, dynamic> j) => LocalClaim(
        id: j['id'] as String,
        policyHint: j['policyHint'] as String,
        participantName: j['participantName'] as String,
        phone: j['phone'] as String,
        description: j['description'] as String,
        lossDate: DateTime.parse(j['lossDate'] as String),
        createdAt: DateTime.parse(j['createdAt'] as String),
        synced: j['synced'] as bool? ?? false,
      );
}

class SyncItem {
  SyncItem({
    required this.id,
    required this.entity,
    required this.payloadId,
    required this.createdAt,
    this.status = SyncStatus.pending,
    this.error,
  });

  final String id;
  final String entity; // lead | quote | collection | claim
  final String payloadId;
  final DateTime createdAt;
  SyncStatus status;
  String? error;

  Map<String, dynamic> toJson() => {
        'id': id,
        'entity': entity,
        'payloadId': payloadId,
        'createdAt': createdAt.toIso8601String(),
        'status': status.name,
        'error': error,
      };

  factory SyncItem.fromJson(Map<String, dynamic> j) => SyncItem(
        id: j['id'] as String,
        entity: j['entity'] as String,
        payloadId: j['payloadId'] as String,
        createdAt: DateTime.parse(j['createdAt'] as String),
        status: SyncStatus.values.firstWhere(
          (e) => e.name == j['status'],
          orElse: () => SyncStatus.pending,
        ),
        error: j['error'] as String?,
      );
}

class AgentProfile {
  const AgentProfile({
    required this.id,
    required this.name,
    required this.code,
    required this.branch,
    required this.phone,
    required this.ytdGwp,
    required this.target,
    required this.wallet,
  });

  final String id;
  final String name;
  final String code;
  final String branch;
  final String phone;
  final double ytdGwp;
  final double target;
  final double wallet;
}
