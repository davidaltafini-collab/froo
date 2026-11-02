import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { Check, Lock, X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { RedeemFlow } from './RedeemFlow';
import { AppPressable } from '../AppPressable';
import { useHardwareBack } from '../../hooks/useHardwareBack';
import type { RewardItem } from '../../types';
import { useSwipeDownSurface } from '../useSwipeDownSurface';

const TIERS = [1500, 3000, 4500, 6000];
const TIER_STICKY_HEADER_INDICES = TIERS.map((_, index) => index * 2);

const REWARDS: Record<number, RewardItem[]> = {
  1500: [
    { name: 'Fresh Bananas (1 lb)', cost: 1500, image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400&q=80' },
    { name: 'Organic Lemon', cost: 1500, image: 'https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=400&q=80' },
    { name: 'Spring Water', cost: 1500, image: 'https://images.unsplash.com/photo-1655079343782-f0fc4704753e?auto=format&fit=crop&q=80&w=400' },
    { name: 'Fresh Croissant', cost: 1500, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400' },
  ],
  3000: [
    { name: 'Avocado (2-Pack)', cost: 3000, image: 'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&q=80&w=400' },
    { name: 'Strawberry Box', cost: 3000, image: 'https://images.unsplash.com/photo-1467825487722-2a7c4cd62e75?auto=format&fit=crop&q=80&w=400' },
    { name: 'Oat Milk (1L)', cost: 3000, image: 'https://images.unsplash.com/photo-1578767361597-216ad9280b77?auto=format&fit=crop&q=80&w=400' },
    { name: 'Artisan Sourdough', cost: 3000, image: 'https://images.unsplash.com/photo-1765227036124-f90781f04dd8?auto=format&fit=crop&q=80&w=400' },
  ],
  4500: [
    { name: 'Organic Eggs', cost: 4500, image: 'https://images.unsplash.com/photo-1617440168937-c6497eaa8db5?auto=format&fit=crop&q=80&w=400' },
    { name: 'Cold Pressed Juice', cost: 4500, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
    { name: 'Ground Coffee', cost: 4500, image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=80&w=400' },
    { name: 'Mixed Nuts', cost: 4500, image: 'https://images.unsplash.com/photo-1657986020391-732179775c66?auto=format&fit=crop&q=80&w=400' },
  ],
  6000: [
    { name: 'Whole Chicken', cost: 6000, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80' },
    { name: 'Cheese Board', cost: 6000, image: 'https://images.unsplash.com/photo-1631379578550-7038263db699?w=400&q=80' },
    { name: 'Organic Olive Oil', cost: 6000, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
    { name: 'Acai Bowl', cost: 6000, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80' },
  ],
};

export function RewardsOverlay({ onClose }: { onClose: () => void }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const designScale = windowWidth / 425;
  const { currentPoints, setCurrentPoints, redeemedItems, setRedeemedItems, setActivePromotionItem } = useAppContext();
  const [displayPoints, setDisplayPoints] = React.useState(currentPoints);
  const displayPointsRef = React.useRef(currentPoints);
  const [activeRedeemItem, setActiveRedeemItem] = React.useState<RewardItem | null>(null);
  const balanceScale = useSharedValue(1);
  const {
    requestClose,
    dragGesture,
    surfaceAnimatedStyle,
  } = useSwipeDownSurface({ closedOffset: windowHeight, onClosed: onClose, dismissDistanceRatio: 0.16 });

  React.useEffect(() => {
    const start = displayPointsRef.current;
    if (start === currentPoints) return;

    balanceScale.value = withSequence(
      withTiming(start < currentPoints ? 0.95 : 1.05, { duration: 150 }),
      withTiming(1, { duration: 150 }),
    );

    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / 1000, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const next = Math.floor(start + (currentPoints - start) * eased);
      displayPointsRef.current = next;
      setDisplayPoints(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [balanceScale, currentPoints]);

  const balanceStyle = useAnimatedStyle(() => ({ transform: [{ scale: balanceScale.value }] }));

  const handleHardwareBack = React.useCallback(() => {
    if (activeRedeemItem) {
      setActiveRedeemItem(null);
      return true;
    }
    requestClose();
    return true;
  }, [activeRedeemItem, requestClose]);
  useHardwareBack(handleHardwareBack);

  const handleRedeem = (item: RewardItem) => {
    if (currentPoints < item.cost) return;
    setActiveRedeemItem(item);
  };

  const handleRedeemConfirm = () => {
    if (!activeRedeemItem) return;
    const item = activeRedeemItem;
    const expiry = Date.now() + 15 * 60 * 1000;
    setRedeemedItems((prev) => ({ ...prev, [item.name]: { item, expiry } }));
    setCurrentPoints((p) => p - item.cost);
    setActivePromotionItem(item);
    setActiveRedeemItem(null);
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 50,
          borderWidth: 1,
          borderColor: '#f1f5f9',
          borderRadius: 28 * designScale,
          overflow: 'hidden',
          backgroundColor: '#f8fafc',
        },
        surfaceAnimatedStyle,
      ]}
    >
      <GestureDetector gesture={dragGesture}>
        <View
          className="bg-white flex-row justify-between items-center"
          style={{
            paddingTop: 48 * designScale,
            paddingBottom: 8 * designScale,
            paddingHorizontal: 24 * designScale,
          }}
        >
          <Text
            className="font-bold text-slate-800"
            style={{
              fontSize: 16 * designScale,
              lineHeight: 24 * designScale,
              letterSpacing: 0.4 * designScale,
            }}
          >
            Rewards
          </Text>
          <AppPressable
            onPress={requestClose}
            className="bg-slate-50 items-center justify-center"
            style={{
              width: 40 * designScale,
              height: 40 * designScale,
              borderRadius: 20 * designScale,
            }}
          >
            <X size={20 * designScale} color="#64748b" />
          </AppPressable>
        </View>
      </GestureDetector>
      <View
        className="bg-white items-center border-b border-slate-100"
        style={{ paddingHorizontal: 24 * designScale, paddingVertical: 24 * designScale }}
      >
        <Text
          className="font-bold text-slate-400 uppercase"
          style={{
            marginBottom: 4 * designScale,
            fontSize: 10 * designScale,
            lineHeight: 15 * designScale,
            letterSpacing: 2 * designScale,
            transform: [{ scaleX: 0.955 }],
          }}
        >
          Total Balance
        </Text>
        <Animated.View
          style={[
            balanceStyle,
            { flexDirection: 'row', alignItems: 'baseline', gap: 4 * designScale },
          ]}
        >
          <Text
            className="font-black text-slate-900"
            style={{
              fontSize: 60 * designScale,
              lineHeight: 60 * designScale,
              letterSpacing: -3 * designScale,
              marginHorizontal: -11.15 * designScale,
              transform: [{ scaleX: 0.87 }],
            }}
          >
            {displayPoints.toLocaleString()}
          </Text>
          <Text
            className="font-bold text-slate-300"
            style={{ fontSize: 20 * designScale, lineHeight: 28 * designScale }}
          >
            pts
          </Text>
        </Animated.View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 66 * designScale }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={TIER_STICKY_HEADER_INDICES}
      >
        {TIERS.flatMap((tier) => [
            <View
              key={`${tier}-header`}
              className="bg-slate-50/95 border-b border-slate-100/50"
              style={{
                zIndex: 20,
                paddingHorizontal: 24 * designScale,
                paddingVertical: 16 * designScale,
                backgroundColor: 'rgba(248,250,252,0.95)',
              }}
            >
              <View className="flex-row justify-between items-end">
                <Text
                  className="font-black text-slate-800"
                  style={{
                    fontSize: 20 * designScale,
                    lineHeight: 28 * designScale,
                    letterSpacing: -0.5 * designScale,
                  }}
                >
                  {tier.toLocaleString()}{' '}
                  <Text
                    className="text-slate-400 font-bold"
                    style={{ fontSize: 14 * designScale, lineHeight: 20 * designScale }}
                  >
                    Pts
                  </Text>
                </Text>
                {currentPoints < tier && (
                  <Text
                    className="font-bold uppercase text-slate-400"
                    style={{
                      fontSize: 10 * designScale,
                      lineHeight: 15 * designScale,
                      letterSpacing: 1 * designScale,
                    }}
                  >
                    Locked
                  </Text>
                )}
              </View>
            </View>,

            <View
              key={`${tier}-content`}
              style={{
                paddingHorizontal: 16 * designScale,
                paddingVertical: 16 * designScale,
                gap: 12 * designScale,
                marginBottom: 8 * designScale,
              }}
            >
              {REWARDS[tier].map((item) => {
                const isLocked = currentPoints < item.cost;
                const missingPts = item.cost - currentPoints;
                const rewardState = redeemedItems[item.name];
                const expiry = rewardState?.expiry || 0;
                const isRedeemed = !!rewardState;
                const isActiveRedeemed = isRedeemed && expiry > Date.now();

                return (
                  <View
                    key={item.name}
                    className={`bg-white flex-row items-center border ${
                      isLocked && !isRedeemed ? 'border-slate-100' : isActiveRedeemed ? 'bg-green-50/30 border-green-200' : 'border-slate-200'
                    }`}
                    style={{
                      padding: 12 * designScale,
                      borderRadius: 24 * designScale,
                      gap: 16 * designScale,
                    }}
                  >
                    <View
                      className="bg-slate-100 relative"
                      style={{
                        width: 96 * designScale,
                        height: 96 * designScale,
                        borderRadius: 20 * designScale,
                        filter: isLocked && !isRedeemed ? [{ grayscale: 0.8 }] : undefined,
                      }}
                    >
                      <ExpoImage
                        source={{ uri: item.image }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 20 * designScale,
                          opacity: isLocked && !isRedeemed ? 0.7 : 1,
                        }}
                        contentFit="cover"
                      />
                      {isLocked && !isRedeemed && (
                        <View
                          className="absolute inset-0 bg-slate-900/20 items-center justify-center"
                          style={{ borderRadius: 20 * designScale }}
                        >
                          <Lock size={24 * designScale} color="white" />
                        </View>
                      )}
                      {isActiveRedeemed && (
                        <View
                          className="absolute bg-green-500 items-center justify-center border-2 border-white"
                          style={{
                            top: -8 * designScale,
                            right: -8 * designScale,
                            width: 32 * designScale,
                            height: 32 * designScale,
                            borderRadius: 16 * designScale,
                          }}
                        >
                          <Check size={16 * designScale} color="white" />
                        </View>
                      )}
                    </View>

                    <View
                      className="flex-1"
                      style={{ paddingVertical: 4 * designScale, paddingRight: 8 * designScale }}
                    >
                      <Text
                        className={`font-bold ${isLocked && !isRedeemed ? 'text-slate-600' : 'text-slate-900'}`}
                        style={{
                          marginBottom: 4 * designScale,
                          fontSize: 15 * designScale,
                          lineHeight: 20.625 * designScale,
                        }}
                      >
                        {item.name}
                      </Text>

                      {isRedeemed ? (
                        <View
                          className="flex-row items-center justify-between"
                          style={{ marginTop: 12 * designScale }}
                        >
                          <View
                            className="flex-row items-center bg-green-100 border border-green-200"
                            style={{
                              gap: 6 * designScale,
                              paddingHorizontal: 12 * designScale,
                              paddingVertical: 6 * designScale,
                              borderRadius: 12 * designScale,
                            }}
                          >
                            <Check size={12 * designScale} color="#15803d" />
                            <Text
                              className="font-black uppercase text-green-700"
                              style={{
                                fontSize: 10 * designScale,
                                lineHeight: 15 * designScale,
                                letterSpacing: 1 * designScale,
                              }}
                            >
                              Redeemed
                            </Text>
                          </View>
                          {isActiveRedeemed && (
                            <AppPressable
                              onPress={() => setActivePromotionItem(item)}
                              className="bg-green-600"
                              style={{
                                paddingHorizontal: 12 * designScale,
                                paddingVertical: 8 * designScale,
                                borderRadius: 12 * designScale,
                              }}
                            >
                              <Text
                                className="text-white font-bold uppercase"
                                style={{
                                  fontSize: 12 * designScale,
                                  lineHeight: 16 * designScale,
                                  letterSpacing: 0.6 * designScale,
                                }}
                              >
                                View QR
                              </Text>
                            </AppPressable>
                          )}
                        </View>
                      ) : isLocked ? (
                        <View
                          className="self-start bg-slate-50 border border-slate-100"
                          style={{
                            marginTop: 12 * designScale,
                            paddingHorizontal: 12 * designScale,
                            paddingVertical: 6 * designScale,
                            borderRadius: 12 * designScale,
                          }}
                        >
                          <Text
                            className="font-black text-slate-400 uppercase"
                            style={{
                              fontSize: 10 * designScale,
                              lineHeight: 15 * designScale,
                              letterSpacing: 1 * designScale,
                            }}
                          >
                            {missingPts.toLocaleString()} pts to unlock
                          </Text>
                        </View>
                      ) : (
                        <View
                          className="flex-row items-center justify-between"
                          style={{ marginTop: 12 * designScale }}
                        >
                          <Text
                            className="font-black text-green-600"
                            style={{ fontSize: 12 * designScale, lineHeight: 16 * designScale }}
                          >
                            {item.cost.toLocaleString()} pts
                          </Text>
                          <AppPressable
                            onPress={() => handleRedeem(item)}
                            className="bg-[#00a63e]"
                            style={{
                              paddingHorizontal: 16 * designScale,
                              paddingVertical: 8 * designScale,
                              borderRadius: 12 * designScale,
                            }}
                          >
                            <Text
                              className="text-white font-bold uppercase"
                              style={{
                                fontSize: 12 * designScale,
                                lineHeight: 16 * designScale,
                                letterSpacing: 0.6 * designScale,
                              }}
                            >
                              Redeem
                            </Text>
                          </AppPressable>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>,
        ])}
      </ScrollView>

      {activeRedeemItem && (
        <RedeemFlow item={activeRedeemItem} userPoints={currentPoints} onConfirm={handleRedeemConfirm} onCancel={() => setActiveRedeemItem(null)} />
      )}
    </Animated.View>
  );
}
