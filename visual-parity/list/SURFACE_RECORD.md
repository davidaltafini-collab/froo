# Surface: Shopping List and owned sheets

Status: accepted on physical Galaxy A54

Web sources:

- `src/views/ListView.tsx`
- `src/components/overlays/CatalogueOverlay.tsx`
- `src/components/overlays/QtyPickerOverlay.tsx`
- `src/components/overlays/ShareOverlay.tsx`

Native targets:

- `mobile/src/views/ListView.tsx`
- `mobile/src/components/SharedUI.tsx`
- `mobile/src/components/overlays/CatalogueOverlay.tsx`
- `mobile/src/components/overlays/QtyPickerOverlay.tsx`
- `mobile/src/components/overlays/ShareOverlay.tsx`
- `mobile/App.tsx` (keyboard tap policy used by the List input)

Binding evidence setup:

- Live reference: `http://127.0.0.1:3000`, canonical `425 x 849`, DPR 1
- Native acceptance: physical Galaxy A54 through direct ADB capture, raw `1080 x 2340`
- Phone captures are width-normalized to `425 x 921` and cropped to the documented top
  `425 x 849`; Expo Web and React Native Web are not accepted as native evidence
- Every mobile source change is followed by a cold Expo launch before acceptance capture
- Dashboard-to-List motion starts from a verified settled Dashboard on both renderers

## Required states

- [x] cold initial populated personal list
- [x] family list and explicit selected-tab state
- [x] history list, chip wrapping, and scroll geometry
- [x] checked-row state and layout transition
- [x] typed item add, including one-tap add while the keyboard is focused
- [x] catalogue open, quantity floor, quantity increment, Add, and maximum scroll
- [x] quantity sheet at values 1 and 2 without entrance restart
- [x] share sheet initial and Sarah selected/shared
- [x] Mark List as Done and empty list
- [x] new history entry and Restore back to My List
- [x] close controls and Android hardware Back
- [x] Quantity and Share backdrop dismissal
- [x] Dashboard-to-List handoff, row stagger, and mascot entrance

The Catalogue sheet covers the complete interactive content region below the frozen header, so
neither canonical composition exposes a catalogue-backdrop hit target. Catalogue dismissal is
verified through its close control and Android hardware Back.

## Confirmed fixes

- Fixed geometry maps from the measured 425-unit web frame through the live native width. Mascot
  percentages resolve from the List root's measured height, preserving its placement in personal,
  family, history, added, and empty states.
- List-local text uses Android system sans because localhost on Windows resolves `font-sans` to
  Segoe UI; Inter produced different widths and line breaks on the Galaxy.
- Dynamic tab and row colors use explicit native styles, avoiding stale NativeWind class commits
  in Fabric.
- The empty card removes a redundant native top margin. CSS margin collapse uses the larger of the
  32px catalogue margin and 16px card margin; React Native otherwise added both and sat 16px low.
- The byte-identical mascot asset ignores pointer input like web `pointer-events-none`, preventing
  its transparent box from blocking Restore and nearby controls. It now has the web entrance too.
- The root ScrollView uses `keyboardShouldPersistTaps="handled"`, so one Plus tap adds while the
  input is focused instead of only dismissing the Android keyboard.
- Catalogue and Share heights account for the Galaxy Modal continuing into system navigation.
  Catalogue includes the hidden scroll range needed for identical maximum-scroll landmarks.
- Quantity uses a persistent shared-value spring instead of a mount preset. Its 408-unit native
  height includes the 72 normalized pixels behind system navigation, producing the web's visible
  336px sheet and y=513 top without jumping on wheel updates.

## Physical-device comparisons

