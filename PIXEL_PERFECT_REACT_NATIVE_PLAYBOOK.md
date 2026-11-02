# Froo Pixel-Perfect React Native Playbook

> Implementation status and measured comparisons: [`visual-parity/PARITY_STATUS.md`](visual-parity/PARITY_STATUS.md).

## Current locked validation setup

This project now has a physical Android device attached and available to Codex through ADB. The
following setup is the binding parity workflow until it is deliberately revised and documented:

- **Visual source of truth:** the live React application at `http://127.0.0.1:3000`.
- **Canonical web capture:** the settled home state at `425 × 849`, DPR 1. This viewport is fixed
  because it produces the approved composition. It must not be replaced with a narrower browser
  viewport merely to match a phone's logical width.
- **Native acceptance device:** Samsung Galaxy A54 (`SM-A546B`), Android 16, physical resolution
  `1080 × 2340`, Android density override `480`, and system font scale `1.5`.
- **Native capture method:** launch the Expo project on the Galaxy and capture the rendered screen
  directly with ADB. A React Native Web or Expo Web browser capture is useful only as a structural
  diagnostic and can never pass the native acceptance gate.
- **Reload gate:** perform a full Expo reload before every native acceptance capture and wait for
  the target state to settle. Fast Refresh is useful during implementation but is not proof that
  every JavaScript and transformed asset change is present on the phone. Use Expo Go's Reload
  action when available; if the menu cannot be opened, cold-start Expo Go through the Metro deep
  link `exp://127.0.0.1:8081` and apply the same ready-state gate. Expo Go's loading screen,
  "new update available" screen, or any capture without application landmarks is invalid and
  must be discarded even if the prescribed wait time has elapsed.
- **Rotating-content gate:** verify that localhost and the phone show the same promo/ad index before
  comparing them. The promo rotates every six seconds; captures with different promos are invalid
  for layout, color, typography, and pixel-difference conclusions.
- **Device settings:** do not change the Galaxy's font scale or display settings to make a capture
  look better. The native implementation must handle the recorded conditions intentionally.
- **Comparison normalization:** preserve each finished image's aspect ratio. Scale by width for
  comparison and crop only a documented comparison boundary; never stretch, squeeze, or trigger a
  different responsive web layout to manufacture agreement. Keep Android system chrome visible in
  the raw device capture and distinguish it from application geometry during review.

Surface 0, Surface 1 Dashboard, the complete Rewards/redemption flow, Surface 2 Offers, and
Surface 3 Shopping List are accepted and frozen on this Galaxy. The next task is Surface 4 Stores.
Other devices remain required before store-ready sign-off, but they do not replace this active
Android acceptance target.

The shared vertical-surface motion contract was deliberately revised after those static
acceptances: sheets no longer overshoot, full-screen sheet backdrops include the header, downward
drag dismisses vertical surfaces, and the promo header is safe-area-aware. Evidence is in
`visual-parity/motion-audit/SURFACE_RECORD.md`. These approved interaction changes supersede stale
captures that show a sharp header above a sheet backdrop.

## 1. Goal and honest definition of “identical”

The rendered web app served from `http://127.0.0.1:3000` is the design source of truth. Its source
lives in `src/`, but acceptance is based on the measured rendered result, not class names or an
assumption about how the source ought to look. The React Native app in `mobile/` must be rebuilt
and accepted one surface at a time against that live reference.

There are two different meanings of identical:

1. **Same renderer:** running the existing web app inside a WebView can render the same HTML,
   CSS, fonts, and Motion code. This is the closest route to literal visual identity, but the UI
   remains a web UI inside an app shell.
2. **Native renderer:** rebuilding the UI with React Native can be perceptually
   indistinguishable on agreed reference devices. It cannot be mathematically identical on every
   iPhone and Android device because text rasterization, safe areas, screen sizes, shadows, and
   platform rendering differ.

For Froo, the recommended architecture is a true React Native shell and true native screens,
with the existing canvas games kept in WebViews. The target is **perceptual parity on a defined
device matrix**, not a claim of universal pixel identity.

## 2. Decision on the existing mobile port

The initial audit found that `mobile/src/views` and `mobile/src/components` could not be used as
a visual baseline: the first port contained dropped motion, approximated effects, incorrect
overlay coordinate systems, and native-only behavior. Those areas have since been rebuilt and
measured against the web source; the current evidence is recorded in the parity status document.

Keep the useful foundation:

- Expo app configuration and native package setup
- Reanimated, Gesture Handler, SVG, Blur, Linear Gradient, Camera, Sensors, and WebView
- context, types, mock data, game bridge, and local assets where they match the web source
- native back-button, permission, splash, and error-boundary infrastructure

