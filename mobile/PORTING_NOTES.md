# React Native port notes

The detailed implementation matrix and current measurements are in
[`../visual-parity/PARITY_STATUS.md`](../visual-parity/PARITY_STATUS.md). The conversion method is
documented in [`../docs/PIXEL_PERFECT_REACT_NATIVE_PLAYBOOK.md`](../docs/PIXEL_PERFECT_REACT_NATIVE_PLAYBOOK.md).

## Architecture

- `mobile/` is a true Expo + React Native app. The application UI is native React Native, not a
  full-app WebView or Capacitor wrapper.
- The current Google map remains an isolated WebView because the web reference itself is an
  embedded Google map. Replacing it with a native map would be a separate redesign.
- Store Breaker and Froo Merge remain isolated WebView games. Reusing their Matter.js canvas
  implementation preserves their physics and artwork more accurately than an unverified rewrite.
  Native game-over results return through the existing bridge.

## Production configuration

The root Vite build emits `game-brick-breaker.html`, `game-fruit-merge.html`, and
`game-dino.html` as production entries. Deploy that build to HTTPS and set:

```env
EXPO_PUBLIC_GAMES_BASE_URL=https://your-games-host.example
```

Simulator defaults exist for local development. A physical development phone must use the
development computer's LAN address. Do not ship without the HTTPS variable.

## Remaining launch gates

- Approve native iOS and Android screenshots and 60 fps motion captures using the device matrix
  in the parity playbook.
- Replace Expo's placeholder icon and splash assets with approved Froo store artwork.
- Complete normal release work: bundle identifiers, signing, EAS profiles, privacy declarations,
  store metadata, and production API/environment values.

These are explicit release gates, not hidden visual simplifications.
