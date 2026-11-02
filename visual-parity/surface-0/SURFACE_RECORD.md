# Surface: App shell and shared primitives

Status: accepted on physical Galaxy A54

Web source files:

- `src/App.tsx`
- `src/components/SharedUI.tsx`
- `src/components/PromoDrawer.tsx`

Native target files:

- `mobile/App.tsx`
- `mobile/src/components/SharedUI.tsx`
- `mobile/src/components/PromoDrawer.tsx`

Reference devices/viewports:

- Live web authority: `http://127.0.0.1:3000`, `425 × 849`, DPR 1
- Native acceptance device: Samsung Galaxy A54 (`SM-A546B`), Android 16
- Raw native capture: `1080 × 2340`, density override 480, font scale 1.5
- Android status-bar bounds: `y = 0..95` physical pixels
- Android navigation-bar bounds: `y = 2196..2340` physical pixels

Deterministic data fixture:

- Home tab active
- Necula David profile
- Two unread notifications
- No active redeemed reward
- Settled finite mount animations before capture

## States

- [x] initial shell
- [x] initial shell with Dashboard content
- [x] Dashboard scrolled while shell remains fixed
- [x] promo handle pressed/dragged
- [x] promo drawer open
- [x] checkout QR open
- [x] tab transition

## Assets and typography

- Promo handle geometry is the same SVG path in web and native.
- Header and navigation icons use the matching Lucide glyphs and sizes.
- Native text uses the bundled Inter faces and disables system font scaling for parity while the
  device remains at its real 1.5 font-scale setting.
- The Sarah avatar is pinned locally as the same SVG in web and native; Surface 0 no longer depends
  on the network DiceBear response.

## Layout measurements

Canonical web at `425 × 849`:

| Element | Bounds |
|---|---|
| App frame | `x=0 y=0 w=425 h=849` |
| Header spacer | `x=1 y=1 w=423 h=122` |
| Header controls | `x=1 y=50 w=423 h=64` |
| Profile control | `x=35 y=50 w=86 h=56` |
| Notification button | `x=345 y=50 w=40 h=40` |
| Scroll viewport | `x=1 y=123 w=423 h=725` |
| Bottom navigation | `x=1 y=763 w=423 h=85` |

Galaxy before the first physical-device shell correction:

| Element | Measured result |
|---|---|
| Header divider | `y=462..463` physical pixels (`154.0..154.3 dp`) |
| Width-mapped web divider target | approximately `y=313` physical pixels |
| Header vertical error | approximately `+150` physical pixels (`+50 dp`) |
| Necula David text | `[109,360][358,396]` physical pixels |
| Bottom-nav top border | `y=1985..1987` physical pixels |
| Android navigation bar | begins at `y=2196`; excluded from app-geometry corrections |

The top error is caused by combining the Android top inset (`95` physical pixels) with an
unscaled `122 dp` web spacer. Surface 0 uses a single design coordinate system: fixed web shell
measurements are width-mapped from 425 to the native window width, and the top inset is not added
again to the layout.

## Motion specifications

- Promo idle handle: `-20 → -12 → -20 → -20`, four-second repeating sequence.
- Promo drag: vertical only, elastic beyond collapsed/open constraints.
- Promo snap: spring damping 25, stiffness 200; threshold 100 px or velocity 200.
- Partner-ad image crossfade: 700 ms ease-in-out every six seconds.
- Tab hand-off: outgoing 150 ms, incoming 220 ms after the outgoing view exits.

## Interaction specifications

- Avatar opens Profile.
- Bell opens Notifications.
- Promo handle opens by downward drag and closes by upward drag or backdrop press.
- Center navigation control opens Scanner.
- Android hardware back closes the topmost open surface before leaving the app.

## Comparison results

- React Native Web evidence is historical structural evidence only.
- First direct Galaxy comparison: 40.04% changed pixels over the full normalized image,
  MAE 55.55/255. This result fails and includes Dashboard differences beyond Surface 0.
- Current shell failure is dominated by the measured top-coordinate error above.
- After the first shell correction, the header divider moved to `y=311..312`, within two physical
  pixels of the width-mapped target. The full-screen metric improved to 24.46% / MAE 28.31 while
  still including the known Dashboard failures.
- A shell-only comparison preserving the top edge and aligning navigation from the measured app
  boundary reports 3.34% changed pixels / MAE 4.24. Its overlay exposed a remaining 5–8 px
  horizontal inset error in the four outer navigation items; that correction is in progress.
- After width-mapping the navigation primitives and pinning the visible app bar to the reference
  `85 × width/425` height, the shell-only result improved to 2.76% / MAE 3.39. Header divider,
  outer item centers, center scanner, and visible navigation height align in the overlay.
- The first physical promo-open comparison is invalid for geometry: localhost showed Promo 1
  (`Weekly Editorial`) while the phone had rotated to Promo 2 (`Exclusive`). A new comparison must
  follow a full reload and capture the same promo index within its six-second display interval.
- The web capture harness now accepts `--promo-index 0|1|2` so rotating content can be matched
  explicitly rather than inferred from elapsed wall-clock time.
- Matched Promo 1 after a full Expo reload: 40.51% / MAE 32.41 over the complete photographic
  frame. The high raw pixel count is dominated by native/browser resampling of the detailed remote
  photograph. Measured content and control geometry aligns; the bottom-anchored group and handle
  remain 13–15 normalized pixels below the canonical frame together with the bottom navigation,
  matching the Galaxy usable viewport being 15 normalized pixels taller than `425 × 849`.

- Final shell-only comparison after a full Expo reload: 2.07% changed pixels / MAE 2.04. The
  compositor preserves the top-aligned header, masks unfinished Dashboard content, and separately
  aligns the native app/navigation boundary without stretching either capture. Evidence:
  `visual-parity/device/galaxy-a54/surface0-final-shell-comparison.png` and its standalone overlay
  and amplified diff.
- Physical-device logs after the final full reload contain no Reanimated render-time write warning
  and no matching React Native fatal/error entry.

## Approved platform exceptions

None.
