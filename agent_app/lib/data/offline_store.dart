import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../engines/quote_engine.dart';
import '../models/models.dart';
import 'seed.dart';

const _kLeads = 'tamin.agent.leads';
const _kQuotes = 'tamin.agent.quotes';
const _kCollections = 'tamin.agent.collections';
const _kClaims = 'tamin.agent.claims';
const _kQueue = 'tamin.agent.queue';
const _uuid = Uuid();

/// Offline-first agent store. Writes locally first, queues for sync when online.
class OfflineStore extends ChangeNotifier {
  OfflineStore();

  final List<Product> products = List.unmodifiable(seedProducts);
  final AgentProfile agent = agentProfile;

  List<Lead> leads = [];
  List<LocalQuote> quotes = [];
  List<Collection> collections = [];
  List<LocalClaim> claims = [];
  List<SyncItem> queue = [];
  bool online = true;
  bool ready = false;
  bool syncing = false;
  String? lastSyncMessage;

  int get pendingCount =>
      queue.where((q) => q.status == SyncStatus.pending || q.status == SyncStatus.failed).length;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    leads = _decodeList(prefs.getString(_kLeads), Lead.fromJson);
    if (leads.isEmpty) leads = seedLeads();
    quotes = _decodeList(prefs.getString(_kQuotes), LocalQuote.fromJson);
    collections = _decodeList(prefs.getString(_kCollections), Collection.fromJson);
    claims = _decodeList(prefs.getString(_kClaims), LocalClaim.fromJson);
    queue = _decodeList(prefs.getString(_kQueue), SyncItem.fromJson);
    ready = true;
    notifyListeners();
  }

  void setOnline(bool value) {
    if (online == value) return;
    online = value;
    notifyListeners();
    if (online) unawaited(syncNow());
  }

  Future<Lead> addLead({
    required String name,
    required String phone,
    required String productLine,
    String notes = '',
  }) async {
    final lead = Lead(
      id: 'ld-${_uuid.v4().substring(0, 8)}',
      name: name,
      phone: phone,
      productLine: productLine,
      status: LeadStatus.open,
      notes: notes,
      createdAt: DateTime.now(),
      synced: false,
    );
    leads = [lead, ...leads];
    await _enqueue('lead', lead.id);
    await _persist();
    notifyListeners();
    return lead;
  }

  Future<LocalQuote> createQuote({
    required String participantName,
    required String phone,
    required Product product,
    required double sumCovered,
    required String frequency,
    int? age,
    int? vehicleAge,
  }) async {
    final priced = priceQuote(
      product: product,
      sumCovered: sumCovered,
      frequency: frequency,
      age: age,
      vehicleAge: vehicleAge,
    );
    final quote = LocalQuote(
      id: 'qt-${_uuid.v4().substring(0, 8)}',
      participantName: participantName,
      phone: phone,
      productId: product.id,
      productName: product.name,
      sumCovered: sumCovered,
      frequency: frequency,
      base: priced.base,
      wakala: priced.wakala,
      tabarru: priced.tabarru,
      levies: priced.levies,
      total: priced.total,
      uwDecision: priced.uwDecision,
      createdAt: DateTime.now(),
    );
    quotes = [quote, ...quotes];

    final match = leads.where((l) => l.phone == phone).toList();
    if (match.isNotEmpty) {
      match.first.status = LeadStatus.quoted;
      match.first.synced = false;
      await _enqueue('lead', match.first.id);
    }

    await _enqueue('quote', quote.id);
    await _persist();
    notifyListeners();
    return quote;
  }

  Future<Collection> collect({
    required String participantName,
    required String phone,
    required double amount,
    required String method,
  }) async {
    final item = Collection(
      id: 'col-${_uuid.v4().substring(0, 8)}',
      participantName: participantName,
      phone: phone,
      amount: amount,
      method: method,
      reference: method == 'mpesa_stk' ? 'STK-${DateTime.now().millisecondsSinceEpoch % 1000000}' : null,
      createdAt: DateTime.now(),
    );
    collections = [item, ...collections];
    await _enqueue('collection', item.id);
    await _persist();
    notifyListeners();
    return item;
  }

  Future<LocalClaim> fileClaim({
    required String policyHint,
    required String participantName,
    required String phone,
    required String description,
    required DateTime lossDate,
  }) async {
    final claim = LocalClaim(
      id: 'cl-${_uuid.v4().substring(0, 8)}',
      policyHint: policyHint,
      participantName: participantName,
      phone: phone,
      description: description,
      lossDate: lossDate,
      createdAt: DateTime.now(),
    );
    claims = [claim, ...claims];
    await _enqueue('claim', claim.id);
    await _persist();
    notifyListeners();
    return claim;
  }

  Future<void> syncNow() async {
    if (!online || syncing) return;
    syncing = true;
    lastSyncMessage = null;
    notifyListeners();

    final pending = queue
        .where((q) => q.status == SyncStatus.pending || q.status == SyncStatus.failed)
        .toList();

    for (final item in pending) {
      item.status = SyncStatus.syncing;
      notifyListeners();
      // Demo sync: simulate network round-trip then mark entity synced.
      await Future<void>.delayed(const Duration(milliseconds: 350));
      item.status = SyncStatus.synced;
      _markEntitySynced(item.entity, item.payloadId);
    }

    queue = queue.where((q) => q.status != SyncStatus.synced).toList();
    lastSyncMessage = pending.isEmpty
        ? 'Nothing to sync'
        : 'Synced ${pending.length} item${pending.length == 1 ? '' : 's'}';
    syncing = false;
    await _persist();
    notifyListeners();
  }

  Future<void> _enqueue(String entity, String payloadId) async {
    queue = [
      SyncItem(
        id: 'sq-${_uuid.v4().substring(0, 8)}',
        entity: entity,
        payloadId: payloadId,
        createdAt: DateTime.now(),
      ),
      ...queue,
    ];
    if (online) unawaited(syncNow());
  }

  void _markEntitySynced(String entity, String id) {
    switch (entity) {
      case 'lead':
        for (final l in leads.where((e) => e.id == id)) {
          l.synced = true;
        }
      case 'quote':
        for (final q in quotes.where((e) => e.id == id)) {
          q.synced = true;
        }
      case 'collection':
        for (final c in collections.where((e) => e.id == id)) {
          c.synced = true;
        }
      case 'claim':
        for (final c in claims.where((e) => e.id == id)) {
          c.synced = true;
        }
    }
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kLeads, jsonEncode(leads.map((e) => e.toJson()).toList()));
    await prefs.setString(_kQuotes, jsonEncode(quotes.map((e) => e.toJson()).toList()));
    await prefs.setString(_kCollections, jsonEncode(collections.map((e) => e.toJson()).toList()));
    await prefs.setString(_kClaims, jsonEncode(claims.map((e) => e.toJson()).toList()));
    await prefs.setString(_kQueue, jsonEncode(queue.map((e) => e.toJson()).toList()));
  }

  List<T> _decodeList<T>(String? raw, T Function(Map<String, dynamic>) fromJson) {
    if (raw == null || raw.isEmpty) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list.map((e) => fromJson(e as Map<String, dynamic>)).toList();
  }
}