Rebuild or re-verify:

- every screen and overlay layout
- typography and line metrics
- all shadows, gradients, masks, clipping, and blur
- every animation and gesture
- safe-area and bottom-navigation geometry
- remote images that can change or load differently

The standalone mobile TypeScript check, root test suite, multi-page web build, and Expo exports
for Web, Android, and iOS pass. Final parity still requires physical-device screenshots and
60 fps motion approval; a browser comparison alone cannot sign off native rendering.

## 3. Rules that cannot be compromised

1. **No redesigns during parity work.** Do not “upgrade” controls to native pickers, maps, swipe
   actions, or platform conventions unless the web reference already behaves that way. Product
   improvements happen after parity and in separate changes.
2. **One surface must pass before the next starts.** Do not port the whole app and leave visual
   correction until the end.
3. **The web app stays frozen while a surface is being ported.** If the web source changes, its
   baseline captures and surface specification must be regenerated.
   A user-approved cross-platform behavior correction may update both localhost and native in the
   same pass, but the changed contract and replacement evidence must be recorded before more
   surface work continues.
4. **Every visual claim needs evidence.** Compare the locked localhost capture with a direct ADB
   phone capture, overlay them, produce a difference image, and review animation recordings.
   “Looks close on my phone” and React Native Web screenshots are not native acceptance.
5. **Use exact assets and values.** Do not substitute icons, approximate SVG shapes, guess
   spacing, or use similar colors.
6. **No silent platform differences.** Any unavoidable iOS/Android difference is documented in
   the surface record and explicitly approved.

## 4. Phase 0 — freeze and measure the source

This phase happens before another native component is rewritten.

### 4.1 Choose reference targets

The active reference is the live localhost application at the canonical `425 × 849` design frame.
The active native target is the connected Galaxy A54 described in **Current locked validation
setup**. Record:

- the canonical localhost `425 × 849` design capture
- the raw Galaxy `1080 × 2340` ADB capture
- the Galaxy safe-area and system-bar geometry
- light/dark system settings if they can influence system chrome
- the recorded text-size/accessibility settings, including the current `1.5` font scale
- one target iPhone viewport and safe-area configuration before store-ready sign-off

Pixel parity is judged only after the viewport, device scale, safe area, and status-bar treatment
are fixed. Other screen sizes are judged for correct responsive behavior rather than for having
the same coordinates. Never capture localhost at the Galaxy's `360 × 780` logical viewport and
call that the canonical reference: doing so reflows the web UI and changes the approved design.

### 4.2 Freeze typography

The web currently uses `font-sans`, which resolves to a system font. The mobile app embeds
Inter. Those cannot produce identical glyph widths and line breaks.

Before screen work, select one distributable font family, bundle the same font files in both
apps, and define every used weight explicitly. If the web appearance must not change, the chosen
font must first be matched to the intended web reference and licensed for app distribution.

For every text style, record:

- family and exact face
- size, weight, line height, letter spacing, transform, and color
- maximum lines, truncation, and wrapping width
- vertical alignment inside controls

### 4.3 Capture the complete state matrix

For every state below, save a full-screen reference image and, where relevant, a 60 fps screen
recording:

- initial and scrolled positions
- pressed, selected, disabled, expanded, loading, empty, and error states
- modal opening, idle, interaction, and closing states
- keyboard-visible states
- reduced-motion behavior
- long text and large data values

Use deterministic mock data, dates, timers, avatars, and image assets during capture. Network
content such as DiceBear images should be downloaded and pinned locally for visual tests.

## 5. Translation rules

### Layout

- Translate DOM structure intentionally: `div` to `View`, semantic text to `Text`, scrolling
  content to `ScrollView` or `FlatList`, and interactions to `Pressable`.
- Treat NativeWind classes as shorthand, not proof of equivalence. CSS and React Native have
  different defaults. Use explicit `StyleSheet` values whenever a class does not reproduce the
  measured output exactly.
- Preserve the web hierarchy and clipping boundaries. Moving an element to a different parent
  can change overflow, opacity, transform origin, and z-order.
- Define one content coordinate system below the safe area. Do not mix hard-coded web offsets
  with an additional unplanned safe-area offset.

### Design tokens

Create a shared native token layer before page work:

- exact colors, opacity values, radii, border widths, and spacing
- typography styles for every distinct web text treatment
- shadow recipes split by iOS and Android where required
- icon size, stroke width, and color rules
- z-index/elevation levels
- shared animation durations, easing curves, and spring parameters

