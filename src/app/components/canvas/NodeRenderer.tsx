import React, { memo } from 'react';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useCanvas, CanvasNode } from '../../store/canvasContext';
import { COMPONENT_REGISTRY } from '../../registry/componentRegistry';

function NodeContent({ node }: { node: CanvasNode }) {
  const { type, props: p } = node;

  switch (type) {
    case 'text':
      return (
        <div style={{
          paddingTop: p.paddingTop, paddingBottom: p.paddingBottom,
          paddingLeft: p.paddingLeft, paddingRight: p.paddingRight,
        }}>
          <p style={{
            fontSize: p.fontSize, fontWeight: p.fontWeight,
            color: p.color, textAlign: p.textAlign, whiteSpace: 'pre-wrap', margin: 0,
          }}>
            {p.content}
          </p>
        </div>
      );

    case 'button': {
      const sizes: Record<string, string> = { sm: '8px 20px', md: '12px 28px', lg: '16px 40px' };
      const variants: Record<string, React.CSSProperties> = {
        primary: { background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none' },
        secondary: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' },
        outline: { background: 'transparent', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' },
      };
      const alignMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
      return (
        <div style={{ display: 'flex', justifyContent: alignMap[p.align] || 'center', padding: '12px 16px' }}>
          <button style={{ ...variants[p.variant], padding: sizes[p.size], borderRadius: p.borderRadius, cursor: 'pointer', fontWeight: 500, fontSize: 14 }}>
            {p.label}
          </button>
        </div>
      );
    }

    case 'image':
      return (
        <div style={{ borderRadius: p.borderRadius, overflow: 'hidden' }}>
          <img
            src={p.src} alt={p.alt}
            style={{ width: '100%', height: p.height, objectFit: p.objectFit, display: 'block' }}
          />
        </div>
      );

    case 'divider':
      return (
        <div style={{ marginTop: p.marginTop, marginBottom: p.marginBottom, padding: '0 16px' }}>
          <hr style={{ border: 'none', borderTop: `${p.thickness}px solid ${p.color}`, margin: 0 }} />
        </div>
      );

    case 'container':
      return (
        <div style={{
          display: p.display,
          flexDirection: p.display === 'flex' ? p.flexDirection : undefined,
          gap: p.gap,
          paddingTop: p.paddingTop, paddingBottom: p.paddingBottom,
          paddingLeft: p.paddingLeft, paddingRight: p.paddingRight,
          background: p.background, borderRadius: p.borderRadius,
          border: '1px solid rgba(255,255,255,0.06)',
          minHeight: 80,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 60, color: 'rgba(255,255,255,0.25)', fontSize: 13, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.12)' }}>
            Empty container — drop components here
          </div>
        </div>
      );

    case 'grid':
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${p.columns}, 1fr)`,
          gap: p.gap,
          paddingTop: p.paddingTop, paddingBottom: p.paddingBottom,
          paddingLeft: p.paddingLeft, paddingRight: p.paddingRight,
        }}>
          {Array.from({ length: p.columns }).map((_, i) => (
            <div key={i} style={{ height: 96, borderRadius: 12, border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              Col {i + 1}
            </div>
          ))}
        </div>
      );

    case 'navbar':
      return (
        <nav style={{ background: p.background, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }} />
            <span style={{ fontSize: 14, fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>{p.logo}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {String(p.links || '').split(',').map((link: string) => (
              <span key={link} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>{link.trim()}</span>
            ))}
            <button style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14 }}>
              {p.ctaLabel}
            </button>
          </div>
        </nav>
      );

    case 'hero':
      return (
        <div style={{ padding: `${p.paddingTop}px 64px ${p.paddingBottom}px`, textAlign: p.textAlign as any }}>
          {p.badge && (
            <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: 12, fontFamily: 'monospace', marginBottom: 24 }}>
              {p.badge}
            </div>
          )}
          <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'pre-line', lineHeight: 1.15 }}>
            {p.title}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
            {p.subtitle}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: p.textAlign === 'left' ? 'flex-start' : p.textAlign === 'right' ? 'flex-end' : 'center', gap: 16 }}>
            {p.ctaPrimary && (
              <button style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
                {p.ctaPrimary}
              </button>
            )}
            {p.ctaSecondary && (
              <button style={{ padding: '14px 32px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 500, cursor: 'pointer' }}>
                {p.ctaSecondary}
              </button>
            )}
          </div>
        </div>
      );

    case 'card':
      return (
        <div style={{ padding: `${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px`, background: p.background, borderRadius: p.borderRadius, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(124,58,237,0.2))', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: 5, background: '#3b82f6' }} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>{p.title}</h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{p.description}</p>
        </div>
      );

    case 'features': {
      const count = Math.max(1, Math.min(6, p.cardCount || 3));
      const featureTitles = ['Visual Editor', 'Component Library', 'One-Click Deploy', 'Live Preview', 'Custom Code', 'Export Ready'];
      const featureDescs = [
        'Drag and drop components to build stunning layouts instantly.',
        '100+ pre-built sections and components ready to use.',
        'Ship production-ready sites in seconds with zero config.',
        'See every change in real time across all device breakpoints.',
        'Drop in custom HTML, CSS, or React components anywhere.',
        'Export clean, readable code or deploy directly from the builder.',
      ];
      return (
        <div style={{ paddingTop: p.paddingTop, paddingBottom: p.paddingBottom, paddingLeft: 48, paddingRight: 48, background: 'rgba(10,10,15,0.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, color: 'rgba(255,255,255,0.95)' }}>{p.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16 }}>{p.subtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 3)}, 1fr)`, gap: 24 }}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(124,58,237,0.2))', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: '#3b82f6' }} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>{featureTitles[i]}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{featureDescs[i]}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'cta':
      return (
        <div style={{ paddingTop: p.paddingTop, paddingBottom: p.paddingBottom, paddingLeft: 48, paddingRight: 48, textAlign: 'center', background: 'linear-gradient(to bottom, transparent, rgba(10,10,15,0.6))' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12, color: 'rgba(255,255,255,0.95)' }}>{p.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 28, fontSize: 16 }}>{p.subtitle}</p>
          <button style={{ padding: '14px 40px', borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 15, boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
            {p.ctaLabel}
          </button>
        </div>
      );

    case 'form':
      return (
        <div style={{ padding: `${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px`, background: p.background, borderRadius: p.borderRadius, border: '1px solid rgba(255,255,255,0.08)', maxWidth: 520, margin: '0 auto' }}>
          <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24, color: 'rgba(255,255,255,0.95)' }}>{p.title}</h3>
          {String(p.fields || '').split(',').map((field: string, i: number) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {field.trim()}
              </label>
              {field.trim().toLowerCase() === 'message' ? (
                <textarea style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: 14, rows: 4, boxSizing: 'border-box', resize: 'vertical', outline: 'none' } as any} rows={4} />
              ) : (
                <input type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
              )}
            </div>
          ))}
          <button style={{ width: '100%', padding: '13px', borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8, fontSize: 15 }}>
            {p.submitLabel}
          </button>
        </div>
      );

    default:
      return (
        <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8 }}>
          Unknown component type: {type}
        </div>
      );
  }
}

