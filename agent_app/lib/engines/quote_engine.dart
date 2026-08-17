import '../models/models.dart';

class PricedQuote {
  const PricedQuote({
    required this.base,
    required this.wakala,
    required this.tabarru,
    required this.levies,
    required this.total,
    required this.uwDecision,
    required this.notes,
  });

  final double base;
  final double wakala;
  final double tabarru;
  final double levies;
  final double total;
  final String uwDecision;
  final List<String> notes;
}

/// Mirrors the web quote engine (wakala/tabarru + Kenya levies) for offline pricing.
PricedQuote priceQuote({
  required Product product,
  required double sumCovered,
  required String frequency,
  int? age,
  int? vehicleAge,
  int claimsLast3Years = 0,
}) {
  final notes = <String>[];
  var decision = 'accept';
  var loadPercent = 0.0;

  if (product.line == 'motor' && (vehicleAge ?? 0) > 15) {
    decision = 'refer';
    notes.add('Vehicle age above agent binding authority.');
  }
  if (product.line == 'medical' && (age ?? 30) > 65) {
    decision = 'refer';
    notes.add('Age requires medical underwriting.');
  }
  if (claimsLast3Years >= 3) {
    decision = 'refer';
    notes.add('Claims history elevated.');
    loadPercent = 25;
  }
  if (sumCovered > product.maxSumCovered) {
    decision = 'reject';
    notes.add('Sum covered exceeds product maximum.');
  }
  if (notes.isEmpty) notes.add('Within agent authority.');

  double annual;
  if (product.ratingBasis == 'flat') {
    annual = product.minContribution * _annualFactor(frequency);
  } else if (product.ratingBasis == 'age_band') {
    final a = age ?? 30;
    final band = a < 18
        ? 0.8
        : a < 35
            ? 1.0
            : a < 50
                ? 1.25
                : 1.6;
    annual = product.minContribution * band * _annualFactor(frequency);
  } else {
    annual = sumCovered * product.baseRate;
  }

  annual *= 1 + loadPercent / 100;
  annual = annual < product.minContribution * _annualFactor(frequency)
      ? product.minContribution * _annualFactor(frequency)
      : annual;

  final period = _round2(annual * _frequencyFactor(frequency));
  final wakala = _round2(period * product.wakalaRate);
  final tabarru = _round2(period - wakala);
  // Training levy 0.2% + PHCF 0.25% + stamp approx
  final levies = _round2(period * 0.0045 + 40);
  final total = _round2(period + levies);

  return PricedQuote(
    base: period,
    wakala: wakala,
    tabarru: tabarru,
    levies: levies,
    total: total,
    uwDecision: decision,
    notes: notes,
  );
}

double _frequencyFactor(String frequency) {
  switch (frequency) {
    case 'daily':
      return 1 / 365;
    case 'weekly':
      return 1 / 52;
    case 'monthly':
      return 1 / 12;
    case 'annually':
      return 1;
    default:
      return 1 / 12;
  }
}

double _annualFactor(String frequency) {
  switch (frequency) {
    case 'daily':
      return 365;
    case 'weekly':
      return 52;
    case 'monthly':
      return 12;
    default:
      return 1;
  }
}

double _round2(double v) => (v * 100).roundToDouble() / 100;
