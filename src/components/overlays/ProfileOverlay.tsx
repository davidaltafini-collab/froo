import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Users, Plus, ShoppingBag, Award, Gift, CreditCard, Settings, HelpCircle, LogOut, QrCode, Share2 } from 'lucide-react';
import { ProfileMenuRow } from '../SharedUI';
import type { ProfileView } from '../../types';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';

export function ProfileOverlay({ onClose, initialView = 'main' }: { onClose: () => void, initialView?: ProfileView }) {
  const [activeView, setActiveView] = React.useState<ProfileView>(initialView);
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onClose);

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
      className="absolute inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden"
    >
      <div className="px-6 pt-12 md:pt-8 pb-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 touch-none" onPointerDown={startVerticalDrag}>
        <div className="flex items-center gap-3">
          {activeView !== 'main' && (
            <button onClick={() => setActiveView('main')} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          )}
          <h2 className="text-lg font-bold text-slate-800">
             {activeView === 'main' && "Account & Profile"}
             {activeView === 'edit_profile' && "Edit Profile"}
             {activeView === 'family_invite' && "Invite to Family"}
             {activeView === 'games' && "Family Games"}
             {activeView === 'payments' && "Payment Methods"}
             {activeView === 'settings' && "App Settings"}
             {activeView === 'help' && "Help & Support"}
          </h2>
        </div>
        <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeView === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 overflow-y-auto hide-scrollbar p-6 pb-safe space-y-6"
            >
              {/* Profile Header */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-slate-200 border-4 border-green-50 flex items-center justify-center overflow-hidden shrink-0">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah`} alt="Necula David" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Necula David</h3>
                  <p className="text-sm text-slate-500 mt-1">sarah.jenkins@gmail.com</p>
                  <button
                    onClick={() => setActiveView('edit_profile')}
                    className="mt-3 text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-4 py-2 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Family Feature */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Family Group</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Share lists & points</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveView('family_invite')}
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3"/> Invite
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-4 relative z-10">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Tom" alt="Tom" /></div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emma" alt="Emma" /></div>
                  </div>
                  <p className="text-xs font-medium text-slate-500 flex-1">Tom and Emma are in your family.</p>
                </div>

                <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 relative z-10">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><ShoppingBag className="w-4 h-4 text-slate-400"/> Shared Shopping List</span>
                      <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer shadow-inner">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                      </div>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Award className="w-4 h-4 text-slate-400"/> Pool Loyalty Points</span>
                      <div className="w-10 h-6 bg-green-500 rounded-full relative cursor-pointer shadow-inner">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                      </div>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Share2 className="w-4 h-4 text-slate-400"/> Share Digital Receipts</span>
                      <div className="w-10 h-6 bg-slate-200 rounded-full relative cursor-pointer shadow-inner">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Family Games & Rewards */}
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[32px] p-6 shadow-sm border border-yellow-300 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <h4 className="font-bold text-lg mb-1">Family Scratch & Win</h4>
                    <p className="text-sm font-medium text-yellow-100">Win points for your family pool!</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                </div>

                <button
                  onClick={() => setActiveView('games')}
                  className="w-full mt-5 bg-white text-orange-600 rounded-2xl py-3 font-bold shadow-md hover:bg-yellow-50 transition-colors"
                >
                  Play Now
                </button>
              </div>

              {/* Other Sections */}
              <div className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                <ProfileMenuRow icon={CreditCard} title="Payment Methods" color="text-slate-700" bg="bg-slate-50" onClick={() => setActiveView('payments')} />
                <ProfileMenuRow icon={Settings} title="App Settings" color="text-slate-700" bg="bg-slate-50" onClick={() => setActiveView('settings')} />
                <ProfileMenuRow icon={HelpCircle} title="Help & Support" color="text-slate-700" bg="bg-slate-50" onClick={() => setActiveView('help')} />
              </div>

              <button className="w-full bg-white rounded-[32px] p-5 shadow-sm border border-red-100 flex items-center justify-center gap-3 text-red-600 font-bold hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </motion.div>
          )}

          {activeView === 'games' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-y-auto hide-scrollbar p-6 pb-safe space-y-6 flex flex-col justify-center"
            >
              <div className="bg-gradient-to-b from-yellow-400 to-orange-500 rounded-[32px] p-8 shadow-sm flex flex-col items-center justify-center text-center text-white relative overflow-hidden min-h-[400px]">
                 {/* Decorative shapes */}
                 <div className="absolute top-10 left-10 w-4 h-4 bg-white/40 rotate-45"></div>
                 <div className="absolute bottom-10 right-10 w-6 h-6 rounded-full bg-white/40"></div>

                 <Gift className="w-16 h-16 mb-4 text-yellow-100" />
                 <h3 className="text-3xl font-extrabold mb-2 text-white drop-shadow-sm">Scratch & Win</h3>
                 <p className="text-yellow-100 font-medium mb-8">Reveal 3 matching icons to win bonus points for your Family Pool!</p>

                 {/* Scratch card area */}
                 <div className="bg-orange-600 p-2 rounded-3xl w-full max-w-[240px] shadow-inner mb-6">
                   <div className="grid grid-cols-2 gap-2">
                     {[1,2,3,4].map(i => (
                       <div key={i} className="aspect-square bg-white rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden group cursor-pointer">
                         <div className="absolute inset-0 bg-yellow-300 flex items-center justify-center text-yellow-600 font-bold text-xs uppercase transition-opacity duration-700 opacity-100 group-hover:opacity-0">Scratch</div>
                         <Award className="w-8 h-8 text-orange-500" />
                       </div>
                     ))}
                   </div>
                 </div>

                 <p className="text-sm font-bold text-white bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm">1 free play remaining this week</p>
              </div>
            </motion.div>
          )}

          {activeView === 'edit_profile' && (
            <motion.div
              key="edit_profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-y-auto hide-scrollbar p-6 pb-safe space-y-6"
            >
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-2xl bg-slate-200 border-4 border-green-50 flex items-center justify-center overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah`} alt="Necula David" className="w-full h-full object-cover" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white hover:bg-green-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2 block">Full Name</label>
                    <input type="text" defaultValue="Necula David" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-green-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2 block">Email Address</label>
                    <input type="email" defaultValue="sarah.jenkins@gmail.com" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-green-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-4 mb-2 block">Phone Number</label>
                    <input type="tel" defaultValue="(555) 123-4567" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-green-500 transition-colors" />
                  </div>

                  <button className="w-full mt-4 bg-green-600 text-white rounded-2xl py-4 font-bold shadow-md shadow-green-200 hover:bg-green-700 transition-colors" onClick={() => setActiveView('main')}>
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'family_invite' && (
            <motion.div
              key="family_invite"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-y-auto hide-scrollbar p-6 pb-safe flex flex-col items-center justify-center space-y-6"
            >
               <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center max-w-sm w-full">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Invite Family Member</h3>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">Let them scan this code with their camera to join your family group.</p>

                  <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 inline-block mb-8">
                     <QrCode className="w-48 h-48 text-slate-800" />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or send link</span>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </div>

                  <button className="w-full mt-6 bg-indigo-600 text-white rounded-2xl py-4 font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Share Invite Link
                  </button>
               </div>
            </motion.div>
          )}

          {activeView === 'payments' && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-y-auto hide-scrollbar p-6 pb-safe space-y-6"
            >
              <div className="space-y-4">
                <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-800 font-bold text-xs italic">VISA</div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">•••• 4242</p>
                      <p className="text-[10px] text-slate-500 font-medium">Expires 12/28</p>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg uppercase tracking-wider">Default</div>
                </div>

                <div className="bg-white rounded-[32px] p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center text-white font-bold text-xs">Pay</div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">Apple Pay</p>
                      <p className="text-[10px] text-slate-500 font-medium">Connected</p>
                    </div>
                  </div>
                </div>

                <button className="w-full bg-slate-50 rounded-[32px] p-5 border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 text-slate-600 font-bold hover:bg-slate-100 transition-colors hover:border-slate-300">
                  <Plus className="w-5 h-5" />
                  Add Payment Method
                </button>
              </div>
            </motion.div>
          )}

          {activeView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-y-auto hide-scrollbar p-6 pb-safe space-y-6"
            >
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center">
                   <div>
                     <p className="font-bold text-sm text-slate-800">Push Notifications</p>
                     <p className="text-xs text-slate-500 mt-0.5">Alerts for offers & rewards</p>
                   </div>
                   <div className="w-12 h-7 bg-green-500 rounded-full relative shadow-inner cursor-pointer">
                     <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                   </div>
                </div>
                <div className="flex justify-between items-center">
                   <div>
                     <p className="font-bold text-sm text-slate-800">Location Services</p>
                     <p className="text-xs text-slate-500 mt-0.5">Find nearby stores & deals</p>
                   </div>
                   <div className="w-12 h-7 bg-green-500 rounded-full relative shadow-inner cursor-pointer">
                     <div className="w-5 h-5 bg-white rounded-full absolute top-1 right-1 shadow-sm"></div>
                   </div>
                </div>
                <div className="flex justify-between items-center">
                   <div>
                     <p className="font-bold text-sm text-slate-800">Email Newsletters</p>
                     <p className="text-xs text-slate-500 mt-0.5">Weekly recipes & specials</p>
                   </div>
                   <div className="w-12 h-7 bg-slate-200 rounded-full relative shadow-inner cursor-pointer">
                     <div className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                   </div>
                </div>
                <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                   <div>
                     <p className="font-bold text-sm text-slate-800">Dark Mode</p>
                     <p className="text-xs text-slate-500 mt-0.5">Match system settings</p>
                   </div>
                   <div className="w-12 h-7 bg-slate-200 rounded-full relative shadow-inner cursor-pointer">
                     <div className="w-5 h-5 bg-white rounded-full absolute top-1 left-1 shadow-sm"></div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'help' && (
            <motion.div
              key="help"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-y-auto hide-scrollbar p-6 pb-safe space-y-4"
            >
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <HelpCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">How can we help?</h3>
                <p className="text-sm text-slate-500 mb-6">Our support team is available Mon-Fri, 9am-6pm.</p>
                <button className="w-full bg-blue-600 text-white rounded-2xl py-4 font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors">
                  Contact Support
                </button>
              </div>

              <div className="bg-white rounded-[32px] p-2 shadow-sm border border-slate-100">
                <ProfileMenuRow icon={HelpCircle} title="FAQ" color="text-slate-700" bg="bg-slate-50" onClick={() => {}} />
                <ProfileMenuRow icon={HelpCircle} title="Terms of Service" color="text-slate-700" bg="bg-slate-50" onClick={() => {}} />
                <ProfileMenuRow icon={HelpCircle} title="Privacy Policy" color="text-slate-700" bg="bg-slate-50" onClick={() => {}} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
