import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, ChevronRight, Coffee, X } from 'lucide-react';
import { OFFERS } from '../data/mockData';
import { useAppContext } from '../context/AppContext';
import type { Offer } from '../types';
import { SheetGrabber } from '../components/SheetGrabber';

const FEATURED_BAKERY_COUPON: Offer = {
  id: 99,
  title: 'Bakery',
  desc: '15% off all Artisan Breads',
  icon: Coffee,
  discount: '15% OFF',
  color: 'bg-amber-50 text-amber-600',
  image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=500',
};

const COUPONS = [...OFFERS, FEATURED_BAKERY_COUPON];
const CATEGORIES = ['All Offers', ...Array.from(new Set(COUPONS.map((coupon) => coupon.title)))];

const COUPON_ACCENTS: Record<string, string> = {
  'Dairy & Eggs': 'bg-emerald-600 shadow-emerald-100',
  'Fresh Produce': 'bg-[#006320] shadow-green-100',
  Bakery: 'bg-amber-500 shadow-amber-100',
  'Meat & Seafood': 'bg-rose-500 shadow-rose-100',
};

function getCouponAccent(title: string) {
  return COUPON_ACCENTS[title] ?? 'bg-slate-800 shadow-slate-100';
}

export function CouponsView() {
  const { setShowRewards } = useAppContext();
  const [selectedCoupon, setSelectedCoupon] = useState<Offer | null>(null);
  const [activeCategory, setActiveCategory] = useState('All Offers');
  const visibleCoupons = activeCategory === 'All Offers'
    ? COUPONS
    : COUPONS.filter((coupon) => coupon.title === activeCategory);

  return (
    <div className="p-6">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-xl font-bold text-slate-800">Offers & Rewards</h2>
      </div>

      <div
        onClick={() => setShowRewards(true)}
        className="from-green-500 to-emerald-600 rounded-[24px] p-5 mb-8 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all active:scale-[0.98] bg-[#006320]"
      >
        <div className="flex items-center gap-4 text-white">
           <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shrink-0 shadow-inner">
             <Gift className="w-6 h-6" />
           </div>
           <div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-green-100 mb-0.5">FreshRewards</p>
             <h3 className="font-bold text-lg leading-tight">Redeem Points</h3>
           </div>
        </div>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0 border border-white/20">
           <ChevronRight className="w-5 h-5 text-white" />
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-800 mb-4">Digital Coupons</h3>
      {/* Categories/filters */}
      <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              type="button"
              key={category}
              onClick={() => setActiveCategory(category)}
              aria-pressed={isActive}
              className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-white bg-[#006320]'
                  : 'bg-white border border-slate-100 text-slate-600 shadow-sm hover:border-green-200'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
      
      {/* Coupon List */}
      <div className="space-y-4 mt-2">
        {visibleCoupons.map((offer, i) => (
          <motion.div 
            layoutId={`coupon-${offer.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ layout: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }, opacity: { delay: i * 0.1 } }}
            key={offer.id} 
            className="relative p-5 rounded-3xl bg-white border border-slate-100 flex flex-col gap-4 shadow-sm overflow-hidden"
          >
            {offer.image && (
              <div className="absolute right-0 top-0 h-24 w-28 overflow-hidden rounded-bl-[30px]" style={{ clipPath: 'polygon(28% 0, 100% 0, 100% 100%, 0 100%)' }}>
                <img src={offer.image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-bl from-black/5 to-white/20" />
              </div>
            )}
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center pr-24">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${getCouponAccent(offer.title)}`}>
                  <offer.icon className="w-6 h-6 text-white" strokeWidth={2.4} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wide">{offer.title}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{offer.desc}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">Exp: Oct 24 &bull; Use in-store</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedCoupon(offer)}
              className="w-full mt-2 py-3 bg-slate-50 hover:bg-green-50 text-green-700 font-bold text-xs rounded-xl transition-colors border border-slate-100 hover:border-green-100"
            >
            View & Use Coupon
            </button>
          </motion.div>
        ))}
      </div>

      {/* Coupon Modal Overlay */}
      <AnimatePresence>
        {selectedCoupon && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center sm:p-6"
            onClick={() => setSelectedCoupon(null)}
          >
            <motion.div 
              layoutId={`coupon-${selectedCoupon.id}`}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="bg-white w-full md:max-w-md md:rounded-[32px] rounded-t-[32px] p-8 flex flex-col shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto hide-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 mx-auto mb-[17px] md:hidden text-slate-200">
                <SheetGrabber />
              </div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                  {selectedCoupon.image ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                      <img src={selectedCoupon.image} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${getCouponAccent(selectedCoupon.title)}`}>
                      <selectedCoupon.icon className="w-6 h-6 text-white" strokeWidth={2.4} />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 uppercase text-[10px] tracking-wide">{selectedCoupon.title}</p>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight mt-1">{selectedCoupon.desc}</h3>
                  </div>
                </div>
                <button onClick={() => setSelectedCoupon(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Barcode Section */}
              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center w-full mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-100 text-green-700 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider">
                  {selectedCoupon.discount}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Scan at Register</p>
                
                <div className="w-full h-24 bg-white flex items-center justify-center rounded-xl shadow-inner px-4 relative overflow-hidden">
                  <motion.div 
                    animate={{ left: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] z-10"
                  />
                  <div className="w-full h-16 bg-white flex justify-between relative z-0">
                    <div className="w-1 bg-slate-800 h-full"></div><div className="w-3 bg-slate-800 h-full"></div><div className="w-1 bg-slate-800 h-full"></div><div className="w-0.5 bg-slate-800 h-full"></div><div className="w-4 bg-slate-800 h-full"></div><div className="w-2 bg-slate-800 h-full"></div><div className="w-1.5 bg-slate-800 h-full"></div><div className="w-2 bg-slate-800 h-full"></div><div className="w-1 bg-slate-800 h-full"></div><div className="w-3 bg-slate-800 h-full"></div><div className="w-1 bg-slate-800 h-full"></div><div className="w-2 bg-slate-800 h-full"></div><div className="w-1 bg-slate-800 h-full"></div><div className="w-2 bg-slate-800 h-full"></div><div className="w-4 bg-slate-800 h-full"></div><div className="w-1 bg-slate-800 h-full"></div><div className="w-2 bg-slate-800 h-full"></div><div className="w-1 bg-slate-800 h-full"></div>
                  </div>
                </div>
                <p className="text-[10px] font-mono font-bold tracking-widest text-slate-400 mt-3">CPN-2023-{selectedCoupon.id}9</p>
              </div>

              {/* Usage Instructions */}
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">How to Use</h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">1</div>
                      <span>Add qualifying items to your shopping cart or basket.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">2</div>
                      <span>Present this barcode to the cashier or scan it at self-checkout.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Terms & Conditions</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Offer valid until Oct 24, 2026. Limit one coupon per customer per visit. Cannot be combined with other offers or store promotions. Discount applies to regular priced items only. Excludes alcohol, tobacco, and gift cards. Valid at all FreshLeaf participating locations.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
