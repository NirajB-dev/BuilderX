import { useRef } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, User, FileText, Mail } from 'lucide-react';
import { useCanvas, CanvasNode } from '../store/canvasContext';
import { NodeRenderer } from './canvas/NodeRenderer';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';

// ── Quick-start templates ─────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'saas',      label: 'SaaS Landing',  icon: Sparkles, nodes: ['navbar','hero','features','cta'] },
  { id: 'portfolio', label: 'Portfolio',      icon: User,     nodes: ['navbar','hero','card','form'] },
  { id: 'article',   label: 'Article',        icon: FileText, nodes: ['navbar','hero','text','divider','cta'] },
  { id: 'contact',   label: 'Contact Page',   icon: Mail,     nodes: ['navbar','hero','form'] },
] as const;

function EmptyState({ onTemplate }: { onTemplate: (types: string[]) => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 select-none"
      style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.04) 1px,transparent 0)', backgroundSize: '28px 28px' }}
    >
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Plus className="w-7 h-7 text-white/40" />
        </div>
        <h3 className="font-semibold text-white/70 mb-1.5">Blank Canvas</h3>
        <p className="text-sm text-white/30 font-mono">Drag from the sidebar · click a template · or use AI Generate</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3 px-8">
        {TEMPLATES.map(t => {
          const Icon = t.icon;
          return (
            <motion.button
              key={t.id}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTemplate([...t.nodes])}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/8 transition-all text-sm text-white/65 hover:text-white/90"
            >
              <Icon className="w-4 h-4 text-blue-400" />
              {t.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ── Drop zone between nodes ───────────────────────────────────────────────
// Key fix: store callbacks in a ref so the useDrop factory closure never goes stale.

type SidebarItem = { id: string; name: string };
type CanvasItem  = { nodeId: string };
type DragItem    = SidebarItem | CanvasItem;

function isSidebarItem(item: DragItem): item is SidebarItem {
  return 'id' in item;
}

function DropZone({ index }: { index: number }) {
  const { insertNodeAt, moveNodeTo } = useCanvas();

  // Mutable ref — always reflects the latest values without recreating the hook
  const latest = useRef({ insertNodeAt, moveNodeTo, index });
  latest.current = { insertNodeAt, moveNodeTo, index };

  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>(
    () => ({
      accept: ['component', 'canvas-node'],
      drop: (item) => {
        if (isSidebarItem(item)) {
          latest.current.insertNodeAt(item.id, latest.current.index);
        } else {
          latest.current.moveNodeTo(item.nodeId, latest.current.index);
        }
      },
      collect: m => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
    }),
    [] // factory called once; latest ref keeps it fresh
  );

  return (
    // Plain div — react-dnd needs a real DOM element, not a Motion wrapper
    <div
      ref={drop}
      style={{
        height: isOver && canDrop ? 44 : 6,
        transition: 'height 0.15s ease, background 0.15s ease',
        background: isOver && canDrop ? 'rgba(59,130,246,0.12)' : 'transparent',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isOver && canDrop ? '1px dashed rgba(59,130,246,0.45)' : '1px solid transparent',
        margin: '0 4px',
      }}
    >
      {isOver && canDrop && (
        <span style={{ fontSize: 11, color: 'rgba(96,165,250,0.85)', fontFamily: 'monospace' }}>Insert here</span>
      )}
    </div>
  );
}

// ── Draggable canvas node (for reordering) ────────────────────────────────

function DraggableNode({ node, index, total }: { node: CanvasNode; index: number; total: number }) {
  const { selectedId } = useCanvas();
  const isSelected = node.id === selectedId;

  const [{ isDragging }, drag] = useDrag<CanvasItem, void, { isDragging: boolean }>(
    () => ({
      type: 'canvas-node',
      item: { nodeId: node.id },
      collect: m => ({ isDragging: m.isDragging() }),
    }),
    [node.id]
  );

  return (
    <div style={{ position: 'relative', opacity: isDragging ? 0.35 : 1, transition: 'opacity 0.15s' }}>
      {/* Drag handle — plain div so react-dnd works reliably */}
      <div
        ref={drag}
        title="Drag to reorder"
        style={{
          position: 'absolute',
          left: -22,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 30,
          cursor: 'grab',
          padding: '6px 4px',
          opacity: isSelected ? 0.55 : 0.12,
          transition: 'opacity 0.2s',
        }}
      >
        <svg width="10" height="18" viewBox="0 0 10 18" fill="rgba(255,255,255,0.9)">
          <circle cx="3" cy="3"  r="1.4"/><circle cx="7" cy="3"  r="1.4"/>
          <circle cx="3" cy="9"  r="1.4"/><circle cx="7" cy="9"  r="1.4"/>
          <circle cx="3" cy="15" r="1.4"/><circle cx="7" cy="15" r="1.4"/>
        </svg>
      </div>

      {/* Animation wrapper — separate from the drag ref */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.16 }}
      >
        <NodeRenderer node={node} isSelected={isSelected} isFirst={index === 0} isLast={index === total - 1} />
      </motion.div>
    </div>
  );
}

// ── Main Canvas ────────────────────────────────────────────────────────────

const VIEWPORT_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '375px' };
const VIEWPORT_PX    = { desktop: 1280,    tablet: 768,     mobile: 375 };

export function Canvas() {
  const { nodes, selectNode, addNode, moveNodeTo, setNodes, viewportMode } = useCanvas();

  // Stable ref — lets the useDrop factory stay fresh without re-creating the hook
  const latest = useRef({ addNode, moveNodeTo, nodesLen: nodes.length });
  latest.current = { addNode, moveNodeTo, nodesLen: nodes.length };

  // Whole-canvas drop target: catches drops that miss the between-node zones
  const [{ isOver: isOverCanvas }, dropCanvas] = useDrop<DragItem, void, { isOver: boolean }>(
    () => ({
      accept: ['component', 'canvas-node'],
      drop: (item, monitor) => {
        if (monitor.didDrop()) return; // already handled by a DropZone child
        if (isSidebarItem(item)) {
          latest.current.addNode(item.id);
        }
        // canvas-node reorder is handled by DropZones only
      },
      collect: m => ({ isOver: m.isOver({ shallow: true }) }),
    }),
    []
  );

  const handleTemplate = (types: string[]) => {
    const ns: CanvasNode[] = types.map(t => ({
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${t}`,
      type: t,
      props: { ...COMPONENT_REGISTRY[t]?.defaultProps },
    }));
    setNodes(ns);
  };

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ background: '#050509' }}
      onClick={() => selectNode(null)}
    >
      {/* Viewport label */}
      <div className="sticky top-0 z-10 flex justify-center py-1 bg-[#050509]/80 backdrop-blur-sm border-b border-white/5">
        <span className="text-[10px] font-mono text-white/25">
          {viewportMode.charAt(0).toUpperCase() + viewportMode.slice(1)} — {VIEWPORT_PX[viewportMode]}px
        </span>
      </div>

      <div className="flex items-start justify-center px-8 py-4 min-h-full">
        <div
          style={{
            width: '100%',
            maxWidth: VIEWPORT_WIDTHS[viewportMode],
            transition: 'max-width 0.32s cubic-bezier(0.4,0,0.2,1)',
            ['--preview-width' as string]: `${VIEWPORT_PX[viewportMode]}px`,
            position: 'relative',
          } as React.CSSProperties}
        >
          {/* Outer drop target — plain div required by react-dnd */}
          <div
            ref={dropCanvas}
            className="rounded-2xl border border-white/10 overflow-visible shadow-2xl"
            style={{
              minHeight: 600,
              background: isOverCanvas ? 'rgba(59,130,246,0.03)' : 'rgba(13,13,18,0.8)',
              backdropFilter: 'blur(20px)',
              transition: 'background 0.2s',
              outline: isOverCanvas ? '2px dashed rgba(59,130,246,0.3)' : '2px solid transparent',
            }}
            onClick={e => e.stopPropagation()}
          >
            {nodes.length === 0 ? (
              <EmptyState onTemplate={handleTemplate} />
            ) : (
              <AnimatePresence mode="popLayout">
                {nodes.map((node, idx) => (
                  <div key={node.id}>
                    <DropZone index={idx} />
                    <DraggableNode node={node} index={idx} total={nodes.length} />
                  </div>
                ))}
                {/* Final drop zone after last node */}
                <DropZone index={nodes.length} />
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
