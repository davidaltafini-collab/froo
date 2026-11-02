import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { CATALOGUE_ITEMS } from '../../data/mockData';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';
import { SheetGrabber } from '../SheetGrabber';

export function CatalogueOverlay({ onClose, onAdd }: { onClose: () => void, onAdd: (item: string, qty: number) => void }) {
  const [qtySelected, setQtySelected] = useState<Record<string, number>>({});
  const [addedToast, setAddedToast] = useState<string | null>(null);
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onClose);

  const handleAdd = (itemName: string) => {
    const q = qtySelected[itemName] || 1;
    onAdd(itemName, q);
    setQtySelected(prev => ({...prev, [itemName]: 1}));
    setAddedToast(itemName);
    setTimeout(() => setAddedToast(null), 2000);
  }

  const updateQty = (itemName: string, d: number) => {
    setQtySelected(prev => ({
      ...prev,
      [itemName]: Math.max(1, (prev[itemName] || 1) + d)
    }));
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex flex-col justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.04, bottom: 1 }}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 420, bounceDamping: 40 }}
        onDragEnd={finishVerticalDrag}
        className="bg-white w-full rounded-t-[32px] flex flex-col h-[90vh] shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="pt-6 px-6 pb-4 shrink-0 border-b border-slate-100 flex flex-col bg-white rounded-t-[32px] z-10 sticky top-0">
          <div
            className="w-12 mx-auto mb-[17px] shrink-0 text-slate-200 cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={startVerticalDrag}
          >
            <SheetGrabber />
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Catalogue</h2>
            <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {addedToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute top-24 left-6 right-6 bg-slate-900 text-white p-3 rounded-xl shadow-xl flex items-center justify-center gap-2 z-50 text-sm font-bold"
              >
                <Check className="w-4 h-4 text-green-400" />
                Added {addedToast} to list
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="overflow-y-auto hide-scrollbar flex-1 p-6 pb-20 bg-slate-50/50">
          {CATALOGUE_ITEMS.map(cat => (
            <div key={cat.id} className="mb-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                {cat.name}
                <div className="flex-1 h-px bg-slate-200 ml-2"></div>
              </h3>
              <div className="space-y-3">
                {cat.items.map(item => (
                  <div key={item.id} className="flex gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 border border-slate-100">
                       <img src={item.img} alt={item.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 text-sm truncate mb-0.5">{item.name}</h4>
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-black text-slate-900">${item.price.toFixed(2)}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.unit}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 h-8">
                        <button onClick={() => updateQty(item.name, -1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800">-</button>
                        <span className="w-6 text-center text-[11px] font-bold text-slate-700">{qtySelected[item.name] || 1}</span>
                        <button onClick={() => updateQty(item.name, 1)} className="w-7 h-full flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800">+</button>
                      </div>
                      <button onClick={() => handleAdd(item.name)} className="h-8 w-full bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-700 active:scale-95 shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-transform">
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
