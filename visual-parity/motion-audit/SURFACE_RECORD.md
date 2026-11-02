# Cross-surface audit: vertical motion, backdrops, dismissal, and promo safe area

Status: accepted on physical Galaxy A54 for the audited interaction contract

Reference:

- Live React target: `http://127.0.0.1:3000`, `425 x 849`, DPR 1
- Native acceptance renderer: Galaxy A54 through ADB, raw `1080 x 2340`
- Expo Go application landmarks were required after every cold launch; one Expo update/loading
  capture was explicitly rejected and excluded from evidence

## Scope

- Share, Catalogue, Quantity, Scanner, coupon detail, and redemption sheets
- Rewards, Profile, Purchase History, and Froo Games vertical full-screen surfaces
- Notification side transition (no-bounce correction; remains directionally horizontal)
- Promo drawer snap motion, camera/status safe top, and notification-area gesture isolation
- Localhost equivalents of the same motion and downward-dismiss interaction

## Accepted motion contract

| Before | After | Why |
|---|---|---|
| Unclamped spring entrances | 260ms cubic-bezier entrance with no overshoot | Removes the visible travel past the final edge and rebound |
| Generic spring exits | 210ms committed timing exit | Makes dismissal decisive and predictable |
| Button/backdrop-only sheet close | Handle/header downward drag with distance and velocity rules | Adds the requested direct gesture without stealing ScrollView input |
| Spring used for every snap | Clamped spring only for an incomplete drag returning to rest | Preserves interruptibility without bounce |
| List backdrops starting at `y=123` | Full modal-root blur/dim | Header now sits under the same backdrop as the page |
| Promo pull zone spanning 70% of the header | Centered 50% pull zone below the measured safe top | Keeps the logo below camera/status content and excludes the bell region |

## Physical-device evidence

- Before Share entrance recording: `share-open-before.mp4`
- Before Share contact sheet: `share-open-before-contact.png`
- Corrected Share entrance recording: `share-open-pass1.mp4`
- Corrected Share contact sheet: `share-open-pass1-contact.png`
- Corrected full-header blur: `share-open-final2-raw.png`
- Final Share handle-dismiss recording/contact sheet: `share-drag-close-final.mp4`,
  `share-drag-close-final-contact.png`
- Full-screen header-dismiss recordings/contact sheets: `history-header-close-final.mp4`,
  `history-header-close-final-contact.png`, `profile-header-close-final.mp4`,
  `profile-header-close-final-contact.png`
- Post-modal-root sheet recordings/contact sheets: `catalogue-root-close-final.mp4`,
  `catalogue-root-close-final-contact.png`, `qty-handle-close-fixed.mp4`,
  `qty-handle-close-fixed-contact.png`, `coupon-root-close-final.mp4`,
  `coupon-root-close-final-contact.png`
- Promo open before/after: `promo-open-before-raw.png`, `promo-open-pass1-raw.png`
- Catalogue and Quantity final sheets: `final2-catalogue-raw.png`, `final2-qty-raw.png`
- Redemption confirmation comparison: `redeem-sheet-pass2-comparison.png`
- Redemption/activation recording: `redemption-pass2.mp4`
- Redemption/activation contact sheet: `redemption-pass2-contact.png`
- Active reward comparison: `redeem-active-pass2-comparison.png`

## Verification results

| Check | Result |
|---|---|
| Share header included in blur | Pass on raw Galaxy capture |
| Share downward swipe | Pass; sheet absent from post-gesture UI hierarchy |
| Purchase History header downward swipe | Pass; overlay absent and Dashboard landmarks present |
| Profile header downward swipe | Pass; overlay absent and Dashboard landmarks present |
| Catalogue downward swipe | Pass from explicit top drag strip after modal-local gesture root |
| Quantity downward swipe | Pass from the visible handle after correcting its gesture ownership |
| Coupon detail downward swipe | Pass from visible handle; Offers landmarks restored |
| Rewards full-screen downward swipe | Pass from non-scrolling header |
| Family Games/Profile subview downward swipe | Pass from non-scrolling header; Offers landmarks restored |
| Promo right-side notification-area swipe | Pass; promo remained closed |
| Promo centered logo swipe | Pass; promo opened |
| Redemption confirmation parity | 5.85% changed pixels, MAE 7.39 |
| Active reward parity | 4.20% changed pixels, MAE 5.48 |
| Localhost Share downward drag | Pass through headless Chromium interaction check |
| Mobile TypeScript | Pass |
| Web TypeScript and production build | Pass |
| Root tests | 14 files / 47 tests passed |
| React Native runtime log | No React Native errors in the final cold-load sweep |

## Android modal gesture ownership

React Native `Modal` creates a separate Android native window. The initial drag handlers could be
mounted and animated correctly yet receive no gesture stream because only the application root was
inside `GestureHandlerRootView`. Each gesture-enabled modal now owns a local root. The final History,
Profile, Scanner, and Share dismissals were driven from their actual header or handle and were
validated by post-gesture UI hierarchy landmarks; backdrop-release lookalikes are not accepted.

## Approved platform exception

The Galaxy header applies a safe-area-derived vertical shift that is zero on a rectangular
localhost viewport. This is intentional: the logo and promo gesture must not occupy physical
camera/status-control space. The green header remains full-bleed behind system chrome.
