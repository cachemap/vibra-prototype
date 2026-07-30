# Vibra Component Decomposition Plan

Source plan: `docs/plan/IMPLEMENTATION_PLAN.md`
Design system: `docs/plan/DESIGN_SYSTEM.md`
Checklist: `docs/plan/COMPONENT_DECOMPOSITION_CHECKLIST.md`
Purpose: split five page-dense routes into feature modules organized by data dependency, using TanStack Query cache sharing and React Context instead of prop drilling.

## Why This Work

Five `"use client"` pages hold 5,914 lines, and the shape is pathological:

| Page | Lines | Components in file |
|---|---|---|
| `app/projects/[projectId]/page.tsx` | 2757 | 2 — one is 2417 lines, its JSX return alone is 1419 lines at ~18 levels deep |
| `app/projects/[projectId]/events/[eventId]/page.tsx` | 1042 | 1 |
| `app/libraries/page.tsx` | 948 | 2 — Suspense wrapper + 753-line body |
| `app/projects/page.tsx` | 813 | 3 |
| `app/share/[shareToken]/page.tsx` | 354 | 1 |

The data layer is not the problem and does not change. `features/projects/queries.ts` exposes 8 query hooks and 33 mutation hooks covering all 43 `ProjectRepository` methods 1:1, behind a hierarchical `projectQueryKeys` factory. No page touches the repository directly; the only `app/` imports from it are type-only.

**That is the lever.** Because every read goes through a keyed query hook, an extracted component can re-call `useProjectWorkspaceQuery(projectId)` or `useDeviceWorkspaceQuery(deviceId)` and get a cache-deduped result. The only things that need to travel down the tree are *identifiers* and *UI state* — never server data. Contexts carry scope, not data.

What actually hurts today:

- **No React contexts exist.** `createContext` has zero hits across `app/`, `components/`, `features/`, `data/`, `domain/`, `lib/`. The only provider is `QueryClientProvider`. Cross-cutting concerns — feedback messages, the audio-preview player, workspace selection — are page-level `useState` read by JSX 1,400 lines below.
- **Re-render cost.** Every `setState` on the project page re-renders the 1419-line tree, including `setPlayheadByScheduleKey`, which fires **once per animation frame** during timeline playback (`features/projects/audio-preview.tsx:194`).
- **Verbatim duplication.** `messageForError` ×5 (differing only in fallback copy); the entire share-link feature — 3 state fields, 4 handlers, a `Dialog`, and a `ConfirmDialog`, ~140 lines — duplicated between the project and event pages; four identical recursive asset-tree utilities written twice against the same `AssetLibraryFolderNode` type; `formatSeconds` ×2; `shareTokenFor` ×2; `behaviorCopy` ×2; ~12 hand-written `x === 1 ? "" : "s"`.
- **Structural duplication.** The `ActionMenu` + destructive `MenuItem` + `Trash2` block at 16 call sites backed by 7 separate "which menu is open" state slots; 9 hand-rolled `Cancel` + `form=`-submit dialogs; the loading/error early-return scaffold in 5 places; the workspace tab bar written twice verbatim.
- **Bug-shaped duplication.** The desktop-table and mobile-card branches recompute the same derived values independently — `row.eventTriggers.reduce((total, t) => total + t.playbacks.length, 0)` runs in both event branches — so the two renderings can silently disagree. Same pattern in the projects list and the libraries list/tile views.
- **Quadratic matrix lookup.** `matrixEntries.find(...)` runs per cell inside the grid render (`app/projects/[projectId]/page.tsx:1874-1878`), i.e. O(rows × cols × entries). The same lookup is written three times.

Intended outcome: no file over ~260 lines, each with one clear data dependency; pages become thin composers. **This is a pure refactor — zero behavior and zero visual change.** Copy, DOM structure, class strings, ARIA attributes, and test ids all survive byte-identical.

## Verified Constraints

Checked directly against source. Two of these kill approaches that look obviously correct.

1. **`ActionMenu` already self-closes** on outside `pointerdown` and Escape (`components/primitives/action-menu.tsx:97-124`). A `RowActionsMenu` owning its own `open` state is therefore *behaviorally identical* to the 7 hoisted slots: pointerdown on menu B's trigger closes A before B's click toggles it open. No menu-open context, no shared hook.
2. **Tab bodies are a mutually-exclusive ternary** (`app/projects/[projectId]/page.tsx:1658`, `1952`) — the inactive branch unmounts. The 6 matrix-selection fields survive tab switches *only because they live on the page*. Moving them into a `MatrixTab` local hook would silently break persistence. **This is the highest-risk trap in the refactor.**
3. **All 8 project-page dialogs share one `<DialogOverlay align="end" open={dialog !== null}>`** (line 2505), and the events page does the same (line 827). The dialog layer extracts as *one* component, not eight independently-mounted dialogs.
4. **The events-page and share-page timeline lane builders are not the same function.** They run over different aggregate shapes — `DeviceWorkspaceAggregate` with `assetById`/`triggerById` Maps vs `SharingLinkPreviewAggregate` with `playback.asset` and `eventTrigger.trigger` inlined — and their `meta` fields differ structurally: the events page returns a `<Switch>` element, share returns a joined string. Do not unify. Only `formatSeconds` and the `0.45` tail constant are genuinely shared.
5. **The libraries asset table and the project-detail asset table are not the same component.** 6 columns vs 5, different column semantics (Library/Last modified vs Source), `iconMap`-driven folder icons vs a fixed `BookOpen`, tiles view on one only, different preview fallback copy ("Visual only" vs "Visual"), different action-menu wrappers, and different selection mechanics (URL params vs component state). Unifying costs a ~10-prop config object and makes the pixel diff unverifiable.
6. **`LoadingState` silently ignores its `description` prop** (`components/primitives/states.tsx:41`). Every page passes one and it is dropped. Keep passing it — removing it is a change — but do not design around it.

