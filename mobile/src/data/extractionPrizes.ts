import type { ExtractionPrize } from '../types';
import { BISTRO } from './bistro';

/** Points earned from games (not spent) needed to qualify for one Prize Drop. */
export const EXTRACTION_THRESHOLD = 150;

/**
 * The drop pool: free Froo Bistro items or bonus points. Product photos are the bundled bistro
 * cut-outs, so a drop renders instantly and offline. Winning a product prize is presented exactly
 * like any other redeemed reward (same QR flow); a points prize goes straight to the balance.
 */
export const EXTRACTION_PRIZES: ExtractionPrize[] = [
  { id: 'fries', name: BISTRO.fries.name, subtitle: 'Free bistro item', rarity: 'common', weight: 22, kind: 'product', image: BISTRO.fries.image },
  { id: 'churros', name: BISTRO.churros.name, subtitle: 'Free bistro item', rarity: 'common', weight: 22, kind: 'product', image: BISTRO.churros.image },
  { id: 'pts-50', name: '50 Points', subtitle: 'Bonus points', rarity: 'common', weight: 26, kind: 'points', pointsValue: 50 },
  { id: 'hotdog-wrap', name: BISTRO.hotdogWrap.name, subtitle: 'Free bistro item', rarity: 'rare', weight: 14, kind: 'product', image: BISTRO.hotdogWrap.image },
  { id: 'panini', name: BISTRO.chickenPanini.name, subtitle: 'Free bistro item', rarity: 'rare', weight: 14, kind: 'product', image: BISTRO.chickenPanini.image },
  { id: 'pts-150', name: '150 Points', subtitle: 'Bonus points', rarity: 'rare', weight: 12, kind: 'points', pointsValue: 150 },
  { id: 'hotdog', name: BISTRO.hotdog.name, subtitle: 'Free bistro item', rarity: 'epic', weight: 6, kind: 'product', image: BISTRO.hotdog.image },
  { id: 'tenders', name: BISTRO.tenders.name, subtitle: 'Free bistro item', rarity: 'epic', weight: 6, kind: 'product', image: BISTRO.tenders.image },
  { id: 'doner', name: BISTRO.donerWrap.name, subtitle: 'Free bistro item', rarity: 'legendary', weight: 3, kind: 'product', image: BISTRO.donerWrap.image },
  { id: 'crocant-box', name: BISTRO.crocantBox.name, subtitle: 'Free bistro item', rarity: 'legendary', weight: 3, kind: 'product', image: BISTRO.crocantBox.image },
  { id: 'pts-500', name: '500 Points', subtitle: 'Mega bonus', rarity: 'legendary', weight: 2, kind: 'points', pointsValue: 500 },
];

export const RARITY_COLORS: Record<ExtractionPrize['rarity'], string> = {
  common: '#94a3b8',
  rare: '#38bdf8',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

export function pickWeightedPrize(): ExtractionPrize {
  const total = EXTRACTION_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let roll = Math.random() * total;
  for (const prize of EXTRACTION_PRIZES) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }
  return EXTRACTION_PRIZES[EXTRACTION_PRIZES.length - 1];
}

export const REEL_LENGTH = 60;
export const REEL_TARGET_INDEX = 48;

/** A decorative strip of prizes for the reel to scroll through, forced to land on `winner`. */
export function buildReel(winner: ExtractionPrize): ExtractionPrize[] {
  return Array.from({ length: REEL_LENGTH }, (_, index) => (index === REEL_TARGET_INDEX ? winner : pickWeightedPrize()));
}
