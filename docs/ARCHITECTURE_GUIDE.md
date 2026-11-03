# FreshRewards App: Codebase Structure Guide

This guide is designed for developers or AI assistants working with the FreshRewards React application codebase. The initial monolithic `App.tsx` has been professionally refactored into a scalable, modular architecture.

## Overview

The application follows a standard component-driven React architecture, heavily utilizing `lucide-react` for iconography and `motion/react` for complex animations (such as the 3D tilting loyalty card and entry/exit transitions).

## Directory Structure

```text
/src
├── components/
│   ├── SharedUI.tsx     # Reusable, stateless UI components (Buttons, Nav items, Pickers)
│   └── Overlays.tsx     # All modal/overlay components (QR, Rewards, Profile, Game)
├── data/
│   └── mockData.ts      # Static data definitions (Offers, Transactions, Catalogue)
├── views/
│   ├── DashboardView.tsx    # Dashboard home screen
│   ├── CouponsView.tsx      # Offers screen
│   ├── ListView.tsx         # Shopping list screen
│   └── StoresView.tsx       # Stores locator screen
├── App.tsx              # Main entry point & global state provider
└── index.css            # Tailwind CSS entry point
```

### 1. `App.tsx` (The Shell)
Serves as the root state holder. It manages:
- `activeTab` (Navigation state: 'home', 'coupons', 'list', 'stores')
- State for controlling the visibility of various overlays (`showQR`, `isScanning`, `showProfile`, etc.)
- Global mock state (e.g., `currentPoints`, `redeemedItems`, `shoppingList`)
- The `<AnimatePresence>` wrappers for transitioning between views and rendering the bottom navigation bar.

### 2. `views/Views.tsx` (Main Screens)
Contains the primary tab views of the application, now modularized into separate files for maintainability:
- `DashboardView.tsx`: The home screen containing the 3D animated loyalty card, quick actions, promotional game entry, daily streak logic, and recent activity.
- `CouponsView.tsx`: The weekly offers and coupon catalog with horizontal scrolling filters.
- `ListView.tsx`: The shopping list feature with item management, swipe-to-delete behaviors, and integration with the catalogue overlay.
- `StoresView.tsx`: A map-based view for locating nearby stores.

### 3. `components/Overlays.tsx` (Modals & Popups)
All absolutely-positioned, z-index heavy overlays that sit on top of the main views.
- `RewardsOverlay`: The full-screen modal showing the user's points and available rewards for redemption.
- `ScannerOverlay`: The simulated barcode/QR scanner overlay.
- `ProfileOverlay`: The user settings and profile menu.
- `PersonalGameOverlay`: The "Store Runner" promotional modal.
- `ActivePromotionOverlay`: Displays details of an actively claimed reward.
- `NotificationsOverlay`: Activity feed and system notifications.
- `ShareOverlay` & `CatalogueOverlay` & `QtyPickerOverlay`: Helper overlays for the shopping list.

### 4. `components/SharedUI.tsx` (Common Elements)
Small, highly reusable UI components that do not hold complex global state.
- `ActionBtn`: The squircle buttons used in Quick Actions.
- `NavItem`: The bottom navigation icons.
- `IOSWheelPicker`: The custom CSS-based scroll snapping wheel used for quantity selection.
- `ProfileMenuRow`: Reusable rows for the profile settings menu.

### 5. `data/mockData.ts` (Constants)
Extracts large static arrays (`OFFERS`, `TRANSACTIONS`, `CATALOGUE_ITEMS`) out of the component files to reduce clutter. Note that `OFFERS` imports directly from `lucide-react` to attach icons to data items.

## State Management Pattern
Currently, state is managed via React `useState` at the `App.tsx` level and passed down via props (Prop Drilling). 
**Important Note for Refactoring:** If introducing React Navigation (e.g., during a React Native migration) or if the component tree deepens further, this state should be migrated to a global store like **Zustand** or **React Context** to avoid excessive prop drilling.

## Styling & Animations
- **Tailwind CSS**: Used exclusively for layout, spacing, typography, and colors.
- **Framer Motion**: Used for entering/exiting views (`AnimatePresence`) and spring physics (e.g., the 3D card tilt in `DashboardView`). When modifying these components, ensure `motion.div` is used instead of standard `div` elements.
