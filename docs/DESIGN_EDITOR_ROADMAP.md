# Design Editor Master Plan

## Product outcome

The editor should let a non-technical user change a React and Tailwind interface
with the spatial confidence of a design tool while preserving the behavior and
structure of the source code.

The required result is not simply "drag elements around." The editor must know
whether a gesture means:

- move an independent visual layer;
- reorder an item in a row, column, grid, or list;
- move an item into another container;
- move a complete page section above or below another section;
- swap the positions of two elements without swapping their behavior;
- adjust a container's padding, gap, alignment, or distribution;
- align or distribute multiple selected elements;
- hand the exact selected element and its context to Codex or another AI editor.

The core rule is:

> Never convert a normal-flow element to absolute positioning just because the
> user dragged it. First infer and show the intended structural operation.

## 1. Current implementation audit

### What already works

- Dev-only Babel tagging adds a source-backed `data-vle-id` to host and
  `motion.*` JSX elements.
- The canvas supports selection, multi-selection, eight resize handles, rotation,
  deletion, undo, redo, image insertion, and image replacement.
- Static Tailwind classes and simple static text can be staged and saved back to
  source.
- Selected elements can be snapped to parent edges, parent centers, sibling
  edges, sibling centers, and ruler guides within a six-pixel threshold.
- Rulers can create, move, and remove horizontal and vertical guides.
- A basic spacing overlay measures parent padding and nearby sibling gaps.
- Same-parent JSX reorder exists in the save middleware.
- A "Send to Codex" action writes the selected DOM context to
  `.design-editor/last-selection.json`.
- Existing test and typecheck baseline is healthy: 14 tests pass and
  `tsc --noEmit` passes.

### Why it still feels wrong

1. **Movement destroys structure too easily.** Most dragged elements are
   promoted to `position: absolute`. This gives immediate movement but removes
   them from flex, grid, stack, and document flow.
2. **Section movement is hidden behind a heuristic.** Reordering only activates
   when an element happens to be at least 82 percent of the parent's width, at
   least 64 pixels tall, and has another similarly wide sibling. Valid sections
   can fail this test and non-sections can pass it.
3. **Flow reorder is vertical only.** It compares only the dragged center Y with
   sibling center Y. Rows, wrapped flex layouts, grids, and horizontal navigation
   cannot be rearranged correctly.
4. **Snapping is invisible.** The coordinate changes, but the user sees no
   alignment line, target, reason, distance, equal-gap indicator, or locked snap.
5. **Snapping jitters.** There is a threshold, but no hysteresis that keeps a snap
   until the pointer intentionally moves away.
6. **Spacing is measurement-only.** It shows a few values but does not let the
   user drag padding or gap handles, equalize gaps, apply a rhythm, or choose the
   source property that should change.
7. **Layers is not a real Layers panel.** It is a flat polling list with visual
   indentation. There is no collapse, drag reorder, reparent, insertion marker,
   lock, visibility, layout badge, source location, or safety state.
8. **No swap operation exists.** The system can reorder one sibling, but cannot
   explicitly swap A and B or preserve an interactive wrapper while exchanging
   visual content.
9. **The AI handoff is incomplete.** It writes DOM context, but does not include a
   resolved source excerpt, computed layout, screenshot, staged operations, or an
   in-editor conversation and diff review.
10. **Source ids are fragile across edits.** Current ids depend on file, line, and
    column. A source edit can move lines and make a later operation stale.

## 2. Product principles

### 2.1 Structure before coordinates

- Flow elements move by source order, CSS `order`, or container layout changes.
- Sections move by JSX/source order.
- Absolute and fixed layers move by coordinates.
- Containers change padding, gap, alignment, and distribution.
- Converting flow content to absolute is an explicit command with a warning, not
  a drag side effect.

### 2.2 Preview the operation before committing it

Every drag must show what will happen on pointer-up:

- a line for an alignment snap;
- a spacing band for an equal-gap snap;
- an insertion bar for reorder;
- a highlighted container for reparent;
- two highlighted targets for swap;
- a ghost copy for duplication;
- a blocked cursor and explanation for unsafe source shapes.

### 2.3 Visual edits are typed commands

The canvas, Layers panel, Properties panel, keyboard shortcuts, and AI must all
produce the same typed editor commands. There should not be five separate ways
to mutate the DOM and source.