interface NodeRendererProps {
  node: CanvasNode;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export const NodeRenderer = memo(function NodeRenderer({ node, isSelected, isFirst, isLast }: NodeRendererProps) {
  const { selectNode, removeNode, moveNode } = useCanvas();
  const def = COMPONENT_REGISTRY[node.type];

  return (
    <div
      className="relative group"
      onClick={(e) => { e.stopPropagation(); selectNode(node.id); }}
      style={{
        outline: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
        outlineOffset: -2,
        borderRadius: isSelected ? 4 : 0,
        transition: 'outline 0.12s',
        cursor: 'pointer',
      }}
    >
      {/* Type label on selection */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: -24, left: 0, zIndex: 20,
          background: '#3b82f6', color: '#fff', fontSize: 11,
          fontFamily: 'monospace', padding: '2px 8px', borderRadius: '4px 4px 0 0',
          pointerEvents: 'none',
        }}>
          {def?.name ?? node.type}
        </div>
      )}

      {/* Action overlay — only on selected */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1 z-20"
          onClick={e => e.stopPropagation()}
        >
          {!isFirst && (
            <button
              onClick={() => moveNode(node.id, 'up')}
              title="Move up"
              style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronUp size={14} />
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => moveNode(node.id, 'down')}
              title="Move down"
              style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ChevronDown size={14} />
            </button>
          )}
          <button
            onClick={() => removeNode(node.id)}
            title="Delete"
            style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}

      <NodeContent node={node} />
    </div>
  );
});
