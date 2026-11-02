import React from 'react';
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import Animated, {
  FadeIn,
  FadeOut,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight, Flame, Gift, Leaf, Timer, Trophy, X } from 'lucide-react-native';
import { GAMES } from '../games/registry';
import type { GameDefinition, GameResult } from '../games/types';
import { GameSessionOverlay } from './GameSessionOverlay';
import { ExtractionOverlay } from './ExtractionOverlay';
import { useAppContext } from '../../context/AppContext';
import { EXTRACTION_THRESHOLD } from '../../data/extractionPrizes';
import { AppPressable } from '../AppPressable';
import { LinearGradient } from '../LinearGradient';
import mascotGamesImg from '../../../assets/brand/mascot-games-float.png';
import GamesHeaderIcon from '../../../assets/brand/games-header-icon.svg';
import iconFruitMerge from '../../../assets/brand/icon-fruit-merge.png';
import iconBrickBreaker from '../../../assets/brand/icon-brick-breaker.png';
import { useSwipeDownSurface } from '../useSwipeDownSurface';

const MAX_TRIES = 3;
const COOLDOWN_MS = 30 * 60 * 1000;
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
  startX: number;
  endX: number;
  color: string;
  rotation: number;
  scale: number;
  delay: number;
  duration: number;
}

function FallingLeaf({ confetto, width, height }: { confetto: Confetto; width: number; height: number }) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withDelay(confetto.delay, withTiming(1, { duration: confetto.duration, easing: Easing.linear }));
  }, [confetto.delay, confetto.duration, progress]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    top: -height * 0.1,
    left: `${confetto.startX}%`,
    opacity: interpolate(progress.value, [0, 0.66, 1], [1, 1, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, ((confetto.endX - confetto.startX) / 100) * width]) },
      { translateY: interpolate(progress.value, [0, 1], [0, height * 1.2]) },
      { rotate: `${interpolate(progress.value, [0, 1], [0, confetto.rotation])}deg` },
      { scale: confetto.scale },
    ],
  }));

  return (
    <Animated.View pointerEvents="none" style={style}>
      <Leaf size={24} color={confetto.color} fill={confetto.color} />
    </Animated.View>
  );
}

async function readHighScores(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    GAMES.map(async (game) => [game.id, Number(await AsyncStorage.getItem(game.highScoreKey)) || 0] as const),
  );
  return Object.fromEntries(entries);
}