### 2.4 The editor explains uncertainty

The editor can infer a layout mode, but the user can override it. Every selected
element shows one of these badges:

- `Layer`
- `Flow item`
- `Section`
- `Container`
- `Generated`
- `Unsafe`

An info tooltip explains why the classification was chosen and what operations
are allowed.

### 2.5 AI never bypasses review

AI changes use the same command and validation pipeline as manual changes. The
user sees a preview, source diff, affected elements, warnings, and Accept or
Reject before the change is saved.

## 3. Target editor workspace

### Left panel: Layers and structure

- True collapsible DOM/source tree.
- Drag handles and insertion markers.
- Drop into containers as well as before or after siblings.
- Layout mode badge on every relevant node.
- Lock and visibility controls.
- Search by tag, text, component, id, or source file.
- Source file and line link for the selected node.
- Icons for dynamic class, generated content, event handlers, and unsafe moves.
- Breadcrumb path such as `Dashboard > Quick actions > Scan button`.

### Center: live canvas

- Direct selection and deep selection.
- Hover outlines and selected bounds.
- Smart alignment lines and distance labels.
- Padding, gap, and margin visualization.
- Reorder and reparent drop zones.
- Multi-select alignment and distribution.
- Rulers and persistent guides.
- Responsive viewport presets and custom width.
- Optional outline mode for otherwise invisible containers.

### Right panel: Inspect and edit

Sections should change according to the selection:

1. Identity: name, tag, component, source, layout type, safety status.
2. Layout: display, direction, grid tracks, wrap, alignment, distribution.
3. Position: flow/order or layer X/Y, never both without an explicit mode change.
4. Size: width, height, min/max, aspect ratio, hug/fill/fixed interpretation.
5. Spacing: individual padding and margin sides, gap, row gap, column gap.
6. Appearance: background, border, radius, opacity, shadow.
7. Typography: family, size, weight, line height, tracking, alignment.
8. Content: safe text and asset replacement.
9. Responsive: base and breakpoint-specific values.
10. AI: selected-element prompt, context options, proposed change, diff.

### Bottom command bar

Keep global actions separate from element-specific actions:

- design mode on/off;
- current tool and shortcut;
- smart guides on/off;
- rulers on/off;
- zoom and viewport;
- undo and redo;
- pending operation count;
- Validate;
- Save.

The existing long row of floating pills should become a compact command bar.

## 4. Tool set and shortcuts

| Tool | Purpose | Default shortcut |
| --- | --- | --- |
| Select | Select, resize, rotate, direct-select children | `V` |
| Hand | Pan the editor viewport without selecting app content | `H` or Space-drag |
| Section move | Reorder full sections with insertion zones | `S` |
| Reorder | Reorder a child within a row, column, wrap, or grid | `R` |
| Move into | Reparent an element into a compatible container | `M` |
| Swap | Swap two positions or swap visual content | `W` |
| Frame/container | Select or create a structural container | `F` |
| Spacing | Inspect and edit padding, margin, and gaps on canvas | `G` |
| Guide | Create and manage rulers and guides | `U` |
| Asset | Insert or replace an image asset | `I` |
| Edit with AI | Open scoped AI drawer for exact selection | `Cmd/Ctrl + K` |

Useful interaction modifiers:

- Shift-click adds or removes from selection.
- Cmd/Ctrl-click cycles through nested tagged elements under the pointer.
- Enter selects the first editable child; Escape selects the parent, then clears.
- Shift during layer movement locks to the dominant axis.
- Alt temporarily disables snapping.
- Cmd/Ctrl during a safe drag duplicates on drag start.
- Arrow keys nudge a layer by one pixel; Shift-arrow uses ten pixels.
- Cmd/Ctrl + arrow reorders a flow item among siblings.
- Alt-drag on a spacing handle mirrors the opposite side.
- Shift-drag on a spacing handle applies the same value to all sides.

## 5. Layout intelligence

### 5.1 Replace `isSectionLike` with a real classifier

Create `layout-classifier.ts` that returns:

```ts
type LayoutKind =
  | 'absolute-layer'
  | 'flow-item'
  | 'section'
  | 'container'
  | 'generated'
  | 'unsafe';

interface LayoutClassification {
  kind: LayoutKind;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  allowedOperations: EditorOperationKind[];
  parentLayout: 'block' | 'flex-row' | 'flex-column' | 'flex-wrap' | 'grid' | 'unknown';
  sourceSafety: SourceSafety;
}
```

