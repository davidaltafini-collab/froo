import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function NotificationsOverlay({ onClose }: { onClose: () => void }) {
  const { notifications, setNotifications } = useAppContext();

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden text-slate-900"
    >
      <div className="px-6 pt-12 md:pt-8 pb-4 flex justify-between items-center bg-white shadow-sm shrink-0 border-b border-slate-100 z-10">
        <span className="font-bold text-slate-800 tracking-wide text-lg">Notifications</span>
        <div className="flex items-center gap-3">
          <button onClick={markAllRead} className="text-xs font-bold text-green-600 uppercase tracking-widest hover:text-green-700 transition-colors">
            Mark All Read
          </button>
          <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
             <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-6 space-y-4">
        {notifications.map(n => {
           const Icon = n.icon;
           return (
             <div key={n.id} className={`p-4 rounded-[24px] border transition-colors flex gap-4 ${n.unread ? 'bg-white border-green-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-80'}`}>
                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center ${n.unread ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                   <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-bold text-sm ${n.unread ? 'text-slate-900' : 'text-slate-700'}`}>{n.title}</h4>
                      {n.unread && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1"></span>}
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed mb-2 pr-4">{n.message}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{n.time}</p>
                </div>
             </div>
           )
        })}
      </div>
    </motion.div>
  );
}