## Context Layer

One rule governs all of it:

> **Providers receive their subtree via `children`, never render it inline.** A provider state change then re-renders only the provider's own function body; `children` is the same element reference, React bails out of that subtree, and only actual `useContext` consumers re-render. Put this as a comment in each provider file.

Corollary: **split every context into a volatile-value context and a stable-actions context**, so a leaf that only dispatches never subscribes to something changing at 60fps or on every keystroke.

| Candidate | Verdict |
|---|---|
| Project workspace scope | Adopt — 2 contexts, 1 provider |
| Feedback / status message | Adopt — 2 contexts, page-scoped, not app-global |
| Audio preview | Adopt — 2 contexts, volatile state + stable actions |
| Dialog and delete orchestration | Adopt, folded into the workspace *actions* context |
| Menu-open slot | Reject — solved by a self-managed `RowActionsMenu` (constraint 1) |
| Server data in context | Reject — re-call the query hook |
| Matrix selection | Reject a context, but the state must stay hoisted (constraint 2) |

### `features/project-workspace/workspace-scope-context.tsx`

Two contexts, one provider. The value context carries resolved identifiers and the hoisted matrix selection; the actions context carries navigation, selection setters, and the dialog/delete dispatchers.

```ts
export type ProjectWorkspaceSelection = {
  activeAssetFolderId: AssetLibraryFolderId | null;
  activeAssetLibraryId: AssetLibraryId | null;   // resolved: selection ?? first project library
  activeTab: "events" | "assets" | "matrix";
  collectionId: CollectionId | null;             // resolved: ?collection= ?? first
  deviceId: DeviceId | null;                     // resolved: ?device= ?? first
  matrixBehavior: ResolutionBehaviorName | null; // hoisted per constraint 2
  matrixFilterAnchor: MatrixFilterAnchor | null;
  matrixFilterAxis: MatrixAxis | null;
  matrixIncomingEventId: EventId | null;
  matrixPlayingEventId: EventId | null;
  matrixTargetEventId: EventId | null;
  projectId: ProjectId;
  searchTerm: string;
};

export type ProjectWorkspaceActions = {
  goToCollection: (collectionId: CollectionId) => void;
  goToDevice: (deviceId: DeviceId) => void;
  goToEvent: (eventId: EventId) => void;
  openDialog: (request: ProjectDialogRequest) => void;  // union; carries its seed values
  requestDelete: (target: DeleteTarget) => void;
  selectAssetFolder: (folderId: AssetLibraryFolderId | null) => void;
  selectAssetLibrary: (libraryId: AssetLibraryId) => void;
  setActiveTab: (tab: "events" | "assets" | "matrix") => void;
  setMatrixSelection: (next: Partial<MatrixSelection>) => void;
  setSearchTerm: (term: string) => void;
};

export function ProjectWorkspaceScopeProvider(props: { children: ReactNode; projectId: ProjectId }): JSX.Element;
export function useProjectWorkspaceSelection(): ProjectWorkspaceSelection;  // throws outside provider
export function useProjectWorkspaceActions(): ProjectWorkspaceActions;
export function useProjectDialogRequest(): ProjectDialogRequest | null;     // narrow third value hook
```

Implementation notes that matter:

- The provider calls `useProjectWorkspaceQuery(projectId)` and `useAssetLibraryTreeQuery(activeAssetLibraryId)` **only to resolve identifiers** (`?device=` match else `devices[0]`), never to expose data. This is the scope-not-data split, and it is why children can each call the same query and hit cache.
- `goTo*` must stay referentially stable even though `useRouter()` and `useSearchParams()` change identity per navigation. Use a write-only-latest ref latched during render:

  ```ts
  const navRef = useRef({ collectionId, deviceId, projectId, router, searchParams });
  navRef.current = { collectionId, deviceId, projectId, router, searchParams };
  const goToDevice = useCallback((deviceId: DeviceId) => {
    const nav = navRef.current;
    nav.router.push(hrefWithParams(`/projects/${nav.projectId}`, nav.searchParams, { device: deviceId }));
  }, []);
  ```

  Safe because the ref is never read during the same render pass. Comment it — it is the only clever thing in this plan.
- The actions object is `useMemo(..., [])` since every member is a `useCallback([])`; the selection object is `useMemo` over its scalar fields.
- `openDialog` and `requestDelete` replace the 7 `openDelete*` functions (lines 673-755) and the 6 `open*Dialog` functions (618-671) — genuine 4-way drilling today, reached from the sidebar, all three tab bodies, and the page header. They are stable dispatchers, so they belong here rather than in a fourth context. `requestDelete` calls `clearFeedback()` internally, reproducing the existing "clear feedback, set target" prelude; menu-close becomes the menu's own concern per constraint 1.
- The provider owns the `dialog` and `deleteTarget` state and computes each request's seed values — default platform id, current collection name, first import candidate — since it already holds the workspace query for resolution.
- `searchParamsFor` (138-162) becomes a private helper over `lib/search-params.ts`.

Replaces page lines 342-348, 360-379, 405-425, 455-467, 592-671, and 673-755.

### `features/feedback/feedback-context.tsx`

The single most duplicated concept: 5 divergent `feedback` `useState`s, 4 in-dialog `<p>` renders, roughly 25 `catch { setFeedback(messageForError(error)) }` blocks, plus the dual `sessionStorage` / `?feedback=` flash channel.

