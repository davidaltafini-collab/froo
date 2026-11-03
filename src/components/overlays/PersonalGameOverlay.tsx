import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, Gamepad2, Leaf, Trophy, Flame, Timer, ChevronRight } from 'lucide-react';
import { GAMES } from '../games/registry';
import type { GameDefinition, GameResult } from '../games/types';
import { GameSessionOverlay } from './GameSessionOverlay';
import { useAppContext } from '../../context/AppContext';
import { useVerticalDismissDrag } from '../../hooks/useVerticalDismissDrag';
import designAsset2 from '@/assets/.design-editor/froogygamer-ms9hn4c4.png';
import designAsset1 from '@/assets/.design-editor/froomergeicon-ms9kqaxv.png';
import designAsset3 from '@/assets/.design-editor/froogygamer-ms9ktk1c.png';
import designAsset4 from '@/assets/.design-editor/froogygamer-ms9ku1rg.png';
import designAsset5 from '@/assets/.design-editor/froogames-bg-ms9lhkkc.svg';
import designAsset6 from '@/assets/.design-editor/chatgpt-image-aug-1-2026-01-04-04-am-4-ms9liijq.png';

const MAX_TRIES = 3;
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const TRIES_KEY = 'frooGamesTriesLeft';
const COOLDOWN_KEY = 'frooGamesCooldownEndsAt';

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface GameReward {
  id: number;
  date: string;
  score: string;
  reward: string;
  type: string;
  game: string;
}

interface Confetto {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
}

function readHighScores(): Record<string, number> {
  return Object.fromEntries(GAMES.map((game) => [game.id, Number(localStorage.getItem(game.highScoreKey)) || 0]));
}

