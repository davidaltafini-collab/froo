
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ScanLine, ShoppingBag, Home, Tag, QrCode, MapPin, Timer } from 'lucide-react';

import { NavItem } from './components/SharedUI';
import { PromoDrawer } from './components/PromoDrawer';
import { ScannerOverlay, ProfileOverlay, PersonalGameOverlay, ActivePromotionOverlay, RewardsOverlay, NotificationsOverlay, HistoryOverlay } from './components/overlays';
import { DashboardView } from './views/DashboardView';
import { CouponsView } from './views/CouponsView';
import { ListView } from './views/ListView';
import { StoresView } from './views/StoresView';
import { useAppContext } from './context/AppContext';
import SarahAvatar from './assets/avatar-sarah.svg';

export default function App() {
  const {
    activeTab, setActiveTab,
    showQR, setShowQR,
    isScanning, setIsScanning,
    showProfile, setShowProfile,
    showNotifications, setShowNotifications,
    showHistory, setShowHistory,
    profileInitialView, setProfileInitialView,
    showPersonalGame, setShowPersonalGame,
    showRewards, setShowRewards,
    redeemedItems,
    activePromotionItem, setActivePromotionItem,
    unreadCount,
  } = useAppContext();

  const frameRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [containerHeight, setContainerHeight] = useState(849);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const updateHeight = () => setContainerHeight(el.clientHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a') || target.closest('[role="button"]')) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    };
    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => document.removeEventListener('click', handleGlobalClick, { capture: true });
  }, []);

  useLayoutEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-0 font-sans text-slate-900">
      {/* Mobile-first constraints container */}
      <div ref={frameRef} className="w-full h-[100dvh] md:h-[849px] md:max-h-[100vh] md:max-w-[425px] bg-white rounded-[28px] shadow-sm border-slate-100 overflow-hidden relative flex flex-col border">

        {/* Header spacer - reserves layout space above the scrollable content */}
        <div className="relative shrink-0 z-10 bg-white border-b border-slate-100" style={{ height: 122 }} />

        {/* Promo Drawer - draggable green header that opens into a promotions drawer */}
        <PromoDrawer containerHeight={containerHeight} />

        {/* Header controls (avatar / notifications) - sit above the collapsed handle, but get covered when the drawer opens */}
        <header className="absolute inset-x-0 top-[49px] h-[64px] z-[35] pointer-events-none">
          <div className="absolute left-[34px] top-0 flex w-[86px] flex-col items-center gap-1 cursor-pointer group pointer-events-auto" onClick={() => { setProfileInitialView('main'); setShowProfile(true); }}>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-green-500 flex items-center justify-center overflow-hidden group-hover:shadow-md transition-all">
              <img src={SarahAvatar} alt="Necula David" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-[12px] leading-none font-bold text-slate-900 group-hover:text-green-700 transition-colors whitespace-nowrap">Necula David</h1>
            </div>
          </div>
          <button
            onClick={() => setShowNotifications(true)}
            className="absolute right-[39px] top-0 p-2 text-slate-400 hover:text-green-600 transition-colors rounded-full hover:bg-slate-50 pointer-events-auto"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">{unreadCount}</span>}
          </button>
        </header>

        {/* Scrollable Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar pb-28 hide-scrollbar relative">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <DashboardView />
              </motion.div>
            )}
            {activeTab === 'coupons' && (
              <motion.div key="coupons" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <CouponsView />
              </motion.div>
            )}
            {activeTab === 'list' && (
              <motion.div key="list" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <ListView />
              </motion.div>
            )}
            {activeTab === 'stores' && (
              <motion.div key="stores" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <StoresView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Active Rewards Floating */}
        <AnimatePresence>
          {Object.values(redeemedItems).some((r) => r.expiry > Date.now()) && activeTab === 'home' && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 20 }}
               className="absolute bottom-[90px] left-0 w-full px-4 z-20 pointer-events-none"
             >
                <div className="pointer-events-auto flex flex-col gap-2">
                  {Object.values(redeemedItems).filter((r) => r.expiry > Date.now()).map((reward, i) => (
                     <div
                        key={i}
                        onClick={() => setActivePromotionItem(reward.item)}
                       className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg shadow-green-900/10 border border-green-200 flex items-center justify-between cursor-pointer hover:border-green-300 transition-colors"
                     >
                       <div className="flex items-center gap-3">
                         <img src={reward.item.image} alt={reward.item.name} crossOrigin="anonymous" className="w-10 h-10 rounded-xl object-cover bg-slate-100" />
                         <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">{reward.item.name}</h4>
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1">
                               <Timer className="w-3 h-3" /> Tap to view QR
                            </p>
                         </div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                         <QrCode className="w-4 h-4" />
                       </div>
                     </div>
                  ))}
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex justify-between items-center px-6 py-3 z-20">
          <NavItem icon={Home} label="Dashboard" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavItem icon={Tag} label="Offers" active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} />

          {/* Center Scan FAB */}
          <div className="relative -top-6">
            <button
              onClick={() => setIsScanning(true)}
              className="bg-green-600 hover:bg-green-700 text-white p-3.5 rounded-2xl shadow-lg shadow-green-200 transition-transform hover:scale-105 active:scale-95 border-4 border-white"
            >
              <ScanLine className="w-6 h-6" />
            </button>
          </div>

          <NavItem icon={ShoppingBag} label="List" active={activeTab === 'list'} onClick={() => setActiveTab('list')} />
          <NavItem icon={MapPin} label="Stores" active={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
        </nav>

        {/* QR Modal Overlay */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowQR(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white p-8 rounded-[32px] shadow-2xl flex flex-col items-center w-full max-w-xs border border-slate-100"
                onClick={e => e.stopPropagation()}
              >
                <div className="bg-green-50 text-green-700 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest mb-8 border border-green-100">
                  Scan at checkout
                </div>
                {/* Fake QR code visualization */}
                <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-green-200 flex flex-col items-center w-full">
                  <div className="w-32 h-32 bg-white flex items-center justify-center rounded-xl shadow-inner mb-4 p-3">
                    <div className="w-full h-full bg-white flex flex-col justify-between">
                      <div className="flex gap-1 h-6">
                        <div className="w-1 bg-slate-800"></div><div className="w-2 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-0.5 bg-slate-800"></div><div className="w-3 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-1.5 bg-slate-800"></div><div className="w-2 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-0.5 bg-slate-800"></div>
                      </div>
                      <div className="flex gap-1 h-6">
                        <div className="w-2 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-0.5 bg-slate-800"></div><div className="w-2 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-1.5 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-3 bg-slate-800"></div><div className="w-0.5 bg-slate-800"></div><div className="w-1 bg-slate-800"></div>
                      </div>
                      <div className="flex gap-1 h-6">
                         <div className="w-1 bg-slate-800"></div><div className="w-2 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-0.5 bg-slate-800"></div><div className="w-3 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-1.5 bg-slate-800"></div><div className="w-2 bg-slate-800"></div><div className="w-1 bg-slate-800"></div><div className="w-0.5 bg-slate-800"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono font-bold tracking-widest text-slate-400">LM-9823-1102</p>
                </div>
                <button
                  onClick={() => setShowQR(false)}
                  className="mt-8 w-full py-4 rounded-2xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
                >
                  Done
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanner Modal Overlay */}
        <AnimatePresence>
          {isScanning && <ScannerOverlay onClose={() => setIsScanning(false)} />}
        </AnimatePresence>

        {/* Profile Modal Overlay */}
        <AnimatePresence>
          {showProfile && <ProfileOverlay onClose={() => setShowProfile(false)} initialView={profileInitialView} />}
        </AnimatePresence>

        {/* Personal Game Overlay */}
        <AnimatePresence>
          {showPersonalGame && <PersonalGameOverlay onClose={() => setShowPersonalGame(false)} onShowRewards={() => setShowRewards(true)} />}
        </AnimatePresence>

        {/* Rewards Overlay */}
        <AnimatePresence>
          {showRewards && <RewardsOverlay onClose={() => setShowRewards(false)} />}
        </AnimatePresence>

        {/* Active Promotion Overlay */}
        <AnimatePresence>
          {activePromotionItem && (
            <ActivePromotionOverlay onClose={() => setActivePromotionItem(null)} />
          )}
        </AnimatePresence>

        {/* Notifications Overlay */}
        <AnimatePresence>
          {showNotifications && (
            <NotificationsOverlay onClose={() => setShowNotifications(false)} />
          )}
        </AnimatePresence>

        {/* History Overlay */}
        <AnimatePresence>
          {showHistory && (
            <HistoryOverlay onClose={() => setShowHistory(false)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