Values should be extracted from the rendered web result, not inferred only from class names.

### Images, SVG, clipping, blur, and shadows

- Reuse the original bitmap and SVG assets. Do not recreate an asset by eye.
- Use `react-native-svg` paths, clip paths, masks, and gradients for deterministic geometry.
- Use `expo-blur` only after comparing its output on both platforms. If a decorative blur cannot
  match, export or render the effect as an asset rather than accepting a visibly different blur.
- Treat Android elevation as a fallback, not an exact version of a CSS shadow. Complex glows may
  need layered translucent views, SVG filters/assets, or a platform-specific recipe.
- Pin image content and its crop (`contentFit`, position, and clipping radius) explicitly.

### Motion and gestures

Every web animation gets a motion specification before it is ported:

| Field | Required value |
|---|---|
| Trigger | tap, drag, mount, state change, scroll, or sensor |
| Start/end | opacity, transform, color, size, blur, path, and z-order |
| Timing | delay, duration, easing curve or spring constants |
| Sequencing | parallel, staggered, waiting, interruptible, or reversible |
| Gesture | hit area, drag bounds, snap points, velocity rule, and cancellation |
| Reduced motion | exact fallback behavior |

Implement motion with Reanimated on the UI thread. Do not replace a morph, spring, or stagger
with a generic `FadeIn` merely because the final static state is similar. Record the web and
native animations side by side at normal speed and frame-by-frame.

The current Froo vertical-surface contract is binding unless a component has a documented
exception:

| Behavior | Locked value |
|---|---|
| Entrance | `260ms`, cubic bezier `(0.32, 0.72, 0, 1)`, transform + opacity, no overshoot |
| Committed exit | `210ms`, cubic bezier `(0.32, 0, 0.67, 0)` |
| Sheet drag dismissal | downward travel over `22%` of the closed offset or velocity over `850` |
| Full-screen vertical dismissal | downward travel over `16%` or velocity over `850` |
| Cancelled drag | clamped spring only; damping `32`, stiffness `320`, mass `0.75` |
| Upward boundary | `0.08` resistance; never allow a visible jump above the resting edge |
| Gesture ownership | drag from the visible handle or non-scrolling header; never steal a sheet's ScrollView |
| Backdrop | blur/dim the complete app shell, including the header, while leaving the sheet sharp |

Ordinary sheet entrances must not use an unconstrained spring. Springs remain appropriate for an
interrupted gesture returning to rest only when overshoot is clamped.

On Android, every gesture-enabled React Native `Modal` must place its contents inside a
`GestureHandlerRootView`. A handler mounted only in the application root does not own the modal's
separate native window; without the modal-local root, the sheet can render correctly while its drag
gesture silently fails on the production renderer. Prove dismissal from the handler/header itself,
not from a backdrop tap that happens to close the same surface.

### Games

The three games are canvas applications. Keeping their existing web implementation inside a
WebView is the highest-fidelity and lowest-risk choice. Make the game bundle local or deploy it
to a production URL; do not ship a LAN development-server URL. Verify touch coordinates, device
pixel ratio, pause/resume, audio, and bridge messages.

## 6. Surface order

The shell comes first because every page depends on its geometry. The Dashboard follows because
it contains the hardest representative effects and will validate the approach early.

### Surface 0 — app shell and shared primitives

Sources:

- `src/App.tsx`
- `src/components/SharedUI.tsx`
- `src/components/PromoDrawer.tsx`

Scope:

- safe area and status bar
- 122 px design header plus the measured platform safe-header shift on camera-island/notched devices
- promo drawer closed, dragged, snapped, and open states
- scrolling content viewport
- bottom navigation and center scanner button
- tab transition and active reward pill
- QR modal

Do not start the Dashboard until this surface passes, because a shell offset makes every page
comparison misleading.

### Surface 1 — Dashboard

Source: `src/views/DashboardView.tsx`

Required states include initial, scrolled, card pressed/tilted, points counting, daily-streak
claim, reward active, promo interaction, and every entry point to an overlay. Reproduce the card
parallax, transformed layers, glow, shadows, number animation, and transient particles exactly.

### Surface 2 — Offers

Source: `src/views/CouponsView.tsx`

Required states include every filter, normal/expired/disabled cards, horizontal scrolling, card
press, and the complete “View & Use” transition. The clipped image corner, sheen, modal geometry,
and shared-element morph are acceptance-critical.

### Surface 3 — Shopping List

Source: `src/views/ListView.tsx`

