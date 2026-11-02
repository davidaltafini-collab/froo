# Surface: Mini-games (Store Breaker, Froo Merge)

Status: accepted on the Galaxy A54 Android target; iOS pending
Web source files: `src/components/games/BrickBreakerGame.tsx`, `src/components/games/FruitMergeGame.tsx`,
`src/components/games/canvasScale.ts`, `src/game-entries/*`
Native target files: `mobile/src/components/games/*`, `mobile/src/components/overlays/GameSessionOverlay.tsx`,
`mobile/src/components/overlays/PersonalGameOverlay.tsx`
Reference devices/viewports: localhost game document at 330 x 644 CSS, DPR 3 (the phone's exact
WebView geometry); Galaxy A54 `SM-A546B`, 1080 x 2340, density override 480, font scale 1.5
Deterministic data fixture: none — both games seed brick layout, power-ups, and spawn tiers from
`Math.random()`, so only geometry, colour, and typography are compared, not entity placement.

Dino is out of scope and is absent from the app: no source reference in `mobile/`, and zero
occurrences in either generated bundle.

## Proven root cause of "games do not open"

`mobile/src/config/gamesServer.ts` resolved the WebView URL to the Android **emulator** loopback
alias when `EXPO_PUBLIC_GAMES_BASE_URL` was unset, and no `mobile/.env` existed:

```
Platform.select({ android: 'http://10.0.2.2:3001', ... })
  -> source={{ uri: 'http://10.0.2.2:3001/game-brick-breaker.html' }}
```

On a physical phone `10.0.2.2` is an ordinary unroutable RFC1918 address, and nothing served port
3001 on the development machine either (only 3000). Evidence captured on the device:

- on-screen WebView error `net::ERR_CONNECTION_TIMED_OUT` (Chromium net error `-8`)
- `/proc/net/tcp` showed three sockets to `0202000A:0BB9` (= `10.0.2.2:3001`) in state `02`
  (`TCP_SYN_SENT`) — the phone re-sending SYNs to an address that never answers
- `logcat` confirmed the WebView itself mounted correctly at 990 x 1933 px, so the failure was
  purely the document source, not navigation, layout, or the component tree
- historical `mobile/expo-tunnel.log` shows the same class of failure on iOS
  (`NSURLErrorDomain` code `-1004`)

The overlay chain (`tap card -> PersonalGameOverlay -> GameSessionOverlay -> WebView`) was healthy
throughout; only the URL was wrong.

## Architecture

The games are the untouched web implementation, built into a **single self-contained HTML document
per game** and embedded in the app as a string (`scripts/build-mobile-games.mjs` ->
`mobile/src/components/games/generated/*.ts`). The WebView loads it with
`source={{ html, baseUrl: 'https://games.froo.local/' }}`.

- Same code as localhost, so physics, timing, difficulty, and scoring are identical by
  construction rather than by reimplementation.
- No host, no LAN address, no hosting cost; verified working in airplane mode.
- `baseUrl` gives the document a stable origin so `localStorage` works — that is where each game
  keeps the high score it draws as `HI` on the canvas.

## Device pixel ratio

Both games previously sized the canvas backing store equal to its CSS box, so on a DPR-3 phone the
canvas was upscaled by the compositor. `setScreen()` now separates the two and scales the context
exactly once; every other coordinate in both files stays in logical CSS pixels, so physics and
pointer input are unchanged.

Measured on the phone, playfield 990 x 1361 device px in both games:

| Game | CSS box | Backing store | Context transform |
|---|---|---|---|
| Store Breaker | 330 x 454 | 990 x 1361 | 3 |
| Froo Merge | 330 x 454 | 990 x 1361 | 3 |

## Comparison results

`node scripts/compare-game-parity.mjs` crops both captures to the playfield and reports a
perceptual difference plus an edge-acuity score, including a control that simulates the old DPR-1
upscale.

| Game | Playfield (device / reference) | Differing px | Mean delta | Acuity device / reference / DPR-1 control |
|---|---|---|---|---|
| Store Breaker | 990x1361 / 990x1362 | 2.59% | 2.30 | 4.32 / 4.19 / 0.91 |
| Froo Merge | 990x1361 / 990x1362 | 0.66% | 0.78 | 0.68 / 0.67 / 0.17 |

Geometry is pixel-exact. Device acuity matches the reference and is ~4.7x the DPR-1 control, which
is the measurement behind the "no pixelation" claim. The residual difference is confined to
randomised game content (brick layout, steel/power-up assignment, spawn tier), the differing `HI`
value, and canvas text — see the exception below. Difference images:
`visual-parity/games/<game>/diff.png`.

## Real-device tests performed (Galaxy A54, density 480, font scale 1.5)

- [x] both games open from the Froo Games list, repeatedly (4 open/close cycles, no leak or crash)
- [x] gameplay: Store Breaker launch, brick collisions, scoring (40 -> 80), life loss
- [x] gameplay: Froo Merge drop, stacking, merges up to tier 5, scoring (36)
- [x] touch coordinates: paddle centre tracks the finger across the full width; drop column follows
- [x] score/result bridge to React Native: `HIGH SCORE 80` / `36`, Best Score tile, tries 3 -> 1
- [x] high score persists across a full overlay close/reopen (AsyncStorage mirror)
- [x] offline: airplane mode on **and** `adb reverse` removed — both games open and render fully
- [x] background/foreground: 12 s in background, score and physics state preserved, no time jump
- [x] portrait layout, no clipping behind status bar or navigation bar
- [x] second density: 400 (DPR 2.5) — canvas rescales correctly and stays sharp; restored to 480
- [x] performance: 50th 17 ms, 90th 28 ms, 99th 36 ms during Froo Merge play (display is 120 Hz;
      native RN control while scrolling the same app measured 14 / 24 / 32 ms)

