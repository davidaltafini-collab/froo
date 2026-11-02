import React from 'react';
import { motion } from 'motion/react';
import { X, Receipt, Search, ChevronRight } from 'lucide-react';
import { TRANSACTIONS } from '../../data/mockData';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';

export function HistoryOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = React.useState('');
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onClose);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredTransactions = normalizedQuery
    ? TRANSACTIONS.filter((tx) =>
        [tx.store, tx.date, tx.amount, tx.points].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        ),
      )
    : TRANSACTIONS;

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
      className="absolute inset-0 z-50 bg-slate-50 flex flex-col overflow-hidden"
    >
      <div className="px-6 pt-12 md:pt-8 pb-4 bg-white border-b border-slate-100 flex justify-between items-center shrink-0 touch-none" onPointerDown={startVerticalDrag}>
        <h2 className="text-xl font-bold text-slate-800">Purchase History</h2>
        <button
          type="button"
          aria-label="Close purchase history"
          onClick={onClose}
          className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-4">
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by store or date..."
            className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl pl-14 pr-5 py-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
          />
        </div>

        {filteredTransactions.map((tx) => (
          <button
            type="button"
            key={tx.id}
            className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4 text-left hover:border-green-200 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 truncate">{tx.store}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{tx.date}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-slate-800">{tx.amount}</p>
              <p className="text-xs font-bold text-green-600 mt-0.5">{tx.points} pts</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 ml-1 shrink-0" />
          </button>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 text-center">
            <p className="text-sm font-bold text-slate-500">No purchases found</p>
            <p className="text-xs text-slate-400 mt-1">Try another store, date, or amount.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