Classification signals:

- computed `position`, `display`, flex direction, wrap, grid tracks, and order;
- DOM parent and source parent;
- sibling count, visual ordering, and repeated geometry;
- semantic tag such as `section`, `main`, `nav`, `header`, or `footer`;
- width is only one signal, never the decision;
- whether the JSX node is a direct child of the parent;
- whether it is rendered by `.map()`, a conditional, a fragment, a portal, or a
  component boundary;
- whether it has event handlers or meaningful interactive descendants;
- explicit user override stored for the editor session.

### 5.2 User-visible mode override

The Properties panel should allow `Auto`, `Layer`, `Flow item`, `Section`, or
`Container`. An override changes editor behavior only unless the user explicitly
chooses "Convert layout in source."

### 5.3 Never mix move semantics

- A `flow-item` drag cannot silently become an absolute move on pointer-up.
- A `section` drag always presents insertion slots, not free X/Y motion.
- An `absolute-layer` drag never changes source order unless Reorder is selected.
- A `container` drag defaults to selecting/moving the container as a whole;
  spacing handles edit its children layout separately.

## 6. Smart snapping engine

### 6.1 Geometry model

Create a single frame snapshot at drag start and update only the moving geometry
during the gesture. The snapshot contains:

- selected bounding boxes and union box;
- parent border box, padding box, and content box;
- visible sibling boxes;
- ancestor container boxes;
- ruler guides;
- layout axes and writing direction;
- relevant baseline lines for text when reliably measurable;
- current page scroll and editor zoom.

Use a spatial index or axis-sorted arrays when pages become large. Do not scan
and measure every DOM element on every pointer event.

### 6.2 Snap target types

1. Parent content edges and centers.
2. Sibling left, right, top, bottom, horizontal center, and vertical center.
3. Selection union-box edges and centers for multi-select.
4. Ruler guides.
5. Repeated gap targets.
6. Parent padding symmetry targets.
7. Common spacing rhythm values found in the current container.
8. Text baseline targets when the nodes are compatible.
9. Grid track and column boundaries.
10. Responsive frame edges.

### 6.3 Candidate scoring

Every candidate should include:

```ts
interface SnapCandidate {
  axis: 'x' | 'y';
  correction: number;
  distance: number;
  kind: 'guide' | 'edge' | 'center' | 'equal-gap' | 'padding' | 'grid' | 'baseline';
  sourceIds: string[];
  label: string;
  priority: number;
}
```

Candidate choice should consider priority, pointer intent, distance, current
locked snap, and whether snapping both axes would create a meaningful result.

Recommended default priorities:

- explicit ruler guide;
- parent padding/content edge;
- sibling edge or center;
- equal spacing;
- inferred spacing rhythm.

### 6.4 Magnetic behavior without jitter

- Enter snap at approximately six CSS pixels, scaled for editor zoom.
- Keep the chosen target locked until pointer error exceeds ten pixels.
- Prefer the current target over a nearby alternative until the lock breaks.
- Do not allow two candidates to alternate frame by frame.
- Alt disables snapping immediately and restores raw pointer position.

### 6.5 Visible feedback

While dragging, draw only the winning guides plus highly relevant secondary
guides:

- solid magenta or accent line for edge/center alignment;
- cyan line for ruler guides;
- paired bracket bands for equal spacing;
- shaded inset bands for parent padding;
- a small label such as `Left edge`, `Center`, `Gap 16`, or `Guide 320`;
- source target highlight at each end of the relation.

The line must extend through the aligned elements so the relationship is obvious.

## 7. Smart spacing system

Smart spacing has four stages: inspect, infer, edit, and normalize.

### 7.1 Inspect

Measure and display:

- padding top, right, bottom, left;
- margin top, right, bottom, left;
- row and column gap;
- nearest sibling distances;
- all repeated sibling gaps in visual order;
- container content box;
- alignment and distribution;
- whether the value comes from a Tailwind class, inherited CSS, browser default,
  inline style, or responsive variant.

### 7.2 Infer

Recognize:

