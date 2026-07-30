# Vibra Design System

Source skill: `.agents/skills/project-design`  
Visual references: `design-screenshots/`

## Design Intent

Vibra is a governance tool for sound and haptic design systems. Its interface must make invisible, temporal, overlapping behavior legible enough for designers to decide rules and for engineers to trust the handoff.

Every screen should do one of two things:

- Make system state legible.
- Make implementation handoff survivable.

If a surface does neither, cut it.

The perceptual brand rule is: quiet surface, loud state. Grayscale carries structure, navigation, typography, and chrome. Purple carries primary action, focus, and selection only.

## Product Principles

### Flexible

Vibra maps behavior rather than enforcing it. Defaults are visible and overridable. Imported structures should be accepted generously, then organized through computed governance views instead of forcing taxonomy upfront.

### Intuitive

The product should borrow from tools this audience already knows: spreadsheets, Figma, and DAWs. The Collision Matrix should support scanning, selection, keyboard movement, copy/paste-style repetition, and undoable writes.

### Simple

Do not simplify by hiding coverage. The complexity is real; Vibra makes it explicit and governed. Reduce chrome, not state.

## Canonical Vocabulary

Use these terms consistently in UI, code-adjacent labels, exports, docs, and handoff surfaces.

| Meaning | Term |
|---|---|
| What fires | Event |
| UI feature grouping | Collection |
| Cross-event arbitration surface | Collision Matrix |
| Arbitration choices | Preempt, Suppress, Queue, Co-play, Not possible |
| Non-decision | Unset |
| Impossible pairing | Not possible |
| Asset organization | Asset Library |
| Target runtime/device configuration | Device |

Current domain model note: `docs/domain-model/MODEL.md` uses `Trigger`, `EventTrigger`, and `TriggerPlayback` for interaction hooks such as `onPress`. In product copy, never call an Event a trigger. When exposing `onPress`, `onRelease`, `onHover`, and `onHold`, label the area as event interactions or phases, while keeping code aligned to the domain model.

Do not use deprecated or drift terms:

- Do not write "Interruption Matrix"; use Collision Matrix.
- Do not write "Supress"; use Suppress.
- Do not write "Coplay"; use Co-play.
- Do not introduce "Duck" unless the domain model adds it. The current model supports `Preempt`, `Queue`, `Co-play`, `Suppress`, and `Not possible`.

## Scope Boundaries

### Map, Do Not Enforce

Vibra declares contextual behavior that a runtime honors. It does not modify source applications directly.

### No Asset Authoring

Vibra displays asset metadata and read-only envelopes. It does not trim, gain-stage, offset, or rewrite uploaded files. Scheduling is event behavior, not destructive asset editing.

### Grid Over Graphs

The Collision Matrix remains a grid. A missing edge in a graph is invisible; an empty cell in a grid is visible and governable.

### Haptic Honesty

Browser haptic support is limited. For web prototype previews, represent haptic timing visually and label it clearly. Do not fake haptics with decorative motion.

## Color

The product is grayscale plus purple. No blue, green, amber, or red, including for success, warning, destructive, or error states.

| Token | Hex | Role |
|---|---|---|
| Gray 25 | `#FDFDFD` | Primary page, overlay, and button background |
| Gray 50 | `#FAFAFA` | Secondary component background |
| Gray 100 | `#F5F5F5` | Tertiary background and not-applicable fills |
| Gray 200 | `#E9EAEB` | Pressed state, secondary dividers, overlay border |
| Gray 300 | `#D5D7DA` | Primary dividers, button borders, secondary hover |
| Gray 400 | `#A4A7AE` | Disabled text and disabled states |
| Gray 500 | `#717680` | Secondary text |
| Gray 600 | `#535862` | Destructive pressed state |
| Gray 700 | `#414651` | Primary text, headings, icons, destructive button |
| Gray 800 | `#252B37` | Destructive hover state |
| Gray 900 | `#181D27` | Reserved, normally unused |
| Purple 500 | `#7A5AF8` | Primary action, selection, focus, brand moments |
| Purple 600 | `#6938EF` | Primary pressed |
| Purple 700 | `#5925DC` | Primary hover |

Rules:

