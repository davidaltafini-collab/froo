# Comprehensive React Native Migration Guide: FreshRewards App

This document provides a **100% exhaustive blueprint** for migrating the FreshRewards React/Vite (web) application to React Native (Expo). The goal is zero loss of feature parity, aesthetic design, or animation fluidity.

## 1. Core Architecture & Dependency Mapping

| Web Technology (Current) | React Native / Expo Equivalent (Target) | Notes |
|---|---|---|
| React (Web DOM) | React Native (Expo) | Use Expo SDK for out-of-the-box hardware access. |
| Tailwind CSS | NativeWind (`nativewind`) | Reuses existing Tailwind classes (e.g., `flex`, `pt-4`, `bg-slate-50`). |
| `framer-motion` | `react-native-reanimated` | Replace `<motion.div>` with `<Animated.View>`. Use Reanimated for `layoutId` (Shared Element Transitions) and `AnimatePresence` (Entering/Exiting animations). |
| `lucide-react` | `lucide-react-native` | Direct swap. Use `color` and `size` props instead of `className`. |
| `<video>` / Scanner | `expo-camera` | For barcode/QR scanning. |
| `window.DeviceOrientationEvent`| `expo-sensors` (DeviceMotion) | For the 3D tilt effect on the loyalty card. |
| CSS `backdrop-filter` | `expo-blur` | Replace all `backdrop-blur-sm` with `<BlurView intensity={50} tint="light">`. |
| CSS Gradients | `expo-linear-gradient` | Replace `bg-gradient-to-r` with `<LinearGradient>`. |
| HTML `<img>` | `expo-image` or `<Image>` | Must handle remote URLs properly without web-specific CORS issues. |

## 2. Navigation Structure

Currently, the web app uses manual state (`activeTab`, `showQR`, `showRewards`, etc.) and absolute positioning. 
In React Native, this **must** be refactored into a proper navigation tree using `@react-navigation/native`.

### Recommended Navigation Tree:
- **RootStack** (Stack Navigator - `presentation: 'modal'`)
  - **MainTabs** (Bottom Tab Navigator)
    - Dashboard (`DashboardView`)
    - Offers (`CouponsView`)
    - List (`ListView`)
    - Stores (`StoresView`)
  - **Overlays / Modals** (Rendered over the tabs)
    - `ProfileOverlay`
    - `NotificationsOverlay`
    - `ScannerOverlay`
    - `RewardsOverlay`
    - `ActivePromotionOverlay`
    - `PersonalGameOverlay`
    - `CatalogueOverlay` (from List view)
    - `QtyPickerOverlay` (from List view)
    - `ShareOverlay` (from List view)

## 3. View-by-View Migration Blueprint

### 3.1 Dashboard (`DashboardView`)
- **Loyalty Card (3D Tilt)**: Map `expo-sensors` accelerometer data to `useAnimatedStyle` in Reanimated to tilt the card on the X/Y axes. 
- **Floating Active Rewards**: Convert the absolute positioned bottom pill into a React Native absolute `<View>` constrained by `useSafeAreaInsets` so it sits right above the bottom tab bar.
- **Daily Streak**: Standard flex layout. Replace `setTimeout` sequences with Reanimated `withDelay` and `withSequence` for the point claim animation.

### 3.2 Offers & Rewards (`CouponsView`)
- **Horizontal Filters**: `<div className="overflow-x-auto">` becomes `<ScrollView horizontal showsHorizontalScrollIndicator={false}>`.
- **Coupon Expansion**: The `<AnimatePresence>` modal using `layoutId` should be replicated using React Navigation's Shared Element Transition or a custom Reanimated layout transition.

### 3.3 Shopping List (`ListView`)
- **Swipe-to-Delete / Check**: Currently uses standard clicks. In React Native, upgrade this to actual swipeable rows using `react-native-gesture-handler` (Swipeable) for a native feel.
- **Custom `IOSWheelPicker`**: The web app implements a custom CSS scroll-snap wheel picker. In React Native, discard the custom CSS and use `@react-native-picker/picker` or a dedicated RN wheel picker library for native iOS/Android picker interactions.
- **Global Click to Close**: In the web, clicking outside a menu closes it via `document.addEventListener`. In RN, wrap the background in a `<TouchableWithoutFeedback onPress={close}>`.

### 3.4 Stores (`StoresView`)
- **Map View**: Currently a static gray placeholder (`bg-slate-200`). Upgrade this to `react-native-maps` to show actual native Apple Maps / Google Maps.
- **Store List**: Standard `<ScrollView>` or `<FlatList>`.

## 4. Specific Component Behaviors & Animations

### Number Counting Animation (Points)
- **Web**: Uses `requestAnimationFrame` manually.
- **RN**: Use Reanimated's `withTiming` on a `useSharedValue`, combined with a `useAnimatedText` component to tick the numbers up smoothly without triggering React re-renders.

### Floating Confetti / Particles (+15 pts)
- **Web**: Array of items mapped to framer-motion elements flying upwards.
- **RN**: Use `react-native-reanimated` to translate absolute `<Animated.View>` elements upwards, or integrate `react-native-confetti-cannon` for the heavy lifting.

### Gradients and SVGs
- React Native doesn't support Tailwind gradient classes perfectly on views. You **must** wrap gradient elements in `<LinearGradient colors={['#color1', '#color2']} />`.

### Shadows & Elevation
- Tailwind shadows (`shadow-sm`, `shadow-lg`, glowing shadows) do not translate 1-to-1 to Android. 
- Use standard iOS `shadowColor`, `shadowOffset`, `shadowOpacity` for iOS.
- Use `elevation` for Android. For glowing colored shadows, you may need to use an absolute positioned blurred `<View>` behind the element.

## 5. State Management & Data
- The web app relies on a massive `App.tsx` state tree passed down via props. 
- **Action**: When migrating to React Navigation, prop-drilling becomes difficult across screens. You **MUST** migrate the core state (`currentPoints`, `redeemedItems`, `notifications`, `shoppingList`) into a global state manager like **Zustand** or **React Context**.

## 6. Hardware & Permissions (Crucial for RN)
- **Camera (Scanner)**: You must configure `Info.plist` (iOS) and `AndroidManifest.xml` (Android) with camera usage descriptions. Expo handles this via the `app.json` plugins.
- **Sensors (Gyroscope for Card)**: No specific runtime permissions required on iOS/Android, but ensure `expo-sensors` is properly linked.

## Summary Checklist for the Migrating AI:
1. [ ] Setup Expo + NativeWind + React Navigation.
2. [ ] Migrate all Global State to Zustand.
3. [ ] Build the Bottom Tab Navigator (Dashboard, Offers, List, Stores).
4. [ ] Build the Overlays as Modals in a Stack Navigator.
5. [ ] Replace all DOM elements (`div`, `span`, `img`, `p`) with Native elements (`View`, `Text`, `Image`).
6. [ ] Swap `backdrop-blur-sm` for `<BlurView>`.
7. [ ] Swap `bg-gradient-*` for `<LinearGradient>`.
8. [ ] Replace `framer-motion` with `react-native-reanimated`.
9. [ ] Replace HTML5 `<video>` with `expo-camera`.
10. [ ] Refactor the Custom Web Wheel Picker to a Native Picker.
