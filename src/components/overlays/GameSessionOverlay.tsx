import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { GameDefinition, GameResult } from '../games/types';
import designAsset1 from '@/assets/.design-editor/froomergeicon-msa6c6ax.png';
import designAsset2 from '@/assets/.design-editor/chatgpt-image-aug-1-2026-01-04-04-am-4-msa8x9rm.png';
import designAsset3 from '@/assets/.design-editor/froomergeicon-msa8xx8x.png';

interface GameSessionOverlayProps {
  game: GameDefinition;
  onExit: () => void;
  onGameOver: (result: GameResult) => void;
}

export function GameSessionOverlay({ game, onExit, onGameOver }: GameSessionOverlayProps) {
  const GameComponent = game.Component;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-white z-[60] flex flex-col"
    >
      <div className="flex items-center justify-between px-5 pt-12 md:pt-6 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <img src={designAsset3} alt="froomergeicon" className="text-green-600 block object-contain w-[14.4%] shrink-0 h-[9.4%]" />
          <h2 className="font-bold text-slate-800 text-sm">{game.title}</h2>
        </div>
        <button
          onClick={onExit}
          className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors border border-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-8">
        <GameComponent onGameOver={onGameOver} />
      </div>
    </motion.div>
  );
}
