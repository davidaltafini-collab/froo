import React from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform, useSpring } from 'motion/react';
import { QrCode, Leaf, MapPin, Clock, Gift, Check, Award, Gamepad2, Flame, Crown, ChevronRight, ShoppingBag } from 'lucide-react';
import { OFFERS, TRANSACTIONS } from '../data/mockData';
import { ActionBtn } from '../components/SharedUI';
import { useAppContext } from '../context/AppContext';
import frooMark from '@/assets/.aistudio/logo-mark.svg';
import mascotImg from '@/assets/.aistudio/mascott.png';
import frogHandImg from '@/assets/.aistudio/froghand-hand.svg';
import designAsset1 from '@/assets/.design-editor/froogames-ms98q703.svg';
import designAsset2 from '@/assets/.design-editor/froogames-bg-ms98v2l5.svg';
import designAsset3 from '@/assets/.design-editor/mascottpicirotaiat-ms993n5n.png';
import designAsset4 from '@/assets/.design-editor/mascott-ms995uzq.png';
import designAsset5 from '@/assets/.design-editor/mascottfarapicioare-ms99b4nj.png';

export function DashboardView() {
  const {
    setShowQR,
    setShowPersonalGame,
    setShowRewards,
    setShowHistory,
    setActiveTab,
    currentPoints,
    setCurrentPoints,
  } = useAppContext();

  const [claimed, setClaimed] = React.useState(false);
  const [displayPoints, setDisplayPoints] = React.useState(currentPoints);
  const [particles, setParticles] = React.useState<{id: number, x: number, y: number}[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  React.useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const tiltX = Math.max(-45, Math.min(45, e.gamma)); 
      const tiltY = Math.max(-45, Math.min(45, e.beta - 45)); 
      x.set(tiltX / 45 * 0.5);
      y.set(tiltY / 45 * 0.5);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [x, y]);

  React.useEffect(() => {
    if (displayPoints === currentPoints) return;
    
    let startTime = performance.now();
    const duration = 1200;
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
  }, [currentPoints]); // removed displayPoints from dependencies to avoid loop

  const handleClaim = (e: React.MouseEvent) => {
    if (claimed) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;

    const newParticles = Array.from({length: 12}).map((_, i) => ({
      id: Date.now() + i,
      x: startX,
      y: startY
    }));
    
    setParticles(newParticles);
    setClaimed(true);

    setTimeout(() => {
      setCurrentPoints(p => p + 15);
    }, 600); // delay point increment until particles fly up
    
    setTimeout(() => {
      setParticles([]);
    }, 2000);
  };

  return (
    <div className="relative">
      {/* Particles Overlay */}
      {particles.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: p.x, y: p.y, scale: 0.5 }}
          animate={{ 
            opacity: [1, 1, 0], 
            x: p.x + (Math.random() - 0.5) * 150, 
            y: p.y - 150 - Math.random() * 200,
            scale: [0.5, 1.5, 1] 
          }}
          transition={{ duration: 0.8 + Math.random() * 0.4, ease: "easeOut" }}
          className="fixed z-[100] pointer-events-none text-green-500 font-black text-xl drop-shadow-md"
          style={{ left: 0, top: 0 }}
        >
          +15
        </motion.div>
      ))}

      {/* Loyalty Card */}
      <div className="px-8 mt-5 relative z-20" style={{ perspective: 1000 }} onClick={async () => {
        if (typeof (window as any).DeviceOrientationEvent !== 'undefined' && typeof (window as any).DeviceOrientationEvent.requestPermission === 'function') {
          try {
            await (window as any).DeviceOrientationEvent.requestPermission();
          } catch(e) {}
        }
      }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative aspect-[1.586/1] w-full"
        >
          {/* Card Decoration Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#00753f] via-[#005c32] to-[#00391f] rounded-[22px] shadow-xl shadow-green-900/20 overflow-hidden flex flex-col justify-between pointer-events-none">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/6 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-black/18 rounded-full blur-2xl -ml-12 -mb-12"></div>
            <div className="absolute inset-0 opacity-[0.13]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <img src={frooMark} alt="" className="z-0 -translate-x-1/2 object-contain opacity-[0.36] w-[83%] h-[71.7%] absolute top-[15.9%] left-[53.5%]" />

            <div className="mt-auto h-[100px] bg-gradient-to-t from-[#00220f]/60 via-[#00220f]/30 to-transparent"></div>
          </div>

          {/* Card Content layer that preserves 3D */}
          <div className="absolute inset-0 p-[18px] flex flex-col justify-between text-white z-[1]" style={{ transformStyle: "preserve-3d" }}>
            {/* Top Header */}
            <div className="flex justify-between items-start" style={{ transform: "translateZ(10px)" }}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1.5 opacity-90">
                  <Leaf className="w-4 h-4 text-green-400" />
                  <span className="font-bold tracking-widest text-xs uppercase text-green-50">Froo<span className="text-green-400">Rewards</span></span>
                </div>
                {/* Faux Card Chip */}
                <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-200 to-yellow-500/80 border border-yellow-300/50 flex flex-col justify-evenly px-1.5 shadow-sm opacity-90" style={{ transform: "translateZ(5px)" }}>
                  <div className="w-full h-[1px] bg-yellow-700/30"></div>
                  <div className="w-full h-[1px] bg-yellow-700/30"></div>
                  <div className="w-full h-[1px] bg-yellow-700/30"></div>
                </div>
              </div>
              
              <button
                onClick={() => setShowQR(true)}
                className="bg-white/12 backdrop-blur-md p-2.5 rounded-[14px] border border-white/20 hover:bg-white/20 transition-colors shadow-sm relative pointer-events-auto"
              >
                <QrCode className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="mt-auto pt-2 pb-0" style={{ transform: "translateZ(15px)" }}>
              {/* Points & Name */}
              <div className="flex justify-between items-end mb-3">
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-green-50/90 mb-1 font-bold">Points Balance</p>
                   <motion.p
                     className="text-3xl font-black tabular-nums tracking-tight origin-left leading-none drop-shadow-sm"
                     animate={claimed ? { scale: [1, 1.05, 1], color: ['#ffffff', '#4ade80', '#ffffff'] } : {}}
                     transition={{ duration: 0.5, delay: 0.6 }}
                   >
                     {displayPoints.toLocaleString()} <span className="text-sm font-bold text-green-300">pts</span>
                   </motion.p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] uppercase tracking-widest text-green-50/90 mb-1 font-bold">Member</p>
                   <p className="text-sm font-bold tracking-wider text-white drop-shadow-sm">Necula David</p>
                </div>
              </div>

              {/* Tier & Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center shadow-inner">
                      <Award className="w-2.5 h-2.5 text-yellow-700" />
                    </div>
                    <span className="text-xs font-bold tracking-wider text-yellow-400 drop-shadow-sm">GOLD</span>
                  </div>
                  <span className="text-[9px] font-bold opacity-90 uppercase tracking-widest text-green-50">Platinum</span>
                </div>
                <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-full w-[60%] rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[9px] text-green-50/90 font-semibold">1,180 pts to Platinum</p>
                  <p className="text-[9px] text-green-50/90 font-semibold tracking-widest">EXP 04/28</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-8 mt-5">
        <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex justify-around">
          <ActionBtn icon={Gift} label="Redeem" onClick={() => setShowRewards(true)} />
          <ActionBtn icon={MapPin} label="Stores" onClick={() => setActiveTab('stores')} />
          <ActionBtn icon={Clock} label="History" onClick={() => setShowHistory(true)} />
        </div>
      </div>

      {/* Mascot floating overlay - sits in the gap between Quick Actions and Daily Streak */}
      <motion.img
        src={designAsset5}
        alt=""
        initial={{
          opacity: 0,
          transform: shouldReduceMotion ? 'rotate(-21.4deg)' : 'translateX(84px) rotate(-21.4deg)',
        }}
        animate={{
          opacity: 1,
          transform: 'translateX(0px) rotate(-21.4deg)',
        }}
        transition={{
          duration: shouldReduceMotion ? 0.18 : 0.28,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="object-contain pointer-events-none select-none z-20 absolute top-[21.6%] left-[79.4%] w-[32.6%] h-[18.5%] will-change-transform"
        style={{ top: 250, right: -54 }}
      />

      {/* Daily Streak */}
      <div className="px-8 mt-5">
        <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 relative overflow-hidden">
          <button
            onClick={handleClaim}
            disabled={claimed}
            className={`absolute top-0 right-0 z-30 h-[46px] min-w-[138px] rounded-tl-none rounded-br-none rounded-tr-[32px] rounded-bl-[26px] px-5 text-base font-black shadow-md shadow-orange-200/70 transition-all ${
              claimed
                ? 'bg-slate-50 text-green-600 shadow-none'
                : 'bg-[#F29F05] text-white active:brightness-95 hover:brightness-105'
            }`}
          >
            {claimed ? <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Claimed</span> : 'Claim +15'}
          </button>

          <div className="pr-28 mb-4">
             <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
               <Flame className="w-5 h-5 text-orange-500" /> Daily Streak
             </h4>
             <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
               {claimed ? (
                 <>
                   3 Day Streak!
                   <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] uppercase font-bold tracking-widest">
                     <Crown className="w-2.5 h-2.5" /> Bonus Unlocked
                   </span>
                 </>
               ) : (
                 '2 Day Streak! +15 pts today'
               )}
             </div>
          </div>

          <div className="flex justify-between items-center mt-4 relative">
            <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-slate-100 -z-10 rounded-full"></div>
            {[
              { day: 'Mon', checked: true, pts: '+5' },
              { day: 'Tue', checked: true, pts: '+10' },
              { day: 'Wed', checked: false, pts: '+15', current: true },
              { day: 'Thu', checked: false, pts: '+20' },
              { day: 'Fri', checked: false, pts: '+25' },
              { day: 'Sat', checked: false, pts: '+30' },
              { day: 'Sun', checked: false, pts: '+50' },
            ].map((d, i) => {
               const isChecked = d.checked || (d.current && claimed);
               return (
               <div key={i} className="flex flex-col items-center gap-1.5 relative bg-white">
                 <p className={`text-[10px] font-bold uppercase ${d.current ? (claimed ? 'text-green-500' : 'text-orange-500') : 'text-slate-400'}`}>{d.day}</p>
                 <motion.div
                   animate={d.current && claimed ? { scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] } : {}}
                   transition={{ duration: 0.5 }}
                   className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${d.current && !claimed ? 'scale-110 shadow-md ring-4 ring-orange-50' : ''} ${isChecked ? 'bg-[#78C043] shadow-sm' : 'bg-slate-50 border border-slate-200'}`}
                 >
                   {isChecked ? (
                     <img src={frogHandImg} alt="" className="w-5 h-5 object-contain" />
                   ) : (
                     <Leaf className="w-4 h-4 text-slate-300" />
                   )}
                 </motion.div>
                 <p className={`text-[9px] font-black ${isChecked ? 'text-green-600' : 'text-slate-400'}`}>{d.pts}</p>
               </div>
               );
            })}
          </div>
        </div>
      </div>

      {/* Promotional Games */}
      <div className="px-8 mt-[32px]">
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col items-start cursor-pointer group" onClick={() => setShowPersonalGame(true)}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-24 h-24 bg-emerald-50 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center w-full relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-[18px] flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                <img src={designAsset2} alt="froogames" className="block h-full w-full object-contain pointer-events-none" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800 leading-tight flex items-center gap-2">
                  Froo Games
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest">Live</span>
                </h4>
                <p className="text-xs font-medium text-slate-500 mt-1">Top the weekly leaderboard!</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Open Froo Games"
              data-design-mode-passthrough="true"
              onClick={(event) => {
                event.stopPropagation();
                setShowPersonalGame(true);
              }}
              className="bg-slate-50 p-2 rounded-xl group-hover:bg-slate-100 border border-slate-100 transition-colors shrink-0 group-hover:translate-x-1"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Offers */}
      <div className="px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800">Weekly Offers</h3>
          <button type="button" onClick={() => setActiveTab('coupons')} className="text-xs text-green-600 underline font-semibold">View All</button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {OFFERS.slice(0, 2).map((offer, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={offer.id} 
              className={`p-5 rounded-3xl border flex flex-col items-start gap-3 shadow-sm ${i === 0 ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${i === 0 ? 'bg-white text-green-600 text-xl font-bold' : 'bg-green-100 text-green-700'}`}>
                <offer.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wide">{offer.title}</p>
                <p className="text-xs text-slate-600 mt-1 leading-snug">{offer.desc}</p>
                <p className={`text-[10px] mt-2 font-bold ${i === 0 ? 'text-green-700' : 'text-slate-400'}`}>Exp: Nov 30</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6 mt-8 mb-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-5 flex items-center justify-between">
            Recent Savings
            <button type="button" onClick={() => setShowHistory(true)} className="text-xs text-green-600 underline font-semibold">View All</button>
          </h3>
          <div className="space-y-4">
            {TRANSACTIONS.slice(0, 2).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs">
                    <ShoppingBag className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{tx.store}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm text-green-600`}>
                    {tx.amount}
                  </p>
                  <p className={`text-[10px] font-bold mt-0.5 text-slate-400`}>
                    {tx.points} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
