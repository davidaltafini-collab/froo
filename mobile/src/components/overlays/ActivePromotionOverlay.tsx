import React from 'react';
import { Modal, ScrollView, useWindowDimensions, View } from 'react-native';
import { Text } from '../Text';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from '../LinearGradient';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { QrCode, Timer, X } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { AppPressable } from '../AppPressable';
import { imageSource, isCutout } from '../../theme/image';

export function ActivePromotionOverlay({ onClose }: { onClose: () => void }) {
  const { width: windowWidth } = useWindowDimensions();
  const designScale = windowWidth / 425;
  const { activePromotionItem: item, redeemedItems } = useAppContext();
  const expiryTime = item ? redeemedItems[item.name]?.expiry || 0 : 0;

  const [timeLeft, setTimeLeft] = React.useState(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
  const [showQR, setShowQR] = React.useState(false);
  const code = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

  React.useEffect(() => {
    const int = setInterval(() => {
      setTimeLeft(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(int);
  }, [expiryTime]);

  if (!item) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOut}
        style={{
          flex: 1,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#f1f5f9',
          borderRadius: 28 * designScale,
          backgroundColor: '#ffffff',
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 * designScale }}
          showsVerticalScrollIndicator={false}
        >
      <View
        className="relative"
        style={{ height: 288 * designScale, backgroundColor: isCutout(item.image) ? '#fbf3e8' : '#f1f5f9' }}
      >
        <ExpoImage
          source={imageSource(item.image)}
          style={{ width: '100%', height: '100%', transform: isCutout(item.image) ? [{ scale: 0.78 }, { translateY: -12 * designScale }] : undefined }}
          contentFit={isCutout(item.image) ? 'contain' : 'cover'}
        />
        <LinearGradient colors={['transparent', 'rgba(255,255,255,0.2)', 'white']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="absolute inset-0" />
        <AppPressable
          onPress={onClose}
          className="absolute bg-white/50 items-center justify-center border border-white/40"
          style={{
            top: 48 * designScale,
            right: 24 * designScale,
            width: 40 * designScale,
            height: 40 * designScale,
            borderRadius: 20 * designScale,
          }}
        >
          <X size={20 * designScale} color="#1e293b" />
        </AppPressable>
      </View>

      <View
        className="items-center"
        style={{ paddingHorizontal: 24 * designScale, marginTop: -32 * designScale }}
      >
        <Text
          className="font-black text-slate-900 text-center"
          style={{
            marginBottom: 8 * designScale,
            fontSize: 30 * designScale,
            lineHeight: 36 * designScale,
            letterSpacing: -0.75 * designScale,
          }}
        >
          {item.name}
        </Text>
        <Text
          className="font-bold text-slate-500"
          style={{
            marginBottom: 32 * designScale,
            fontSize: 14 * designScale,
            lineHeight: 20 * designScale,
          }}
        >
          Valid at participating locations.
        </Text>

        {!showQR ? (
          <View
            className="bg-slate-50 border border-slate-100 items-center shadow-sm w-full"
            style={{ borderRadius: 32 * designScale, padding: 32 * designScale }}
          >
            <View
              className="bg-[#ffe2e2] items-center justify-center"
              style={{
                width: 64 * designScale,
                height: 64 * designScale,
                borderRadius: 32 * designScale,
                marginBottom: 16 * designScale,
              }}
            >
              <Timer size={32 * designScale} color="#e7000b" />
            </View>
            <Text
              className="font-bold uppercase text-slate-400"
              style={{
                marginBottom: 8 * designScale,
                fontSize: 12 * designScale,
                lineHeight: 16 * designScale,
                letterSpacing: 1.2 * designScale,
              }}
            >
              Expires in
            </Text>
            <Text
              className="font-black text-slate-800"
              style={{
                marginBottom: 32 * designScale,
                fontSize: 60 * designScale,
                lineHeight: 60 * designScale,
                letterSpacing: -3 * designScale,
              }}
            >
              {timeString}
            </Text>

            <AppPressable
              onPress={() => setShowQR(true)}
              className="w-full bg-[#e7000b] items-center"
              style={{
                borderRadius: 16 * designScale,
                paddingVertical: 16 * designScale,
                boxShadow: `0 ${4 * designScale}px 0 rgb(185,28,28)`,
              }}
            >
              <Text
                className="text-white font-black uppercase"
                style={{
                  fontSize: 18 * designScale,
                  lineHeight: 28 * designScale,
                  letterSpacing: 0.45 * designScale,
                }}
              >
                Scan at Cash Register
              </Text>
            </AppPressable>
          </View>
        ) : (
          <View
            className="bg-white border border-slate-200 items-center shadow-lg w-full"
            style={{ borderRadius: 32 * designScale, padding: 32 * designScale }}
          >
            <Text
              className="font-bold text-slate-500 uppercase"
              style={{
                marginBottom: 24 * designScale,
                fontSize: 14 * designScale,
                lineHeight: 20 * designScale,
                letterSpacing: 1.4 * designScale,
              }}
            >
              Show this code to cashier
            </Text>
            <View
              className="bg-white border-slate-900"
              style={{
                padding: 16 * designScale,
                borderWidth: 4 * designScale,
                borderRadius: 24 * designScale,
                marginBottom: 24 * designScale,
              }}
            >
              <QrCode size={192 * designScale} color="#0f172a" />
            </View>
            <View
              className="bg-slate-50"
              style={{
                paddingHorizontal: 24 * designScale,
                paddingVertical: 12 * designScale,
                borderRadius: 16 * designScale,
              }}
            >
              <Text
                className="font-black text-slate-800"
                style={{
                  fontSize: 36 * designScale,
                  lineHeight: 40 * designScale,
                  letterSpacing: 3.6 * designScale,
                }}
              >
                {code}
              </Text>
            </View>
          </View>
        )}
      </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
