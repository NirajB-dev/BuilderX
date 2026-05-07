<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=40&pause=1000&color=6366F1&center=true&vCenter=true&width=600&height=80&lines=BuilderX;Visual+Page+Builder;Drag.+Drop.+Ship." alt="BuilderX" />

<br/>

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-builder--x--chi.vercel.app-6366f1?style=for-the-badge&logoColor=white)](https://builder-x-chi.vercel.app/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![CI](https://img.shields.io/github/actions/workflow/status/NirajB-dev/BuilderX/ci.yml?style=for-the-badge&label=CI&logo=github-actions&logoColor=white)](https://github.com/NirajB-dev/BuilderX/actions)

<br/>

**A browser-based drag-and-drop page builder with AI layout generation, live code export, and sub-50ms re-renders — built as a showcase of production-grade React architecture.**

<br/>

[**→ Try it live**](https://builder-x-chi.vercel.app/) · [Report Bug](https://github.com/NirajB-dev/BuilderX/issues) · [Source Code](https://github.com/NirajB-dev/BuilderX)

</div>

---

## ✨ What it does

<table>
<tr>
<td width="50%">

### 🎨 Visual Canvas
Blank dot-grid canvas — drag components from the sidebar or click to add. Drop zones appear **between every section** so you can insert at any position, not just the bottom.

</td>
<td width="50%">

### 🤖 AI Layout Generator
Describe any page in plain English — *"SaaS landing page for a project management tool"* — and Claude generates a full component tree in seconds. Powered by the Anthropic API, key stored locally.

</td>
</tr>
<tr>
<td width="50%">

### 📦 Code Export
Export your canvas as a self-contained **HTML + CSS** file or a **React / JSX** component — one click, download-ready. Live line count and file size shown in the modal.

</td>
<td width="50%">

### ↩️ Undo / Redo
Every action — drag, drop, prop edit, reorder — is a snapshot pushed onto a 50-deep history stack. `⌘Z` / `⌘⇧Z` traverse it instantly. Auto-save debounces at 1.5 s.

</td>
</tr>
</table>

---

## 🏗️ Architecture highlights

These are the technical decisions worth talking about in interviews.

### Virtual-DOM diffing layer
Canvas state is a normalised JSON list of `{ id, type, props }` nodes. React.memo boundaries on each `NodeRenderer` mean only the changed node re-renders — not the whole canvas. Measured sub-50ms across layouts with 20+ components.

### Command-pattern undo/redo
```
every user action
  → pushHistory(past, currentNodes)   // snapshot O(1) push, capped at 50
  → dispatch(new state)
  → debounce(1500ms) → MARK_SAVED

UNDO → pop past stack, push to future stack
REDO → pop future stack, push to past stack
```
No libraries — pure `useReducer` with immutable updates.

### Responsive preview system
Viewport modes (375 / 768 / 1280 px) inject `--preview-width` as a CSS custom property on the canvas root. Components read `var(--preview-width)` — instant preview switch, no iframe, no page reload.

### Stale-closure-safe DND
react-dnd factory closures are called once and never re-created. All mutable state (`insertNodeAt`, `moveNodeTo`, `nodes.length`) is stored in a `useRef` that updates every render. The drop handler reads `ref.current` at drop time — always fresh.

```ts
// The pattern that makes DND actually work
const latest = useRef({ insertNodeAt, moveNodeTo, index });
latest.current = { insertNodeAt, moveNodeTo, index }; // written every render

useDrop(() => ({
  drop: (item) => latest.current.insertNodeAt(item.id, latest.current.index)
}), []); // factory runs once — ref keeps it fresh
```

---

## 🧩 Component registry

12 built-in component types, each with a full `PropDef` schema that drives the Properties Panel automatically:

| Category | Components |
|---|---|
| **Basic** | Text · Button · Image · Divider |
| **Layout** | Container · Grid |
| **Sections** | Navbar · Hero · Features Grid · Card · Form · CTA |

Adding a new type = one entry in `componentRegistry.ts`. The Properties Panel, Export Modal, and AI Generator all pick it up with zero other changes.

---

## ⌨️ Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `⌘ Z` | Undo |
| `⌘ ⇧ Z` / `⌘ Y` | Redo |
| `Delete` / `Backspace` | Remove selected component |
| `Escape` | Deselect |

---

## 🚀 Getting started

```bash
git clone https://github.com/NirajB-dev/BuilderX.git
cd BuilderX
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Available scripts

```bash
npm run dev        # start dev server
npm run build      # production build → dist/
npm run typecheck  # tsc --noEmit (runs in CI)
```

---

## 🤖 AI Generate setup

1. Click **AI Generate** (violet button in the toolbar)
2. Enter your [Anthropic API key](https://console.anthropic.com/) — stored in `localStorage`, never leaves your browser
3. Describe your page and hit **Generate** or press `⌘↵`

Uses `claude-haiku-4-5` for fast, low-cost layout generation.

---

## 🛠 Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI Framework | React 18 + TypeScript | Concurrent rendering, full type safety |
| Build | Vite 6 + esbuild | Sub-second HMR, 1.4 s prod build |
| Styling | Tailwind CSS v4 | Zero-runtime, purged CSS |
| Drag & Drop | react-dnd + HTML5Backend | Mature, headless, works with any element |
| Animation | Motion (Framer Motion) | Spring physics, `AnimatePresence` |
| State | `useReducer` + Context | No extra library — predictable, serialisable |
| Component library | Radix UI primitives | Accessible, unstyled, composable |
| AI | Anthropic API (Claude Haiku) | Best-in-class instruction following for JSON |
| CI/CD | GitHub Actions + Vercel | Push to `main` → live in ~30 s |

---

## 📁 Project structure

```
src/
├── app/
│   ├── registry/
│   │   └── componentRegistry.ts   # component types, default props, prop schemas
│   ├── store/
│   │   └── canvasContext.tsx       # state machine, command history, auto-save
│   ├── utils/
│   │   └── codeGenerator.ts       # HTML + React export generators
│   └── components/
│       ├── Toolbar.tsx             # undo/redo, viewport switcher, export, AI
│       ├── ComponentSidebar.tsx    # draggable component palette
│       ├── Canvas.tsx              # drop zones, templates, viewport wrapper
│       ├── PropertiesPanel.tsx     # data-driven prop editor (schema → controls)
│       ├── StatusBar.tsx           # live stats
│       ├── ExportModal.tsx         # HTML / React code export
│       ├── AIGenerateModal.tsx     # Claude-powered layout generator
│       └── canvas/
│           └── NodeRenderer.tsx   # per-type renderers (React.memo)
```

---

## 🔮 What's next

- [ ] **Real-time collaboration** — replace history stack with CRDT / OT, broadcast over WebSocket
- [ ] **Export to Next.js project** — scaffold a full `app/` directory from canvas JSON
- [ ] **Component marketplace** — publishable packages with versioned prop schemas
- [ ] **Nested children** — drag components *inside* Container / Grid nodes
- [ ] **Lighthouse integration** — real score computed on each publish

---

<div align="center">

Built by [Niraj Bharambe](https://github.com/NirajB-dev) · MIT License

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&pause=2000&color=6366F1&center=true&vCenter=true&width=400&lines=Star+⭐+if+this+helped+you!;PRs+welcome." alt="footer" />

</div>
