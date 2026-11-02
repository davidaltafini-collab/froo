import React from 'react';
import { motion } from 'motion/react';
import { X, Timer, QrCode } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function ActivePromotionOverlay({ onClose }: { onClose: () => void }) {
  const { activePromotionItem: item, redeemedItems } = useAppContext();
  const expiryTime = item ? (redeemedItems[item.name]?.expiry || 0) : 0;

  const [timeLeft, setTimeLeft] = React.useState(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
  const [showQR, setShowQR] = React.useState(false);

  React.useEffect(() => {
    const int = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(int);
  }, [expiryTime]);

  if (!item) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="absolute inset-0 bg-white z-[70] flex flex-col"
    >
      <div className="flex-1 overflow-y-auto hide-scrollbar pb-safe">
        <div className="relative h-72 bg-slate-100">
          <img src={item.image} alt={item.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
          <button onClick={onClose} className="absolute top-12 right-6 w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-slate-800 shadow-sm border border-white/40">
             <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 -mt-8 relative z-10 text-center">
           <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{item.name}</h2>
           <p className="text-sm font-bold text-slate-500 mb-8">Valid at participating locations.</p>

           {!showQR ? (
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
               className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 flex flex-col items-center shadow-sm"
             >
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <Timer className="w-8 h-8" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Expires in</p>
                <div className="text-6xl font-black tabular-nums tracking-tighter text-slate-800 mb-8">
                  {timeString}
                </div>

                <button
                  onClick={() => setShowQR(true)}
                  className="w-full bg-red-600 text-white rounded-2xl py-4 text-lg font-black uppercase tracking-wide shadow-[0_4px_0_rgb(185,28,28)] active:translate-y-1 active:shadow-none hover:-translate-y-0.5 transition-all"
                >
                  Scan at Cash Register
                </button>
             </motion.div>
           ) : (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white border border-slate-200 rounded-[32px] p-8 flex flex-col items-center shadow-lg"
             >
                <p className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-widest">Show this code to cashier</p>
                <div className="bg-white p-4 border-4 border-slate-900 rounded-3xl mb-6 inline-block">
                  <QrCode className="w-48 h-48 text-slate-900" />
                </div>
                <div className="text-4xl font-black tracking-widest text-slate-800 tabular-nums bg-slate-50 px-6 py-3 rounded-2xl">
                  {Math.floor(1000 + Math.random() * 9000)}-{Math.floor(1000 + Math.random() * 9000)}
                </div>
             </motion.div>
           )}
        </div>
      </div>
    </motion.div>
  )
}
