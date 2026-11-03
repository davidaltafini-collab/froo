import React from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text as BaseText } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import Animated from 'react-native-reanimated';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { QrCode, Share2, X } from 'lucide-react-native';
import { AppPressable } from '../AppPressable';
import { BackdropBlur } from '../BackdropBlur';
import { useSwipeDownSurface } from '../useSwipeDownSurface';
import { SheetGrabber } from '../SheetGrabber';
import { elevation } from '../../theme/elevation';
interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  avatar: string;
}

const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 1, name: 'Sarah', relation: 'Wife', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&q=80&fit=crop' },
  { id: 2, name: 'Mike', relation: 'Brother', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&q=80&fit=crop' },
  { id: 3, name: 'Emma', relation: 'Daughter', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&q=80&fit=crop' },
];

function Text({ style, ...props }: React.ComponentProps<typeof BaseText>) {
  return <BaseText {...props} style={[style, { fontFamily: 'sans-serif' }]} />;
}

export function ShareOverlay({ onClose }: { onClose: () => void }) {
  const { width } = useWindowDimensions();
  const s = width / 425;
  const [sharedWith, setSharedWith] = React.useState<number | null>(null);
  const sheetHeight = 643 * s;
  const {
    requestClose,
    dragGesture,
    surfaceAnimatedStyle,
    backdropAnimatedStyle,
  } = useSwipeDownSurface({ closedOffset: sheetHeight, onClosed: onClose });

  return (
    <Modal transparent visible onRequestClose={requestClose} animationType="none" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, backdropAnimatedStyle]}
        >
          <BackdropBlur />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.6)' }]} />
        </Animated.View>
        <AppPressable onPress={requestClose} style={StyleSheet.absoluteFill} />
        {/* The whole sheet drags down to dismiss, not just the grabber. */}
        <GestureDetector gesture={dragGesture}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: 0,
              bottom: 0,
              left: 0,
              // 609px visible web sheet + the documented lower native crop, adjusted for the
              // transparent modal's navigation-region boundary.
              height: sheetHeight,
              padding: 24 * s,
              paddingBottom: 40 * s,
              borderTopLeftRadius: 32 * s,
              borderTopRightRadius: 32 * s,
              backgroundColor: '#ffffff',
              boxShadow: '0 25px 50px -12px rgba(15,23,42,0.25)',
            },
            surfaceAnimatedStyle,
          ]}
        >
          <View style={{ marginHorizontal: -24 * s, paddingHorizontal: 24 * s, paddingBottom: 12 * s }}>
              <View style={{ marginBottom: 5 * s, alignSelf: 'center' }}>
                <SheetGrabber scale={s} />
              </View>
            </View>

          <View className="flex-row items-center justify-between" style={{ marginBottom: 24 * s }}>
            <Text
              className="font-bold text-slate-900"
              style={{ fontSize: 24 * s, lineHeight: 32 * s, letterSpacing: -0.6 * s }}
            >
              Share List
            </Text>
            <AppPressable
              onPress={requestClose}
              className="bg-slate-100 items-center justify-center"
              style={{ width: 40 * s, height: 40 * s, borderRadius: 20 * s }}
            >
              <X size={20 * s} color="#64748b" />
            </AppPressable>
          </View>

          <Text
            className="font-bold text-slate-400 uppercase"
            style={{ marginBottom: 16 * s, fontSize: 14 * s, lineHeight: 20 * s, letterSpacing: 1.4 * s }}
          >
            Family Members
          </Text>
          <View style={{ gap: 12 * s, marginBottom: 32 * s }}>
            {FAMILY_MEMBERS.map((member) => {
              const isShared = sharedWith === member.id;
              return (
                <View
                  key={member.id}
                  className="flex-row items-center justify-between bg-slate-50"
                  style={[elevation.card, { padding: 12 * s, borderRadius: 16 * s,  }]}
                >
                  <View className="flex-row items-center" style={{ gap: 12 * s }}>
                    <ExpoImage
                      source={{ uri: member.avatar }}
                      style={{ width: 40 * s, height: 40 * s, borderRadius: 20 * s }}
                      contentFit="cover"
                    />
                    <View>
                      <Text className="font-bold text-slate-800" style={{ fontSize: 14 * s, lineHeight: 20 * s }}>
                        {member.name}
                      </Text>
                      <Text className="font-bold text-slate-400" style={{ fontSize: 12 * s, lineHeight: 16 * s }}>
                        {member.relation}
                      </Text>
                    </View>
                  </View>
                  <AppPressable
                    onPress={() => setSharedWith(member.id)}

                    style={[elevation.card, {
                      paddingHorizontal: 16 * s,
                      paddingVertical: 8 * s,
                      borderRadius: 12 * s,
                      backgroundColor: isShared ? '#dcfce7' : '#ffffff',
                    }]}
                  >
                    <Text
                      className="font-bold uppercase"
                      style={{
                        color: isShared ? '#15803d' : '#475569',
                        fontSize: 12 * s,
                        lineHeight: 16 * s,
                        letterSpacing: 0.6 * s,
                      }}
                    >
                      {isShared ? 'Shared' : 'Share'}
                    </Text>
                  </AppPressable>
                </View>
              );
            })}
          </View>

          <Text
            className="font-bold text-slate-400 uppercase"
            style={{ marginBottom: 16 * s, fontSize: 14 * s, lineHeight: 20 * s, letterSpacing: 1.4 * s }}
          >
            Other Ways
          </Text>
          <View className="flex-row" style={{ gap: 16 * s, marginBottom: 16 * s }}>
            <AppPressable
              className="flex-1 bg-slate-50 items-center justify-center"
              style={[elevation.card, { padding: 16 * s, borderRadius: 16 * s, gap: 12 * s }]}
            >
              <View
                className="bg-white items-center justify-center"
                style={[elevation.card, { width: 48 * s, height: 48 * s, borderRadius: 24 * s }]}
              >
                <Share2 size={20 * s} color="#475569" />
              </View>
              <Text className="font-bold text-slate-600" style={{ fontSize: 12 * s, lineHeight: 16 * s }}>
                WhatsApp
              </Text>
            </AppPressable>
            <AppPressable
              className="flex-1 bg-slate-50 items-center justify-center"
              style={[elevation.card, { padding: 16 * s, borderRadius: 16 * s, gap: 12 * s }]}
            >
              <View
                className="bg-white items-center justify-center"
                style={[elevation.card, { width: 48 * s, height: 48 * s, borderRadius: 24 * s }]}
              >
                <QrCode size={20 * s} color="#475569" />
              </View>
              <Text className="font-bold text-slate-600" style={{ fontSize: 12 * s, lineHeight: 16 * s }}>
                QR Code
              </Text>
            </AppPressable>
          </View>
        </Animated.View>
        </GestureDetector>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
