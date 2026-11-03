import React, { createContext, useContext, useState } from 'react';
import { Flame, Crown, ScanLine } from 'lucide-react';
import type {
  TabKey,
  ProfileView,
  RedeemedItems,
  RewardItem,
  AppNotification,
} from '../types';

const initialNotifications: AppNotification[] = [
  { id: 1, title: 'Points Expiring Soon', message: 'You have 450 points expiring in 3 days. Redeem them now!', time: '2 hours ago', icon: Flame, unread: true },
  { id: 2, title: 'New Reward Unlocked', message: 'You just unlocked the Platinum tier reward catalogue.', time: '1 day ago', icon: Crown, unread: true },
  { id: 3, title: 'Receipt Available', message: 'Your digital receipt for froo Giurgiului is ready.', time: '2 days ago', icon: ScanLine, unread: false },
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

  const unreadCount = notifications.filter(n => n.unread).length;

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
