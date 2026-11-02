import React from 'react';
import { ScrollView, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { Text } from './Text';
import { LinearGradient } from './LinearGradient';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { AppPressable } from './AppPressable';

export function ActionBtn({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
  return (
    <AppPressable onPress={onClick} className="flex flex-col items-center gap-3 min-w-[72px]">
      <View className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 items-center justify-center">
        <Icon size={20} color="#94a3b8" />
      </View>
      <Text className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">{label}</Text>
    </AppPressable>
  );
}

export function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  scale = 1,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  scale?: number;
}) {
  return (
    <AppPressable
      onPress={onClick}
      className="items-center"
      style={{ minWidth: 64 * scale, gap: 6 * scale }}
    >
      <View
        className={active ? 'bg-green-50' : 'bg-transparent'}
        style={{ padding: 8 * scale, borderRadius: 12 * scale }}
      >
        <Icon size={20 * scale} color={active ? '#15803d' : '#94a3b8'} />
      </View>
      <Text
        className={`font-bold ${active ? 'text-green-700' : 'text-slate-400'}`}
        style={{ fontSize: 10 * scale, lineHeight: 15 * scale }}
      >
        {label}
      </Text>
    </AppPressable>
  );
}

const WHEEL_ITEM_HEIGHT = 44;
const WHEEL_VISIBLE_PADDING = 88;

export function IOSWheelPicker({
  value,
  onChange,
  min = 1,
  max = 99,
  scale = 1,
  fontFamily,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  scale?: number;
  fontFamily?: string;
}) {
  const scrollRef = React.useRef<ScrollView>(null);
  const items = React.useMemo(() => Array.from({ length: max - min + 1 }, (_, i) => min + i), [min, max]);
  const itemHeight = WHEEL_ITEM_HEIGHT * scale;
  const visiblePadding = WHEEL_VISIBLE_PADDING * scale;

  React.useEffect(() => {
    const targetTop = (value - min) * itemHeight;
    // Defer to let the ScrollView finish laying out before jumping to the initial value.
    const id = setTimeout(() => scrollRef.current?.scrollTo({ y: targetTop, animated: false }), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / itemHeight);
    const val = Math.min(max, Math.max(min, min + idx));
    if (val !== value) onChange(val);
  };

  return (
    <View className="relative w-full overflow-hidden" style={{ height: 220 * scale }}>
      {/* Central highlight pill */}
      <View
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-200/50 pointer-events-none z-10"
        style={{ width: 120 * scale, height: 44 * scale, borderRadius: 12 * scale }}
      />

      <ScrollView
        ref={scrollRef}
        onMomentumScrollEnd={handleMomentumEnd}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        contentContainerStyle={{ paddingTop: visiblePadding, paddingBottom: visiblePadding }}
      >
        {items.map((i) => (
          <View key={i} style={{ height: itemHeight }} className="items-center justify-center">
            <Text
              style={{
                color: value === i ? '#0f172a' : '#94a3b8',
                fontFamily,
                fontSize: 22 * scale,
                lineHeight: 28 * scale,
                fontWeight: value === i ? '600' : '400',
              }}
            >
              {i}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Fade masks replacing the web version's CSS mask-image */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
        className="absolute top-0 left-0 right-0 z-20"
        style={{ height: 70 * scale }}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
        className="absolute bottom-0 left-0 right-0 z-20"
        style={{ height: 70 * scale }}
      />
    </View>
  );
}

export function ProfileMenuRow({ icon: Icon, title, color, bg, onClick }: { icon: LucideIcon; title: string; color: string; bg: string; onClick?: () => void }) {
  return (
    <AppPressable onPress={onClick} className="w-full flex-row items-center justify-between p-4 rounded-3xl">
      <View className="flex-row items-center gap-4">
        <View className={`w-10 h-10 rounded-xl ${bg} items-center justify-center`}>
          <Icon size={20} color={color} />
        </View>
        <Text className="font-bold text-sm text-slate-700">{title}</Text>
      </View>
      <ChevronRight size={20} color="#94a3b8" />
    </AppPressable>
  );
}
