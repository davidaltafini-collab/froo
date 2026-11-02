import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Share2, Leaf } from 'lucide-react';

export const PARTNER_ADS = [
  {
    id: 1,
    tag: "Weekly Editorial",
    tagColor: "text-[#006320]",
    title: (
      <>Taste<br/><span className="text-orange-400">The</span><br/>Summer</>
    ),
    titleText: "TASTE THE SUMMER.",
    subtitle: "Summer Issue",
    subtitleColor: "text-green-400",
    desc: "Discover our curated selection of hand-picked organic fruits, artisan cheeses, and farm-fresh vegetables for your perfect weekend picnic.",
    img: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#006320]",
    fillColor: "rgb(0,99,32)",
    gradient: "from-transparent via-[#006320]/40 to-[#006320]",
    btnClass: "bg-orange-500 hover:bg-orange-400 text-white",
    articleSectionTitle: "OUR PROMISE.",
    articleSectionBg: "bg-[#006320]",
    articleSectionText: "text-white",
    articleSectionDesc: "We work directly with over 50 local farmers to bring you the freshest produce within 24 hours of harvest.",
    articleBtn: "bg-white text-[#006320]",
    articleBtnText: "Meet The Farmers",
    items: [
      { img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=400", title: "Citrus Burst", desc: "Farm fresh oranges." },
      { img: "https://images.unsplash.com/photo-1748118869490-16c8e8a6fd7d?auto=format&fit=crop&q=80&w=400", title: "Berry Sweet", desc: "Organic strawberries." },
      { img: "https://images.unsplash.com/photo-1589984662646-e7b2e4962f18?auto=format&fit=crop&q=80&w=400", title: "Melon Magic", desc: "Sweet watermelon." }
    ]
  },
  {
    id: 2,
    tag: "Exclusive",
    tagColor: "text-rose-900",
    title: (
      <>Bake<br/><span className="text-pink-300">Like A</span><br/>Pro</>
    ),
    titleText: "BAKE LIKE A PRO.",
    subtitle: "Masterclass Series",
    subtitleColor: "text-pink-300",
    desc: "Elevate your baking with our premium French butter, organic Madagascar vanilla, and artisanal flour blends.",
    img: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-rose-900",
    fillColor: "rgb(136,19,55)",
    gradient: "from-transparent via-rose-900/40 to-rose-900",
    btnClass: "bg-pink-300 hover:bg-pink-200 text-rose-900",
    articleSectionTitle: "CRAFTED WITH CARE.",
    articleSectionBg: "bg-rose-900",
    articleSectionText: "text-white",
    articleSectionDesc: "Our baking ingredients are sourced from generations-old mills and independent dairy farms to ensure exceptional quality in every bite.",
    articleBtn: "bg-white text-rose-900",
    articleBtnText: "Shop Essentials",
    items: [
      { img: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&q=80&w=400", title: "French Butter", desc: "Cultured and rich." },
      { img: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&q=80&w=400", title: "Artisan Flour", desc: "Stone-ground." },
      { img: "https://images.unsplash.com/photo-1682482198446-4cbf92f85a4b?auto=format&fit=crop&q=80&w=400", title: "Vanilla Bean", desc: "Madagascar sourced." }
    ]
  },
  {
    id: 3,
    tag: "New Arrivals",
    tagColor: "text-indigo-900",
    title: (
      <>Coffee<br/><span className="text-amber-400">House</span><br/>Blend</>
    ),
    titleText: "COFFEE HOUSE BLEND.",
    subtitle: "Morning Rituals",
    subtitleColor: "text-amber-400",
    desc: "Start your day right with our new single-origin roasts, creamy oat milks, and fresh-baked artisanal pastries.",
    img: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-indigo-900",
    fillColor: "rgb(49,46,129)",
    gradient: "from-transparent via-indigo-900/40 to-indigo-900",
    btnClass: "bg-amber-400 hover:bg-amber-300 text-indigo-900",
    articleSectionTitle: "THE PERFECT CUP.",
    articleSectionBg: "bg-indigo-900",
    articleSectionText: "text-white",
    articleSectionDesc: "We partner with fair-trade cooperatives globally to bring you ethically sourced, sustainably grown coffee beans.",
    articleBtn: "bg-white text-indigo-900",
    articleBtnText: "Discover Roasts",
    items: [
      { img: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=400", title: "Single Origin", desc: "Ethiopian Yirgacheffe." },
      { img: "https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&q=80&w=400", title: "Oat Barista", desc: "Perfectly steamed." },
      { img: "https://images.unsplash.com/photo-1542840410-3092f99611a3?auto=format&fit=crop&q=80&w=400", title: "Dark 70%", desc: "Rich and intense." }
    ]
  }
];

function HeaderHandle({ color = "rgb(0,99,32)", className = "" }: { color?: string, className?: string }) {
  return (
    <svg width="100%" height="auto" viewBox="0 0 367 90" version="1.1" xmlns="http://www.w3.org/2000/svg" className={className} style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round',strokeMiterlimit:2}}>
      <g transform="matrix(1,0,0,1,-23.653571,19.106469)">
        <g transform="matrix(-1,-0,0,-0.804295,419,59.416085)">
          <motion.path d="M391.822,73.873C438.622,73.519 3.41,74.655 30,73.873C48.197,73.339 158.613,0 209.5,0C267.103,0 351.203,74.181 391.822,73.873Z" animate={{ fill: color }} transition={{ duration: 0.7, ease: "easeInOut" }} />
        </g>
        <g transform="matrix(0.016313,0,0,0.016313,209.381786,25.492708)">
          <g transform="matrix(1,0,0,1,-3959.333333,-2734)">
            <g id="Background" transform="matrix(7.733073,0,0,7.733073,0,0)">
              <path d="M571.497,253.058C578.14,253.273 578.044,253.294 584.552,254.05C629.165,259.233 652.552,290.924 656.711,321.473C669.226,413.391 572.31,446.264 516.165,402.93C466.819,364.844 472.73,256.702 571.497,253.058ZM611.044,337.494C610.955,335.821 610.982,334.143 610.892,332.47C608.128,280.746 536.334,283.29 532.977,331.54C529.529,381.089 577.754,392.316 599.305,369.312C611.232,356.581 610.786,341.852 611.044,337.494Z" style={{fill:'rgb(254,254,254)'}}/>
              <path d="M766.499,253.055C772.616,253.283 772.529,253.298 778.557,254.002C837.066,260.831 850.456,307.414 852.001,325.546C860.184,421.608 757.171,443.963 707.659,400.321C661.318,359.473 670.338,256.124 766.499,253.055ZM805.079,346.434C805.228,344.789 805.445,343.151 805.594,341.507C811.019,281.589 732.231,280.863 727.942,329.545C723.807,376.477 761.282,386.23 780.408,378.268C800.638,369.846 803.321,353.395 805.079,346.434Z" style={{fill:'rgb(254,254,254)'}}/>
              <path d="M465.537,487.053C609.169,496.583 676.365,430.879 678.036,438.658C678.6,441.283 684.889,470.555 684.741,471.539C684.094,475.849 551.898,577.142 384.691,516.011C345.976,501.857 305.671,475.148 304.893,471.469C304.814,471.097 310.728,437.925 312.547,437.767C313.926,437.647 361.818,470.26 432.438,482.792C438.448,483.859 438.409,483.711 465.537,487.053Z" style={{fill:'rgb(254,254,254)'}}/>
              <path d="M267.5,253.067C296.477,253.067 298.144,252.504 298.164,255.507C298.343,283.042 299.133,283.214 298.022,285.325C296.716,287.808 249.622,285.205 247.762,286.794C247.072,287.383 247.153,287.597 247.153,388.5C247.153,419.925 247.742,421.693 244.504,421.716C241.142,421.741 203.842,422.015 202.48,421.551C201.185,421.109 201.337,420.488 201.336,295.5C201.336,289.331 203.67,286.348 197.5,286.331C175.265,286.271 171.954,287.044 171.69,284.48C171.679,284.37 171.634,255.064 171.719,254.539C172.372,250.531 201.692,255.472 202.059,251.441C204.164,228.283 193.734,167.99 272.48,171.918C282.741,172.43 305.453,176.242 306.182,179.515C306.41,180.539 302.424,207.779 302.304,208.462C301.438,213.394 299.341,210.818 294.454,209.688C243.804,197.981 247.021,229.314 247.154,250.509C247.176,253.93 250.515,253.067 267.5,253.067Z" style={{fill:'rgb(254,254,254)'}}/>
              <path d="M439.502,253.046C442.153,253.18 462.294,254.202 471.218,262.801C472.42,263.959 472.048,264.297 462.63,300.552C461.096,306.46 456.391,293.248 429.488,294.221C407.319,295.023 394.966,312.051 394.122,327.467C393.501,338.81 394.868,420.022 393.324,421.29C392.711,421.793 392.59,421.721 355.5,421.718C350.334,421.718 347.813,423.696 347.81,418.498C347.729,295.352 348.683,294.249 344.169,289.849C339.159,284.965 331.796,288.837 331.785,283.497C331.732,256.461 331.631,255.783 333.383,255.178C336.892,253.967 358.232,251.651 368.611,255.134C395.243,264.069 387.211,280.132 391.35,279.207C391.411,279.193 396.123,265.913 411.638,258.807C424.368,252.977 433.899,253.25 439.502,253.046Z" style={{fill:'rgb(254,254,254)'}}/>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

export function EditorialOverlay({ onClose, ad }: { onClose: () => void, ad?: any }) {
  const content = ad || PARTNER_ADS[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 bg-white z-50 flex flex-col overflow-y-auto hide-scrollbar"
    >
      <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors z-20">
        <X className="w-6 h-6" />
      </button>

      <div className="relative h-[60vh] w-full shrink-0">
        <img src={content.img} alt={content.subtitle} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 text-white">
          <p className={`${content.subtitleColor} font-bold tracking-[0.2em] uppercase text-xs mb-3`}>{content.subtitle}</p>
          <h1 className="text-5xl font-black tracking-tight leading-[0.9] mb-4 whitespace-pre-wrap">{content.titleText.replace(/ /g, '\n')}</h1>
          <p className="text-white/80 text-sm max-w-[250px] leading-relaxed">{content.desc}</p>
        </div>
      </div>

      <div className="p-8 pb-20 bg-white">
        <div className="flex gap-4 mb-10 overflow-x-auto pb-4 -mx-8 px-8 snap-x" style={{ scrollbarWidth: 'none' }}>
          {(content.items || []).map((item: any, i: number) => (
             <div key={i} className="min-w-[200px] snap-center">
                <div className="w-full aspect-[4/5] rounded-[24px] overflow-hidden mb-4 relative">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
             </div>
          ))}
        </div>

        <div className={`w-full ${content.articleSectionBg} ${content.articleSectionText} rounded-[32px] p-8 relative overflow-hidden`}>
          <div className="relative z-10">
            <h2 className="text-3xl font-black leading-tight mb-4 whitespace-pre-wrap">{content.articleSectionTitle.replace(/ /g, '\n')}</h2>
            <p className="text-white/80 text-sm leading-relaxed mb-8">{content.articleSectionDesc}</p>
            <button className={`${content.articleBtn} font-bold rounded-full py-3 px-6 text-sm uppercase tracking-wider active:scale-95 transition-transform`}>
              {content.articleBtnText}
            </button>
          </div>
          <Leaf className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10" />
        </div>
      </div>
    </motion.div>
  );
}

export function PromoDrawer({ containerHeight, onInteract }: { containerHeight: number, onInteract?: () => void }) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [activeEditorialAd, setActiveEditorialAd] = useState<any>(null);
  const [showEditorial, setShowEditorial] = useState(false);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  const [hasInteractedWithPromo, setHasInteractedWithPromo] = useState(false);
  const dragControls = useDragControls();

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % PARTNER_ADS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handlePointerDown = (e: any) => {
    setHasInteractedWithPromo(true);
    if (onInteract) onInteract();
    dragControls.start(e);
  };

  return (
    <>
      {isPromoOpen && (
        <div
          className="absolute inset-0 z-30 cursor-pointer"
          onClick={() => setIsPromoOpen(false)}
        />
      )}

      <motion.div
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: -20, bottom: containerHeight - 200 }}
        dragElastic={0.1}
        onDragStart={() => {
           setHasInteractedWithPromo(true);
           if (onInteract) onInteract();
        }}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 200) {
            setIsPromoOpen(true);
          } else if (info.offset.y < -100 || info.velocity.y < -200) {
            setIsPromoOpen(false);
          } else {
            setIsPromoOpen(isPromoOpen);
          }
        }}
        initial={{ y: -20 }}
        animate={
          isPromoOpen
            ? { y: containerHeight - 200 }
            : !hasInteractedWithPromo
              ? { y: [-20, -12, -20, -20] }
              : { y: -20 }
        }
        transition={
          (!hasInteractedWithPromo && !isPromoOpen)
            ? { y: { repeat: Infinity, duration: 4, times: [0, 0.1, 0.2, 1], ease: "easeInOut" } }
            : { duration: 0.28, ease: [0.32, 0.72, 0, 1] }
        }
        className="absolute top-0 left-0 w-full z-40 flex flex-col pointer-events-none"
      >
        <div
           onPointerDown={handlePointerDown}
           className={`absolute bottom-[calc(100%-25px)] left-0 w-full h-[850px] ${PARTNER_ADS[currentAdIndex].bgColor} flex flex-col justify-end p-0 pointer-events-auto cursor-grab active:cursor-grabbing overflow-hidden z-0 transition-colors duration-700`}
        >
           <div className={`relative w-full h-full flex flex-col justify-end ${PARTNER_ADS[currentAdIndex].bgColor} transition-colors duration-700`}>
             <AnimatePresence>
               <motion.div
                 key={currentAdIndex}
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.7, ease: "easeInOut" }}
                 className="absolute inset-0"
               >
                 <img src={PARTNER_ADS[currentAdIndex].img} alt="Promo" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                 <div className={`absolute inset-0 bg-gradient-to-b ${PARTNER_ADS[currentAdIndex].gradient}`} />
               </motion.div>
             </AnimatePresence>
             <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#006320] to-transparent pointer-events-none z-[5]" />

             <div className="relative z-10 p-8 pb-14 flex flex-col gap-5 text-white h-full justify-end pointer-events-none">
               <div className="absolute top-20 right-6 pointer-events-auto">
                 <button onClick={() => setIsPromoOpen(false)} className="p-3 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/30 transition-colors shadow-lg"><X className="w-6 h-6"/></button>
               </div>

               <AnimatePresence mode="wait">
                 <motion.div
                   key={currentAdIndex}
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -15 }}
                   transition={{ duration: 0.5, ease: "easeOut" }}
                   className="flex flex-col gap-5"
                 >
                   <div>
                     <span className={`bg-white ${PARTNER_ADS[currentAdIndex].tagColor} text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-lg`}>
                       {PARTNER_ADS[currentAdIndex].tag}
                     </span>
                   </div>

                   <h2 className="text-[4rem] font-black leading-[0.85] tracking-tighter uppercase drop-shadow-xl mt-2">
                     {PARTNER_ADS[currentAdIndex].title}
                   </h2>

                   <p className="text-lg text-white/90 font-medium max-w-[280px] leading-snug drop-shadow-md mt-2">
                     {PARTNER_ADS[currentAdIndex].desc}
                   </p>

                   <div className="flex gap-4 mt-4 pointer-events-auto">
                     <button
                       onClick={() => { setActiveEditorialAd(PARTNER_ADS[currentAdIndex]); setShowEditorial(true); setIsPromoOpen(false); }}
                       className={`${PARTNER_ADS[currentAdIndex].btnClass} font-bold rounded-full py-4 px-8 shadow-xl transition-colors flex-1 active:scale-95 text-sm uppercase tracking-wider`}
                     >
                       Explore Now
                     </button>
                     <button className="bg-white/20 backdrop-blur-md text-white font-bold rounded-full py-4 px-6 shadow-xl hover:bg-white/30 transition-colors active:scale-95 text-sm uppercase tracking-wider flex items-center justify-center">
                       <Share2 className="w-5 h-5" />
                     </button>
                   </div>
                 </motion.div>
               </AnimatePresence>
             </div>
           </div>
        </div>

        <div className="relative w-full pointer-events-none z-10">
           <motion.div
             className="w-[104%] max-w-none h-auto block -translate-x-[2%]"
             animate={(!hasInteractedWithPromo && !isPromoOpen) ? {
               filter: [
                 "drop-shadow(0px 0px 0px rgba(134, 239, 172, 0))",
                 "drop-shadow(0px 8px 16px rgba(134, 239, 172, 0.7))",
                 "drop-shadow(0px 0px 0px rgba(134, 239, 172, 0))",
                 "drop-shadow(0px 0px 0px rgba(134, 239, 172, 0))"
               ]
             } : {
               filter: "drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.2))"
             }}
             transition={{ repeat: Infinity, duration: 4, times: [0, 0.1, 0.2, 1], ease: "easeInOut" }}
           >
             <HeaderHandle color="#006320" />
           </motion.div>
           <div
             onPointerDown={handlePointerDown}
             className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[80px] cursor-grab active:cursor-grabbing pointer-events-auto"
           />
        </div>
      </motion.div>

      <AnimatePresence>
        {showEditorial && <EditorialOverlay ad={activeEditorialAd} onClose={() => setShowEditorial(false)} />}
      </AnimatePresence>
    </>
  );
}
