import 'package:flutter_test/flutter_test.dart';
import 'package:tamin_agent/engines/quote_engine.dart';
import 'package:tamin_agent/data/seed.dart';

void main() {
  test('boda micro weekly prices with wakala split', () {
    final product = seedProducts.firstWhere((p) => p.id == 'prd-boda');
    final priced = priceQuote(
      product: product,
      sumCovered: 250000,
      frequency: 'weekly',
    );
    expect(priced.base, greaterThan(0));
    expect(priced.wakala + priced.tabarru, closeTo(priced.base, 0.02));
    expect(priced.total, greaterThan(priced.base));
    expect(priced.uwDecision, 'accept');
  });

  test('motor old vehicle refers', () {
    final product = seedProducts.firstWhere((p) => p.id == 'prd-motor');
    final priced = priceQuote(
      product: product,
      sumCovered: 800000,
      frequency: 'monthly',
      vehicleAge: 18,
    );
    expect(priced.uwDecision, 'refer');
  });
}
