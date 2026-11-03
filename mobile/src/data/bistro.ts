import churros from '../../assets/bistro/churros.webp';
import fries from '../../assets/bistro/fries.webp';
import tenders from '../../assets/bistro/tenders.webp';
import hotdog from '../../assets/bistro/hotdog.webp';
import hotdogWrap from '../../assets/bistro/hotdog-wrap.webp';
import crocantBox from '../../assets/bistro/crocant-box.webp';
import chickenSandwich from '../../assets/bistro/chicken-sandwich.webp';
import donerWrap from '../../assets/bistro/doner-wrap.webp';
import chickenPanini from '../../assets/bistro/chicken-panini.webp';
import flatbread from '../../assets/bistro/flatbread-sub.webp';

/**
 * Froo Bistro menu. Photos are the transparent product cut-outs that already ship with the
 * mini-games, bundled locally so every bistro surface renders instantly and offline.
 * Prices are demo values in lei.
 */
export interface BistroItem {
  id: string;
  name: string;
  tagline: string;
  price: number;
  image: number;
}

export const BISTRO = {
  churros: { id: 'churros', name: 'Churros', tagline: 'Cinnamon sugar', price: 8.99, image: churros },
  fries: { id: 'fries', name: 'French Fries', tagline: 'Crispy, salted', price: 7.99, image: fries },
  tenders: { id: 'tenders', name: 'Chicken Tenders', tagline: '5 pieces', price: 15.99, image: tenders },
  hotdog: { id: 'hotdog', name: 'Loaded Hot Dog', tagline: 'Pickles & mustard', price: 11.99, image: hotdog },
  hotdogWrap: { id: 'hotdog-wrap', name: 'French Hot Dog', tagline: 'Toasted baguette', price: 8.49, image: hotdogWrap },
  crocantBox: { id: 'crocant-box', name: 'Crocant Box', tagline: 'Tenders & fries', price: 24.99, image: crocantBox },
  chickenSandwich: { id: 'chicken-sandwich', name: 'Crispy Chicken Burger', tagline: 'Cheddar & pickles', price: 17.99, image: chickenSandwich },
  donerWrap: { id: 'doner-wrap', name: 'Doner Wrap', tagline: 'Grilled chicken', price: 19.99, image: donerWrap },
  chickenPanini: { id: 'chicken-panini', name: 'Chicken Panini', tagline: 'Pressed to order', price: 14.99, image: chickenPanini },
  flatbread: { id: 'flatbread', name: 'Bistro Flatbread', tagline: 'Beef & garlic sauce', price: 16.99, image: flatbread },
} satisfies Record<string, BistroItem>;

/** Order used by the Dashboard "Froo Bistro" carousel. */
export const BISTRO_FEATURED: BistroItem[] = [
  BISTRO.hotdog,
  BISTRO.crocantBox,
  BISTRO.chickenPanini,
  BISTRO.donerWrap,
  BISTRO.chickenSandwich,
  BISTRO.fries,
  BISTRO.churros,
];

/** Points earned per purchase: 1 point per leu spent. */
export const bistroPoints = (item: BistroItem) => Math.round(item.price);

export const formatLei = (value: number) => `${value.toFixed(2).replace('.', ',')} lei`;