- four equal padding sides;
- paired horizontal or vertical padding;
- repeated gaps within a small tolerance;
- an existing rhythm such as 4, 8, 12, 16, 24, 32;
- outlier items that break an otherwise consistent rhythm;
- flex/grid `gap` versus child margins used as a substitute for gap.

### 7.3 Edit directly on canvas

- Hover inside a container edge to reveal a draggable padding band.
- Hover between repeated children to reveal a draggable gap handle.
- Click a measurement label to enter an exact value.
- Mirror, link, or unlink sides.
- Show a live preview and the source property that will be changed.
- Prefer changing parent `gap` for repeated siblings instead of applying margins
  to every child.

### 7.4 Normalize with explicit suggestions

Offer non-destructive suggestions:

- `Equalize all gaps to 16px`;
- `Match left and right padding at 24px`;
- `Use the container's 8px rhythm`;
- `Replace four child margins with parent gap`.

Each suggestion previews affected nodes and source classes before applying.

## 8. Reordering elements and sections

### 8.1 Canvas reorder

For normal-flow content, dragging should calculate visual insertion slots:

- column: before, between, and after children on Y;
- row: before, between, and after children on X;
- wrapped flex: choose row first, then slot within row;
- grid: choose cell/visual index using row and column centers;
- sections: full-width insertion bands between section siblings.

The dragged element appears as a ghost while siblings animate away from the
insertion point. The original node should remain in flow until commit so the page
does not collapse.

### 8.2 Section movement

Section movement must work in three ways:

1. Drag a section on the canvas to an insertion band.
2. Drag a section row in Layers before or after another section.
3. Use `Move up`, `Move down`, or keyboard commands.

Initial safe scope:

- both sections are direct JSX siblings;
- both resolve to the same source parent;
- neither is generated by `.map()`;
- no conditional expression would be crossed;
- source parses after the planned move.

If those conditions fail, keep the preview untouched and explain the exact
reason. Do not fall back to absolute positioning.

### 8.3 Cross-container moves

Move into another container should be a separate, deliberate operation.

Safe first version:

- source and destination are in the same file;
- destination can accept JSX children;
- node is not generated;
- no variable scope is crossed;
- no portal or component boundary is crossed;
- target does not create invalid interactive nesting;
- source imports remain valid.

Later versions may support cross-file moves with import analysis. Do not attempt
that in the first reorder release.

### 8.4 Auto-scroll

Canvas and Layers dragging both need controlled edge auto-scroll. Speed should
increase with proximity to the edge and stop immediately when the pointer leaves
the activation zone.

## 9. Swapping elements

"Swap" needs two explicit meanings because users often mean different things.

### 9.1 Swap positions

Swap the source positions of A and B while each element keeps its own content,
attributes, handlers, state, and styling.

Safe first version:

- same parent;
- two direct JSX siblings;
- neither generated or conditional;
- source ranges are disjoint and parse safely after the swap.

### 9.2 Swap visual content

Keep the functional wrapper in place but exchange the visual children or asset.
This is useful when two buttons have different click handlers but their icon and
label presentations need to trade places.

Before this operation, show a preservation checklist:

- wrapper tag remains;
- event handlers remain;
- `aria-*`, `role`, `name`, `type`, and form semantics remain;
- stateful component identity and key remain;
- only approved visual children/classes move.

### 9.3 Swap interaction

1. Select A.
2. Choose Swap or press `W`.
3. Hover B and show both highlighted with `Swap positions` and
   `Swap visual content` choices.
4. Show an inline preview.
5. Commit as one undoable transaction.

Dragging A directly on top of B can offer Swap, but must not perform it without
an explicit pointer-up choice.

## 10. Layers panel behavior

### 10.1 Real tree model

Stop rebuilding a flat list every 300 ms. Build a normalized tree from tagged DOM
nodes plus source metadata and update it through:

- selection and editor command events;
- a scoped `MutationObserver` for application changes;
- route/view changes;
- explicit refresh after source reload.

### 10.2 Drag and drop

Use a sortable tree interaction for the panel. `@dnd-kit/core` and
`@dnd-kit/sortable` are reasonable candidates for Layers only. Keep canvas
geometry on the custom pointer engine because canvas snapping and reparenting
need domain-specific behavior.

Drop affordances:

