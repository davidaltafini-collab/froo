import type { ExtractionPrize } from '../types';

/** Points earned from games (not spent) needed to qualify for one Prize Drop. */
export const EXTRACTION_THRESHOLD = 150;

/**
 * The drop pool. Product images are reused from the existing offer/rewards catalogues so the
 * drop never introduces new art — winning a product prize is presented exactly like any other
 * redeemed reward (same QR flow), winning a points prize just adds straight to the balance.
 */
export const EXTRACTION_PRIZES: ExtractionPrize[] = [
  { id: 'lemon', name: 'Organic Lemon', subtitle: 'Free item', rarity: 'common', weight: 22, kind: 'product', image: 'https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=400&q=80' },
  { id: 'croissant', name: 'Fresh Croissant', subtitle: 'Free item', rarity: 'common', weight: 22, kind: 'product', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400' },
  { id: 'pts-50', name: '50 Points', subtitle: 'Bonus points', rarity: 'common', weight: 26, kind: 'points', pointsValue: 50 },
  { id: 'avocado', name: 'Avocado (2-Pack)', subtitle: 'Free item', rarity: 'rare', weight: 14, kind: 'product', image: 'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&q=80&w=400' },
  { id: 'oat-milk', name: 'Oat Milk (1L)', subtitle: 'Free item', rarity: 'rare', weight: 14, kind: 'product', image: 'https://images.unsplash.com/photo-1578767361597-216ad9280b77?auto=format&fit=crop&q=80&w=400' },
  { id: 'pts-150', name: '150 Points', subtitle: 'Bonus points', rarity: 'rare', weight: 12, kind: 'points', pointsValue: 150 },
  { id: 'juice', name: 'Cold Pressed Juice', subtitle: 'Free item', rarity: 'epic', weight: 6, kind: 'product', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
  { id: 'coffee', name: 'Ground Coffee', subtitle: 'Free item', rarity: 'epic', weight: 6, kind: 'product', image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=400' },
  { id: 'chicken', name: 'Whole Chicken', subtitle: 'Free item', rarity: 'legendary', weight: 3, kind: 'product', image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80' },
  { id: 'cheese-board', name: 'Cheese Board', subtitle: 'Free item', rarity: 'legendary', weight: 3, kind: 'product', image: 'https://images.unsplash.com/photo-1631379578550-7038263db699?w=400&q=80' },
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
