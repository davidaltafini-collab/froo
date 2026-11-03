# FreshRewards — Restructuring Progress

Tracks the professionalization pass on the app's architecture: real types, a
proper state layer, a maintainable file structure, error handling, and basic
test coverage. This is a structural refactor — behavior should stay identical
throughout.

## Status: Done

`npm run lint` (tsc --noEmit) and `npm test` (6/6 Vitest tests) both pass clean.

## Architecture snapshot

**Before**
- All state (12 `useState` calls) lived in `App.tsx`, prop-drilled 5-9 levels into views/overlays.
- `components/Overlays.tsx` was a single 1,271-line file holding 10 unrelated modals.
- Nearly everything shared (`item`, `redeemedItems`, `notifications`, coupon objects) was typed `any`.
- No error boundary. No tests.

**After** (target)
- Global app state lives in `src/context/AppContext.tsx`, consumed via `useAppContext()`.
- Overlays live one-per-file under `src/components/overlays/`.
- Shared shapes are typed in `src/types/index.ts`.
- `src/components/ErrorBoundary.tsx` wraps the app.
- Vitest smoke tests cover the core flows.

## Phases

- [x] **Phase 0 — PROGRESS.md**: this file.
- [x] **Phase 1 — Type system**: `src/types/index.ts` + replace `any` across `mockData.ts`, views, overlays.
- [x] **Phase 2 — State extraction**: `src/context/AppContext.tsx` (`AppProvider` + `useAppContext()`), `App.tsx`/`DashboardView`/`CouponsView` refactored off prop-drilling (typed inline with the extraction rather than as a separate pass).
- [x] **Phase 3 — Split Overlays.tsx**: one file per overlay under `src/components/overlays/`, barrel `index.ts`, old file deleted. `RewardsOverlay`/`NotificationsOverlay`/`ActivePromotionOverlay` now read their data from `useAppContext()` instead of props; `onClose`/`onAdd`/`onShowRewards`-style UI callbacks stayed as explicit props.
- [x] **Phase 4 — ErrorBoundary**: `src/components/ErrorBoundary.tsx`, wired into `main.tsx` (outermost, wraps `AppProvider`).
- [x] **Phase 5 — Basic tests**: Vitest + React Testing Library + jsdom added (`npm test`). `src/test/setup.ts` polyfills `window.matchMedia` (motion/react needs it under jsdom). Three test files, 6 tests total:
  - `src/App.test.tsx` — shell renders, bottom nav switches Dashboard/List/Stores/Offers.
  - `src/context/AppContext.test.tsx` — claiming points and redeeming a reward update `currentPoints`/`redeemedItems`.
  - `src/views/ListView.test.tsx` — adding an item and marking the list done moves it out of view.

Verified after Phases 1-3: `npm run lint` (`tsc --noEmit`) is clean, and every touched module
was requested through the running Vite dev server (`curl`) and returned `200` with no
compile errors in the server log.

**Important finding during Phase 4**: the project had no `@types/react`/`@types/react-dom`
installed at all — `tsc --noEmit` was passing "clean" throughout Phases 1-3 only because
every React import, prop, and hook was silently typed `any`. Installed
`@types/react@^19`/`@types/react-dom@^19` as devDependencies; the full codebase still
typechecks clean with real React types in place now, so this was a latent gap rather than
new errors, but it's the difference between a real type system and a placebo one.

## Cleanup log

- Fixed earlier: `SharedUI.tsx` and `Overlays.tsx` each had a bogus self-import
  of their own exports, which crashed Vite with "Duplicate declaration" errors.
- Done (this pass): trimmed the copy-pasted mega-imports (full lucide-react
  icon list, unused `OFFERS`/`TRANSACTIONS`/`CATALOGUE_ITEMS`, unused Overlays
  list, unused `SharedUI` names) in every file touched — `mockData.ts`,
  `ListView.tsx`, `StoresView.tsx`, `DashboardView.tsx`, `CouponsView.tsx`,
  `App.tsx`, and all 10 new overlay files each now import only what they use.
  Also found and removed two genuinely dead props in `DashboardView` that
  were never read in its body (`redeemedItems`, `setActivePromotionItem`).

## Backlog / not in scope for this pass

- Move `ListView`'s shopping-list state (`lists`, `history`) into the global
  context — currently view-local and not shared, left as-is per YAGNI.
- ESLint config (currently only `tsc --noEmit` via `npm run lint`).
- CI pipeline.
- Swap Context for Zustand if the app's state grows enough to need it (already
  flagged in `ARCHITECTURE_GUIDE.md`).
- The React Native migration described in `REACT_NATIVE_MIGRATION_GUIDE.md`.
- `git init` — this directory isn't a git repo yet.
