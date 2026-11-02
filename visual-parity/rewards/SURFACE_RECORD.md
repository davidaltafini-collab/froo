# Surface: Rewards and redemption

Status: accepted on physical Galaxy A54

Web sources:

- `src/components/overlays/RewardsOverlay.tsx`
- `src/components/overlays/RedeemFlow.tsx`
- `src/components/overlays/ActivePromotionOverlay.tsx`

Native targets:

- `mobile/src/components/overlays/RewardsOverlay.tsx`
- `mobile/src/components/overlays/RedeemFlow.tsx`
- `mobile/src/components/overlays/ActivePromotionOverlay.tsx`
- `mobile/App.tsx`

Binding evidence setup:

- Live reference: `http://127.0.0.1:3000`, canonical `425 x 849`, DPR 1
- Native acceptance: Galaxy A54 through direct ADB capture, raw `1080 x 2340`
- Phone captures are normalized by width to `425 x 921`, then cropped to the canonical top
  `425 x 849`; they are never stretched or substituted with Expo Web
- Every source change is followed by a cold Expo launch before acceptance evidence
- Reference fixture: 4,820 points, Fresh Bananas at 1,500 points, and a 15-minute promotion

## Required states

- [x] initial Rewards list and 4,820-point balance
- [x] measured scrolled position with sticky tier header
- [x] locked 6,000-point cards, grayscale treatment, lock icons, and unlock labels
- [x] redemption confirmation backdrop and bottom sheet
- [x] activation transient and settled redeemed state
- [x] active-promotion timer surface
- [x] active-promotion QR surface and one-second code update cadence
- [x] close controls and Android hardware Back at every overlay depth

## Confirmed fixes

- Rewards, confirmation, and the Dashboard now share the correct native sibling hierarchy. The
  confirmation blur samples Rewards rather than the Dashboard behind a nested Android Modal.
- All fixed web geometry is mapped from the 425-unit design frame, including balance type,
  reward cards, images, buttons, the confirmation sheet, hero crop, timer card, and QR card.
- The 4,820/3,320 balance width is corrected independently from its already-matching height so
  Android's Inter glyph metrics do not widen the display.
- Tier headings are direct sticky ScrollView children with measured z-order and opaque coverage.
  An Android bottom-scroll allowance lets the final tier reach the same sticky bound.
- Locked images use the installed React Native grayscale filter plus the web-equivalent opacity;
  the previous colored locked images were rejected.
- The active-promotion surface uses the original reward asset, exact 425-frame geometry, and the
  web timer/QR branch. Its displayed numeric code now regenerates on the same one-second render
  cadence as localhost.
- Rewards owns Android Back while mounted. Back cancels confirmation first, then closes Rewards;
  the native active-promotion Modal consumes Back above both and returns to the redeemed state.

## Physical-device comparisons

| State | Changed pixels (>20) | MAE | Result |
|---|---:|---:|---|
| Initial Rewards, final cold load | 11.40% | 10.71 | Header, balance, tier, four cards, and controls aligned |
| Confirmation sheet | 5.85% | 7.32 | Blur hierarchy, sheet top, image, copy, and buttons aligned |
| Redeemed state | 12.52% | 11.25 | 3,320 balance, redeemed badge, View QR, and card stack aligned |
| Active promotion | 4.18% | 5.40 | Hero, title, timer card, countdown, and CTA aligned |
| Active promotion QR, final cadence build | 4.55% | 6.12 | QR geometry aligned; random numeric content changes each second |
| Scrolled tier at matched web scrollTop 691 | 10.20% | 9.28 | Sticky 3,000 header and 3,000/4,500 landmarks aligned |
| Locked cards at matched non-overlapping position | 8.51% | 8.30 | 6,000 header, grayscale images, locks, cards, and labels aligned |

The changed-pixel metric includes browser/native font edges and separate bitmap decoders. The
side-by-side and 50/50 overlays contain no remaining large rectangular geometry discrepancy.

## Motion and interaction evidence

- Native redemption/activation recording:
  `visual-parity/rewards/rewards-redemption-motion-native-pass1.mp4`
- Motion contact sheet:
  `visual-parity/rewards/rewards-redemption-motion-native-pass1-contact-sheet.png`
- Android Back verification hierarchies:
  `visual-parity/rewards/back-rewards-ui.xml`,
  `visual-parity/rewards/confirm-retest-after-ui.xml`, and
  `visual-parity/rewards/active-back-after2-ui.xml`
- QR cadence frames:
  `visual-parity/rewards/rewards-qr-cadence-final-frame1-native.png` and
  `visual-parity/rewards/rewards-qr-cadence-final-frame2-native.png`

## Current evidence

- Initial: `visual-parity/rewards/rewards-final-initial2-comparison.png`
- Confirmation: `visual-parity/rewards/rewards-redeem-physical-pass4-comparison.png`
- Redeemed: `visual-parity/rewards/rewards-redeemed-pass1-comparison.png`
- Active promotion: `visual-parity/rewards/rewards-active-promotion-pass3-comparison.png`
- QR: `visual-parity/rewards/rewards-qr-cadence-final2-comparison.png`
- Scrolled sticky tier: `visual-parity/rewards/rewards-scrolled-pass3-matched-comparison.png`
- Locked cards: `visual-parity/rewards/rewards-locked-grayscale-pass2-comparison.png`

## Approved platform exceptions

None.
