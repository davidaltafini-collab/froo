

import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { 
  Bell, ScanLine, ShoppingBag, User, 
  Home, Tag, QrCode, ChevronRight, 
  Leaf, MapPin, Clock, Plus, Coffee, Download,
  Gift, Check, Search, Award,
  Settings, Users, CreditCard, HelpCircle, LogOut, X, Share2, Lock,
  Gamepad2, Trophy, Timer, Star, Flame, Crown
} from 'lucide-react';

import { OFFERS, TRANSACTIONS, CATALOGUE_ITEMS } from '../data/mockData';

export function ActionBtn({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 group min-w-[72px]">
      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-green-50 group-hover:text-green-700 group-hover:border-green-100 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{label}</span>
    </button>
  );
}

export function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      data-design-mode-passthrough="true"
      className={`flex flex-col items-center gap-1.5 min-w-[64px] ${active ? 'text-green-700' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-green-50 text-green-700' : 'bg-transparent text-slate-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}

export function IOSWheelPicker({ value, onChange, min = 1, max = 99 }: { value: number, onChange: (v: number) => void, min?: number, max?: number }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const itemHeight = 44; 
  const scrollTimeout = React.useRef<any>(null);

  React.useEffect(() => {
    if (containerRef.current) {
      const targetTop = (value - min) * itemHeight;
      containerRef.current.scrollTop = targetTop;
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const y = e.currentTarget.scrollTop;
    const Math = window.Math;
    const idx = Math.round(y / itemHeight);
    const val = min + idx;
    if (val !== value && val >= min && val <= max) {
      onChange(val);
    }
    
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (containerRef.current) {
        const targetTop = (val - min) * itemHeight;
        containerRef.current.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }, 150);
  };

  return (
    <div className="relative h-[220px] w-full overflow-hidden select-none" style={{ WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)' }}>
      {/* Central Highlight Pill */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[120px] h-[44px] bg-slate-200/50 rounded-xl pointer-events-none"></div>
      
      <div 
         ref={containerRef}
         onScroll={handleScroll}
         className="h-full w-full overflow-y-auto hide-scrollbar snap-y snap-mandatory hide-scrollbar relative z-10"
         style={{ paddingTop: '88px', paddingBottom: '88px' }}
       >
         {items.map(i => (
           <div 
             key={i} 
             className="h-[44px] snap-center flex items-center justify-center text-[22px] transition-colors duration-200" 
             style={{ 
               color: value === i ? '#0f172a' : '#94a3b8', 
               fontWeight: value === i ? 600 : 400
             }}
           >
             {i}
           </div>
         ))}
       </div>
    </div>
  )
}

export function ProfileMenuRow({ icon: Icon, title, color, bg, onClick }: { icon: any, title: string, color: string, bg: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-3xl transition-colors group">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="font-bold text-sm text-slate-700">{title}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
    </button>
  )
}