| State | Changed pixels (>20) | MAE | Result |
|---|---:|---:|---|
| Initial personal list, final cold build | 8.54% | 7.59 | Header, controls, mascot, rows, and fixed nav aligned |
| Family list | 8.02% | 6.22 | Selected tab, rows, page height, and mascot aligned |
| History | 4.53% | 4.50 | Cards, wrapped chips, Restore controls, and mascot aligned |
| First row checked | 8.08% | 6.85 | Check, colors, strike-through, and row geometry aligned |
| Fresh catalogue Add result | 10.06% | 10.31 | `Organic Bananas x2` prepended; header remains `Qty: 1` |
| Empty list, final margin fix | 6.59% | 6.82 | Empty-card top, size, label, and mascot aligned |
| Catalogue open | 8.36% | 8.22 | Header boundary, products, controls, and crop aligned |
| Catalogue first quantity = 2 | 8.56% | 8.27 | Quantity and product row aligned |
| Catalogue maximum scroll | 6.53% | 6.83 | Category/product landmarks and scroll limit aligned |
| Share open | 7.31% | 8.74 | Settled sheet, members, methods, and blur aligned |
| Share with Sarah selected | 5.36% | 5.37 | Selected control and settled sheet aligned |
| Quantity = 1 | 4.59% | 6.31 | y=513 top, title, Done, wheel, blur, and nav aligned |
| Quantity = 2 | 3.44% | 4.06 | Wheel change without sheet displacement |

Metrics include Android status chrome, browser/native font-edge rasterization, and blur sampling.
Normal-scale review and 50/50 overlays contain no large rectangular geometry discrepancy. Earlier
mid-spring Share, incorrectly anchored Quantity, mismatched-scroll Catalogue, and keyboard-tainted
motion captures are explicitly rejected.

## Motion specifications and evidence

- Shell handoff: 150ms exit followed by 220ms enter, opacity plus 10px horizontal translation.
- Rows: opacity 0 to 1, y 10 to 0, scale 0.95 to 1, 50ms stagger capped at 300ms.
- Mascot: opacity 0 to 1 and x 84 to 0 in 280ms with Bezier `(0.23, 1, 0.32, 1)`;
  reduced motion keeps x at 0 and uses the web's 180ms opacity-only fallback.
- Sheets: y 100% to 0 with stiffness 200 and damping 25. Quantity retains its shared value across
  wheel updates.
- Web: `list-entrance-motion-web-trimmed.mp4`
- Raw native: `list-entrance-motion-native-pass2-raw.mp4`
- Normalized native: `list-entrance-motion-native-pass2.mp4`
- First-scene synchronized pair: `list-entrance-motion-side-by-side-synced.mp4`
- Synchronized contact sheet: `list-entrance-motion-contact-sheet-synced.png`

## Interaction and visual evidence

- Initial: `list-initial-final-comparison.png`
- Family/history/checked: `list-family-pass2-comparison.png`,
  `list-history-pass3-comparison.png`, and `list-first-checked-comparison.png`
- Quantity: `list-qty-stable-pass5-comparison.png`,
  `list-qty-two-stable-pass5-comparison.png`, and `window-qty-two-pass5.xml`
- Catalogue: `list-added-fresh-comparison.png`,
  `list-catalogue-scrolled-pass4-comparison.png`, and `catalogue-clamp-after.xml`
- Empty/history/restore: `list-empty-pass2b-comparison.png`,
  `window-history-pointer-test.xml`, and `window-restored-pointer-test.xml`
- Share: `list-share-long-selected-comparison.png`
- Typed single-tap Add: `typed-single-tap.xml`
- Quantity dismissal: `dismiss-qty-done-closed.xml`, `dismiss-qty-backdrop-closed.xml`, and
  `dismiss-qty-back-closed.xml`
- Share dismissal: `dismiss-share-x-closed.xml`, `dismiss-share-backdrop-closed.xml`, and
  `dismiss-share-back-closed.xml`
- Catalogue dismissal: `catalogue-live-x-closed.xml` and `dismiss-catalogue-back-closed.xml`

## Verification gates

- Root tests: 47 passed
- Root web TypeScript: passed after assigning `mobile/` to its own project boundary
- Mobile TypeScript: passed
- Production multi-page Vite build: passed
- Android runtime log exercise across all three sheets: clean

## Approved platform exceptions

None on the Galaxy A54. An agreed physical iPhone remains required for project-wide iOS parity and
store-ready sign-off; a simulator or Expo Web capture cannot substitute for that future gate.