```ts
export type FeedbackActions = {
  clearFeedback: () => void;
  reportError: (error: unknown) => void;
  /** Wraps the try/catch: clears, awaits work, sets success copy, converts errors. */
  runWithFeedback: <T>(options: {
    onSuccess?: (value: T) => string | null;
    work: () => Promise<T>;
  }) => Promise<T | undefined>;
  setFeedback: (message: string | null) => void;
};

export function FeedbackProvider(props: {
  children: ReactNode;
  errorFallback: string;
  initialMessage?: string | null;
}): JSX.Element;
export function useFeedbackMessage(): string | null;    // volatile value
export function useFeedbackActions(): FeedbackActions;  // stable
export function FeedbackText(props: { className?: string }): JSX.Element | null;
```

- **Page-scoped, not app-global.** The error fallback string differs per surface, and an app-global message would survive route changes — a behavior change.
- `FeedbackText` renders exactly `{message ? <p className="text-sm text-gray-600">{message}</p> : null}` and collapses the 4 in-dialog copies verbatim. The two **page-level** banners (`app/libraries/page.tsx:645` vs `app/projects/page.tsx:551-555`) have divergent markup — read `useFeedbackMessage()` in place there and leave the markup alone. Harmonizing them is a visual change and is out of scope.
- `runWithFeedback` collapses the 15 try/catch blocks on the project page (820-1261) and roughly 5 on each other page. Success copy stays at the call site via `onSuccess`, so wording is preserved verbatim.
- Split rationale: `reportError` is called from deep leaves such as row delete handlers. If those subscribed to the message value, every feedback change would re-render the whole tab body.

### `features/projects/audio-preview-context.tsx`

```ts
export type AudioPreviewState = {
  activeKey: string | null;
  isPlaying: boolean;
  playheadByScheduleKey: Readonly<Record<string, number>>;
};
export type AudioPreviewActions = {
  isSchedulePlaying: (scheduleKey: string) => boolean;
  playItem: (item: AudioPreviewItem) => Promise<void>;
  playSchedule: (scheduleKey: string, items: readonly AudioPreviewItem[], durationSeconds?: number) => void;
  playheadFor: (scheduleKey: string) => number | null;
  stop: () => void;
  stopSchedule: (scheduleKey: string) => void;
};

export function AudioPreviewProvider(props: { children: ReactNode }): JSX.Element;
export function useAudioPreviewState(): AudioPreviewState;
export function useAudioPreviewActions(): AudioPreviewActions;
/** Context-reading wrapper; renders DOM byte-identical to AudioPreviewIconButton. */
export function AudioPreviewButton(props: { item: AudioPreviewItem }): JSX.Element;
```

- Wraps the existing `useAudioPreviewPlayer()` unchanged. The hook is already instantiated exactly once per page, so hoisting it into a provider at page root is behavior-identical.
- **Keep `AudioPreviewIconButton` (props-based) exported** — it stays the testable unit and the share page's read-only lanes keep using it. `AudioPreviewButton` is a 6-line wrapper reading `activeKey`, `playItem`, and `stop` from context. Seven call sites collapse to `<AudioPreviewButton item={...} />`.
- `isSchedulePlaying` and `playheadFor` derive from volatile state, so back them with a ref-latched read inside the stable-actions context and expose `playheadByScheduleKey` on the state context. Then `EventTimeline` is the **only** per-frame subscriber, and playback animation re-renders one lane subtree instead of a 1042-line page.
- Verify `playItem`'s `useCallback` deps are actually stable. If they are not, ref-latch inside the provider rather than editing the hook.

### Rejected, With Reasons

- **A context carrying `ProjectWorkspaceAggregate`, `DeviceWorkspaceAggregate`, or the asset tree.** It duplicates TanStack Query's job, and since *every* mutation invalidates `projectQueryKeys.all`, one giant value object would churn on every write and defeat the point entirely.
- **A menu-open context** — constraint 1.
- **An app-global feedback or toast context** — behavior change, and the design system has no toast primitive.
- **A `MatrixSelectionContext`.** The 6 fields are used only inside the matrix subtree, but per constraint 2 they must survive the tab body unmounting. Hoist them into `ProjectWorkspaceScopeProvider`'s value context, which is the page-equivalent scope, and pass them down from `MatrixTab`'s parent.

## Shared Utility Layer

`lib/` exists and is empty. Six files, all pure, and — apart from `errors.ts` — free of `@/domain` imports. That boundary is what makes the directory worth having.

**`lib/errors.ts`.** The fallback becomes a **required second parameter**, with the four distinct strings as named constants: `workspaceErrorFallback`, `libraryErrorFallback`, `projectsErrorFallback`, `shareErrorFallback`. No default — a default would silently swap copy on one surface. Each `FeedbackProvider` receives `errorFallback`, so call sites shrink to `reportError(error)`. Transcribe all five current strings character-for-character; two may already be identical.

**`lib/format.ts`.** `formatSeconds`, plus **two named date functions rather than a variant parameter**: `formatAssetDate` (`{ day, month }`, from `app/libraries/page.tsx:82`) and `formatProjectDate` (`{ day, month, year, timeZone: "UTC" }`, from `app/projects/page.tsx:133`). A variant parameter invites a wrong call site that silently changes rendered text; two names make the divergence greppable. Harmonizing the two formats is a deliberate visual change and belongs in its own commit.

**`lib/plural.ts`.** `pluralSuffix(count)` collapses all 12 inline `x === 1 ? "" : "s"` at zero risk. `countLabel(count, singular, plural?)` is for cascade summary strings, used only where the output is provably identical. No `<Pluralize>` component — it would inject text nodes and could alter whitespace.

**`lib/tree.ts`.** Generic core plus typed wrappers:

```ts
export type TreeShape<TNode> = {
  childrenOf: (node: TNode) => readonly TNode[];
  idOf: (node: TNode) => string;
};
export const flattenTree: <TNode>(root: TNode, shape: TreeShape<TNode>) => TNode[];
export const findTreeNode: <TNode>(roots: readonly TNode[], id: string, shape: TreeShape<TNode>) => TNode | null;
export const pathToTreeNode: <TNode>(roots: readonly TNode[], id: string, shape: TreeShape<TNode>) => TNode[];
```

