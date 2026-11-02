import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { RedeemFlow } from './RedeemFlow';
import type { RewardItem } from '../../types';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';

export function RewardsOverlay({ onClose }: { onClose: () => void }) {
  const { currentPoints, setCurrentPoints, redeemedItems, setRedeemedItems, setActivePromotionItem } = useAppContext();

  const TIERS = [1500, 3000, 4500, 6000];

  const [displayPoints, setDisplayPoints] = React.useState(currentPoints);
  const [activeRedeemItem, setActiveRedeemItem] = React.useState<RewardItem | null>(null);
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onClose);

  React.useEffect(() => {
    if (displayPoints === currentPoints) return;

    let startTime = performance.now();
    const duration = 1000;
    const start = displayPoints;
    const end = currentPoints;

    let frame: number;
    const animate = (now: number) => {
      let p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4); // cubic ease out
      setDisplayPoints(Math.floor(start + (end - start) * ease));
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [currentPoints]);

  const handleRedeem = (item: RewardItem) => {
    if (currentPoints < item.cost) return;
    setActiveRedeemItem(item);
  };

  const handleRedeemConfirm = () => {
    if (!activeRedeemItem) return;
    const item = activeRedeemItem;
    const expiry = Date.now() + 15 * 60 * 1000; // 15 mins
    setRedeemedItems(prev => ({ ...prev, [item.name]: { item, expiry } }));
    setCurrentPoints(p => p - item.cost);
    setActivePromotionItem(item);
    setActiveRedeemItem(null);
  };

  const REWARDS: Record<number, RewardItem[]> = {
    1500: [
      { name: "Fresh Bananas (1 lb)", cost: 1500, image: "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80" },
      { name: "Organic Lemon", cost: 1500, image: "https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=400&q=80" },
      { name: "Spring Water", cost: 1500, image: "https://images.unsplash.com/photo-1655079343782-f0fc4704753e?auto=format&fit=crop&q=80&w=400" },
      { name: "Fresh Croissant", cost: 1500, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400" },
    ],
    3000: [
      { name: "Avocado (2-Pack)", cost: 3000, image: "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&q=80&w=400" },
      { name: "Strawberry Box", cost: 3000, image: "https://images.unsplash.com/photo-1467825487722-2a7c4cd62e75?auto=format&fit=crop&q=80&w=400" },
      { name: "Oat Milk (1L)", cost: 3000, image: "https://images.unsplash.com/photo-1578767361597-216ad9280b77?auto=format&fit=crop&q=80&w=400" },
      { name: "Artisan Sourdough", cost: 3000, image: "https://images.unsplash.com/photo-1765227036124-f90781f04dd8?auto=format&fit=crop&q=80&w=400" },
    ],
    4500: [
      { name: "Organic Eggs", cost: 4500, image: "https://images.unsplash.com/photo-1617440168937-c6497eaa8db5?auto=format&fit=crop&q=80&w=400" },
      { name: "Cold Pressed Juice", cost: 4500, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80" },
      { name: "Ground Coffee", cost: 4500, image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=400" },
      { name: "Mixed Nuts", cost: 4500, image: "https://images.unsplash.com/photo-1657986020391-732179775c66?auto=format&fit=crop&q=80&w=400" },
    ],
    6000: [
      { name: "Whole Chicken", cost: 6000, image: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80" },
      { name: "Cheese Board", cost: 6000, image: "https://images.unsplash.com/photo-1631379578550-7038263db699?w=400&q=80" },
      { name: "Organic Olive Oil", cost: 6000, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80" },
      { name: "Acai Bowl", cost: 6000, image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80" },
    ]
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.04, bottom: 1 }}
      dragMomentum={false}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 40 }}
      onDragEnd={finishVerticalDrag}
      className="absolute inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden text-slate-900"
    >
      {/* Sticky Header: Massive Points */}
      <div className="sticky top-0 z-30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col">
        {/* Close & Title */}
        <div className="px-6 pt-12 md:pt-8 pb-2 flex justify-between items-center touch-none" onPointerDown={startVerticalDrag}>
           <span className="font-bold text-slate-800 tracking-wide">Rewards</span>
           <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5" />
           </button>
        </div>

        {/* Massive Points Display */}
        <div className="px-6 py-6 flex flex-col items-center border-b border-slate-100 overflow-hidden relative">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Balance</p>
           <motion.div
             className="flex items-baseline gap-1"
             animate={{ scale: displayPoints < currentPoints ? [1, 0.95, 1] : (displayPoints > currentPoints ? [1, 1.05, 1] : 1) }}
             transition={{ duration: 0.3 }}
           >
              <span className="text-6xl font-black tabular-nums tracking-tighter text-slate-900">{displayPoints.toLocaleString()}</span>
              <span className="text-xl font-bold text-slate-300">pts</span>
           </motion.div>
        </div>
      </div>

      {/* Dynamic Tier List */}
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-safe relative">
        {TIERS.map(tier => (
          <div key={tier} className="mb-2">
            <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-xl px-6 py-4 border-b border-slate-100/50 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end">
                <h3 className="font-black text-xl text-slate-800 tracking-tight">{tier.toLocaleString()} <span className="text-slate-400 text-sm font-bold">Pts</span></h3>
                {currentPoints < tier && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Locked</p>
                )}
              </div>
            </div>

            <div className="px-4 py-4 flex flex-col gap-3">
              {REWARDS[tier].map((item, i) => {
                const isLocked = currentPoints < item.cost;
                const missingPts = item.cost - currentPoints;
                const rewardState = redeemedItems[item.name];
                const expiry = rewardState?.expiry || 0;
                const isRedeemed = !!rewardState;
                const isActiveRedeemed = isRedeemed && expiry > Date.now();

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    animate={isActiveRedeemed ? { scale: [1, 1.02, 1], borderColor: '#86efac' } : {}}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    className={`bg-white rounded-3xl p-3 flex gap-4 items-center shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border overflow-hidden relative ${
                      isLocked && !isRedeemed ? 'border-slate-100' : (isActiveRedeemed ? 'bg-green-50/30' : 'border-slate-200')
                    }`}
                  >
                    {/* Image */}
                    <div className="w-24 h-24 shrink-0 rounded-[20px] overflow-visible relative bg-slate-100">
                      <img src={item.image} alt={item.name} crossOrigin="anonymous" className={`w-full h-full rounded-[20px] object-cover transition-all duration-700 ${isLocked && !isRedeemed ? 'grayscale-[0.8] opacity-70' : ''} ${isActiveRedeemed ? 'ring-2 ring-green-400 ring-offset-2' : ''}`} />
                      {isLocked && !isRedeemed && (
                        <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center backdrop-blur-[1px] rounded-[20px]">
                          <Lock className="w-6 h-6 text-white drop-shadow-md" />
                        </div>
                      )}
                      {isActiveRedeemed && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0, rotate: -45 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
                          className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 py-1 pr-2">
                      <h4 className={`font-bold text-[15px] leading-snug mb-1 ${isLocked && !isRedeemed ? 'text-slate-600' : 'text-slate-900'}`}>{item.name}</h4>

                      {isRedeemed ? (
                        <div className="mt-3 flex items-center justify-between">
                          <div className="w-fit flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 border border-green-200 rounded-xl">
                            <Check className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Redeemed</span>
                          </div>
                          {isActiveRedeemed && (
                            <button
                              onClick={() => setActivePromotionItem(item)}
                              className="bg-green-600 text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-700 active:scale-95 transition-all shadow-sm">
                              View QR
                            </button>
                          )}
                        </div>
                      ) : isLocked ? (
                        <div className="mt-3 w-fit flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{missingPts.toLocaleString()} pts to unlock</span>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs font-black text-green-600">{item.cost.toLocaleString()} pts</p>
                          <button
                            onClick={() => handleRedeem(item)}
                            className="text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 active:scale-95 transition-all shadow-sm bg-[#00a63e]">
                            Redeem
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Spacer for bottom safe area */}
        <div className="h-12"></div>
      </div>

      <AnimatePresence>
        {activeRedeemItem && (
          <RedeemFlow
            item={activeRedeemItem}
            userPoints={currentPoints}
            onConfirm={handleRedeemConfirm}
            onCancel={() => setActiveRedeemItem(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