- top third: before node;
- middle: into compatible container;
- bottom third: after node;
- horizontal indentation: proposed nesting depth;
- red blocked marker: invalid drop with reason.

### 10.3 Layer controls

- lock prevents canvas selection and manipulation but keeps the node visible;
- hide is preview-only until explicitly saved as a visibility change;
- collapse persists for the editor session;
- rename is an editor label unless a source id/name change is explicitly chosen;
- badges communicate layout mode and source safety without decorative noise.

## 11. Multi-selection tools

When two or more elements are selected, show:

- align left, horizontal center, right;
- align top, vertical center, bottom;
- distribute horizontal spacing;
- distribute vertical spacing;
- equalize width or height;
- wrap in container, when source-safe;
- group as editor selection without altering source;
- move together only when all selected nodes use compatible positioning.

For flow items, alignment should usually edit the parent container. If the
selection does not share a compatible parent, show why alignment would require a
structural change.

## 12. Selected-element AI editing

### 12.1 The button

Every single selection gets a primary contextual action:

**Edit with AI**

The action can also be opened with `Cmd/Ctrl + K`. The drawer title should name
the selection, for example:

`Editing: Scan button in DashboardView.tsx`

Provider choices can be:

- Codex;
- OpenAI API chat;
- Copy context only.

The UI should not claim to control an unrelated ChatGPT browser tab. A true
in-editor chat requires a configured provider or local Codex integration.

### 12.2 Exact selection bundle

Replace the current DOM-only JSON with a versioned bundle:

```ts
interface ElementContextBundleV1 {
  version: 1;
  selection: NodeRef;
  route: string;
  viewport: { width: number; height: number; dpr: number; scrollX: number; scrollY: number };
  rect: DOMRectSnapshot;
  layout: LayoutClassification;
  computedStyle: PickedComputedStyle;
  attributes: Record<string, string>;
  text: string;
  ancestors: ElementSummary[];
  children: ElementSummary[];
  siblings: ElementSummary[];
  source: {
    file: string;
    component?: string;
    start: number;
    end: number;
    excerpt: string;
    fileHash: string;
  };
  stagedOperations: EditorOperation[];
  screenshot?: { path: string; crop: DOMRectSnapshot };
}
```

The bundle must identify one exact node and include enough surrounding context
to understand alignment and behavior without dumping the entire application.

### 12.3 AI drawer workflow

1. User selects an element.
2. User clicks Edit with AI.
3. Editor captures and shows the element name, breadcrumb, source, layout badge,
   and optional screenshot thumbnail.
4. User writes a request such as "make this align with the card title" or
   "swap this with the rewards button but keep both actions."
5. The editor includes the selected node and relevant referenced nodes.
6. AI first returns a short interpretation and a proposed operation plan.
7. Any patch or structured editor command is validated.
8. The canvas previews the proposed result.
9. The user accepts, rejects, or asks for a revision.
10. Accepted changes enter normal undo/redo and remain pending until Save.

### 12.4 Integration levels

#### Level A: context handoff

- Save the richer bundle in `.design-editor/selections/`.
- Copy a ready prompt containing the bundle path and selected node label.
- Keep `last-selection.json` as a pointer to the newest bundle.
- This works without an API key and is the fastest useful release.

#### Level B: Codex SDK adapter

- Add a dev-server-only Node adapter using `@openai/codex-sdk`.
- Start or resume a coding thread with the repository as its working directory.
- Send the bundle path and user request.
- Return the final response and proposed diff to the editor.
- Use this for a relatively simple request-response integration.

#### Level C: Codex App Server adapter

- Use Codex App Server for a rich embedded client with conversation history,
  streamed events, approvals, tool progress, and thread resume.
- Keep it on a localhost-only server-side connection.
- The browser talks to the Vite middleware over a narrow authenticated session;
  it does not spawn Codex or hold credentials directly.
- Generate protocol types from the installed Codex version instead of hardcoding
  experimental schemas.

#### Level D: Responses API adapter

- Optional provider for a general ChatGPT-style in-editor assistant.
- Keep keys exclusively on the server.
- Require structured output matching `EditorOperationProposal` when asking the
  model to change the canvas.
- Plain conversation responses never gain direct write permission.

### 12.5 AI safety and scope