Wrappers keep the current readable names and branded id types: `features/assets/asset-folder-tree.ts` (`flattenAssetFolders`, `findAssetFolderNode`, `pathForAssetFolder`, `countAssetFolderDescendants` — **one implementation replaces two identical sets**, `app/libraries/page.tsx:93-152` and `app/projects/[projectId]/page.tsx:288-339`, the clearest tree win) and `features/projects-list/project-folder-tree.ts`. Note `countFolderDescendants` returns `{ assets, folders }` while `countProjects` returns a number — genuinely different folds, so keep them as separate wrappers.

**`lib/search-params.ts`.** `hrefWithParams(basePath, current, updates)` where a `null` value deletes the key. Collapses project-detail `searchParamsFor` (138-162), libraries `searchParamsFor` (154-186, whose hardcoded `/libraries` base becomes the `basePath` argument), and projects `folderHrefFor` (301-302, upgrading string concatenation to `URLSearchParams`). **Verify byte-identical output** for both the null and non-null cases before adopting.

**`lib/flash-message.ts`** (needs `"use client"`; touches `window`). `hrefWithFlashMessage`, `readAndClearFlashMessage`, and `writeFlashMessage` over the `"vibra.projects.feedback"` key. Preserve the exact dual channel — `sessionStorage` **and** `?feedback=` — because one page reads each. Keep the `typeof window === "undefined"` guard so it stays safe inside a lazy `useState` initializer.

Deliberately **not** in `lib/`, because they are domain-coupled: `shareTokenFor` goes to `features/sharing/share-token.ts`; `assetExtensionFor` and `assetSourceLabelFor` to `features/assets/asset-metadata.ts`; `behaviorCopy` and friends to `features/matrix/behavior.ts`.

## New Primitives

Four additions, each exported from `components/primitives/index.ts` in alphabetical position, each carrying `"use client"` only if it uses hooks.

**`badge.tsx`** — `{ children, className?, variant?: "outline" | "solid" }`. `solid` is `rounded-lg bg-gray-100 px-2 py-1` (5 sites); `outline` is the share-page variant (1 site). `className` carries site-specific `truncate` and `text-xs` so output stays byte-identical. Collapses `app/libraries/page.tsx:620,623,793,811`, `app/projects/[projectId]/page.tsx:2049`, `app/share/[shareToken]/page.tsx:197`.

**`row-actions-menu.tsx`** — highest leverage, **16 call sites**.

```ts
export type RowActionsMenuItem = {
  destructive?: boolean;
  icon?: ReactNode;
  label: string;
  onSelect: () => void;
};
type RowActionsMenuProps = {
  align?: "end" | "start";
  disabled?: boolean;
  grouped?: boolean;
  icon?: LucideIcon;
  items: readonly RowActionsMenuItem[];
  label: string;
  size?: "compact" | "default";
};
```

Owns its `open` state internally per constraint 1, which deletes all 7 menu-open state slots. **Careful:** libraries' `renderActionsMenu` emits `<MenuItem>` *without* a `MenuGroup` wrapper while the project page always wraps — inspect whether `MenuGroup` adds a DOM node or class; if it does, keep the `grouped?` prop rather than normalizing. **Leave the outer wrapper span or div at the call site** — three variants exist, one with `stopPropagation`, and the wrapper is a layout concern of the row. Encoding it as a prop is worse than leaving it.

**`form-dialog.tsx`** — `{ cancelLabel?, children, className?, disabled?, formId, onCancel, onSubmit, open?, size?, submitLabel, title }`. Renders a bare `Dialog` whose `actions` are the `Cancel` plus `form={formId} type="submit"` pair, wrapping `<form className="grid gap-4" id={formId}>`. It renders **no** `DialogOverlay` of its own — the overlay stays owned by the page's dialog layer per constraint 3. Collapses 9 sites: libraries 860-884, projects 557-583, project detail 2557/2626/2657/2697, events 879/921/965. Audit all nine first and leave any outlier (extra action button, non-primary submit) on a raw `Dialog`. The 4-button share dialog explicitly does not use this.

**`page-state.tsx`** — `PageStateScaffold({ breadcrumbs, children })` renders exactly `<section className="grid gap-4 px-4 py-5"><PageHeader breadcrumbs border={false} className="px-0 py-0" />{children}</section>`. Collapses project detail 1263-1304 (three branches), libraries 482-506, projects 446-474.

### Rejected Primitives

- **A `QueryStateBoundary` render-prop taking a `UseQueryResult`.** The four surfaces genuinely differ: share has no `PageHeader` and different padding, the project page's third branch renders the *loading* state rather than an error, and libraries and projects render their states inline instead of early-returning. Moving the early return out of the page would also change where hooks run relative to the returns. Keep the early returns in the page and shrink each to 3 lines.
- **A `RecordList<T>` for the dual desktop/mobile and list/tile renders.** It would have to express 6-vs-5 columns, per-cell renderers, row-click vs no-click, `stopPropagation` wrappers, different empty states, and two entirely different mobile card layouts. That is a table framework, and it makes the pixel diff unverifiable.

  **Instead, extract per-row *derivation* and per-cell *presentation* and keep two JSX branches.** This is where the real, bug-shaped duplication lives:

  - `features/project-workspace/event-row-model.ts` — computing `EventRowModel[]` once in `EventsTab` fixes the double-compute *and* guarantees the two branches can never disagree.
  - `features/assets/asset-cells.tsx` — `AssetNameCell` and `AssetPreviewCell({ asset, fallbackLabel, previewKeyPrefix })`, shared by the libraries table, the libraries tiles, and the project asset table; `fallbackLabel` carries the "Visual only" vs "Visual" divergence.
  - `features/projects-list/project-row-model.ts` — same treatment.

