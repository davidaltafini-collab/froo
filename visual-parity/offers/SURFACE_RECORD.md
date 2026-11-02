# Surface: Offers and coupon detail

Status: accepted on physical Galaxy A54

Web source:

- `src/views/CouponsView.tsx`

Native targets:

- `mobile/src/views/CouponsView.tsx`
- `mobile/src/components/PromoDrawer.tsx` (closed/open gesture hit-test regression only)

Binding evidence setup:

- Live reference: `http://127.0.0.1:3000`, canonical `425 x 849`, DPR 1
- Native acceptance: Galaxy A54 through direct ADB capture, raw `1080 x 2340`
- Phone captures are normalized by width to `425 x 921`, then cropped to the canonical top
  `425 x 849`; they are never stretched or substituted with Expo Web
- Every mobile source change is followed by a cold Expo launch before acceptance evidence
- Rotating promo content is ignored only behind the coupon modal blur; exposed promo comparisons
  require the same ad content on localhost and the phone

## Required states

- [x] cold initial state with All Offers selected
- [x] Dairy & Eggs filter: one matching coupon
- [x] Fresh Produce filter: one matching coupon
- [x] Bakery filter: two matching coupons, including the featured bakery coupon
- [x] Meat & Seafood filter: one matching coupon
- [x] horizontal category scrolling without accidental filter selection
- [x] matched vertical-scrolled state with fixed bottom navigation
- [x] coupon card photo clip, sheen, accent, copy, expiry, and CTA
- [x] card-to-sheet coupon expansion and reverse close
- [x] coupon-detail blur, sheet, barcode, scan line, usage instructions, and terms
- [x] close button, backdrop tap, and Android hardware Back

The canonical web source has no expired or disabled coupon branch or fixture. Those states are
therefore not invented in the parity build; adding them requires a web-source state first.

## Confirmed fixes

- All 425-unit Offers geometry is mapped through the Galaxy's live native width, including page
  padding, banner, filters, cards, clipped photos, typography, and CTA controls.
- The clipped coupon photo uses the original image inside an SVG clip path matching the web
  polygon and rounded lower-left corner, with the original diagonal sheen.
- Active/inactive filter colors and borders use explicit native values. Dynamic NativeWind class
  changes inside the horizontal ScrollView rendered the new React state but prevented Fabric from
  committing it on this phone; those captures were rejected. Explicit styles remove that runtime
  reconciliation failure.
- Filter activation is deferred until the native responder completes and commits only when the
  horizontal row moved less than three logical pixels. Stationary taps select; drags only scroll.
- Card entrance and spring layout transitions remain active after the Fabric fix and filtering
  continues to commit correctly.
- The coupon sheet maps all internal 425-frame measurements to native width. Its Galaxy height
  accounts for the native Modal continuing into Android's system-navigation region, placing the
  visible rounded sheet top at the same reference coordinate.
- The coupon detail retains the measured card-to-sheet spring, delayed content reveal, reverse
  close, native blur, and the web-equivalent three-second linear barcode scan cycle.
- The shared promo handle still opens and closes after its gesture hit-test split, and closing it
  preserves the Offers page's prior vertical scroll offset.

## Physical-device comparisons

| State | Changed pixels (>20) | MAE | Result |
|---|---:|---:|---|
| Initial Offers, final cold load | 9.78% | 9.37 | Header, banner, filters, first cards, and fixed nav aligned |
| Fresh Produce filter | 7.49% | 7.25 | Selected chip and single filtered card aligned |
| Coupon detail, final pass | 5.57% | 5.03 | Sheet top, header, barcode, instructions, terms, and blur aligned |
| Vertical scroll at matched web scrollTop 467 | 11.93% | 9.99 | Fresh, Bakery, Meat, lower Bakery, and fixed nav aligned |

The changed-pixel metric includes Android system chrome, browser/native font edges, blur sampling,
and independent network-bitmap decoding. The accepted overlays contain no large rectangular
geometry discrepancy. The earlier 28.67% scrolled result used mismatched scroll positions and is
explicitly rejected.

## Motion and interaction evidence

- Web motion: `visual-parity/offers/offers-coupon-motion-web-trimmed.mp4`
- Physical native motion: `visual-parity/offers/offers-coupon-motion-native-trimmed.mp4`
- Synchronized pair: `visual-parity/offers/offers-coupon-motion-side-by-side.mp4`
- Motion contact sheet: `visual-parity/offers/offers-coupon-motion-side-by-side-contact.png`
- Filter accessibility hierarchies:
  `visual-parity/device/galaxy-a54/offers-filter-dairy-final.xml`,
  `visual-parity/device/galaxy-a54/offers-produce-animated.xml`,
  `visual-parity/device/galaxy-a54/offers-bakery-gated.xml`, and
  `visual-parity/device/galaxy-a54/offers-filter-meat-final.xml`
- Dismissal hierarchies:
  `visual-parity/device/galaxy-a54/offers-modal-back-close.xml`,
  `visual-parity/device/galaxy-a54/offers-modal-backdrop-close.xml`, and
  `visual-parity/device/galaxy-a54/offers-modal-button-close.xml`

## Current evidence

- Initial: `visual-parity/offers/offers-initial-final-comparison.png`
- Fresh Produce: `visual-parity/offers/offers-produce-functional-comparison.png`
- Coupon detail: `visual-parity/offers/offers-coupon-open-pass4-comparison.png`
- Matched vertical scroll: `visual-parity/offers/offers-scrolled-matched-comparison.png`
- Horizontal swipe gate: `visual-parity/device/galaxy-a54/offers-swipe-gated.xml`
- Promo open/close regression:
  `visual-parity/device/galaxy-a54/promo-regression-open2-raw.png` and
  `visual-parity/device/galaxy-a54/promo-regression-closed.xml`

## Approved platform exceptions

None.
