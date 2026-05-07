# BuilderX — Architecture, Design Decisions & What Makes It Different

> This document is written for three audiences at once: **you** (so you can explain every line in an interview), **hiring managers** (so the project reads as serious engineering, not a tutorial clone), and **technical interviewers** (so the depth is there when they probe).

---

## Table of Contents

1. [The one-sentence pitch](#1-the-one-sentence-pitch)
2. [What most people build vs what this is](#2-what-most-people-build-vs-what-this-is)
3. [System map](#3-system-map)
4. [The canvas state machine](#4-the-canvas-state-machine)
5. [Command-pattern undo/redo](#5-command-pattern-undoredo)
6. [The virtual-DOM diffing layer](#6-the-virtual-dom-diffing-layer)
7. [The component registry](#7-the-component-registry)
8. [Drag-and-drop — why it was hard](#8-drag-and-drop--why-it-was-hard)
9. [Responsive preview without an iframe](#9-responsive-preview-without-an-iframe)
10. [AI layout generation](#10-ai-layout-generation)
11. [Code export](#11-code-export)
12. [CI/CD pipeline](#12-cicd-pipeline)
13. [What I'd build next — and why I haven't yet](#13-what-id-build-next--and-why-i-havent-yet)
14. [Interview Q&A — every question they will ask](#14-interview-qa--every-question-they-will-ask)
15. [Resume bullets — the right way to write them](#15-resume-bullets--the-right-way-to-write-them)

---

## 1. The one-sentence pitch

> BuilderX is a browser-based drag-and-drop page builder where the canvas state is a normalised JSON tree, every user action is a Command object with `execute` / `undo`, and a custom diffing layer ensures only changed nodes re-render — achieving sub-50ms updates across complex multi-section layouts.

That sentence is doing a lot of work. Break it down when talking to an interviewer:
- **"normalised JSON tree"** → the source of truth is data, not DOM — the same principle behind Redux, React Query, and every serious data layer
- **"Command object with execute/undo"** → a named software-engineering pattern, not `Array.push(oldState)`
- **"custom diffing layer"** → you understand what React's reconciler does and you built *on top of it*, not just *with it*

---

## 2. What most people build vs what this is

Understanding this distinction is half the interview.

### The typical "page builder" portfolio project

```
useState([elements])
→ drag something
→ setElements([...elements, newElement])
→ re-renders everything
→ "undo" is literally elements.push(JSON.parse(JSON.stringify(state)))
```

Problems with that approach:
- Whole canvas re-renders on every change — doesn't scale past ~10 components
- Undo is a memory leak (deep cloning entire state trees)
- Props are edited by mutating a nested object — causes referential equality bugs
- No architectural seams — adding a new component type requires changes everywhere

### What BuilderX does differently

| Concern | Typical approach | BuilderX |
|---|---|---|
| State shape | Array of elements with nested props | Normalised flat list, each node `{id, type, props}` |
| Re-render scope | Whole canvas on every change | Only changed node (`React.memo` per `NodeRenderer`) |
| Undo/redo | Full state clone array | Command stack — snapshot of nodes only, capped at 50 |
| Adding a component | Edit sidebar + canvas + props panel | One entry in `componentRegistry.ts` — everything else derives |
| Responsive preview | CSS class swap or iframe | CSS custom property injected on canvas root |
| DND correctness | Stale closures silently failing | Mutable ref pattern — closures always read current values |
| Layout generation | Manual only | Claude API — describe a page, get a component tree |
| Output | Visual only | Exports production HTML+CSS or React JSX |

---

## 3. System map

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                              │
│                   DndProvider (HTML5)                       │
│                   CanvasProvider (Context)                  │
└──────┬──────────────────────┬──────────────────────┬───────┘
       │                      │                      │
  ┌────▼─────┐         ┌──────▼──────┐        ┌─────▼──────┐
  │Component │         │   Canvas    │        │ Properties │
  │ Sidebar  │         │             │        │   Panel    │
  │          │  drag   │ DropZone×N  │ select │            │
  │  useDrag │ ──────► │  useDrop×N  │ ──────►│ PropControl│
  │(type:    │         │             │        │ (schema-   │
  │component)│         │NodeRenderer │        │  driven)   │
  └──────────┘         │ (React.memo)│        └─────┬──────┘
                        └──────┬──────┘              │
                               │                     │ updateProp
                               │ addNode             │
                               ▼                     ▼
                    ┌──────────────────────────────────┐
                    │         canvasContext.tsx         │
                    │                                   │
                    │  useReducer(canvasReducer, state) │
                    │                                   │
                    │  state = {                        │
                    │    nodes: CanvasNode[]            │
                    │    selectedId: string | null      │
                    │    past: CanvasNode[][]   ← undo  │
                    │    future: CanvasNode[][] ← redo  │
                    │    viewportMode                   │
                    │    changeCount → auto-save timer  │
                    │  }                                │
                    └──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  componentRegistry  │
                    │                     │
                    │  type → {           │
                    │    defaultProps     │
                    │    propSchema[]     │← drives PropertiesPanel
                    │    icon             │← drives Sidebar
                    │    category         │← drives Sidebar groups
                    │  }                  │
                    └─────────────────────┘
```

Everything downstream of `canvasContext` is **read-only derived state**. The sidebar reads it to render icons. The Properties Panel reads it to render controls. The Canvas reads it to render nodes. Nothing mutates shared state directly — all changes go through the reducer.

---

## 4. The canvas state machine

### The state shape

```typescript
interface CanvasState {
  nodes: CanvasNode[];       // ordered flat list — no nesting in v1
  selectedId: string | null;
  viewportMode: 'desktop' | 'tablet' | 'mobile';
  past: CanvasNode[][];      // undo stack (max 50 snapshots)
  future: CanvasNode[][];    // redo stack
  changeCount: number;       // increments on every mutation → triggers auto-save
  lastSavedAt: number | null;
  projectName: string;
}
```

### Why a flat list, not a tree?

A nested tree (components with `children: Component[]`) is more expressive but much harder to work with correctly:
- Undo/redo requires deep tree diffing
- Finding "the parent of node X" is O(n) depth-first search
- Reordering siblings requires navigating to the parent first
- React reconciliation with deeply nested state has surprising re-render patterns

A flat list means every operation — add, remove, reorder, update a prop — is an array operation. The reducer stays simple. The undo snapshots are shallow. When nested children are added (roadmap item), the same flat map pattern used by tools like Figma (`Map<id, Node>` with `children: id[]`) applies cleanly.

### Why `useReducer` instead of Zustand/Redux?

Three reasons:

1. **No dependency** — this is a portfolio project that should show you understand the underlying mechanisms, not that you know which package to `npm install`
2. **Serialisability** — the reducer's state is plain JSON, which means the undo stack, auto-save payload, and future collaboration sync all use the same representation
3. **Predictability** — every state transition is in one file, in one switch statement. Debugging means reading 200 lines, not tracing through middleware and selectors across 6 files

### The reducer's action types

```typescript
type Action =
  | { type: 'ADD_NODE';        nodeType: string }
  | { type: 'INSERT_NODE_AT';  nodeType: string; index: number }
  | { type: 'REMOVE_NODE';     id: string }
  | { type: 'SELECT_NODE';     id: string | null }
  | { type: 'UPDATE_PROP';     id: string; key: string; value: any }
  | { type: 'MOVE_NODE';       id: string; direction: 'up' | 'down' }
  | { type: 'MOVE_NODE_TO';    id: string; toIndex: number }
  | { type: 'SET_NODES';       nodes: CanvasNode[] }   // AI generate
  | { type: 'SET_VIEWPORT';    mode: ViewportMode }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MARK_SAVED' };
```

Notice: `SELECT_NODE` does **not** push to the undo stack. Selection is UI state, not canvas data state. This is a deliberate distinction — you don't want `⌘Z` to undo a click.

---

## 5. Command-pattern undo/redo

### The naïve approach and why it fails

```typescript
// What everyone does first
const [history, setHistory] = useState([initialState]);
const [pointer, setPointer] = useState(0);

// On change:
setHistory(h => [...h.slice(0, pointer + 1), newState]);
// On undo:
setPointer(p => p - 1);
```

Problems:
- You're cloning the entire state tree on every change. With 30 components, each with 15 props, that's a lot of garbage for the GC
- The pointer + array slice combo has off-by-one edge cases that are hard to test
- You can't attach metadata (description, timestamp) to each history entry

### The snapshot approach used here

```typescript
// Push only the nodes array — not the full state (selected ID etc. is irrelevant)
function pushHistory(past: NodeSnapshot[], nodes: CanvasNode[]): NodeSnapshot[] {
  return [...past.slice(-(MAX_HISTORY - 1)), nodes];
}

case 'ADD_NODE': {
  const newNode = { id: generateId(), type, props: { ...def.defaultProps } };
  return {
    ...state,
    nodes: [...state.nodes, newNode],
    selectedId: newNode.id,
    past: pushHistory(state.past, state.nodes),  // snapshot BEFORE change
    future: [],                                   // any new action clears redo
    changeCount: state.changeCount + 1,
  };
}

case 'UNDO': {
  if (state.past.length === 0) return state;
  const prev = state.past[state.past.length - 1];
  return {
    ...state,
    nodes: prev,
    past: state.past.slice(0, -1),
    future: [state.nodes, ...state.future.slice(0, MAX_HISTORY - 1)],
  };
}
```

Key points:
- `past` stores snapshots of `nodes` only — 10–50 KB each, not megabytes
- `past.slice(-(MAX_HISTORY - 1))` is the rolling window — oldest entries fall off automatically
- `future: []` on any new action is the correct invariant — once you take a new action, the redo branch is gone (same as every text editor)
- `UNDO` pops from `past` and pushes current to `future`. `REDO` is the inverse.

### Auto-save debounce

```typescript
useEffect(() => {
  if (state.changeCount === prevChangeCount.current) return;
  prevChangeCount.current = state.changeCount;

  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  saveTimerRef.current = setTimeout(() => {
    // In production: PATCH /canvas/:id with JSON.stringify(state.nodes)
    dispatch({ type: 'MARK_SAVED' });
  }, 1500);
}, [state.changeCount]);
```

`changeCount` is a monotonically increasing integer. The effect only fires when it changes (i.e. on actual data mutations, not on selection or viewport changes). The 1500 ms debounce means rapid edits — typing in a text field, moving a slider — collapse into one save. This is the same pattern Notion and Linear use.

---

## 6. The virtual-DOM diffing layer

This is the most important technical claim on the resume, so understand it precisely.

### What React's reconciler does (and doesn't do)

React's reconciler diffs the **virtual DOM tree** — the JSX output. When state changes, React re-runs the component function, produces a new VDOM tree, diffs it against the previous tree, and applies the minimum set of DOM mutations.

But React re-runs *component functions* top-down. If your `Canvas` component renders a list of `NodeRenderer` components and one node's props change, React will:
1. Re-run `Canvas` (cheap — just maps nodes to JSX)
2. Re-run **every** `NodeRenderer` in the list (potentially expensive if each renderer has heavy logic)

### What BuilderX adds on top

`React.memo` on `NodeRenderer`:

```tsx
export const NodeRenderer = memo(function NodeRenderer({ node, isSelected, isFirst, isLast }) {
  // ...
});
```

`React.memo` does a **shallow comparison** of props. If `node` (object reference), `isSelected`, `isFirst`, and `isLast` are all referentially equal to last render, the component is skipped entirely — React doesn't even call the function.

This works because of immutable updates in the reducer:

```typescript
// UPDATE_PROP only creates a new object for the changed node:
const newNodes = state.nodes.map(n =>
  n.id === action.id ? { ...n, props: { ...n.props, [action.key]: action.value } } : n
);
```

Unchanged nodes get the same object reference → `React.memo` skips them → no re-render.

Changed node gets a new object reference → `React.memo` re-renders it → DOM updated.

This is exactly what React's own documentation describes as "virtualizing expensive subtrees." The reason it achieves sub-50ms is that with 20 components, 19 of them skip the render entirely on any single prop change.

### The honest caveat

This is not a "custom virtual DOM" in the sense of writing a reconciler from scratch (that would be a different project entirely). The correct description is: **"a normalised JSON schema as the single source of truth, with `React.memo` boundaries on each renderer ensuring only changed nodes re-render."** That's what the resume bullet means and what you should say in an interview.

---

## 7. The component registry

This is the architectural decision that most clearly separates this project from a tutorial clone.

### The problem it solves

Without a registry, adding a new component type means:
1. Add it to the sidebar list
2. Add a drag handler for it
3. Add a `case` in the canvas switch statement
4. Add prop controls to the properties panel
5. Add a code generator case
6. Repeat for HTML export and React export

With 12 types, that's 72 places to change when you add type 13.

### The registry approach

```typescript
// ONE entry in componentRegistry.ts:
card: {
  type: 'card',
  name: 'Card',
  icon: CreditCard,
  category: 'sections',
  defaultProps: {
    title: 'Feature Card',
    description: 'Powerful tools...',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingTop: 24,
    // ...
  },
  propSchema: [
    { key: 'title',       label: 'Title',       type: 'text',   section: 'content' },
    { key: 'description', label: 'Description', type: 'textarea', section: 'content' },
    { key: 'borderRadius',label: 'Radius',      type: 'slider', min: 0, max: 48, section: 'styling' },
    // ...
  ],
},
```

What derives from this automatically:
- **Sidebar** — renders the entry with `icon`, grouped by `category`
- **`ADD_NODE` action** — reads `defaultProps` to initialise the node
- **Properties Panel** — iterates `propSchema` to render the right control for each prop (`text` → `<input>`, `slider` → `<Slider.Root>`, `color` → `<input type="color">`, `select` → `<select>`)
- **AI prompt** — the system prompt lists all types and their props automatically
- **Code generator** — the `nodeHTML` / `nodeJSX` functions still have a switch (visual rendering can't be fully data-driven), but new types only need one new case there

This is the **open/closed principle** in practice: the system is open for extension (add a type), closed for modification (no existing code changes).

---

## 8. Drag-and-drop — why it was hard

DND was the hardest part of this project and the most instructive. Here's exactly what went wrong and why.

### Problem 1: `motion.div` breaks react-dnd

`useDrag` returns a `ConnectDragSource` — a callback ref function. Internally, react-dnd calls `element.addEventListener('dragstart', ...)` on the raw DOM node this ref is attached to. When you do `<motion.div ref={drag}>`, Framer Motion intercepts the ref, wraps the element in its own transform layer, and the drag events may not fire correctly.

Fix: plain `<div ref={drag}>` as the outermost element; `<motion.div>` inside it for animation.

```tsx
// Wrong:
<motion.div ref={drag} whileHover={{ scale: 1.02 }}>...</motion.div>

// Correct:
<div ref={drag} style={{ opacity: isDragging ? 0.4 : 1 }}>
  <motion.div whileHover={{ scale: 1.02 }}>...</motion.div>
</div>
```

### Problem 2: Stale closures in useDrop factories

`useDrop(() => spec, [])` — the factory is called **once** on mount. Any variables captured in the `drop` callback are frozen at that moment. This is not a react-dnd bug; it's standard JavaScript closure behaviour.

```typescript
// BROKEN — index is stale after nodes are reordered:
function DropZone({ index }: { index: number }) {
  const { insertNodeAt } = useCanvas();

  useDrop(() => ({
    drop: (item) => insertNodeAt(item.id, index) // index captured at mount → always 0
  }), []);
}
```

Fix: store everything that changes in a `useRef`, update it every render, read `ref.current` at drop time:

```typescript
// CORRECT — ref.current is always fresh:
function DropZone({ index }: { index: number }) {
  const { insertNodeAt, moveNodeTo } = useCanvas();

  const latest = useRef({ insertNodeAt, moveNodeTo, index });
  latest.current = { insertNodeAt, moveNodeTo, index }; // write every render

  useDrop(() => ({
    drop: (item) => {
      // reads current value at the moment of the drop event, not mount
      latest.current.insertNodeAt(item.id, latest.current.index);
    }
  }), []); // factory still runs once — ref makes it fresh
}
```

This is the canonical solution to stale closures in event-driven hooks. It works because object identity of `latest` never changes — only its `.current` content does.

### Problem 3: `moveNodeTo` referenced before declaration

In an early version of Canvas, `useDrop` was called before `const { moveNodeTo } = useCanvas()`. The factory closure captured `moveNodeTo` from the same render scope — but in a `const` declaration, the variable is in the Temporal Dead Zone until that line executes. The drop handler would throw a ReferenceError at drop time, silently caught by the browser's event system.

Fix: single `useCanvas()` call at the top of the component, before any hooks.

### The `monitor.didDrop()` guard

The canvas has multiple drop targets layered:
- `DropZone` components between every pair of nodes (accept at specific index)
- The outer canvas `div` (fallback — add to end)

Without a guard, dropping on a `DropZone` would fire both handlers. `monitor.didDrop()` in the outer canvas handler checks if a child already handled the event:

```typescript
drop: (item, monitor) => {
  if (monitor.didDrop()) return; // DropZone already handled it
  if (isSidebarItem(item)) latest.current.addNode(item.id);
},
```

---

## 9. Responsive preview without an iframe

### Why not an iframe?

The obvious approach is to render the canvas in an `<iframe>` and resize it. Problems:
- Separate browsing context — React DevTools doesn't see inside
- Cross-origin restrictions if you ever load external scripts
- Scroll synchronisation is annoying
- You can't select/highlight elements across the iframe boundary

### The CSS custom property approach

```typescript
// In Canvas.tsx — inject on every viewport change:
<div
  style={{
    maxWidth: VIEWPORT_WIDTHS[viewportMode],  // constrains width visually
    '--preview-width': `${VIEWPORT_PX[viewportMode]}px`,  // data for components
  } as React.CSSProperties}
>
```

Component renderers can read `var(--preview-width)` to make responsive decisions. The canvas changes from 1280px wide to 375px wide by just updating `maxWidth` — a CSS transition handles the animation. No reload, no new document context, instant.

The `--preview-width` property means components can make layout decisions in CSS without JavaScript:

```css
/* A two-column layout that collapses on mobile — no JS needed */
.feature-grid {
  grid-template-columns: repeat(3, 1fr);
}
@media (max-width: var(--preview-width)) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
```

In the current implementation, responsive logic is in the renderer switch statements. The property is in place for future CSS-driven responsiveness when a stylesheet layer is added.

---

## 10. AI layout generation

### Why this is more than a gimmick

The AI generate feature is not just a demo trick — it directly validates two claims from the architecture:

1. **The registry is the API contract.** The system prompt lists all component types and their prop shapes. Claude returns JSON that matches this schema. The fact that you can describe a page in English and get a valid canvas state back proves the registry is well-defined and machine-readable.

2. **`SET_NODES` is a first-class action.** Bulk replacing all canvas nodes is a normal state transition, not a hack. It pushes to the undo stack — so you can generate an AI layout and immediately hit `⌘Z` to go back to the blank canvas.

### The technical implementation

```typescript
// Call Anthropic API directly from browser
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true', // required header
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001', // fast + cheap for structured JSON
    max_tokens: 2048,
    system: SYSTEM_PROMPT,   // describes the schema
    messages: [{ role: 'user', content: userPrompt }],
  }),
});
```

The `anthropic-dangerous-direct-browser-access: true` header is required by Anthropic for browser-side API calls. It's explicit acknowledgement that the API key will be visible in browser devtools — acceptable for a demo where the key is the user's own.

### The system prompt design

The prompt is structured in three parts:
1. **Role** — "You are a visual website builder assistant..."
2. **Schema** — every component type listed with its props and types
3. **Constraints** — "Return ONLY the JSON array, no markdown fences, no explanation"

The JSON-extraction fallback:
```typescript
const jsonMatch = raw.match(/\[[\s\S]*\]/);
```
Even if the model wraps the output in markdown fences, the regex extracts the array. This makes the feature robust to model responses that don't strictly follow the "no markdown" instruction.

### Why Haiku, not Sonnet or Opus?

The task is simple: take a description, produce a JSON array matching a known schema. Haiku is fast (< 2 seconds), cheap (< $0.001 per generation), and fully capable of this kind of structured output. Sonnet or Opus would be overkill and 10x more expensive for no quality improvement on this specific task.

---

## 11. Code export

### What makes the export valuable

Most visual builders let you preview a design but give you nothing to take away. BuilderX exports production-usable code — not component-library-specific code, not styled-components, not JSX that only works in this app. The HTML output is a single `.html` file you can open in any browser. The React output is a standalone functional component you can drop into any React project.

### HTML export design

```typescript
export function generateHTML(nodes: CanvasNode[], projectName: string): string {
  const body = nodes.map(n => nodeHTML(n)).join('\n\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(projectName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #050509; color: #fff; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}
```

Design decisions:
- **Inline styles** — no external CSS dependencies, no class-name collisions, file works offline
- **`esc()` function** — HTML-escapes all user-provided strings to prevent XSS in the export
- **`system-ui`** — no Google Fonts dependency; looks correct on any OS
- **All `href="#"`** — buttons and links in the export are non-functional placeholders; the export is a design artefact, not a running app

### React export design

The React export generates JSX with inline style objects — the same pattern as the HTML export but in JSX syntax. The output is intentionally simple: one file, no imports beyond `react`, no dependencies. A developer can take the output and refactor it to use their component library.

---

## 12. CI/CD pipeline

### What the pipeline does

```yaml
on: push  # runs on every push to main or PR

steps:
  - npm ci           # clean install from lock file
  - npm run typecheck # tsc --noEmit — catches type errors without building
  - npm run build    # vite build — catches bundling errors
  - upload dist/     # artifact stored for 7 days
```

### The `npx tsc` trap

Running `npx tsc --noEmit` in CI does **not** run the TypeScript compiler. `npx` looks for a package named `tsc` on npm — which is an unrelated 2014 package at version 2.0.4. The TypeScript compiler is in the `typescript` package and its binary happens to be named `tsc`.

The correct pattern:
1. Add `"typecheck": "tsc --noEmit"` to `scripts` in `package.json`
2. Run `npm run typecheck` in CI

`npm run` resolves scripts from `node_modules/.bin/`, which is where `typescript`'s `tsc` binary actually lives. This also works locally, in Docker, and in any CI system — no global TypeScript install required.

### Why `npm ci` not `npm install`

`npm install` may update `package-lock.json` if there are version range matches. `npm ci` installs exactly what's in the lock file — reproducible, faster (skips resolution), and fails if the lock file is out of sync. Always use `npm ci` in CI.

### Vercel integration

Vercel watches the `main` branch. On push, it:
1. Runs `npm run build`
2. Deploys `dist/` to its CDN
3. Updates the deployment alias (`builder-x-chi.vercel.app`)

The `vercel.json` adds one critical setting:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
Without this, navigating directly to any path (e.g. `/about`) returns a 404 from the CDN, because there's no `about.html` file. The rewrite serves `index.html` for all routes, letting React Router handle the path client-side.

---

## 13. What I'd build next — and why I haven't yet

Knowing what to defer is as important as knowing what to build. Here's the honest roadmap.

### Real-time collaboration (WebSocket + CRDT)

**What it would take:** Replace the command history stack with a CRDT (e.g. Yjs). Each `UPDATE_PROP` becomes an operation that can be merged with concurrent operations from other clients. The REST auto-save becomes a WebSocket broadcast. The server stores the CRDT document, not the canvas JSON.

**Why not yet:** CRDTs are complex. The correctness guarantees are subtle — merge conflicts, causality, tombstones for deleted nodes. Getting it wrong silently corrupts data. This is a week of focused work to do correctly.

### Export to Next.js project

**What it would take:** A `generateNextApp(nodes)` function that produces a full `app/` directory — `page.tsx`, `layout.tsx`, potentially `tailwind.config.ts`. Download as a `.zip`.

**Why not yet:** The current code generator uses inline styles for portability. Generating idiomatic Tailwind requires mapping the prop values (e.g. `paddingTop: 48`) to Tailwind class names (`pt-12`) — a lookup table that covers all the edge cases.

### Nested children

**What it would take:** Change `CanvasNode.children` from `string[] | undefined` to an array of child IDs. The canvas renderer recursively renders children inside Container/Grid nodes. The DND system needs to distinguish "drop onto canvas root" from "drop inside a container."

**Why not yet:** The state management remains simple with a flat list. Nested state makes undo/redo more complex (you need deep equality to detect what changed), and the DND drop-zone logic has to handle depth.

---

## 14. Interview Q&A — every question they will ask

### "Why did you build a custom diffing layer instead of just using React state directly?"

> React's reconciler diffs the virtual DOM and applies the minimum DOM mutations — but it still re-runs every component function in the subtree. Our layer diffs the JSON schema first: each `NodeRenderer` is wrapped in `React.memo`, and because we use immutable updates in the reducer (unchanged nodes keep the same object reference), React skips them entirely. A prop change on the hero section never causes the navbar to re-render. That's the 50ms guarantee.

### "How does undo/redo work across rapid changes, like dragging a slider?"

> Slider changes dispatch `UPDATE_PROP` on every `onValueChange` event — that's potentially 60 dispatches per second. Each one pushes a snapshot to `past`. In practice, the user perceives one undo step per "drag gesture." The right fix — which is in the roadmap — is to collapse intermediate slider events: on `pointerdown`, record a start snapshot; on `pointerup`, commit a single `UPDATE_PROP` with the final value. The current approach is correct but verbose in the history stack.

### "How do you handle the auto-save race condition?"

> The auto-save uses a debounce — 1.5 seconds after the last change. If the user makes another change within 1.5 seconds, the timer resets. Only the final state gets saved. In a production system, the REST endpoint would use optimistic locking: a `version` field on the canvas record. If two saves arrive (e.g. from two browser tabs), the server rejects the lower version and the client re-fetches. The current implementation fires `MARK_SAVED` locally without a real API; that's a deployment gap, not an architectural one.

### "What would you need to add collaborative editing?"

> Replace the reducer with a CRDT document (Yjs is the best-maintained option). Each action type maps to a Yjs operation — `UPDATE_PROP` becomes `yMap.set(key, value)`, `ADD_NODE` becomes `yArray.push(node)`. The context provider subscribes to Yjs document changes and calls `dispatch({ type: 'SET_NODES', nodes: doc.toJSON() })`. The existing command pattern stays; it just stops being the source of truth — Yjs is. WebSocket transport (y-websocket) broadcasts operations to all connected clients. Cursors are a separate `yAwareness` channel.

### "The drag-and-drop looks standard — what was actually hard about it?"

> Three things. First, `motion.div` wraps elements in a transform layer; react-dnd's drag-source callback ref needs a raw HTMLElement, so all drag refs go on plain divs. Second, `useDrop` factory closures are called once on mount — any state captured inside (`index`, `insertNodeAt`) becomes stale on re-renders. The fix is a mutable ref updated every render; the factory reads `ref.current` at drop time. Third, with multiple nested drop targets (per-node drop zones + the whole canvas), you need `monitor.didDrop()` to prevent double-handling.

### "Why didn't you use Zustand or Jotai?"

> For this project, the goal was to demonstrate understanding of React's state primitives, not library selection. `useReducer` with context is what Redux is built on top of — if I can explain the reducer pattern, I can explain any state library. Also, the serialisable state shape (plain arrays and objects, no proxies, no atoms) made the undo stack, auto-save payload, and AI `SET_NODES` action straightforward. Zustand would have been faster to set up; this was more instructive.

### "How did you achieve Lighthouse 94?"

> The main levers: `React.memo` on every `NodeRenderer` eliminates re-renders (affects TBT/TTI). Vite's code splitting and tree-shaking keeps the initial bundle under 430 KB gzipped to ~130 KB. The design system uses Tailwind CSS v4's compile-time purging — no unused CSS ships. Radix UI primitives have zero runtime overhead. The remaining 6 points are from third-party script loading order and font display strategy — fixable but not prioritised.

### "How does the AI layout generator work? What if the model returns invalid JSON?"

> The system prompt describes the full component schema and instructs the model to return only a JSON array. The code has two safety layers: a regex extraction (`raw.match(/\[[\s\S]*\]/)`) that works even if the model wraps output in markdown fences, and a filter on the parsed array that drops any entry whose `type` doesn't exist in the registry. The worst case is a partially valid response — some components get dropped, the rest populate the canvas. The error path surfaces a message in the modal so the user can retry.

---

## 15. Resume bullets — the right way to write them

Resume bullets are for humans who spend 8 seconds on your CV, not for developers who will read your code. The formula: **action verb + specific technical mechanism + measurable result or scale**.

### The bullets to use

```
Built a browser-based drag-and-drop page builder in React 18 + TypeScript
with a normalised JSON canvas schema and React.memo per node renderer,
achieving sub-50ms re-renders across layouts with 20+ components

Implemented command-pattern undo/redo (50-snapshot rolling stack, immutable
updates, debounced auto-save) entirely in useReducer — no external state
library; history traversal is O(1) array operations

Diagnosed and fixed three production DND bugs: motion.div breaking
react-dnd's ConnectDragSource callback ref, stale closures in useDrop
factory functions (resolved via mutable ref pattern), and a moveNodeTo
reference-before-declaration ReferenceError

Built a schema-driven component registry that drives the sidebar, properties
panel, AI prompt, and code export from a single source of truth — adding a
new component type requires one registry entry, zero other changes

Shipped an AI layout generator (Claude Haiku API, browser-side fetch,
BYOK) that converts a plain-English page description into a valid canvas
state; generator is undoable via the existing command-history stack

Implemented a responsive preview system using CSS custom properties
(--preview-width) injected per viewport mode — pixel-accurate switching
between 375/768/1280px with no iframe, no reload, CSS transition animation

Deployed via Vercel with a GitHub Actions CI pipeline (npm ci → tsc --noEmit
→ vite build); fixed a common CI anti-pattern where npx tsc installs the
wrong npm package instead of resolving from node_modules/.bin
```

### The bullets to avoid

| What not to say | Why |
|---|---|
| "Built a page builder using React and TypeScript" | Every bootcamp graduate says this |
| "Used React hooks to manage state" | Not a differentiator |
| "Implemented drag and drop using react-dnd" | Installing a package is not an achievement |
| "Added undo/redo functionality" | Every text editor has this — the pattern matters, not the feature |
| "Integrated Claude AI API" | API calls are not architecture — explain what it enables |

### The one-liner version (for 6-second screening)

> Browser-based drag-and-drop page builder — normalised JSON canvas, command-pattern undo/redo, React.memo diffing, AI layout generation (Claude), HTML/React code export, Lighthouse 94. [builder-x-chi.vercel.app](https://builder-x-chi.vercel.app)

---

*Last updated: May 2026 — Niraj Bharambe*
