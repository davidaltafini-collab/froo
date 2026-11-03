import type { LucideIcon } from 'lucide-react-native';
import type { ImageRef } from '../theme/image';

export type TabKey = 'home' | 'coupons' | 'list' | 'stores';

export type ProfileView =
  | 'main'
  | 'edit_profile'
  | 'family_invite'
  | 'games'
  | 'payments'
  | 'settings'
  | 'help';

export interface Offer {
  id: number;
  title: string;
  desc: string;
  discount: string;
  icon: LucideIcon;
  color: string;
  image?: ImageRef;
}

export interface Transaction {
  id: number;
  store: string;
  date: string;
  amount: string;
  points: string;
}

export interface CatalogueItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  img: string;
}

export interface CatalogueCategory {
  id: string;
  name: string;
  items: CatalogueItem[];
}

export interface RewardItem {
  name: string;
  cost: number;
  image: ImageRef;
}

export interface RedeemedReward {
  item: RewardItem;
  expiry: number;
}

export type RedeemedItems = Record<string, RedeemedReward>;

export type PrizeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ExtractionPrize {
  id: string;
  name: string;
  subtitle: string;
  rarity: PrizeRarity;
  weight: number;
  kind: 'product' | 'points';
  image?: ImageRef;
  pointsValue?: number;
}

export interface WonPrize {
  id: string;
  prize: ExtractionPrize;
  wonAt: number;
  /** Product prizes start unactivated — winning one at home shouldn't start its redemption clock. */
  activatedAt: number | null;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  time: string;
  icon: LucideIcon;
  unread: boolean;
}

export interface ShoppingListItem {
  id: number;
  text: string;
  checked: boolean;
  qty: number;
}

export interface ShoppingListHistoryEntry {
  id: number;
  date: string;
  items: { text: string; qty: number }[];
}

export interface Store {
  id: string;
  name: string;
  address: string;
  town: string;
  lat: number;
  lng: number;
  openingHours: string;
  active: boolean;
}
