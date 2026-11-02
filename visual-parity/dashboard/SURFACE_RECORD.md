# Surface: Dashboard

Status: accepted on physical Galaxy A54

Web source:

- `src/views/DashboardView.tsx`

Native target:

- `mobile/src/views/DashboardView.tsx`

Binding evidence setup:

- Live reference: `http://127.0.0.1:3000`, canonical `425 × 849`, DPR 1
- Native acceptance: Galaxy A54 through direct ADB capture, raw `1080 × 2340`
- Every phone candidate follows a full Expo Reload and a confirmed Dashboard-ready UI hierarchy
- Initial comparisons use the settled home state; rotating promos are not compared across indices

## Required states

- [x] settled initial Dashboard
- [x] scrolled Dashboard
- [x] loyalty card pressed/tilted and released
- [x] daily claim transient motion
- [x] settled claimed state and updated points
- [x] Rewards entry point
- [x] History entry point
- [x] Stores entry point
- [x] Froo Games entry point

## Confirmed fixes

- Native SVG radial-gradient alpha now uses `stopOpacity`; Android had discarded alpha embedded in
  `rgba(...)` stop colors, rendering the subtle six-percent white and eighteen-percent black card
  texture circles as opaque lobes.
- Loyalty-card and Daily-Streak fixed geometry is width-mapped from the canonical 425-unit design
  frame without globally shrinking text that already matched the reference.
- The byte-identical `981 × 1310` mascot asset is positioned from direct overlay measurements.
- Dashboard QR no longer uses Android `BlurView` inside the transformed card; its visible twelve-
  percent white fill, border, radius, icon, and interaction remain.
- Card touch and device-motion springs now use the web card's `300 / 30 / 1` stiffness, damping,
  and mass. Touch owns the values during a drag so the 50 ms sensor feed cannot fight the finger;
  sensor control resumes after the web-equivalent settling window.
- Froo Games, Weekly Offers, and Recent Savings now width-map their fixed geometry and type from
  the canonical 425-unit frame. The Games card's CSS blur circles are reproduced with native SVG
  radial fades instead of oversized hard-edged 360dp shapes.

## Initial-state comparison history

| Pass | Changed pixels (>20) | MAE | Result |
|---|---:|---:|---|
| Before card alpha correction | 22.60% | 26.00 | Opaque card texture lobes; failed |
| Card alpha corrected | 17.17% | 17.98 | Card intact; Dashboard geometry still oversized |
| Selective fixed-geometry scaling | 12.87% | 12.08 | Card, quick actions, and mascot aligned |
| Daily Streak exact bounds | 11.22% | 10.22 | Initial geometry aligned; interaction validation remains |
| Final initial after lower-section work | 11.30% | 10.26 | No measurable initial-state regression |

## Interaction and secondary-state evidence

| State | Changed pixels (>20) | MAE | Result |
|---|---:|---:|---|
| Settled claimed, first pass | 14.43% | 13.98 | Bonus badge wrapped; failed |
| Settled claimed, inline badge | 12.28% | 12.34 | 4,835 points and inline bonus state aligned |
| Card held at matched 50%/50% -> 84%/14% point | 11.72% | 10.41 | Direction, footprint, corner slope, and content parallax aligned |
| Scrolled, unmatched nominal offset | 11.50% | 12.11 | Phone inertia placed content about nine design pixels farther |
| Scrolled, measured 369px reference offset | 7.07% | 6.52 | Daily, Games, Weekly Offers, offer cards, and nav aligned |

The web card-motion capture stores the computed transform for every keyframe. Its final release
frame reports `transform: none` at 900 ms. The native pass uses the same normalized gesture and
the same spring constants, with a direct held-state screenshot taken before release.

Current evidence:

- Initial final: `visual-parity/dashboard/dashboard-final-initial-comparison.png`
- Initial overlay: `visual-parity/dashboard/dashboard-final-initial-overlay.png`
- Initial diff: `visual-parity/dashboard/dashboard-final-initial-diff.png`
- Scrolled final: `visual-parity/dashboard/dashboard-scrolled-pass2-matched-comparison.png`
- Scrolled overlay: `visual-parity/dashboard/dashboard-scrolled-pass2-matched-overlay.png`
- Settled claimed: `visual-parity/dashboard/dashboard-claimed-pass3-comparison.png`
- Claim motion: `visual-parity/dashboard/dashboard-claim-motion-native-pass2.mp4`
- Claim contact sheet: `visual-parity/dashboard/dashboard-claim-motion-pass2-early-contact-sheet.png`
- Card web keyframes and transforms: `visual-parity/dashboard/web-card-motion-frames/`
- Card native motion: `visual-parity/dashboard/dashboard-card-tilt-motion-native-pass3.mp4`
- Card held comparison: `visual-parity/dashboard/dashboard-card-tilt-held-matched-comparison.png`
- Physical entry captures: `visual-parity/dashboard/rewards-entry-raw.png`,
  `visual-parity/dashboard/history-entry-raw.png`, `visual-parity/dashboard/stores-entry-raw.png`,
  and `visual-parity/dashboard/games-entry-raw.png`

## Approved platform exceptions

None.