- Default scope is selected node plus necessary parent/sibling context.
- Expanding to the component, file, or whole page requires a visible scope choice.
- The user sees every affected file before applying.
- AI cannot save automatically.
- AI cannot change handlers, data flow, navigation, accessibility semantics, or
  state unless the request explicitly requires it and the diff calls it out.
- A stale `fileHash` invalidates the proposal and requires regeneration.

## 13. Source model and typed operations

### 13.1 Replace ad hoc pending edits with commands

```ts
type EditorOperation =
  | SetStyleOperation
  | SetTextOperation
  | ResizeOperation
  | MoveLayerOperation
  | SetContainerLayoutOperation
  | ReorderNodeOperation
  | MoveNodeOperation
  | SwapNodesOperation
  | SwapVisualContentOperation
  | InsertAssetOperation
  | ReplaceAssetOperation
  | DeleteNodeOperation;
```

Every operation includes:

- operation id and timestamp;
- target `NodeRef` values;
- preconditions;
- preview data;
- inverse operation for undo;
- source edit plan;
- validation result;
- human-readable summary.

### 13.2 More stable node references

Line and column remain useful for diagnostics, but they should not be the only
identity. A `NodeRef` should include:

- relative file path;
- component/function name when available;
- AST structural path;
- opening tag name;
- stable attributes such as `id`, `name`, `key`, or test id when present;
- normalized text fingerprint;
- source range and source hash at capture time.

On save, resolve by exact hash and range first, then structural fingerprint. If
resolution is ambiguous, stop and ask the user to reselect. Never patch the
nearest line as a guess.

### 13.3 Transaction pipeline

1. Intent from canvas, panel, shortcut, or AI.
2. Classify target and requested operation.
3. Build typed command with preconditions.
4. Validate source shape and DOM constraints.
5. Apply preview through one preview reducer.
6. Render guides, insertion marker, or warnings.
7. Commit one transaction to history.
8. On Save, reparse the latest source and revalidate.
9. Generate edits, format touched source, and parse/typecheck.
10. Save atomically or roll back the whole transaction.

## 14. Source safety matrix

| Source shape | Style | Reorder | Reparent | Swap | AI patch |
| --- | --- | --- | --- | --- | --- |
| Static JSX, static class | Safe | Safe with sibling checks | Safe in same file/container | Safe with checks | Preview and validate |
| Dynamic `className` | Read-only initially | May be safe | May be safe | May be safe | Code patch review required |
| Child of `.map()` | Data-level edit required | Block DOM-node reorder | Block initially | Block initially | Edit backing array only |
| Conditional branch | Branch-local only | Block across branch | Block across branch | Block across branch | Explicit code patch |
| Fragment siblings | Usually safe | Safe after AST validation | Limited | Limited | Preview and validate |
| Portal content | Inspect only initially | Block | Block | Block | Explicit code patch |
| Cross-file component move | Style may be safe | Not relevant | Block first release | Block first release | Full code review |
| Interactive wrapper | Style safe | Usually safe | Validate nesting | Preserve semantics | Highlight behavior changes |

## 15. Responsive editing

- Add frame presets for phone, tablet, laptop, and desktop plus custom width.
- Show which Tailwind breakpoint currently controls each value.
- Default edits should modify the active cascade level only after the user
  chooses `Base`, `sm`, `md`, `lg`, `xl`, or `2xl`.
- Warn when a base edit will affect every viewport.
- Keep layout classification per viewport because flex direction, grid tracks,
  wrapping, and section width can change at breakpoints.
- Provide a quick multi-viewport preview before Save.

## 16. Undo, validation, and saving

### Undo/redo

- One gesture is one history entry.
- Reorder, swap, and AI accept are atomic entries.
- Guide creation and movement have their own editor-only history.
- Saving clears only successfully persisted operations.
- A failed save keeps the preview and operations so the user can fix or discard.

### Validation before source write

- node references still resolve uniquely;
- source file hash or operation precondition is valid;
- source edit ranges do not overlap incorrectly;
- resulting files parse;
- touched TypeScript typechecks;
- invalid HTML nesting is not introduced;
- interactive descendants do not become illegally nested;
- affected Tailwind utilities are recognized or deliberately arbitrary;
- no operation accidentally converts a flow item to absolute;
- the preview command and source command describe the same result.

### Save result UI

Show each operation as `Saved`, `Skipped`, or `Failed`, with the exact reason and
source file. Do not reload and erase this information immediately on partial
failure.

