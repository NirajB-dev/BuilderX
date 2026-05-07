import { useDrop } from 'react-dnd';
import { useDrag } from 'react-dnd';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, Layout, User, FileText, Mail } from 'lucide-react';
import { useCanvas, CanvasNode } from '../store/canvasContext';
import { NodeRenderer } from './canvas/NodeRenderer';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';

// ── Templates ─────────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: 'saas',
    label: 'SaaS Landing',
    icon: Sparkles,
    nodes: ['navbar', 'hero', 'features', 'cta'],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    icon: User,
    nodes: ['navbar', 'hero', 'card', 'form'],
  },
  {
    id: 'blog',
    label: 'Article',
    icon: FileText,
    nodes: ['navbar', 'hero', 'text', 'divider', 'text', 'cta'],
  },
  {
    id: 'contact',
    label: 'Contact Page',
    icon: Mail,
    nodes: ['navbar', 'hero', 'form'],
  },
] as const;

function EmptyState({ onTemplate }: { onTemplate: (types: string[]) => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <Plus className="w-7 h-7 text-white/40" />
        </div>
        <h3 className="font-semibold text-white/70 mb-1.5">Blank Canvas</h3>
        <p className="text-sm text-white/30 font-mono">Drag from the sidebar or start with a template</p>
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 hover:bg-white/8 transition-all text-sm text-white/70 hover:text-white/90"
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

// ── Per-node drop zone (insert between) ───────────────────────────────────

interface DropZoneProps {
  index: number;
}

function DropZone({ index }: DropZoneProps) {
  const { insertNodeAt, moveNodeTo } = useCanvas();

  const [{ isOver, canDrop }, drop] = useDrop<
    { id: string; name: string } | { nodeId: string },
    void,
    { isOver: boolean; canDrop: boolean }
  >(() => ({
    accept: ['component', 'canvas-node'],
    drop: (item) => {
      if ('nodeId' in item) {
        moveNodeTo(item.nodeId, index);
      } else {
        insertNodeAt(item.id, index);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{
        height: isOver ? 44 : 6,
        transition: 'height 0.15s ease, background 0.15s ease',
        background: isOver ? 'rgba(59,130,246,0.12)' : 'transparent',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isOver && canDrop ? '1px dashed rgba(59,130,246,0.5)' : '1px solid transparent',
        margin: '0 2px',
        cursor: 'default',
      }}
    >
      {isOver && canDrop && (
        <span style={{ fontSize: 11, color: 'rgba(96,165,250,0.8)', fontFamily: 'monospace' }}>
          Insert here
        </span>
      )}
    </div>
  );
}

// ── Draggable node wrapper ─────────────────────────────────────────────────

function DraggableNode({
  node,
  index,
  total,
}: {
  node: CanvasNode;
  index: number;
  total: number;
}) {
  const { selectedId } = useCanvas();

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'canvas-node',
    item: { nodeId: node.id },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <motion.div
      ref={preview}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.16 }}
      style={{ position: 'relative' }}
    >
      {/* Drag handle — shown when selected */}
      {selectedId === node.id && (
        <div
          ref={drag}
          title="Drag to reorder"
          style={{
            position: 'absolute',
            left: -24,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 30,
            cursor: 'grab',
            padding: '4px',
            opacity: 0.5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width="12" height="20" viewBox="0 0 12 20" fill="rgba(255,255,255,0.6)">
            <circle cx="4" cy="4" r="1.5" /><circle cx="8" cy="4" r="1.5" />
            <circle cx="4" cy="10" r="1.5" /><circle cx="8" cy="10" r="1.5" />
            <circle cx="4" cy="16" r="1.5" /><circle cx="8" cy="16" r="1.5" />
          </svg>
        </div>
      )}
      <NodeRenderer
        node={node}
        isSelected={node.id === selectedId}
        isFirst={index === 0}
        isLast={index === total - 1}
      />
    </motion.div>
  );
}

// ── Main Canvas ────────────────────────────────────────────────────────────

const VIEWPORT_WIDTHS = { desktop: '100%', tablet: '768px', mobile: '375px' };
const VIEWPORT_PX = { desktop: 1280, tablet: 768, mobile: 375 };

export function Canvas() {
  const { nodes, selectNode, addNode, insertNodeAt, setNodes, viewportMode } = useCanvas();

  // End-of-list drop target (add at bottom)
  const [{ isOver: isOverEnd, canDrop: canDropEnd }, dropEnd] = useDrop<
    { id: string; name: string } | { nodeId: string },
    void,
    { isOver: boolean; canDrop: boolean }
  >(() => ({
    accept: ['component', 'canvas-node'],
    drop: (item) => {
      if ('nodeId' in item) {
        moveNodeTo(item.nodeId, nodes.length);
      } else {
        addNode(item.id);
      }
    },
    collect: m => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  }));

  // Need moveNodeTo in scope for the closure above
  const { moveNodeTo } = useCanvas();

  const handleTemplate = (types: string[]) => {
    const ns: CanvasNode[] = types.map(t => ({
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${t}`,
      type: t,
      props: { ...COMPONENT_REGISTRY[t]?.defaultProps },
    }));
    setNodes(ns);
  };

  const maxWidth = VIEWPORT_WIDTHS[viewportMode];

  return (
    <div
      className="flex-1 overflow-auto relative"
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
            maxWidth: maxWidth,
            transition: 'max-width 0.32s cubic-bezier(0.4,0,0.2,1)',
            ['--preview-width' as any]: `${VIEWPORT_PX[viewportMode]}px`,
            position: 'relative',
          }}
        >
          <div
            className="bg-[#0d0d12]/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-visible shadow-2xl relative"
            style={{ minHeight: 600 }}
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

                {/* Final drop zone at bottom */}
                <div
                  ref={dropEnd}
                  style={{
                    height: isOverEnd ? 48 : 12,
                    transition: 'height 0.15s ease, background 0.15s ease',
                    background: isOverEnd ? 'rgba(59,130,246,0.1)' : 'transparent',
                    borderRadius: '0 0 16px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isOverEnd && canDropEnd ? '1px dashed rgba(59,130,246,0.4)' : '1px solid transparent',
                    borderTop: isOverEnd ? '1px dashed rgba(59,130,246,0.4)' : 'none',
                  }}
                >
                  {isOverEnd && canDropEnd && (
                    <span style={{ fontSize: 11, color: 'rgba(96,165,250,0.7)', fontFamily: 'monospace' }}>
                      Add to bottom
                    </span>
                  )}
                </div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
