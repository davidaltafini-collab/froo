import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Share2, QrCode } from 'lucide-react';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';
import { SheetGrabber } from '../SheetGrabber';

interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  avatar: string;
}

export function ShareOverlay({ onClose }: { onClose: () => void }) {
  const familyMembers: FamilyMember[] = [
    { id: 1, name: 'Sarah', relation: 'Wife', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&q=80&fit=crop' },
    { id: 2, name: 'Mike', relation: 'Brother', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&q=80&fit=crop' },
    { id: 3, name: 'Emma', relation: 'Daughter', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&q=80&fit=crop' },
  ];

  const [sharedWith, setSharedWith] = useState<number | null>(null);
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onClose);

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
        className="bg-white w-full rounded-t-[32px] p-6 flex flex-col shadow-2xl relative pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div
          className="w-12 mx-auto mb-[17px] shrink-0 text-slate-200 cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={startVerticalDrag}
        >
          <SheetGrabber />
        </div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Share List</h2>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Family Members</h3>
        <div className="space-y-3 mb-8">
          {familyMembers.map(member => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" crossOrigin="anonymous" />
                <div>
                  <div className="font-bold text-slate-800 text-sm">{member.name}</div>
                  <div className="text-xs font-bold text-slate-400">{member.relation}</div>
                </div>
              </div>
              <button
                onClick={() => setSharedWith(member.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${sharedWith === member.id ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-200 text-slate-600 hover:border-green-200 hover:text-green-600 shadow-sm'}`}
              >
                {sharedWith === member.id ? 'Shared' : 'Share'}
              </button>
            </div>
          ))}
        </div>

        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Other Ways</h3>
        <div className="flex gap-4 mb-4">
          <button className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3 hover:bg-green-50 hover:border-green-200 transition-colors group">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Share2 className="w-5 h-5 text-slate-600 group-hover:text-green-600" />
            </div>
            <span className="text-xs font-bold text-slate-600 group-hover:text-green-700">WhatsApp</span>
          </button>
          <button className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3 hover:bg-green-50 hover:border-green-200 transition-colors group">
            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5 text-slate-600 group-hover:text-green-600" />
            </div>
            <span className="text-xs font-bold text-slate-600 group-hover:text-green-700">QR Code</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