- **Converting the workspace tab bar to the existing unused `Tabs` primitive.** Tempting, since it would collapse two 35-line duplicated blocks, but it emits different DOM and classes, and the current buttons carry `aria-selected`, which the e2e suite may select on. Extract `workspace-tab-bar.tsx` reproducing the *existing* markup exactly, used twice. Converting to `Tabs` is a separate, visually verified commit.

## Target Module Tree

`features/projects/queries.ts` **stays where it is** — every page imports it, and moving it is churn for zero benefit.

```
lib/
  errors.ts  flash-message.ts  format.ts  plural.ts  search-params.ts  tree.ts

components/primitives/
  badge.tsx  form-dialog.tsx  page-state.tsx  row-actions-menu.tsx   (+ index.ts)

features/
  projects/
    queries.ts                       unchanged
    audio-preview.tsx                unchanged, keeps AudioPreviewIconButton
    audio-preview-context.tsx        ~90
  feedback/
    feedback-context.tsx             ~110
  sharing/
    share-token.ts                   ~10
    use-share-link.ts                ~120
    share-link-dialog.tsx            ~90
  assets/
    asset-authoring-dialogs.tsx      unchanged
    asset-cells.tsx                  ~60
    asset-folder-tree.ts             ~50
    asset-metadata.ts                ~25
  matrix/
    behavior.ts                      ~70
    matrix-axis-filter.tsx           moved from features/projects/
    matrix-grid.tsx                  ~180
    matrix-resolution-panel.tsx      ~120
    matrix-tab.tsx                   ~140
    matrix-toolbar.tsx               ~90
  project-workspace/
    asset-library-rail.tsx           ~70
    assets-tab.tsx                   ~130
    delete-target.ts                 ~60
    event-row-model.ts               ~40
    events-cards.tsx                 ~70
    events-tab.tsx                   ~110
    events-table.tsx                 ~80
    project-asset-table.tsx          ~120
    workspace-delete-confirm.tsx     ~90
    workspace-dialogs.tsx            ~260
    workspace-empty-state.tsx        ~45
    workspace-header.tsx             ~60
    workspace-layout.tsx             ~90
    workspace-mobile-controls.tsx    ~90
    workspace-scope-context.tsx      ~150
    workspace-sidebar.tsx            ~150
    workspace-tab-bar.tsx            ~45
  events/
    event-delete-confirms.tsx        ~70
    event-derivations.ts             ~90
    event-dialogs.tsx                ~200
    event-header.tsx                 ~70
    event-timeline.tsx               ~200
  libraries/
    library-asset-table.tsx          ~120
    library-asset-tiles.tsx          ~110
    library-delete-confirm.tsx       ~80
    library-dialogs.tsx              ~130
    library-rail.tsx                 ~80
    library-toolbar.tsx              ~90
    use-library-selection.ts         ~90
  projects-list/
    create-folder-dialog.tsx         ~50
    create-project-dialog.tsx        ~160
    project-folder-tree.ts           ~40
    project-row-model.ts             ~50
    projects-cards.tsx               ~70
    projects-delete-confirm.tsx      ~60
    projects-table.tsx               ~80
    projects-toolbar.tsx             ~70
  share-preview/
    share-preview-device.tsx         ~80
    share-preview-event.tsx          ~140
    share-preview-header.tsx         ~70
    share-preview-matrix.tsx         ~80
```

New files follow the conventions already established in `features/`: `"use client"` at the top; a local non-exported `type XProps`; props alphabetized in the type, the destructuring, and the JSX attributes; `readonly T[]` and `ReadonlySet<Id>` for collections; branded ids from `@/domain`; `on*` callbacks taking domain values rather than events; `@/` alias imports.

## Module Notes

### `features/sharing/` — the clearest win, do it first

Verbatim-duplicated between the project and event pages. Extract as a **behavior hook plus one dialog file**, not a monolith, since the two pages open it for different `ShareTarget`s from different buttons.

- `share-token.ts` — `shareTokenFor(link)`, replacing project detail 167 and events 83.
- `use-share-link.ts` — `useShareLink(): ShareLinkController` with `{ cancelDelete, close, confirmDelete, copyLink, isDeleting, isOpen, label, link, openPreview, openShare, pendingDelete, requestDelete }`. Owns the 3-field state cluster and calls `useGenerateSharingLinkMutation()`, `useDeleteSharingLinkMutation()`, and `useFeedbackActions()` itself. Replaces project detail 380-383 plus 757-818 and events 133-136 plus 420-481. **Verify the success and error copy is identical between the two pages before merging; if it differs, take it as hook options.**
- `share-link-dialog.tsx` — two exports: `ShareLinkDialog` (the 4-action-button `Dialog`, 2505-2555) and `ShareLinkDeleteConfirm` (the `ConfirmDialog`, 2492-2503). Two exports from one file so a page can place the `Dialog` *inside* its shared `DialogOverlay` and the `ConfirmDialog` outside it, matching today's DOM.

Net: roughly 140 duplicated lines × 2 pages become ~220 lines in one module, and both pages lose 3 state fields, 4 handlers, and ~70 lines of JSX each.

### `features/matrix/`

