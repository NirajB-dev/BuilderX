import { memo } from 'react';
import { CanvasNode } from '../../store/canvasContext';

// Pure content renderer — no drag, no selection, no overlays.
// All interaction is owned by CanvasNodeWrap in Canvas.tsx.

function NodeContent({ node }: { node: CanvasNode }) {
  const { type, props: p } = node;

  switch (type) {
    case 'text':
      return (
        <div style={{ padding: `${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px`, height: '100%' }}>
          <p style={{ fontSize: p.fontSize, fontWeight: p.fontWeight, color: p.color, textAlign: p.textAlign, whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>
            {p.content}
          </p>
        </div>
      );

    case 'button': {
      const sizes: Record<string, string> = { sm: '8px 20px', md: '12px 28px', lg: '16px 40px' };
      const variants: Record<string, React.CSSProperties> = {
        primary: { background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', border: 'none' },
        secondary: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' },
        outline: { background: 'transparent', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' },
      };
      const alignMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
      return (
        <div style={{ display: 'flex', justifyContent: alignMap[p.align] || 'center', alignItems: 'center', height: '100%', padding: '8px 12px' }}>
          <button style={{ ...variants[p.variant], padding: sizes[p.size], borderRadius: p.borderRadius, cursor: 'default', fontWeight: 500, fontSize: 14 }}>
            {p.label}
          </button>
        </div>
      );
    }

    case 'image':
      return (
        <div style={{ borderRadius: p.borderRadius, overflow: 'hidden', height: '100%' }}>
          <img src={p.src} alt={p.alt} style={{ width: '100%', height: '100%', objectFit: p.objectFit, display: 'block' }} />
        </div>
      );

    case 'divider':
      return (
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '0 16px' }}>
          <hr style={{ width: '100%', border: 'none', borderTop: `${p.thickness}px solid ${p.color}`, margin: 0 }} />
        </div>
      );

    case 'container':
      return (
        <div style={{
          display: p.display, flexDirection: p.display === 'flex' ? p.flexDirection : undefined,
          gap: p.gap, padding: `${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px`,
          background: p.background, borderRadius: p.borderRadius,
          border: '1px solid rgba(255,255,255,0.06)', height: '100%', boxSizing: 'border-box',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'rgba(255,255,255,0.2)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8 }}>
            Empty container
          </div>
        </div>
      );

    case 'grid':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.columns},1fr)`, gap: p.gap, padding: `${p.paddingTop}px ${p.paddingLeft}px ${p.paddingBottom}px ${p.paddingRight}px`, height: '100%', boxSizing: 'border-box' }}>
          {Array.from({ length: p.columns }).map((_, i) => (
            <div key={i} style={{ borderRadius: 10, border: '1px dashed rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              Col {i + 1}
            </div>
          ))}
        </div>
      );

    case 'navbar':
      return (
        <nav style={{ background: p.background, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#9333ea)', flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>{p.logo}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {String(p.links || '').split(',').map((l: string) => (
              <span key={l} style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', cursor: 'default' }}>{l.trim()}</span>
            ))}
            <button style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', border: 'none', fontSize: 14, cursor: 'default' }}>
              {p.ctaLabel}
            </button>
          </div>
        </nav>
      );

    case 'hero':
      return (
        <div style={{ padding: `${p.paddingTop}px 64px ${p.paddingBottom}px`, textAlign: p.textAlign, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {p.badge && (
            <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: 12, fontFamily: 'monospace', marginBottom: 24 }}>
              {p.badge}
            </div>
          )}
          <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.45))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'pre-line', lineHeight: 1.15 }}>
            {p.title}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>{p.subtitle}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {p.ctaPrimary && <button style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'default', boxShadow: '0 8px 32px rgba(59,130,246,0.28)' }}>{p.ctaPrimary}</button>}
            {p.ctaSecondary && <button style={{ padding: '14px 32px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 500, cursor: 'default' }}>{p.ctaSecondary}</button>}
          </div>
        </div>
      );

    case 'card':
      return (
        <div style={{ padding: `${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px`, background: p.background, borderRadius: p.borderRadius, border: '1px solid rgba(255,255,255,0.08)', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.2))', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: '#3b82f6' }} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>{p.title}</h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{p.description}</p>
        </div>
      );

    case 'features': {
      const count = Math.max(1, Math.min(6, p.cardCount || 3));
      const titles = ['Visual Editor','Component Library','One-Click Deploy','Live Preview','Custom Code','Export Ready'];
      const descs  = ['Drag and drop components to build stunning layouts.','100+ pre-built sections ready to use.','Ship production-ready sites in seconds.','See changes live across all breakpoints.','Drop in custom HTML or React anywhere.','Export clean code or deploy directly.'];
      return (
        <div style={{ padding: `${p.paddingTop}px 48px ${p.paddingBottom}px`, background: 'rgba(10,10,15,0.4)', height: '100%', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{p.title}</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>{p.subtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 3)},1fr)`, gap: 24 }}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.2))', marginBottom: 14 }} />
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{titles[i]}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>{descs[i]}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'cta':
      return (
        <div style={{ padding: `${p.paddingTop}px 48px ${p.paddingBottom}px`, textAlign: 'center', background: 'linear-gradient(to bottom,transparent,rgba(10,10,15,0.55))', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{p.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontSize: 16 }}>{p.subtitle}</p>
          <div><button style={{ padding: '14px 40px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'default', fontSize: 15 }}>{p.ctaLabel}</button></div>
        </div>
      );

    case 'form': {
      const fields = String(p.fields || '').split(',').map((f: string) => f.trim()).filter(Boolean);
      return (
        <div style={{ padding: `${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px`, background: p.background, borderRadius: p.borderRadius, border: '1px solid rgba(255,255,255,0.08)', height: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20 }}>{p.title}</h3>
          {fields.map((f: string, i: number) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f}</label>
              {f.toLowerCase() === 'message'
                ? <div style={{ width: '100%', height: 72, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />
                : <div style={{ width: '100%', height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
          <button style={{ width: '100%', padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'default', marginTop: 6 }}>{p.submitLabel}</button>
        </div>
      );
    }

    default:
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.25)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8 }}>
          {type}
        </div>
      );
  }
}

export const NodeRenderer = memo(function NodeRenderer({ node }: { node: CanvasNode }) {
  return <NodeContent node={node} />;
});
