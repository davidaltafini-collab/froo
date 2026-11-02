# Froo React Native parity status

Last updated: 2026-08-02

## Current result

`mobile/` is a true Expo + React Native application. The app shell, four main surfaces,
all global overlays, gestures, and the two production mini-games have been ported or retained
behind deliberately isolated platform adapters. The application UI is not a Capacitor shell and
is not rendered in a full-app WebView.

The web app in `src/` remains the visual authority. The binding reference is localhost at
425 x 849 and DPR 1. Native acceptance now uses direct ADB screenshots and recordings from the
attached Samsung Galaxy A54 (SM-A546B), not React Native Web or Expo Web. The raw phone capture is
1080 x 2340 and is normalized by width without stretching. Surface 0, Dashboard, the complete
Rewards/redemption flow, Offers, and Shopping List are accepted on that physical device; Stores is
the next surface in the one-at-a-time sequence.

Shared vertical motion and overlay behavior were re-audited across those accepted surfaces on the
same Galaxy. Entrances now use a non-overshooting timing curve, downward drag dismissal is present,
sheet blur covers the full app including the header, and the promo pull zone respects the physical
safe top while excluding the notification target. The localhost source was updated to the same
interaction contract. Evidence is recorded in `motion-audit/SURFACE_RECORD.md`.

The metric below reports pixels whose difference exceeds 20 plus mean absolute error (MAE) on a
0-255 scale. Network bitmap decoding, blur implementation, and browser font rasterization can
raise the pixel count even when measured geometry is aligned, so every generated side-by-side
image remains part of review.

## Accepted physical-device matrix

| Surface/state | Changed pixels | MAE |
|---|---:|---:|
| Surface 0 shell | 2.07% | 2.04 |
| Dashboard initial | 11.30% | 10.26 |
| Dashboard claimed | 12.28% | 12.34 |
| Dashboard card held at matched point | 11.72% | 10.41 |
| Dashboard scrolled at measured 369px reference offset | 7.07% | 6.52 |
| Rewards initial | 11.40% | 10.71 |
| Rewards confirmation sheet | 5.85% | 7.32 |
| Rewards redeemed | 12.52% | 11.25 |
| Rewards scrolled at measured 691px reference offset | 10.20% | 9.28 |
| Rewards locked cards | 8.51% | 8.30 |
| Active promotion | 4.18% | 5.40 |
| Active promotion QR | 4.55% | 6.12 |
| Offers initial | 9.78% | 9.37 |
| Offers Fresh Produce filter | 7.49% | 7.25 |
| Offers coupon detail | 5.57% | 5.03 |
| Offers scrolled at measured 467px reference offset | 11.93% | 9.99 |
| Shopping List initial | 8.54% | 7.59 |
| Shopping List family | 8.02% | 6.22 |
| Shopping List history | 4.53% | 4.50 |
| Shopping List checked row | 8.08% | 6.85 |
| Shopping List empty | 6.59% | 6.82 |
| Shopping List catalogue | 8.36% | 8.22 |
| Shopping List catalogue scrolled | 6.53% | 6.83 |
| Shopping List share selected | 5.36% | 5.37 |
| Shopping List quantity 1 | 4.59% | 6.31 |
| Shopping List quantity 2 | 3.44% | 4.06 |

Surface-specific evidence and the reasons behind the remaining raster differences are recorded in
`surface-0/SURFACE_RECORD.md`, `dashboard/SURFACE_RECORD.md`,
`rewards/SURFACE_RECORD.md`, `offers/SURFACE_RECORD.md`, and `list/SURFACE_RECORD.md`.

## Historical 425 x 849 React Native Web structural matrix

The following matrix predates the physical-phone acceptance loop. It remains useful for regression
orientation but cannot approve a native surface.

