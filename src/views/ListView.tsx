import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ShoppingBag, User, Clock, Plus, Check, Users, Share2 } from 'lucide-react';
import { ShareOverlay, CatalogueOverlay, QtyPickerOverlay } from '../components/overlays';
import type { ShoppingListItem, ShoppingListHistoryEntry } from '../types';
import designAsset1 from '@/assets/.design-editor/froggyshoppinglist-ms9kkuzc.png';

export function ListView() {
  const shouldReduceMotion = useReducedMotion();
  const [lists, setLists] = useState<Record<string, ShoppingListItem[]>>({
    personal: [
      { id: 1, text: 'Organic Bananas (Bunch)', checked: false, qty: 1 },
      { id: 2, text: 'Almond Milk (Unsweetened)', checked: true, qty: 2 },
      { id: 3, text: 'Sourdough Bread', checked: false, qty: 1 },
      { id: 4, text: 'Avocados (3 pack)', checked: false, qty: 1 },
      { id: 5, text: 'Free-range Eggs (Dozen)', checked: true, qty: 1 },
    ],
    family: [
      { id: 6, text: 'Paper Towels', checked: false, qty: 1 },
      { id: 7, text: 'Dish Soap', checked: true, qty: 1 },
      { id: 8, text: 'Laundry Detergent', checked: false, qty: 2 },
    ]
  });

  const [history, setHistory] = useState<ShoppingListHistoryEntry[]>([
    { id: 101, date: 'Oct 20, 2026', items: [{ text: 'Apples', qty: 4 }, { text: 'Chicken Breast', qty: 2 }, { text: 'Rice', qty: 1 }] },
    { id: 102, date: 'Oct 12, 2026', items: [{ text: 'Coffee Beans', qty: 1 }, { text: 'Almond Milk', qty: 2 }] }
  ]);

  const [activeList, setActiveList] = useState<string>('personal');
  const [newItemText, setNewItemText] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [showCatalogue, setShowCatalogue] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);

  const toggleItem = (id: number) => {
    if (activeList === 'history') return;
    setLists(prev => ({
      ...prev,
      [activeList]: prev[activeList].map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    }));
  };

  const addItem = (text: string, qty: number = 1) => {
    const listToUpdate = activeList === 'history' ? 'personal' : activeList;
    setLists(prev => ({
      ...prev,
      [listToUpdate]: [{ id: Date.now() + Math.random(), text, checked: false, qty }, ...prev[listToUpdate]]
    }));
    setNewItemText('');
  };

  const handleDone = () => {
    if (lists[activeList] && lists[activeList].length > 0) {
      const newHistory = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: lists[activeList].map(i => ({ text: i.text, qty: i.qty }))
      };
      setHistory([newHistory, ...history]);
      
      setLists(prev => ({
        ...prev,
        [activeList]: []
      }));
    }
  };

  const handleRestoreHistory = (h: ShoppingListHistoryEntry) => {
    setLists(prev => ({
      ...prev,
      personal: [
        ...h.items.map(i => ({ id: Date.now() + Math.random(), text: i.text, checked: false, qty: i.qty })),
        ...prev.personal
      ]
    }));
    setActiveList('personal');
  };
  
  const currentItems = lists[activeList] || [];

  return (
    <div className="p-6 relative isolate">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Shopping Lists</h2>
          {activeList !== 'history' && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 bg-slate-50 text-slate-600 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-50 hover:text-green-700 transition-colors relative"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          )}
        </div>
        
        {/* List Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar relative">
          <button 
            onClick={() => setActiveList('history')}
            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-2xl shadow-sm transition-colors ${activeList === 'history' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-100 text-slate-600 hover:border-slate-300'}`}
          >
            <Clock className="w-4 h-4" />
          </button>
          <div className="w-px h-10 bg-slate-200 shrink-0"></div>
          <button 
            onClick={() => setActiveList('personal')}
            className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm transition-colors ${activeList === 'personal' ? 'bg-green-600 text-white' : 'bg-white border border-slate-100 text-slate-600 hover:border-green-200'}`}
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              My List
            </div>
          </button>
          <button 
            onClick={() => setActiveList('family')}
            className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap shadow-sm transition-colors ${activeList === 'family' ? 'bg-green-600 text-white' : 'bg-white border border-slate-100 text-slate-600 hover:border-green-200'}`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Family List
            </div>
          </button>
        </div>

        {activeList !== 'history' ? (
          <>
            {/* Add item */}
            <div className="flex gap-3 mb-4 mt-2">
              <div className="flex-1 flex items-center bg-white border border-slate-100 shadow-sm rounded-2xl focus-within:border-green-400 focus-within:ring-1 focus-within:ring-green-400 overflow-hidden">
                <input 
                  type="text" 
                  placeholder={`Add an item to ${activeList}...`}
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newItemText.trim()) {
                      addItem(newItemText.trim(), newItemQty);
                      setNewItemQty(1);
                    }
                  }}
                  className="flex-1 px-5 py-4 text-sm font-medium text-slate-800 focus:outline-none bg-transparent"
                />
                <div className="px-3 border-l border-slate-100 flex items-center">
                  <button 
                    onClick={() => setShowQtyModal(true)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 relative"
                  >
                    Qty: {newItemQty}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => { if(newItemText.trim()) { addItem(newItemText.trim(), newItemQty); setNewItemQty(1); } }}
                className="w-14 h-14 bg-green-600 text-white rounded-2xl flex items-center justify-center hover:bg-green-700 shrink-0 shadow-lg shadow-green-200 transition-transform active:scale-95"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            
            <button 
              onClick={() => setShowCatalogue(true)}
              className="w-full mb-8 py-4 bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> Browse Catalogue
            </button>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {currentItems.map((item, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center gap-4 p-4 rounded-3xl border cursor-pointer transition-colors ${item.checked ? 'bg-slate-50 border-slate-100 shadow-none' : 'bg-white border-slate-100 shadow-sm hover:border-green-200'}`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border-2 transition-colors ${item.checked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 bg-white'}`}>
                      {item.checked && <Check className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-bold block truncate transition-colors ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {item.text}
                      </span>
                    </div>
                    <div className="bg-slate-100 px-3 py-1 rounded-lg shrink-0">
                       <span className="text-xs font-black text-slate-500">x{item.qty}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {currentItems.length === 0 && (
                <div className="text-center p-8 bg-slate-50 rounded-[32px] border border-slate-100 border-dashed mt-4">
                  <p className="text-sm font-bold text-slate-400">List is empty</p>
                </div>
              )}
              
              {currentItems.length > 0 && (
                <button 
                  onClick={handleDone}
                  className="w-full mt-6 py-4 bg-green-600 text-white rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-[0_8px_16px_rgba(22,163,74,0.25)] hover:bg-green-700 active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5" /> Mark List as Done
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6 mt-4">
            {history.map(h => (
              <div 
                key={h.id} 
                className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm hover:border-green-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 group-hover:text-green-500 transition-colors" />
                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-green-600 transition-colors">{h.date}</h3>
                  </div>
                  <button 
                    onClick={() => handleRestoreHistory(h)}
                    className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-green-600 hover:text-white transition-colors flex items-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3 h-3" /> Restore
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {h.items.map((hi, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2 group-hover:bg-green-50/50 group-hover:border-green-100 transition-colors">
                       <span className="text-xs font-bold text-slate-600">{hi.text}</span>
                       <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-1.5 rounded-md group-hover:bg-green-100 group-hover:text-green-700 transition-colors">x{hi.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center p-8 bg-slate-50 rounded-[32px] border border-slate-100 border-dashed mt-4">
                <p className="text-sm font-bold text-slate-400">No history yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCatalogue && <CatalogueOverlay onClose={() => setShowCatalogue(false)} onAdd={(item, qty) => { addItem(item, qty); setShowCatalogue(false); }} />}
        {showShareModal && <ShareOverlay onClose={() => setShowShareModal(false)} />}
        {showQtyModal && <QtyPickerOverlay value={newItemQty} onChange={setNewItemQty} onClose={() => setShowQtyModal(false)} />}
      </AnimatePresence>
    
      <motion.img
        src={designAsset1}
        alt=""
        aria-hidden="true"
        initial={{
          opacity: 0,
          transform: shouldReduceMotion ? 'rotate(-1.5deg)' : 'translateX(84px) rotate(-1.5deg)',
        }}
        animate={{
          opacity: 1,
          transform: 'translateX(0px) rotate(-1.5deg)',
        }}
        transition={{
          duration: shouldReduceMotion ? 0.18 : 0.28,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="object-contain pointer-events-none select-none z-20 absolute top-[20.4%] left-[75.9%] w-[37.4%] h-[21.5%] will-change-transform"
      />
    </div>
  )
}