export function PersonalGameOverlay({ onClose, onShowRewards }: { onClose: () => void; onShowRewards: () => void }) {
  const { registerGamePoints, gamePointsProgress, extractionsAvailable } = useAppContext();
  const { width, height } = useWindowDimensions();
  const shouldReduceMotion = useReducedMotion();
  const [showExtraction, setShowExtraction] = React.useState(false);
  const { requestClose, dragGesture, surfaceAnimatedStyle } = useSwipeDownSurface({
    closedOffset: height,
    onClosed: onClose,
    dismissDistanceRatio: 0.16,
  });

  const [rewards, setRewards] = React.useState<GameReward[]>([
    { id: 1, date: 'Today, 10:42 AM', score: '4,250', reward: '+42 pts', type: 'High Score Bonus', game: 'Store Breaker' },
    { id: 2, date: 'Yesterday, 04:15 PM', score: '3,800', reward: '+38 pts', type: 'Session Completion', game: 'Store Breaker' },
    { id: 3, date: 'Mon, 09:20 AM', score: '4,100', reward: '+41 pts', type: 'Session Completion', game: 'Store Breaker' },
  ]);

  const [activeGame, setActiveGame] = React.useState<GameDefinition | null>(null);
  const [confetti, setConfetti] = React.useState<Confetto[]>([]);
  const [highScores, setHighScores] = React.useState<Record<string, number>>({});
  const [triesLeft, setTriesLeft] = React.useState(MAX_TRIES);
  const [cooldownEndsAt, setCooldownEndsAt] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(() => Date.now());
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const [storedTries, storedCooldown, scores] = await Promise.all([
        AsyncStorage.getItem(TRIES_KEY),
        AsyncStorage.getItem(COOLDOWN_KEY),
        readHighScores(),
      ]);
      if (storedTries !== null) setTriesLeft(Number(storedTries));
      if (storedCooldown !== null) setCooldownEndsAt(Number(storedCooldown));
      setHighScores(scores);
      setHydrated(true);
    })();
  }, []);

  React.useEffect(() => {
    if (cooldownEndsAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cooldownEndsAt]);

  React.useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(TRIES_KEY, String(triesLeft));
  }, [triesLeft, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    if (cooldownEndsAt === null) AsyncStorage.removeItem(COOLDOWN_KEY);
    else AsyncStorage.setItem(COOLDOWN_KEY, String(cooldownEndsAt));
  }, [cooldownEndsAt, hydrated]);

  React.useEffect(() => {
    if (cooldownEndsAt !== null && now >= cooldownEndsAt) {
      setTriesLeft(MAX_TRIES);
      setCooldownEndsAt(null);
    }
  }, [now, cooldownEndsAt]);

  const isCoolingDown = cooldownEndsAt !== null && now < cooldownEndsAt;
  const cooldownRemainingMs = cooldownEndsAt !== null ? Math.max(0, cooldownEndsAt - now) : 0;
  const canPlay = !isCoolingDown && triesLeft > 0;

  const launchConfetti = () => {
    const colors = ['#4ade80', '#22c55e', '#16a34a', '#15803d', '#facc15', '#fbbf24'];
    const startedAt = Date.now();
    setConfetti(
      Array.from({ length: 30 }, (_, index) => {
        const startX = 20 + Math.random() * 60;
        return {
          id: startedAt + index,
          startX,
          endX: startX + (Math.random() - 0.5) * 20,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360 + 360 * (Math.random() > 0.5 ? 1 : -1),
          scale: 0.5 + Math.random(),
          delay: Math.random() * 500,
          duration: 2500 + Math.random() * 1000,
        };
      }),
    );
    setTimeout(() => setConfetti([]), 4000);
  };

  const handleGameOver = (game: GameDefinition, result: GameResult) => {
    if (result.isNewHighScore) {
      launchConfetti();
      setHighScores((prev) => ({ ...prev, [game.id]: result.highScore }));
      // The game keeps its own copy in the WebView's localStorage — that is what it draws
      // as "HI" on the canvas. Mirror it into AsyncStorage so the card below the game and
      // the Best Score tile still agree with it after this overlay is closed and reopened.
      AsyncStorage.setItem(game.highScoreKey, String(result.highScore));
    }

    const points = Math.max(1, Math.round(result.score / 10));
    registerGamePoints(points);

    const newReward: GameReward = {
      id: Date.now(),
      date: 'Just now',
      score: result.score.toLocaleString(),
      reward: `+${points} pts`,
      type: result.isNewHighScore ? 'New High Score!' : 'Session Completion',
      game: game.title,
    };

    setRewards((prev) => [newReward, ...prev].slice(0, 10));

    setTriesLeft((prev) => {
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
    <Modal transparent visible onRequestClose={requestClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#f1f5f9',
            borderRadius: 28,
            backgroundColor: '#f8fafc',
          },
          surfaceAnimatedStyle,
        ]}
      >
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, overflow: 'hidden' }}>
        {confetti.map((item) => <FallingLeaf key={item.id} confetto={item} width={width} height={height} />)}
      </View>
      <View style={{ position: 'relative' }}>
        <GestureDetector gesture={dragGesture}>
          <View className="px-6 pt-12 pb-4 flex-row items-center justify-between bg-slate-50 border-b border-slate-100">
            <View className="flex-row items-center gap-3">
              <View className="bg-white rounded-2xl items-center justify-center shadow-sm border border-slate-100" style={{ width: 53, height: 50 }}>
                <GamesHeaderIcon width="100%" height="100%" />
              </View>
              <Text className="text-lg font-bold text-slate-800">Froo Games</Text>
            </View>
            <AppPressable onPress={requestClose} className="w-10 h-10 bg-white rounded-full items-center justify-center border border-slate-100">
              <X size={20} color="#64748b" />
            </AppPressable>
          </View>
        </GestureDetector>
      </View>

      {/*
        Sized and positioned as a percentage of the full sheet (matching the web reference's
        `absolute left-[37.1%] w-[42.6%] h-[24.1%]` against its full-screen container), not the
        header's local box — a fixed pixel size was collapsing this to a tiny icon on real devices.
        zIndex stays well below GameSessionOverlay (60) and ExtractionOverlay (200) so it can never
        paint over an active game or prize-drop session.
      */}
      <Animated.View
        key="games-mascot"
        pointerEvents="none"
        // Plain fast fade rather than the delayed slide it had: the delay plus the decode of the
        // full-size PNG was what made the mascot show up noticeably after the rest of the sheet.
        entering={FadeIn.duration(shouldReduceMotion ? 0 : 140)}
        style={{
          position: 'absolute',
          zIndex: 15,
          top: height * 0.06,
          left: width * 0.371,
          width: width * 0.426,
          height: height * 0.241,
        }}
      >
        <ExpoImage
          pointerEvents="none"
          source={mascotGamesImg}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
          transition={0}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>

      <ScrollView className="flex-1 bg-[#ebf4ee]" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-6 pb-2">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">Play a Game</Text>
            {isCoolingDown ? (
              <View className="flex-row items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-lg">
                <Timer size={12} color="#ea580c" />
                <Text className="text-xs font-bold text-orange-600">{formatCountdown(cooldownRemainingMs)}</Text>
              </View>
            ) : (
              <View className="bg-green-50 px-2.5 py-1 rounded-lg">
                <Text className="text-xs font-bold text-green-600">{triesLeft} {triesLeft === 1 ? 'try' : 'tries'} left</Text>
              </View>
            )}
          </View>
          <View className="gap-3">
            {GAMES.map((game) => (
              <AppPressable
                key={game.id}
                onPress={() => canPlay && setActiveGame(game)}
                disabled={!canPlay}
                className="w-full bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm flex-row items-center gap-4"
                style={{ opacity: canPlay ? 1 : 0.5, minHeight: game.id === 'fruit-merge' ? 119 : 105 }}
              >
                <View className="w-14 h-14 bg-green-600 rounded-2xl items-center justify-center overflow-hidden">
                  <ExpoImage source={game.id === 'fruit-merge' ? iconFruitMerge : iconBrickBreaker} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-slate-800">{game.title}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5">{game.tagline}</Text>
                  <Text className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1.5">
                    High Score {(highScores[game.id] ?? 0).toLocaleString()}
                  </Text>
                </View>
                <ChevronRight size={20} color="#cbd5e1" />
              </AppPressable>
            ))}
          </View>
        </View>

        <View className="px-6" style={{ paddingTop: 4 }}>
          {extractionsAvailable > 0 ? (
            <AppPressable
              onPress={() => setShowExtraction(true)}
              className="rounded-[28px] p-5 flex-row items-center gap-4 shadow-sm relative overflow-hidden"
            >
              {/* Same loyalty-card gradient recipe, so the unlocked state reads as the same
                  brand family as the rest of the app instead of a generic dark UI kit card. */}
              <LinearGradient
                colors={['#00753f', '#005c32', '#00391f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(250,204,21,0.2)' }}>
                <Gift size={24} color="#facc15" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-white">Prize Drop ready!</Text>
                <Text className="text-xs text-white/60 mt-0.5">
                  {extractionsAvailable > 1 ? `${extractionsAvailable} drops waiting` : 'Open it for a free item or bonus points'}
                </Text>
              </View>
              <ChevronRight size={20} color="#facc15" />
            </AppPressable>
          ) : (
            <View className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Gift size={16} color="#94a3b8" />
                  <Text className="text-xs font-bold text-slate-500">Next Prize Drop</Text>
                </View>
                <Text className="text-xs font-bold text-slate-400">{gamePointsProgress}/{EXTRACTION_THRESHOLD} pts</Text>
              </View>
              <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${Math.min(100, (gamePointsProgress / EXTRACTION_THRESHOLD) * 100)}%` }}
                />
              </View>
            </View>
          )}
        </View>

        <View className="px-6 gap-4 pb-8 pt-4" style={{ paddingTop: 17 }}>
          <View className="flex-row gap-4">
            <View className="flex-1 bg-white rounded-[24px] p-5 border border-slate-100 items-center shadow-sm" style={{ minHeight: 126 }}>
              <Trophy size={24} color="#facc15" style={{ marginBottom: 8 }} />
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Best Score</Text>
              <Text className="text-2xl font-black text-slate-800">{bestScore.toLocaleString()}</Text>
            </View>
            <View className="flex-1 bg-white rounded-[24px] p-5 border border-slate-100 items-center shadow-sm" style={{ minHeight: 126 }}>
              <Flame size={24} color="#fb923c" style={{ marginBottom: 8 }} />
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Rank</Text>
              <Text className="text-2xl font-black text-slate-800">#12</Text>
            </View>
          </View>

          <View className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm mt-2">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-bold text-lg text-slate-800">Top Players</Text>
              <View className="flex-row items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg">
                <Timer size={12} color="#4f46e5" />
                <Text className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Ends in 2d</Text>
              </View>
            </View>
            <View className="gap-3">
              {[
                { rank: 1, name: 'Mike T.', score: '6,800', isMe: false },
                { rank: 2, name: 'Sarah J.', score: '5,920', isMe: true },
                { rank: 3, name: 'Alex W.', score: '5,100', isMe: false },
                { rank: 4, name: 'Jess K.', score: '4,850', isMe: false },
              ].map((user, i) => (
                <View key={i} className={`flex-row items-center justify-between p-4 rounded-2xl border ${user.isMe ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                  <View className="flex-row items-center gap-4">
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        user.rank === 1 ? 'bg-yellow-100' : user.rank === 2 ? 'bg-slate-200' : user.rank === 3 ? 'bg-orange-100' : 'bg-slate-200'
                      }`}
                    >
                      <Text
                        className={`font-black text-sm ${
                          user.rank === 1 ? 'text-yellow-700' : user.rank === 2 ? 'text-slate-700' : user.rank === 3 ? 'text-orange-700' : 'text-slate-500'
                        }`}
                      >
                        {user.rank}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className={`font-bold text-sm ${user.isMe ? 'text-green-900' : 'text-slate-700'}`}>{user.name}</Text>
                      {user.isMe && (
                        <View className="bg-green-600 px-1.5 py-0.5 rounded">
                          <Text className="text-[9px] text-white uppercase tracking-widest">You</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text className={`font-black ${user.isMe ? 'text-green-700' : 'text-slate-500'}`}>{user.score}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm mt-2">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="font-bold text-lg text-slate-800">Recent Rewards</Text>
              <View className="flex-row items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg">
                <Leaf size={12} color="#16a34a" />
                <Text className="text-xs font-bold text-green-600 uppercase tracking-widest">Balance</Text>
              </View>
            </View>

            <View className="gap-3">
              {rewards.map((session) => (
                <Animated.View key={session.id} entering={FadeIn} exiting={FadeOut} className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-bold text-sm text-slate-800">{session.type}</Text>
                    <Text className="font-black text-green-600 bg-green-100/50 px-2 py-0.5 rounded-md">{session.reward}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-medium text-slate-500">{session.game} · {session.date}</Text>
                    <Text className="text-xs font-bold text-slate-400">Score: {session.score}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>

            <AppPressable
              onPress={() => {
                requestClose();
                setTimeout(onShowRewards, 230);
              }}
              className="w-full mt-4 bg-green-50 rounded-xl py-3 items-center"
            >
              <Text className="text-green-700 font-bold text-sm">View Full Balance</Text>
            </AppPressable>
          </View>
        </View>
      </ScrollView>

      {activeGame && (
        <GameSessionOverlay
          game={activeGame}
          onExit={() => setActiveGame(null)}
          onGameOver={(result) => handleGameOver(activeGame, result)}
        />
      )}
      {showExtraction && <ExtractionOverlay onClose={() => setShowExtraction(false)} />}
      </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}