- `behavior.ts` — `behaviorCopy`, `behaviorIconFor`, `behaviorCellClass`, `behaviorBubbleClass`, replacing project detail 171-226 and the share page's `behaviorCopy` duplicate (41-47). Prefer returning the icon *component reference* so the file stays `.ts`.
- `matrix-axis-filter.tsx` — moved unchanged from `features/projects/`; `data-testid="matrix-axis-filter"` rides along. One import site to update.
- `matrix-tab.tsx` — replaces 1658-1951 as the orchestrator. Calls `useDeviceWorkspaceQuery(deviceId)` itself for a cache hit. Receives the 6 hoisted matrix fields plus the setter from scope context.
- `matrix-toolbar.tsx` — header row, coverage stat, and the `"toolbar"` axis-filter anchor (1701).
- `matrix-grid.tsx` — **must keep `data-testid="collision-matrix-grid"` on the same element** (1800) and both remaining axis anchors (1815, 1827). Calls the 6 matrix mutations itself; they are used nowhere else, and all invalidate `projectQueryKeys.all`, so no coordination is lost. **Fix the quadratic lookup** by precomputing a `Map` keyed `` `${playingEventId}:${incomingEventId}` `` — the same `.find` is written at 565-569, 1220-1223, and 1874-1878.
- `matrix-resolution-panel.tsx` — the selected-cell detail and behavior picker; calls the upsert and delete entry mutations.
- `renderMatrixAxisFilter` (1122-1140) becomes a real `MatrixAxisFilterAnchor` component. It is a component in all but name today; naming it is free.

### `features/project-workspace/`

| Component | Calls itself | Receives from props or context |
|---|---|---|
| `workspace-header` | `useProjectWorkspaceQuery` | `shareController` prop |
| `workspace-sidebar` | `useProjectWorkspaceQuery`, `useDeviceWorkspaceQuery` | scope and actions contexts only |
| `workspace-mobile-controls` | same two | scope and actions contexts |
| `workspace-tab-bar` | none | `activeTab`, `ariaLabel?`, `onSelect` |
| `assets-tab` | `useProjectWorkspaceQuery`, `useAssetLibrariesQuery`, `useAssetLibraryTreeQuery` | scope and actions contexts |
| `asset-library-rail` | `useAssetLibrariesQuery` | `libraries`, `onSelect`, `selectedId` |
| `project-asset-table` | none | `items`, `onDeleteAsset`, `onDeleteFolder`, `onOpenFolder` |
| `events-tab` | `useDeviceWorkspaceQuery` | scope and actions contexts |
| `events-table`, `events-cards` | none | `onDeleteEvent`, `onOpenEvent`, `rows: readonly EventRowModel[]` |
| `workspace-dialogs` | all create and update mutations | dialog request from context |
| `workspace-delete-confirm` | all 9 delete mutations | delete target from context |

- `workspace-sidebar.tsx` replaces 1386-1538. **Preserve `data-testid="device-list"` (1444) and `data-testid="collection-list"` (1515)** on the same `div`s, and keep the "Systems" and "Collections" headings verbatim. "Systems" contradicts the canonical vocabulary in `docs/plan/DESIGN_SYSTEM.md`, but **copy is not changed in a pure refactor** — it is recorded as a follow-up below. The sidebar owns the search input via scope `searchTerm`/`setSearchTerm` and does its own device and collection filtering, today at 1309-1320.
- `workspace-empty-state.tsx` is today's `EmptyProjectWorkspace` (239-278), lifted verbatim.
- `delete-target.ts` holds the `DeleteTarget` union, `deleteActionLabelFor` (227-238), and the real win: `cascadeSummaryFor` and `deleteBodyCopyFor` as **`switch` statements over the discriminant**, replacing the 18-line nested ternary chain (2467-2485) and the `startsWith("matrix")` string sniff (2487). Uses `pluralSuffix`. Pure and unit-testable, and the highest-value readability fix in the file.
- `workspace-dialogs.tsx` renders the **single** `<DialogOverlay align="end" open={request !== null}>` containing `ShareLinkDialog` plus six `FormDialog`s. Each form's local state (360-367) moves into a small per-dialog component inside this file, matching the `asset-authoring-dialogs.tsx` convention — except that the dialog also calls its own mutation. That is a deliberate upgrade: the mutation *is* the persistence, and since everything invalidates `all` there is no page-level coordination to preserve.

Target `app/projects/[projectId]/page.tsx`, about 110 lines:

```tsx
export default function ProjectPage() {
  const projectId = asEntityId<ProjectId>(useParams().projectId);
  const workspaceQuery = useProjectWorkspaceQuery(projectId);
  const flash = useSearchParams().get("feedback");
  // three early-return branches, each 3 lines via PageStateScaffold
  return (
    <FeedbackProvider errorFallback={workspaceErrorFallback} initialMessage={flash}>
      <AudioPreviewProvider>
        <ProjectWorkspaceScopeProvider projectId={projectId}>
          <ProjectWorkspaceLayout />
        </ProjectWorkspaceScopeProvider>
      </AudioPreviewProvider>
    </FeedbackProvider>
  );
}
```

`ProjectWorkspaceLayout` holds the `<section>` grid, header, sidebar, main, tab-body switch, and dialog layer. It is a sibling *under* the providers, so the `children` bailout rule applies.

### `features/events/`

- `event-derivations.ts` (pure) — `locateEventInCollections`, `previewItemsByEventTriggerId`, `timelineMaxSecondsFor`, `timelinePlaybacksFor`, plus an exported `timelineTailSeconds = 0.45`. Replaces page 166-236 and is directly unit-testable.
- `event-timeline.tsx` — **where the non-memoized 120-line inline `timelineLanes` builder (236-359) goes**, wrapped in `useMemo`. It cannot be a pure `lib/` function because lanes embed `IconButton`, `Switch`, and `Button` elements with callbacks; but as a memoized derivation inside a component receiving stable `on*` props, it recomputes only when event or playback state actually changes rather than on every keystroke in every dialog. This is also the sole `useAudioPreviewState()` subscriber, which is how the per-frame re-render collapses from the whole page to one subtree. **Careful:** wrap every `on*` in `useCallback` at the caller and include them in the deps — unstable identity either thrashes (harmless) or goes stale (a bug).
- `event-header.tsx`, `event-dialogs.tsx` (the single `DialogOverlay` plus `ShareLinkDialog` plus 4 `FormDialog`s), and `event-delete-confirms.tsx`.

Target: about 120 lines.

