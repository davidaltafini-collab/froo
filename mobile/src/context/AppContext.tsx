import React, { createContext, useContext, useState } from 'react';
import { Flame, Crown, ScanLine } from 'lucide-react-native';
import type {
  TabKey,
  ProfileView,
  RedeemedItems,
  RewardItem,
  AppNotification,
  ExtractionPrize,
  WonPrize,
} from '../types';
import { EXTRACTION_THRESHOLD } from '../data/extractionPrizes';

const initialNotifications: AppNotification[] = [
  { id: 1, title: 'Points Expiring Soon', message: 'You have 450 points expiring in 3 days. Redeem them now!', time: '2 hours ago', icon: Flame, unread: true },
  { id: 2, title: 'New Reward Unlocked', message: 'You just unlocked the Platinum tier reward catalogue.', time: '1 day ago', icon: Crown, unread: true },
  { id: 3, title: 'Receipt Available', message: 'Your digital receipt for Store #402 is ready.', time: '2 days ago', icon: ScanLine, unread: false },
];

interface AppContextValue {
  activeTab: TabKey;
  setActiveTab: React.Dispatch<React.SetStateAction<TabKey>>;
  showQR: boolean;
  setShowQR: React.Dispatch<React.SetStateAction<boolean>>;
  isScanning: boolean;
  setIsScanning: React.Dispatch<React.SetStateAction<boolean>>;
  showProfile: boolean;
  setShowProfile: React.Dispatch<React.SetStateAction<boolean>>;
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  showHistory: boolean;
  setShowHistory: React.Dispatch<React.SetStateAction<boolean>>;
  profileInitialView: ProfileView;
  setProfileInitialView: React.Dispatch<React.SetStateAction<ProfileView>>;
  showPersonalGame: boolean;
  setShowPersonalGame: React.Dispatch<React.SetStateAction<boolean>>;
  showRewards: boolean;
  setShowRewards: React.Dispatch<React.SetStateAction<boolean>>;
  currentPoints: number;
  setCurrentPoints: React.Dispatch<React.SetStateAction<number>>;
  redeemedItems: RedeemedItems;
  setRedeemedItems: React.Dispatch<React.SetStateAction<RedeemedItems>>;
  activePromotionItem: RewardItem | null;
  setActivePromotionItem: React.Dispatch<React.SetStateAction<RewardItem | null>>;
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  unreadCount: number;
  gamePointsProgress: number;
  extractionsAvailable: number;
  setExtractionsAvailable: React.Dispatch<React.SetStateAction<number>>;
  wonPrizes: WonPrize[];
  setWonPrizes: React.Dispatch<React.SetStateAction<WonPrize[]>>;
  /** Adds points earned from a game to the spendable balance and to Prize Drop progress. */
  registerGamePoints: (points: number) => void;
  /** Records a Prize Drop result: points prizes top up the balance immediately, product prizes are
   * only added to the Rewards list — winning one doesn't start its redemption clock. */
  claimPrize: (prize: ExtractionPrize) => void;
  /** Starts a won product prize's 15-minute in-store redemption window and opens its QR code. */
  activatePrize: (wonPrizeId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showQR, setShowQR] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [profileInitialView, setProfileInitialView] = useState<ProfileView>('main');
  const [showPersonalGame, setShowPersonalGame] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(4820);
  const [redeemedItems, setRedeemedItems] = useState<RedeemedItems>({});
  const [activePromotionItem, setActivePromotionItem] = useState<RewardItem | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);
  const [gamePointsProgress, setGamePointsProgress] = useState(0);
  const [extractionsAvailable, setExtractionsAvailable] = useState(0);
  const [wonPrizes, setWonPrizes] = useState<WonPrize[]>([]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const registerGamePoints = (points: number) => {
    setCurrentPoints((prev) => prev + points);
    setGamePointsProgress((prev) => {
      const total = prev + points;
      const earned = Math.floor(total / EXTRACTION_THRESHOLD);
      if (earned > 0) setExtractionsAvailable((count) => count + earned);
      return total % EXTRACTION_THRESHOLD;
    });
  };

  const claimPrize = (prize: ExtractionPrize) => {
    const id = `${prize.id}-${Date.now()}`;
    setExtractionsAvailable((prev) => Math.max(0, prev - 1));
    if (prize.kind === 'points') {
      setCurrentPoints((prev) => prev + (prize.pointsValue ?? 0));
      // Points have nothing to activate later, so mark them activated on arrival.
      setWonPrizes((prev) => [{ id, prize, wonAt: Date.now(), activatedAt: Date.now() }, ...prev]);
      return;
    }
    // Product prizes wait for the player to activate them — winning one at home shouldn't start
    // a 15-minute in-store countdown before they've even left the house.
    setWonPrizes((prev) => [{ id, prize, wonAt: Date.now(), activatedAt: null }, ...prev]);
  };

  const activatePrize = (wonPrizeId: string) => {
    const won = wonPrizes.find((entry) => entry.id === wonPrizeId);
    if (!won || won.activatedAt || won.prize.kind !== 'product') return;
    const rewardItem: RewardItem = { name: won.prize.name, cost: 0, image: won.prize.image ?? '' };
    setRedeemedItems((prev) => ({ ...prev, [won.prize.name]: { item: rewardItem, expiry: Date.now() + 15 * 60 * 1000 } }));
    setWonPrizes((prev) => prev.map((entry) => (entry.id === wonPrizeId ? { ...entry, activatedAt: Date.now() } : entry)));
    setActivePromotionItem(rewardItem);
  };

  const value: AppContextValue = {
    activeTab, setActiveTab,
    showQR, setShowQR,
    isScanning, setIsScanning,
    showProfile, setShowProfile,
    showNotifications, setShowNotifications,
    showHistory, setShowHistory,
    profileInitialView, setProfileInitialView,
    showPersonalGame, setShowPersonalGame,
    showRewards, setShowRewards,
    currentPoints, setCurrentPoints,
    redeemedItems, setRedeemedItems,
    activePromotionItem, setActivePromotionItem,
    notifications, setNotifications,
    unreadCount,
    gamePointsProgress,
    extractionsAvailable, setExtractionsAvailable,
    wonPrizes, setWonPrizes,
    registerGamePoints,
    claimPrize,
    activatePrize,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
}