## 17. Performance and accessibility

- Replace the always-running selection `requestAnimationFrame` loop with event-
  driven invalidation plus animation-aware temporary tracking.
- Measure DOM in batches and write styles in a separate animation frame.
- Use pointer capture for gestures.
- Use `ResizeObserver`, scroll events on relevant containers, and
  `MutationObserver` to invalidate geometry.
- Keep overlay controls fully keyboard accessible.
- Provide visible focus, screen-reader labels, and non-color snap distinctions.
- Respect reduced motion when animating reorder previews.
- Keep app pointer-event overrides scoped and restore them exactly on exit.
- Do not ship any editor instrumentation in production builds.

## 18. Recommended technical structure

```text
design-editor/
  core/
    node-ref.ts
    layout-classifier.ts
    geometry-snapshot.ts
    snap-engine.ts
    spacing-engine.ts
    reorder-engine.ts
    safety.ts
    operations.ts
    transaction-store.ts
  client/
    canvas/
      CanvasOverlay.tsx
      SelectionOverlay.tsx
      SnapGuides.tsx
      InsertionIndicator.tsx
      SpacingHandles.tsx
    panels/
      LayersPanel.tsx
      InspectorPanel.tsx
      AiEditDrawer.tsx
    tools/
      select-tool.ts
      layer-move-tool.ts
      reorder-tool.ts
      reparent-tool.ts
      swap-tool.ts
      spacing-tool.ts
    bridge/
      editor-client.ts
  server/
    source-index.ts
    operation-validator.ts
    source-writer.ts
    selection-bundle.ts
    ai-provider.ts
    codex-sdk-provider.ts
    codex-app-server-provider.ts
  shared/
    protocol.ts
    schemas.ts
```

The existing files can be migrated gradually. Do not rewrite everything before
shipping the first visible improvements.

## 19. Test plan

### Unit tests

- classify absolute, block, flex row, flex column, wrap, grid, section, generated,
  and unsafe nodes;
- rank competing snap candidates;
- preserve a snap with hysteresis;
- infer equal gaps and symmetric padding;
- compute insertion index for column, row, wrap, and grid;
- build inverse commands for undo;
- resolve `NodeRef` after harmless line movement;
- reject ambiguous or stale node references;
- validate same-parent reorder, reparent, and swap source shapes.

### DOM interaction tests

- drag a flow card between siblings without adding `absolute`;
- drag a section above another section and preserve page flow;
- reorder a horizontal nav item;
- reorder a wrapped item to another row;
- show and clear alignment lines;
- hold and release snap hysteresis;
- Alt disables snap;
- Layers and canvas produce identical reorder commands;
- blocked drops explain why;
- keyboard reorder works;
- AI drawer captures the exact selected node.

### Source fixture tests

Maintain fixture files for:

- direct JSX siblings;
- fragments;
- conditionals;
- `.map()` output;
- dynamic classes;
- motion components;
- event handlers;
- same-file reparent;
- unsafe cross-file scope;
- swapping interactive wrappers versus visual children.

Each fixture should assert the exact output diff and successful reparse.

### End-to-end acceptance scenarios

1. Select a dashboard section, drag it above another section, save, reload, and
   see the new order with no absolute positioning.
2. Select two cards in a row, swap positions, and verify their actions moved with
   them.
3. Swap only the visual content of two buttons and verify each original action
   remains in place.
4. Drag a card into another safe container and see a clear reparent preview.
5. Drag an absolute image until its left edge aligns with a sibling and see the
   alignment line and label before it snaps.
6. Equalize three gaps from the canvas spacing tool and verify one parent `gap`
   class changes.
7. Select an element, open Edit with AI, ask for an alignment change, preview the
   proposal, accept it, undo it, redo it, and save it.

## 20. Implementation sequence

### Phase 0: stabilize the foundation

Deliverables:

- Add typed `NodeRef`, `LayoutClassification`, and `EditorOperation` contracts.
- Add source shape metadata during Babel tagging or through a dev-server source
  index.
- Add editor diagnostics showing current classification and safety reason.
- Stop the silent flow-to-absolute fallback.
- Add focused tests for current reorder and id resolution.

Exit gate:

- Every selected element has an explainable layout badge.
- Dragging a flow item can no longer accidentally destroy layout flow.

