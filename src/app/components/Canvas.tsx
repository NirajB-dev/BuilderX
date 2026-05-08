import { useRef, useCallback, memo } from 'react';
import { useDrop } from 'react-dnd';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Plus, Sparkles, User, FileText, Mail, Copy, Trash2 } from 'lucide-react';
import {
  useCanvas, CanvasNode, CANVAS_WIDTHS, SNAP, snapGrid, autoLayout,
} from '../store/canvasContext';
import { NodeRenderer } from './canvas/NodeRenderer';

const CANVAS_HEIGHT = 2400;

// ── Quick-start templates ─────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'saas',      label: 'SaaS Landing', icon: Sparkles, nodes: ['navbar','hero','features','cta'] },
  { id: 'portfolio', label: 'Portfolio',    icon: User,      nodes: ['navbar','hero','card','form'] },
  { id: 'article',   label: 'Article',      icon: FileText,  nodes: ['navbar','hero','text','divider','cta'] },
  { id: 'contact',   label: 'Contact',      icon: Mail,      nodes: ['navbar','hero','form'] },
] as const;

function EmptyState({ onTemplate }: { onTemplate: (types: string[]) => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 pointer-events-none select-none" style={{ zIndex: 1 }}>
      <div className="pointer-events-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Plus className="w-7 h-7 text-white/35" />
        </div>
        <h3 className="font-semibold text-white/55 mb-1.5">Blank Canvas</h3>
        <p className="text-sm text-white/25 font-mono">Drag from sidebar · drop anywhere · or pick a template</p>
      </div>
      <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
        {TEMPLATES.map(t => {
          const Icon = t.icon;
          return (
            <motion.button key={t.id}
              whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => onTemplate([...t.nodes])}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/8 transition-all text-sm text-white/55 hover:text-white/90">
              <Icon className="w-4 h-4 text-blue-400" />{t.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Resize handle (bottom-right corner) ───────────────────────────────────

const ResizeHandle = memo(function ResizeHandle({
  nodeId, startW, startH,
}: { nodeId: string; startW: number; startH: number }) {
  const { updateSize } = useCanvas();
  const orig = useRef({ w: startW, h: startH });

  const onMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    orig.current = { w: startW, h: startH };
    const startMx = e.clientX; const startMy = e.clientY;

    const onMove = (ev: MouseEvent) => {
      updateSize(
        nodeId,
        Math.max(80,  snapGrid(orig.current.w + ev.clientX - startMx)),
        Math.max(40,  snapGrid(orig.current.h + ev.clientY - startMy)),
      );
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div onMouseDown={onMouseDown} title="Drag to resize"
      style={{
        position: 'absolute', right: -5, bottom: -5,
        width: 12, height: 12, borderRadius: 3,
        background: '#3b82f6', cursor: 'nwse-resize', zIndex: 30,
        boxShadow: '0 0 0 2px #030307',
      }}
    />
  );
});

// ── Canvas node wrapper — free-form draggable ──────────────────────────────

const CanvasNodeWrap = memo(function CanvasNodeWrap({ node, idx }: { node: CanvasNode; idx: number }) {
  const { selectedId, selectNode, removeNode, duplicateNode, updatePosition } = useCanvas();
  const isSelected = node.id === selectedId;

  // Motion values track current position (avoids React re-renders during drag)
  const mx = useMotionValue(node.position.x);
  const my = useMotionValue(node.position.y);

  // Sync motion values if position changes externally (undo, AI generate)
  const lastX = useRef(node.position.x);
  const lastY = useRef(node.position.y);
  if (lastX.current !== node.position.x) { mx.set(node.position.x); lastX.current = node.position.x; }
  if (lastY.current !== node.position.y) { my.set(node.position.y); lastY.current = node.position.y; }

  const xRounded = useTransform(mx, v => Math.round(v));
  const yRounded = useTransform(my, v => Math.round(v));

  return (
    <motion.div
      style={{
        position: 'absolute', top: 0, left: 0,
        x: mx, y: my,
        width: node.size.width,
        height: node.size.height,
        zIndex: isSelected ? 500 : idx + 1,
      }}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragEnd={() => {
        const nx = Math.max(0, snapGrid(mx.get()));
        const ny = Math.max(0, snapGrid(my.get()));
        mx.set(nx); my.set(ny);
        updatePosition(node.id, nx, ny);
      }}
      onClick={e => { e.stopPropagation(); selectNode(node.id); }}
    >
      {/* Rendered content — pointer-events off so drag gesture owns the element */}
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', userSelect: 'none' }}>
        <NodeRenderer node={node} />
      </div>

      {/* Selection overlays */}
      {isSelected && (
        <>
          {/* Blue outline ring */}
          <div style={{
            position: 'absolute', inset: 0,
            border: '2px solid #3b82f6', borderRadius: 4,
            pointerEvents: 'none', zIndex: 10,
          }} />

          {/* x, y, W×H label */}
          <div style={{
            position: 'absolute', top: -24, left: 0,
            background: '#3b82f6', color: '#fff',
            fontSize: 10, fontFamily: 'monospace',
            padding: '2px 7px', borderRadius: '4px 4px 0 0',
            pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 20,
          }}>
            <motion.span>{xRounded}</motion.span>, <motion.span>{yRounded}</motion.span>
            {' · '}{node.size.width}×{node.size.height}
          </div>

          {/* Action buttons */}
          <div style={{ position: 'absolute', top: -34, right: 0, display: 'flex', gap: 4, zIndex: 30 }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => duplicateNode(node.id)} title="Duplicate (⌘D)"
              style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(10,10,18,0.95)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Copy size={12} />
            </button>
            <button onClick={() => removeNode(node.id)} title="Delete"
              style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Trash2 size={12} />
            </button>
          </div>

          {/* Resize corner */}
          <ResizeHandle nodeId={node.id} startW={node.size.width} startH={node.size.height} />
        </>
      )}
    </motion.div>
  );
});

// ── Main Canvas ────────────────────────────────────────────────────────────

export function Canvas() {
  const { nodes, selectNode, addNode, setNodes, viewportMode } = useCanvas();
  const scrollRef  = useRef<HTMLDivElement>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const cw = CANVAS_WIDTHS[viewportMode];

  // Mutable ref for useDrop factory (avoids stale closure)
  const latest = useRef({ addNode, cw, scrollTop: 0 });
  latest.current.addNode = addNode;
  latest.current.cw = cw;

  const onScroll = useCallback(() => {
    latest.current.scrollTop = scrollRef.current?.scrollTop ?? 0;
  }, []);

  const [{ isOver }, drop] = useDrop<{ id: string }, void, { isOver: boolean }>(
    () => ({
      accept: 'component',
      drop: (item, monitor) => {
        const offset = monitor.getClientOffset();
        const rect   = artboardRef.current?.getBoundingClientRect();
        if (offset && rect) {
          const x = snapGrid(Math.max(0, offset.x - rect.left));
          const y = snapGrid(Math.max(0, offset.y - rect.top + latest.current.scrollTop));
          latest.current.addNode(item.id, x, y, latest.current.cw);
        } else {
          latest.current.addNode(item.id, undefined, undefined, latest.current.cw);
        }
      },
      collect: m => ({ isOver: m.isOver() }),
    }),
    []
  );

  // Merge react-dnd drop ref with our artboard ref
  const setRefs = useCallback((el: HTMLDivElement | null) => {
    (artboardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    drop(el);
  }, [drop]);

  const handleTemplate = (types: string[]) => setNodes(autoLayout(types, cw));

  return (
    <div ref={scrollRef} onScroll={onScroll}
      className="flex-1 overflow-auto" style={{ background: '#030307' }}
      onClick={() => selectNode(null)}
    >
      {/* Viewport indicator */}
      <div className="sticky top-0 z-[100] flex items-center justify-center py-0.5 border-b border-white/5 bg-[#030307]/90 backdrop-blur-sm">
        <span className="text-[10px] font-mono text-white/22">
          {viewportMode} — {cw}px &nbsp;·&nbsp; {CANVAS_HEIGHT}px canvas &nbsp;·&nbsp; {SNAP}px grid
        </span>
      </div>

      {/* Scrollable body */}
      <div className="flex justify-center py-6 px-4 min-h-full">
        {/* Artboard */}
        <div ref={setRefs}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: cw, minWidth: cw,
            height: CANVAS_HEIGHT, flexShrink: 0,
            background: isOver ? 'rgba(59,130,246,0.03)' : 'rgba(12,12,18,0.97)',
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
            backgroundSize: `${SNAP * 2.5}px ${SNAP * 2.5}px`,
            border: isOver
              ? '2px dashed rgba(59,130,246,0.5)'
              : '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            overflow: 'visible',
            transition: 'border-color 0.12s, background 0.12s',
          }}
        >
          {nodes.length === 0 && <EmptyState onTemplate={handleTemplate} />}

          {nodes.map((node, idx) => (
            <CanvasNodeWrap key={node.id} node={node} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