## Gameplay and presentation changes (requested after the port)

These are deliberate product changes, so the games no longer match the pre-change localhost
captures. Both platforms move together because they build from the same source.

### Haptics

The games emit named events (`tick`, `impact`, `strong`, `pickup`, `levelUp`, `fail`) through
`onHaptic`; the shell maps them to expo-haptics in
[`mobile/src/components/games/haptics.ts`](../../mobile/src/components/games/haptics.ts). The
games never touch a platform API, so a desktop browser simply drops them and the web reference
is unchanged.

Intensity varies by what happened rather than firing one buzz for everything: a chipped brick
ticks, a destroyed brick is a medium impact, a brick smashed under the power ball is heavy, and
a cleared level is a two-beat pattern. Froo Merge scales the same way by merge tier — tiers 0–1
tick, 2–4 impact, 5+ strong, and the last two tiers use the level-up pattern.

Throttling is in the host, not the games: 55 ms between contacts and 90 ms between other events.
Measured on the Galaxy during a rally: **24 vibrations across 25 s of active play**, confirmed in
logcat as `VibrationAttributes{mUsage=TOUCH}` for `host.exp.exponent`.

### Froo Merge — drop where you tap

`pointerdown` now aims before releasing. A touch fires `pointerdown` with no preceding
`pointermove`, so a tap used to drop the piece wherever the *previous* one was released.
Verified on the phone: a tap at x=150 landed the piece at the far left, the next at x=930 landed
at the far right.

### Store Breaker — presentation

- **Tray instead of a bar.** The paddle is the Froo Bistro tray, medium by default and large
  while FRIES is active. Drawn width always equals the collision width so the visual and the
  hit area cannot disagree; the height is clamped to the space below the bounce line.
- **Pickups are just the item.** The capsule, clip circle and coloured ring are gone; a soft
  drop shadow separates the product shot from the playfield.
- **All seven pickups have art.** SAUCE and SHAKE previously fell back to a coloured text
  capsule and now use `powerup-sauce.webp` and `powerup-shake.webp`.
- **One dial per effect replaces five countdown pills.** Each running effect shows its item
  inside a ring that drains clockwise, fading out over its last 900 ms. No text.
- **The effect banner is gone.** A caught pickup lifts off the tray and dissolves instead of
  printing "Paddle Widened!".

`smalldish.png` is intentionally unused — there is no narrow-paddle state to attach it to.

### Sprite preparation

`scripts/prepare-game-sprites.mjs` cuts the supplied renders off their backdrop by flood-filling
from the borders with a local colour tolerance, keeps the largest opaque region, then crops and
downscales to webp. Tolerances are per image because the renders differ: the large tray's glow
blows out to white against its white rim, and the Slurpee sits on a dark backdrop.

| Sprite | Source | Output | Size |
|---|---|---|---|
| `powerup-sauce.webp` | 1024x1024, 1615 KB | 320x316 | 29 KB |
| `powerup-shake.webp` | 1024x1024, 1736 KB | 162x320 | 19 KB |
| `paddle-dish-medium.webp` | 1536x1024, 2065 KB | 512x189 | 18 KB |
| `paddle-dish-large.webp` | 1536x1024, 2072 KB | 512x170 | 16 KB |

## Approved platform exceptions

1. **Canvas text glyphs differ between Android and the Windows reference.** Both games request
   `bold Npx Verdana, sans-serif`. Verdana ships on Windows and macOS but not on Android, which
   falls back to Roboto. Roboto's narrower advances make the text drift progressively across a
   string — visible in `diff.png` as doubled lettering that grows toward the end of each line.
   This is font availability, not scaling or blur, and an iPhone will differ again (it has neither
   Verdana nor Roboto by default).

   Removing it requires bundling one licensed web font into the game document, which would also
   change the localhost reference and therefore needs approval and fresh baselines before it is
   done.

2. **Entity placement is not comparable between runs.** Both games randomise layout per session, so
   only geometry, colour, and typography can be diffed.

3. **Two pickup sprites carry third-party trade dress.** `powerup-sauce.webp` is a Heinz ketchup
   packet and `powerup-shake.webp` is a 7-Eleven Slurpee cup. Supplied and approved as final art
   by the project owner on 2026-08-03; every other game asset is Froo Bistro own-brand.

4. **The sauce sprite keeps a soft cast shadow.** It touches the packet, so the largest-region
   filter preserves it. At the rendered size (~36 design units) it reads as contact shading.

## Verification of the requested changes

Deterministic harness run at the phone's exact geometry (330x644 CSS, DPR 3) with `Math.random`
pinned to 0.1 by the harness — no game source altered — reaching FRIES every time:

- falling pickup drawn with no ring, only the item and its shadow
- tray swapped to `Froo BISTRO Large` while the effect ran
- countdown dial rendered with the fries sprite inside a partially drained orange ring
- 200 s of continuous auto-played gameplay across several levels with **zero runtime errors**

On the Galaxy A54: both games open, Froo Merge drops at the tapped column, Store Breaker shows
the medium tray and ring-less pickups mid-fall, haptics fire at ~1/s during a rally.
