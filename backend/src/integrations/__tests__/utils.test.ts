import test from 'node:test';
import assert from 'node:assert/strict';

import { parseAvailability } from '../utils';

test('parseAvailability handles negative availability phrases', () => {
  const phrases = ['Indisponible', 'Produit non disponible', 'Article hors stock'];
  for (const phrase of phrases) {
    assert.equal(parseAvailability(phrase), 'out_of_stock');
  }
});

test('parseAvailability handles positive availability phrases', () => {
  const phrases = [
    'Disponible en boutique',
    'Produit disponible en magasin',
    'Retrait magasin disponible',
  ];
  for (const phrase of phrases) {
    assert.equal(parseAvailability(phrase), 'in_stock');
  }
});