### `features/libraries/` — stays separate from the project assets tab

Per constraint 5, do not unify. What **is** shared and must be: `features/assets/asset-folder-tree.ts` (the four identical recursive utilities, one copy for two pages), `asset-metadata.ts`, `asset-cells.tsx`, and the already-shared `asset-authoring-dialogs.tsx`. That captures roughly 80% of the real duplication at roughly 5% of the risk.

- `use-library-selection.ts` owns the `?library=`, `?folder=`, and `?view=` reading plus `goToFolder`, `goToLibrary`, and `setView` over `lib/search-params.ts`, and resolves `folderPath`, `selectedFolder`, `selectedLibrary`, and `visibleItems` by calling the queries itself. It returns a plain object — **no context**, because the libraries page is depth 2 and contexts pay off at depth 3 or more.
- `library-rail.tsx`, `library-toolbar.tsx` (preserving the non-functional search input verbatim), `library-asset-table.tsx` (669-757), `library-asset-tiles.tsx` (759-848), `library-dialogs.tsx` (860-884, via `FormDialog`), `library-delete-confirm.tsx` (906-945, nested ternaries becoming a local `switch`).

Target: about 100 lines. Keep the existing `LibrariesPage` Suspense wrapper — it satisfies the `useSearchParams` lint rule that produced commit `d1028b6`.

### `features/projects-list/`

`project-folder-tree.ts`; `project-row-model.ts` (265-289 becoming `ProjectRowModel[]`, killing the double-compute); `projects-table.tsx` and `projects-cards.tsx` over one row model; `projects-toolbar.tsx` (preserving the `disabled` search input and its "Search arrives in a later slice" placeholder verbatim); `create-project-dialog.tsx` (the device preset picker, starter-event picker, and its own search state, calling `useCreateProjectMutation` itself); `create-folder-dialog.tsx`; `projects-delete-confirm.tsx`. The flash read moves to `readAndClearFlashMessage()` passed as `FeedbackProvider initialMessage`.

Target: about 95 lines.

### `features/share-preview/` — separate components, deliberately

**The share page does not reuse the authenticated components behind a `readOnly` prop.** Three reasons:

1. **Different data shape.** Share renders `SharingLinkPreviewAggregate`, which is flattened, with `playback.asset` and `eventTrigger.trigger` inlined and `createdByUser` present. The authenticated components render `DeviceWorkspaceAggregate` and need `assetById` and `triggerById` Maps. Sharing would require a per-view adapter layer costing more than two components.
2. **Different behavior surface.** Authenticated views carry `RowActionsMenu`, `Switch` toggles, add and delete buttons, and mutations. A `readOnly` flag threading through all of that is the "boolean prop that forks the render tree" anti-pattern, and it would put mutation hooks inside a component rendered on an unauthenticated route.
3. **Genuine output divergence** — constraint 4.

Shared instead: `formatSeconds`, `timelineTailSeconds` and the playback sort comparator, `behaviorCopy`, `AudioPreviewIconButton` / `AudioPreviewButton`, and `Badge`. **Do not** convert the hand-built header (190-207) to `PageHeader` — different markup and padding, and it renders an `<h1>` where `PageHeader` may not. Extract `share-preview-header.tsx` reproducing the current DOM, then `share-preview-device.tsx` (244-265), `share-preview-event.tsx` (269-306, absorbing the 56-131 derivation chain into its own `useMemo`), and `share-preview-matrix.tsx` (308-347).

Target: about 85 lines.

## Line Count Targets

| Page | Now | Target |
|---|---|---|
| `app/projects/[projectId]/page.tsx` | 2757 | ~110 |
| `app/projects/[projectId]/events/[eventId]/page.tsx` | 1042 | ~120 |
| `app/libraries/page.tsx` | 948 | ~100 |
| `app/projects/page.tsx` | 813 | ~95 |
| `app/share/[shareToken]/page.tsx` | 354 | ~85 |
| **total** | **5914** | **~510** |

Net repo line count stays roughly flat — about 55 new files averaging ~95 lines. The win is that no file exceeds ~260 lines and each has one data dependency.

## Implementation Order

Land directly on the implementation branch, one commit per stage, each independently green. Stages 1-3 are additive only and cannot break anything; visual-regression risk is concentrated in stage 4 and stages 6-12.

| Stage | Commit | Risk |
|---|---|---|
| 0 | Capture fresh baselines for the projects-list and share pages | none |
| 1 | `refactor: add lib/ pure utilities` plus unit tests, no call sites changed | none |
| 2 | `refactor: adopt lib/ utilities across pages` | low |
| 3 | `refactor: add Badge, FormDialog, PageStateScaffold, RowActionsMenu` | none |
| 4 | `refactor: adopt new primitives at existing call sites` — 16 menus, 9 dialogs, 6 badges, 5 scaffolds; deletes 7 menu-open state slots | medium; first DOM-touching stage |
| 5 | `refactor: extract features/sharing` | low-medium |
| 6 | `refactor: add feedback and audio-preview contexts`; `runWithFeedback` replaces ~25 try/catch blocks | medium-high |
| 7 | `refactor: extract features/matrix` — keep the 6 matrix fields on the page, threaded as props | high; deepest JSX, two test ids |
| 8 | `refactor: extract scope context, header, sidebar, tab bar`; move the matrix fields into the context | high |
| 9 | `refactor: extract assets and events tabs` plus row models | medium-high |
| 10 | `refactor: extract workspace dialogs and delete confirm`; page reaches ~110 lines | medium |
| 11 | `refactor: decompose event detail page`; memoize `timelineLanes` | medium-high |
| 12 | `refactor: decompose libraries page` plus shared `features/assets/*` | medium |
| 13 | `refactor: decompose projects list page` | low-medium |
| 14 | `refactor: decompose share preview page` | low |
| 15 | `chore: remove unused query hooks` — `useCollisionMatrixQuery`, `useSharingLinkQuery` | none |