Required states include empty/populated lists, checked rows, catalogue open, category changes,
quantity picker, and share sheet. Match the web interaction first; keep swipe-to-delete out of the
parity build unless it is separately approved.

Owned overlays:

- `CatalogueOverlay`
- `QtyPickerOverlay`
- `ShareOverlay`

All three owned overlays use the shared no-overshoot motion contract, cover the header with their
backdrop, and support downward drag dismissal. Catalogue and Quantity expose a drag affordance in
their existing unused top strip without moving the accepted content geometry.

### Surface 4 — Stores

Source: `src/views/StoresView.tsx`

Match the current web map and store-list behavior. A native map migration is a separate product
change, because its labels, controls, pins, and camera behavior will not be visually identical to
the current embedded map.

### Surface 5 — global overlays

Port each overlay as its own independently accepted surface:

1. `ScannerOverlay`
2. `ProfileOverlay`, including every internal sub-view and transition
3. `NotificationsOverlay`
4. `HistoryOverlay`
5. `RewardsOverlay`
6. `RedeemFlow`
7. `ActivePromotionOverlay`
8. `PersonalGameOverlay`
9. `GameSessionOverlay`

An overlay is not complete when its closed and open screenshots match; its entrance, exit,
backdrop, background-content behavior, scroll locking, and hardware-back behavior must also pass.

## 7. Per-surface working loop

Repeat this loop without exceptions:

1. **Inventory:** list the source components, assets, data states, interactions, and animations.
2. **Capture:** produce deterministic screenshots and recordings from the live localhost reference
   at `425 × 849` and direct ADB captures from the Galaxy A54.
3. **Measure:** record bounding boxes, spacing, font metrics, colors, corners, shadows, clipping,
   scroll positions, and motion parameters.
4. **Implement:** rebuild only the selected surface in React Native. Reuse logic and data where
   safe; do not transliterate JSX mechanically.
5. **Capture native:** perform a full Expo reload, then use the same data, rotating-content index,
   state, and timing on the physical Galaxy. Preserve its raw `1080 × 2340` capture as evidence
   before creating any normalized derivative. Confirm application landmarks after Expo finishes
   downloading/loading the update; a timed wait alone is not a readiness assertion.
6. **Compare:** preserve aspect ratio, normalize by the documented width mapping without browser
   reflow or image stretching, and inspect a side-by-side image, 50% opacity overlay, perceptual
   difference image, and side-by-side animation recording.
7. **Correct:** work from large geometry to typography, then decoration, then animation.
8. **Verify:** run TypeScript, interaction tests, iOS and Android device checks, and performance
   checks.
9. **Accept and freeze:** mark every state pass/fail and do not advance while a required state is
   still failing.

## 8. Acceptance gate

A surface is complete only when all of the following are true:

- the physical Galaxy A54 capture passes; Expo Web or React Native Web evidence alone cannot pass
- canonical reference-device captures have no visible geometry, typography, asset, clipping,
  color, or shadow discrepancy at normal viewing scale
- any remaining anti-aliasing-only differences are isolated in the difference image and noted
- animation order, direction, duration, easing/spring behavior, and interruption match the web
- scroll bounds, sticky/floating elements, gestures, and tap targets behave the same
- iOS and Android both pass the approved responsive and safe-area checks
- there are no TypeScript errors, runtime warnings, missing assets, or development URLs
- the surface record lists every accepted platform exception; an empty exception list is ideal

A raw “zero differing pixels” threshold is not appropriate across browser, iOS, and Android
renderers because font and edge anti-aliasing differ. Use a tight perceptual threshold plus human
inspection. Large rectangular difference regions always indicate a real layout/style defect and
must not be hidden by increasing the threshold.

## 9. Surface record template

Create one record per surface using this template:

```md
# Surface: [name]

Status: inventory | capture | implementation | comparison | accepted
Web source files:
Native target files:
Reference devices/viewports:
Deterministic data fixture:

## States
- [ ] initial
- [ ] scrolled
- [ ] pressed/selected
- [ ] modal or expanded
- [ ] empty/loading/error where applicable

## Assets and typography

## Layout measurements

## Motion specifications

## Interaction specifications

## Comparison results

## Approved platform exceptions
```

## 10. Definition of project completion

The migration is complete when every surface record is accepted, the full cross-surface user
flows pass on iOS and Android, the games load from a production-safe location, app icons and
splash assets are final, permissions are verified in release builds, and no known visual
simplification remains undocumented or unapproved.

Until then, the statement should be “native implementation in parity validation,” not
“pixel-perfect conversion complete.”