- Surfaces ladder Gray 25, Gray 50, Gray 100.
- Pure white is not a product surface.
- Purple never encodes governance state.
- Errors, warnings, success, destructive actions, and conflicts use grayscale treatment.

## Typography

Use Figtree everywhere.

| Style | Size / Line | Weight | Use |
|---|---:|---:|---|
| xs | 12 / 18 | 400 | Dense body, helper copy |
| xs medium | 12 / 18 | 500 | Verb labels, badges |
| sm | 14 / 20 | 400-600 | Table text, controls, section labels |
| md | 16 / 24 | 400-600 | Overlay H1, page titles |
| lg | 18 / 28 | 600 | Rare page-level headings |

Use tabular numerals in grids, counters, timing values, and matrix cells.

## Radius

Use only authored radii:

| Element | Radius |
|---|---:|
| Button | 8px |
| Button card | 12px |
| Overlay or dropdown | 16px |

Do not invent 4px radius. If a component needs a value not covered here, choose the closest authored class only when implementation needs to proceed and record the decision in an ADR.

## Borders And Dividers

| Element | Spec |
|---|---|
| Primary divider | 1px Gray 300, center aligned |
| Secondary divider | 1px Gray 200, center aligned |
| Overlay/dropdown border | 0.5px Gray 200, inside aligned, plus shadow-lg |
| Button border | 1px Gray 300, inside aligned |

Use dividers to clarify sections, not to create decorative card stacks.

## Layout Constants

| Constant | Value |
|---|---:|
| Main nav height | 64px |
| Left sidebar width | 268px |
| Page gutter | 16px |
| Default table row | 40px |
| Compact table row | 32px |
| Matrix cell | 119px x 40px |
| Compact matrix cell | 96px x 32px |
| Verb badge height | 22px |
| Compact verb badge height | 20px |
| Default button height | 34px |
| Compact button height | 30px |
| Preview panel target width | 450px |
| Desktop baseline | 1600px |

Density is a user setting. Build default density first and keep compact density token-ready.

## Overlay And Dropdown Spacing

Overlay rules:

- 16px side/top margin.
- 16px from H1 to the next element.
- 8px from H2 or section label to the next element.
- 16px within a section.
- 32px between sections, or 16px + divider + 16px.
- CTA buttons sit bottom right with 16px between buttons.
- Primary action is far right; secondary is to its left.

Dropdown rules:

- 8px side/top margin.
- 0px between items.
- 150px minimum width.
- CTA buttons sit bottom right with 8px between buttons.
- Stacked dropdowns sit 4px apart.
- Dropdown dividers split exactly three semantic groups in order: in-page actions, destructive actions, outward actions.

## Component Rules

### Buttons

- Primary: Purple 500, hover Purple 700, pressed Purple 600.
- Secondary/utility: Gray 25 with Gray 300 border, Gray 300 hover, Gray 200 pressed.
- Destructive: grayscale only. Use Gray 700 default, Gray 800 hover, Gray 600 pressed.
- Disabled: Gray 400 text/icons with low-contrast grayscale surface.
- Use lucide icons for icon buttons and familiar actions.

### Inputs

- Compact height aligned to button height.
- Gray 300 border by default.
- Purple focus ring, 2px at 40% alpha with 1px offset.
- No colored validation states. Errors use icon, text, border weight, and placement.

### Tables And Rows

- Default row height 40px.
- Compact row height 32px.
- Headers remain visible in empty table states.
- Selection is persistent state, not a momentary hover.
- Event rows are single-select.
- Dashboard/project list rows may support multi-select when implemented.

### Cards

Use cards only for selectable items, popovers, and dialogs. Do not put page sections inside cards. Do not nest cards.

### Menus

Use one menu open at a time. Right-click holds the selected item state until the menu closes. Menus must flip to remain onscreen.

### Empty States

Empty states show the shape of the real work area. Do not use decorative illustrations. The cold-open matrix should show a skeletal grid and name the first action.

## Collision Matrix

The Collision Matrix is the primary governance surface.

Rules:

- It is always a grid.
- Coverage percentage stays visible without scrolling.
- Playing and Incoming labels live on axis rails.
- Filters dim or mask cells; they do not collapse rows or reflow the grid.
- Per-cell detail lives in one canonical bottom preview panel.
- Not possible is an explicit decision, visually distinct from unset.
- Matrix candidates come only from events on the selected device.
- The current domain model has a shared behavior set; do not render sound/haptic-specific behaviors unless the model changes.

Cell encoding:

| State | Fill | Border | Mark |
|---|---|---|---|
| Set, explicit | Gray 25 | Solid Gray 300 | Verb glyph and label, Gray 700 |
| Set, inherited | Gray 25 | Solid Gray 300 | Same at 60% opacity |
| Not applicable / Not possible treatment | Gray 100 | Solid Gray 200 | Centered dot or explicit N/A label, Gray 500 |
| Unset | Gray 25 | Dashed Gray 300 | Diagonal hatch, Gray 200 |
| Conflict | Gray 700 | Solid Gray 800 | Inverted glyph and label, Gray 25 |

Behavior copy:

- Preempt: Incoming stops the playing one and takes over.
- Suppress: Incoming does not play. The playing one continues.
- Queue: Incoming waits and plays when the current one finishes.
- Co-play: Both play at full level.
- Not possible: These two cannot occur at the same time.

## Asset Library

Rules:

- Free-form nested folders.
- One canonical home per asset.
- Unlimited event references to an asset.
- Sound and haptic assets can share a folder.
- Reference count is primary metadata.
- Envelope display is read-only.
- Asset folders may contain both child folders and assets.

Useful computed views for later prototype polish:

- Unused assets.
- Format outliers.
- Critical or important assets if priority is added later.
- Assets referenced by more than N events.

## Projects And Filing Surfaces

Rules:

- Project and folder lists support grid and table views.
- The view toggle lives in the header beside `New`.
- List column headers render even when the list is empty.
- Title editing is in place, not a spawned separate field.
- Newly created items may use a one-shot pressed/arrival cue.
- Selection persists until cleared or replaced.
- Dashboard/project list surfaces may support multi-select; event rows remain single-select.
- Path titles grow with nesting depth and every segment is clickable.

## Handoff Surfaces

Handoff is a screen, not just a button.

Where a user sets a rule, show what the developer receives and what is now live. Future handoff paths may include JSON export, React SDK, MCP server, and read-only developer views. For the prototype, share pages and preview summaries are the first handoff surfaces.

## Screen Reference Map

Use these screenshots as implementation evidence:

- `color-palette.png`: color tokens.
- `buttons-and-tabbed-interface.png`: buttons, icon buttons, checkbox, segmented tabs, inputs, selected states.
- `project-folder-explorer.png`: `/projects` filing surface.
- `empty-project-viewer.png`: empty project workspace and left rail.
- `event-list.png`: populated project event workspace.
- `event-playback-timeline.png`: event preview and playback scheduling.
- `asset-library-explorer-list-view.png`: asset library list view.
- `asset-library-explorer-tile-view.png`: asset library tile view.
- `collision-matrix.png`: matrix layout and behavior editor.
- `matrix-cells.png`: cell states and behavior pills.
- `overlay-popups-1.png`, `overlay-popups-2.png`, `overlay-popups-3.png`: dialogs, popovers, filters, pickers, QR/share, create flows.

## Verification Checklist

Before calling a UI slice done:

- [ ] Surfaces use Gray 25, not pure white.
- [ ] No hue exists except purple.
- [ ] Purple appears only on primary actions, selection, focus, or brand moments.
- [ ] Governance state is encoded by glyph, label, fill, border, pattern, opacity, or inversion, not hue.
- [ ] Figtree is the only product typeface.
- [ ] Radius values are 8px, 12px, or 16px.
- [ ] Dividers and borders use the documented gray weights.
- [ ] Overlay/dropdown spacing follows this doc.
- [ ] Dropdown items are grouped semantically.
- [ ] Coverage gaps are more visible than completed cells.
- [ ] Matrix filters do not collapse or reorder rows.
- [ ] Empty states show the shape of the eventual work area.
- [ ] Text does not overflow buttons, tables, panels, or dialogs.
- [ ] Hover, focus, loading, and selection states do not shift layout.
- [ ] Screen implementation cites the relevant `design-screenshots/` reference in QA notes or PR summary.