Ordering rationale: stages 5 and 6 build the cross-cutting layers that 7-14 consume, so doing them out of order means rewriting extracted components. Within 7-10 the project page is dismantled inside-out, deepest tab body first, so it compiles at every step. Stages 11-14 are independent of each other and of 7-10 and can run in parallel once 1-6 land.

The 7-before-8 split is deliberate: keep the matrix state on the page in stage 7 and move it into the context in stage 8, so stage 7 stays focused on the JSX lift.

## Verification Plan

Verify at the end of each stage and fix anything found before committing.

Gate for every stage, all four, no exceptions:

```
pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e
```

`pnpm typecheck` runs `next typegen && tsc --noEmit`, so it catches route and param type drift. `pnpm lint` catches the `useSearchParams`-outside-Suspense rule that produced commit `d1028b6` — directly relevant when moving `useSearchParams` into `workspace-scope-context.tsx`, so keep the existing Suspense wrappers.

Structural invariants, grepped before and after every commit:

```
grep -rn 'data-testid' app components features | sort
grep -rno 'aria-label\|role="status"\|role="tab"\|aria-selected\|aria-checked' app features | sort
```

The first must always yield exactly 6 results, unchanged: `matrix-axis-filter`, `timeline-playhead`, `project-asset-libraries`, `device-list`, `collection-list`, `collision-matrix-grid`. Since `tests/e2e/projects.spec.ts` selects mostly by role, label, and text, the ARIA and role list is the stronger signal — capture it before stage 1 and diff after every stage. Any delta is a bug until proven otherwise.

Browser verification at the end of each stage against the running stack on `http://localhost:3000` via `/projects` with the seeded demo credentials. Re-capture and diff at matching viewport sizes:

- `docs/plan/visual-audit-captures/` covers `libraries-{list,tile}-{desktop,mobile}`, `project-{assets,events,matrix}-{desktop,mobile}`, `projects-{desktop,tablet,mobile}`, `workspace-crud-project-creator-*`, and `share-*`. Most relevant after stages 4, 7, 9, 10, and 12.
- `design-screenshots/` covers `collision-matrix.png`, `event-playback-timeline.png`, `event-list.png`, `empty-project-viewer.png`, `overlay-popups-1.png`, and `asset-library-explorer-{list,tile}-view.png`. Use for stages 7, 10, and 11.
- The projects-list and share pages have no complete baseline set. Capture them in stage 0 so stages 13 and 14 have something to diff against.

Behavior checks neither test suite covers, run manually at the noted stage:

1. **Matrix selection persistence across tab switches** (stages 7, 8). Select a cell, switch to Events, switch back — selection, behavior picker, and filter anchor must all be preserved. This is the constraint 2 trap.
2. **Two action menus** (stage 4). Open row A's menu, click row B's trigger — A closes and B opens in one click.
3. **Schedule playback animation** (stages 6, 11). Play a lane; the playhead animates smoothly and `timeline-playhead` is still present. While playing, type in a dialog — no stutter. Stutter means the `children` bailout rule was violated.
4. **Cross-page flash message** (stages 2, 6). Delete an event from the event page and the project page shows the message via the `?feedback=` channel; delete a project and `/projects` shows it via the `sessionStorage` channel. Both must work.
5. **Dialog stacking** (stage 10). Open the share dialog, click the delete link — the `ConfirmDialog` appears *over* the `DialogOverlay`.
6. **Timeline memo staleness** (stage 11). Add a playback, edit its offset, delete a lane — the timeline updates immediately each time.

Unit tests to add — free coverage for the pure extractions, and they make the mechanical stages verifiable without a browser: `tests/lib-tree.test.ts`, `tests/lib-format.test.ts`, `tests/lib-errors.test.ts`, `tests/event-derivations.test.ts`, and `tests/delete-target-copy.test.ts`. The last is a table test **transcribed from the current source**, asserting the new `switch` emits byte-identical strings for all 8 discriminants — the strongest available guarantee for the riskiest string refactor.

**Do not** add snapshot tests of the extracted components. They would lock in the *new* DOM rather than prove it matches the old, and they would rot immediately.

## ADRs To Write

- Context boundary policy: scope and UI state in context, server data via re-called query hooks; the `children` bailout rule and the split volatile-value / stable-actions shape.
- Feature module layout: what belongs in `lib/` (pure, no `@/domain`), in `components/primitives/` (no data hooks), and in `features/<domain>/` (may call query and mutation hooks).
- Why the share preview keeps separate read-only components instead of a `readOnly` prop on the authenticated ones.
- Why no generic table or record-list abstraction, and the row-model pattern adopted in its place.

## Follow-Ups Deliberately Out Of Scope

Each is a real issue found during analysis, and each is a behavior or visual change that must not ride inside a pure refactor:

- The sidebar heading says "Systems" where the canonical vocabulary is Device (`docs/plan/DESIGN_SYSTEM.md`).
- `formatAssetDate` and `formatProjectDate` format the same kind of timestamp differently.
- The two page-level feedback banners use divergent markup for the same concept.
- The libraries search input is rendered but non-functional (no `value` or `onChange`); the projects search input is rendered `disabled` with a "Search arrives in a later slice" placeholder.
- `LoadingState` ignores its `description` prop, so every page passes copy that never renders.
- The share page's "Open mobile preview" opens the identical route in a new tab rather than a distinct mobile view, and its summary table restates four values already shown in the header.
- The share route renders inside `WorkspaceShell`, so an unauthenticated viewer sees the Projects and Libraries nav plus the "Reset demo" button.
- Every mutation invalidates `projectQueryKeys.all`, making the targeted invalidations that precede it dead weight; no mutation is optimistic.
- Converting the workspace tab bar to the existing unused `Tabs` primitive.