### Phase 1: visible smart snapping

Deliverables:

- Extract the geometry and snap engines from `SelectionBox.tsx`.
- Add candidate scoring, zoom-aware threshold, and hysteresis.
- Render live edge, center, guide, padding, and equal-gap feedback.
- Make Alt disable snapping and Shift axis lock operate before snap scoring.

Exit gate:

- The user can always see what aligns with what and why the element snapped.

### Phase 2: real spacing tools

Deliverables:

- Measure all padding, margin, row gap, and column gap values.
- Add on-canvas padding and gap handles.
- Add exact value entry, linked sides, mirrored sides, and rhythm suggestions.
- Save parent gap changes instead of per-child margins when appropriate.

Exit gate:

- Repeated spacing can be inspected, equalized, and saved from the canvas.

### Phase 3: section and element reorder

Deliverables:

- Implement row, column, wrap, grid, and section insertion calculations.
- Add canvas ghost and insertion indicators.
- Turn Layers into a collapsible sortable tree.
- Support drag reorder and keyboard reorder for safe same-parent JSX siblings.
- Add auto-scroll and blocked-drop explanations.

Exit gate:

- Sections can be moved above/below each other from canvas and Layers.
- Flow items can change order without absolute positioning.

### Phase 4: reparent and swap

Deliverables:

- Add same-file safe reparent operation.
- Add swap positions.
- Add function-preserving visual-content swap.
- Add transaction-level undo and source preconditions.
- Validate interactive nesting and event-handler preservation.

Exit gate:

- The user can deliberately move an item into another container or swap two
  items with a clear preview and safety explanation.

### Phase 5: exact selected-element AI handoff

Deliverables:

- Build the versioned element context bundle with source excerpt and file hash.
- Add Edit with AI button and `Cmd/Ctrl + K` drawer.
- Ship Level A context copy/handoff first.
- Add provider interface and Codex SDK adapter behind the Vite dev server.
- Convert AI proposals to typed operations or reviewed source diffs.
- Add accept, reject, revise, undo, and stale-context handling.

Exit gate:

- A user can point to one exact element, talk about it with Codex, and review a
  scoped change without explaining file names or guessing which JSX node it is.

### Phase 6: professional editor controls

Deliverables:

- Responsive breakpoint editing.
- Multi-selection alignment and distribution.
- Lock, hide, outline mode, search, breadcrumbs, and source navigation.
- Improved typography, border, shadow, and size controls.
- Command palette and shortcut reference.

Exit gate:

- Daily layout work no longer requires switching to code for routine structural
  and spacing changes.

### Phase 7: advanced and deliberately deferred work

- Data-level reorder for `.map()` output.
- Cross-file component movement and import repair.
- Grid track editing and named areas.
- Constraints and pinning across responsive frames.
- Persistent project guides.
- Multiplayer presence or collaboration.
- Plugin API for custom property editors and AI actions.

These are valuable only after the basic editor is predictable and safe.

## 21. Immediate next build slice

The highest-value first implementation slice should contain exactly these items:

1. Replace `isSectionLike` with the explicit layout classifier.
2. Remove the flow-to-absolute fallback.
3. Render live snap guides and labels from structured snap candidates.
4. Add vertical section insertion indicators and safe same-parent reorder.
5. Add drag reorder to Layers for the same operation.
6. Upgrade Send to Codex into the versioned selection bundle and rename it
   `Edit with AI`.

This slice directly fixes the most damaging problems: invisible snapping,
unreliable section movement, missing element reorder, and ambiguous AI context.

## 22. Definition of done

The editor is ready for serious use when all of the following are true:

- A user never has to guess whether a drag will move, reorder, reparent, or swap.
- Snapping always shows the target relationship before commit.
- Sections and flow items remain in document flow after reorder.
- Layers and canvas expose the same structural operations.
- Swapping can preserve function when requested.
- Spacing can be measured, edited, equalized, and saved at the correct parent or
  child level.
- Unsafe source shapes are blocked with a specific explanation.
- Undo restores both visual preview and staged source intent.
- AI receives the exact selected node, source excerpt, geometry, and context.
- AI changes are previewed and reviewed before they affect source.
- Save reparses and typechecks touched code.
- Production builds contain none of the editor instrumentation.