| Surface/state | Changed pixels | MAE |
|---|---:|---:|
| Dashboard | 7.75% | 5.25 |
| Promo drawer open | 5.55% | 6.77 |
| Checkout QR | 7.98% | 4.81 |
| Offers | 5.69% | 4.10 |
| Offers: produce filter | 4.69% | 3.62 |
| Offers: coupon detail | 3.31% | 2.09 |
| Shopping List | 5.20% | 4.74 |
| Shopping List: history | 2.59% | 2.03 |
| Shopping List: catalogue | 4.08% | 4.58 |
| Shopping List: share | 2.24% | 2.83 |
| Shopping List: quantity | 3.88% | 3.74 |
| Stores | 3.46% | 2.69 |
| Stores: empty search | 5.65% | 4.65 |
| Profile | 8.66% | 5.33 |
| Profile: edit | 2.08% | 1.61 |
| Profile: scratch game | 6.30% | 4.37 |
| Profile: family invite | 5.04% | 6.39 |
| Profile: payments | 1.87% | 1.35 |
| Profile: settings | 1.71% | 0.94 |
| Profile: help | 3.00% | 2.55 |
| Notifications | 2.99% | 1.71 |
| Scanner | 2.83% | 1.42 |
| Purchase history | 2.30% | 2.10 |
| Rewards | 7.75% | 6.12 |
| Reward redemption sheet | 3.01% | 2.35 |
| Active reward | 0.85% | 0.37 |
| Active reward QR | 2.55% | 1.90 |
| Promo editorial | 2.18% | 2.01 |
| Froo Games | 5.80% | 4.33 |
| Game session | 7.59% | 5.05 |

Generated evidence is grouped under `surface-0/`, `dashboard/`, `device/`, `surface-1/` through
`surface-3/`, and `overlays/`. Accepted native states include raw ADB captures, normalized phone
candidates, side-by-side composites, overlays, amplified diffs, and motion recordings.

## Parity-critical implementation decisions

- The app frame, promo handle, tab viewport, and bottom navigation use the web coordinate system
  and clipping boundaries. The native header adds the measured safe-header shift required to keep
  the Froo logo and pull gesture below camera islands/status controls.
- Tailwind v4 colors are pinned in the NativeWind configuration because its Tailwind v3
  defaults otherwise produce visibly different colors for identical utility names.
- Overlays use real React Native `Modal` roots when nesting would otherwise place them in a
  ScrollView coordinate system. Vertical sheet backdrops now cover the complete app shell,
  including the header, as explicitly approved after the original list acceptance. Every
  gesture-enabled Android modal owns a modal-local `GestureHandlerRootView`; the app-level root
  cannot service gestures in the modal's separate native window.
- CSS-only effects have platform adapters: native blur uses `BlurView`, maps and the two canvas
  games use isolated WebViews, and React Native Web uses matching backdrop-filter/iframe
  adapters for the visual harness.
- Motion timing was ported for tab hand-off, promo drag/snap and ad crossfade, list staggering,
  barcode/scan lines, reward count-up, high-score confetti, bottom sheets, and the coupon's
  measured card-to-sheet transition. Vertical surfaces use the documented `260ms` no-overshoot
  entrance and `210ms` committed exit; clamped springs are limited to cancelled drags.
- Native-only swipe-to-delete was removed from the parity build because it is absent from the
  source React application.

## Required before declaring store-ready parity

1. Complete the remaining surfaces on the attached Galaxy A54, then capture the agreed iPhone at
   native DPR, including safe areas, keyboards, camera permission states, maps, WebViews, and
   reduced-motion settings.
2. Record the promo drawer, coupon expansion, scanner line, QR scan line, tab transitions,
   reward redemption, and game-over confetti at 60 fps and approve them frame by frame.
3. Deploy the root multi-page Vite build to HTTPS and set
   `EXPO_PUBLIC_GAMES_BASE_URL`; `.env.example` documents the contract. The production build now
   emits all `game-*.html` entries and their assets.
4. Replace the remaining Expo placeholder app icon and splash artwork with approved Froo store
   assets. This needs brand approval; it is not a UI-porting guess.

The Galaxy A54 is available through ADB and is the current Android acceptance device. An agreed
iPhone still needs to be connected before iOS can be honestly signed off. The Expo exporter builds
Web, Android, and iOS bundles successfully, but exports do not replace device evidence.
