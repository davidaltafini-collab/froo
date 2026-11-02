import React from 'react';
import { motion } from 'motion/react';
import { Award } from 'lucide-react';
import type { RewardItem } from '../../types';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';
import { SheetGrabber } from '../SheetGrabber';

export function RedeemFlow({ item, userPoints, onConfirm, onCancel }: { item: RewardItem, userPoints: number, onConfirm: () => void, onCancel: () => void }) {
  const [step, setStep] = React.useState<'confirm' | 'animating'>('confirm');
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onCancel);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-end justify-center"
      onClick={onCancel}
    >
       <motion.div
         initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
         transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
         drag="y"
         dragControls={dragControls}
         dragListener={false}
         dragConstraints={{ top: 0, bottom: 0 }}
         dragElastic={{ top: 0.04, bottom: 1 }}
         dragMomentum={false}
         dragTransition={{ bounceStiffness: 420, bounceDamping: 40 }}
         onDragEnd={finishVerticalDrag}
         className="w-full bg-white rounded-t-[32px] p-6 pb-safe flex flex-col items-center text-center"
         onClick={event => event.stopPropagation()}
       >
          <div
            className="w-12 mb-[25px] text-slate-200 cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={startVerticalDrag}
          >
            <SheetGrabber />
          </div>

          {step === 'confirm' ? (
            <>
              <img src={item.image} alt={item.name} crossOrigin="anonymous" className="w-32 h-32 object-cover rounded-2xl mb-6 shadow-md" />
              <h3 className="text-2xl font-black text-slate-900 mb-2">{item.name}</h3>
              <p className="text-slate-500 font-medium mb-8">Are you sure you want to redeem this reward for <span className="font-bold text-slate-800">{item.cost.toLocaleString()} pts</span>?</p>

              <button
                onClick={() => {
                  setStep('animating');
                  setTimeout(() => {
                    onConfirm();
                  }, 1200);
                }}
                className="w-full text-white rounded-2xl py-4 text-lg font-black uppercase tracking-wide mb-3 hover:bg-slate-800 transition-colors bg-[#17642a]"
              >
                Yes, Redeem
              </button>
              <button onClick={onCancel} className="w-full py-4 text-slate-500 font-bold uppercase tracking-wide hover:text-slate-700 transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center">
               <motion.div
                 animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 1 }}
                 className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6"
               >
                 <Award className="w-10 h-10 text-green-600" />
               </motion.div>
               <h3 className="text-xl font-black text-slate-900">Activating Reward...</h3>
            </div>
          )}
       </motion.div>
    </motion.div>
  );
}