export function PersonalGameOverlay({ onClose, onShowRewards }: { onClose: () => void, onShowRewards: () => void }) {
  const { setCurrentPoints } = useAppContext();
  const overlayRef = React.useRef<HTMLDivElement>(null);
  const { dragControls, startVerticalDrag, finishVerticalDrag } = useVerticalDismissDrag(onClose);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const [rewards, setRewards] = React.useState<GameReward[]>([
    { id: 1, date: 'Today, 10:42 AM', score: '4,250', reward: '+42 pts', type: 'High Score Bonus', game: 'Store Breaker' },
    { id: 2, date: 'Yesterday, 04:15 PM', score: '3,800', reward: '+38 pts', type: 'Session Completion', game: 'Store Breaker' },
    { id: 3, date: 'Mon, 09:20 AM', score: '4,100', reward: '+41 pts', type: 'Session Completion', game: 'Store Breaker' },
  ]);

  const [confetti, setConfetti] = React.useState<Confetto[]>([]);
  const [activeGame, setActiveGame] = React.useState<GameDefinition | null>(null);
  const [highScores, setHighScores] = React.useState<Record<string, number>>(() => readHighScores());

  const [triesLeft, setTriesLeft] = React.useState(() => {
    const stored = localStorage.getItem(TRIES_KEY);
    return stored !== null ? Number(stored) : MAX_TRIES;
  });
  const [cooldownEndsAt, setCooldownEndsAt] = React.useState<number | null>(() => {
    const stored = localStorage.getItem(COOLDOWN_KEY);
    return stored !== null ? Number(stored) : null;
  });
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (cooldownEndsAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownEndsAt]);

  React.useEffect(() => {
    localStorage.setItem(TRIES_KEY, String(triesLeft));
  }, [triesLeft]);

  React.useEffect(() => {
    if (cooldownEndsAt === null) localStorage.removeItem(COOLDOWN_KEY);
    else localStorage.setItem(COOLDOWN_KEY, String(cooldownEndsAt));
  }, [cooldownEndsAt]);

  React.useEffect(() => {
    if (cooldownEndsAt !== null && now >= cooldownEndsAt) {
      setTriesLeft(MAX_TRIES);
      setCooldownEndsAt(null);
    }
  }, [now, cooldownEndsAt]);

  React.useEffect(() => {
    const overlay = overlayRef.current;
    const scrollEl = scrollRef.current;
    if (!overlay || !scrollEl) return;

    const updateMascotOffset = () => {
      overlay.style.setProperty('--froo-games-scroll-y', `${scrollEl.scrollTop}px`);
    };

    updateMascotOffset();
    scrollEl.addEventListener('scroll', updateMascotOffset, { passive: true });
    return () => scrollEl.removeEventListener('scroll', updateMascotOffset);
  }, []);

  const isCoolingDown = cooldownEndsAt !== null && now < cooldownEndsAt;
  const cooldownRemainingMs = cooldownEndsAt !== null ? Math.max(0, cooldownEndsAt - now) : 0;
  const canPlay = !isCoolingDown && triesLeft > 0;

  const launchConfetti = () => {
    const colors = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#facc15', '#fbbf24'];

    const newConfetti = Array.from({length: 30}).map((_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * 60, // percentage width
      y: -10, // start above screen
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 1,
      delay: Math.random() * 0.5
    }));

    setConfetti(newConfetti);

    setTimeout(() => {
      setConfetti([]);
    }, 4000);
  };

  const handleGameOver = (game: GameDefinition, result: GameResult) => {
    if (result.isNewHighScore) {
      launchConfetti();
      setHighScores(prev => ({ ...prev, [game.id]: result.highScore }));
    }

    const points = Math.max(1, Math.round(result.score / 10));
    setCurrentPoints(prev => prev + points);

    const newReward: GameReward = {
      id: Date.now(),
      date: 'Just now',
      score: result.score.toLocaleString(),
      reward: `+${points} pts`,
      type: result.isNewHighScore ? 'New High Score!' : 'Session Completion',
      game: game.title,
    };

    setRewards(prev => [newReward, ...prev].slice(0, 10));

    setTriesLeft(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setCooldownEndsAt(Date.now() + COOLDOWN_MS);
        return 0;
      }
      return next;
    });
  };

  const bestScore = Math.max(0, ...Object.values(highScores));

  return (
    <motion.div
      ref={overlayRef}
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
      className="absolute inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden text-slate-900"
    >
      {/* Confetti Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <AnimatePresence>
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              initial={{ top: '-10%', left: `${c.x}%`, rotate: 0, scale: c.scale, opacity: 1 }}
              animate={{
                top: '110%',
                left: `${c.x + (Math.random() - 0.5) * 20}%`,
                rotate: c.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
                opacity: [1, 1, 0]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5 + Math.random(), delay: c.delay, ease: "linear" }}
              className="absolute"
              style={{ color: c.color }}
            >
              <Leaf className="w-6 h-6 fill-current" />
            </motion.div>
          ))}
        </AnimatePresence>

        
      
        
      </div>

      <motion.img
        src={designAsset4}
        alt="Froo gamer mascot"
        initial={{
          opacity: 1,
          transform: shouldReduceMotion ? 'translateY(0px)' : 'translateY(-72px)',
        }}
        animate={{
          opacity: 1,
          transform: 'translateY(0px)',
        }}
        transition={{
          delay: shouldReduceMotion ? 0 : 0.1,
          duration: shouldReduceMotion ? 0.12 : 0.22,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="z-[90] object-contain select-none drop-shadow-md absolute left-[37.1%] w-[42.6%] h-[24.1%] pointer-events-none will-change-transform"
        style={{ top: 'calc(6% - var(--froo-games-scroll-y, 0px))' }}
      />

      <div className="px-6 pt-12 md:pt-8 pb-4 flex items-center justify-between shrink-0 relative z-20 bg-slate-50 border-b border-slate-100 touch-none" onPointerDown={startVerticalDrag}>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 w-[15.8%] shrink-0 h-[68.2%]">
            <img src={designAsset5} alt="froogames+bg" className="block h-full w-full object-contain pointer-events-none" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Froo Games</h2>
        </div>
        <button
          type="button"
          aria-label="Close Froo Games"
          data-design-mode-passthrough="true"
          onClick={onClose}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors border border-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar pb-safe hide-scrollbar relative z-10 bg-slate-50">
        {/* Game Picker */}
        <div className="px-6 pt-6 pb-2 opacity-[1.00] bg-[#ebf4ee]">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Play a Game</h3>
            {isCoolingDown ? (
              <div className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">
                <Timer className="w-3 h-3" /> {formatCountdown(cooldownRemainingMs)}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg">
                {triesLeft} {triesLeft === 1 ? 'try' : 'tries'} left
              </div>
            )}
          </div>
          <div className="space-y-3">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => canPlay && setActiveGame(game)}
                disabled={!canPlay}
                className="w-full bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm flex items-center gap-4 text-left hover:border-green-200 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <img
                    src={game.id === 'fruit-merge' ? designAsset1 : designAsset6}
                    alt={`${game.title} artwork`}
                    className="block h-full w-full object-contain pointer-events-none"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800">{game.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{game.tagline}</p>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1.5">
                    High Score {(highScores[game.id] ?? 0).toLocaleString()}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Stats & Weekly Rank */}
        <div className="px-6 space-y-4 pb-8 pt-4 relative bg-[#ebf4ee]">
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex flex-col justify-center items-center text-center shadow-sm">
                 <Trophy className="w-6 h-6 text-yellow-400 mb-2" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Best Score</p>
                 <p className="text-2xl font-black text-slate-800">{bestScore.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex flex-col justify-center items-center text-center shadow-sm">
                 <Flame className="w-6 h-6 text-orange-400 mb-2" />
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Rank</p>
                 <p className="text-2xl font-black text-slate-800">#12</p>
              </div>
           </div>

           {/* Leaderboard */}
           <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm mt-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-lg text-slate-800">Top Players</h4>
                <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg">
                  <Timer className="w-3 h-3" /> Ends in 2d
                </div>
              </div>
                      <div className="space-y-3">
                 {[
                   { rank: 1, name: 'Mike T.', score: '6,800', isMe: false },
                   { rank: 2, name: 'David N.', score: '5,920', isMe: true },
                   { rank: 3, name: 'Alex W.', score: '5,100', isMe: false },
                   { rank: 4, name: 'Jess K.', score: '4,850', isMe: false },
                 ].map((user, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border ${user.isMe ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'} transition-colors`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${user.rank === 1 ? 'bg-yellow-100 text-yellow-700' : user.rank === 2 ? 'bg-slate-200 text-slate-700' : user.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-500'}`}>
                            {user.rank}
                          </div>
                          <div>
                            <p className={`font-bold text-sm flex items-center gap-2 ${user.isMe ? 'text-green-900' : 'text-slate-700'}`}>
                              {user.name}
                              {user.isMe && <span className="text-[9px] bg-green-600 px-1.5 py-0.5 rounded text-white uppercase tracking-widest">You</span>}
                            </p>
                          </div>
                       </div>
                       <p className={`font-black ${user.isMe ? 'text-green-700' : 'text-slate-500'}`}>{user.score}</p>
                    </div>
                 ))}
              </div>
           </div>

           {/* Recent Rewards */}
           <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm mt-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-lg text-slate-800">Recent Rewards</h4>
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1.5 rounded-lg">
                  <Leaf className="w-3 h-3" /> Balance
                </div>
              </div>

              <div className="space-y-3">
                 <AnimatePresence>
                 {rewards.map((session, i) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, height: 0, scale: 0.9 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-col p-4 rounded-2xl border border-slate-100 bg-slate-50 transition-colors"
                    >
                       <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-sm text-slate-800">{session.type}</p>
                          <p className="font-black text-green-600 bg-green-100/50 px-2 py-0.5 rounded-md">{session.reward}</p>
                       </div>
                       <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-500">{session.game} &middot; {session.date}</p>
                          <p className="text-xs font-bold text-slate-400">Score: {session.score}</p>
                       </div>
                    </motion.div>
                 ))}
                 </AnimatePresence>
              </div>

              <button
                onClick={() => { onClose(); onShowRewards(); }}
                className="w-full mt-4 bg-green-50 text-green-700 rounded-xl py-3 font-bold text-sm hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
              >
                View Full Balance
              </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {activeGame && (
          <GameSessionOverlay
            game={activeGame}
            onExit={() => setActiveGame(null)}
            onGameOver={(result) => handleGameOver(activeGame, result)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
