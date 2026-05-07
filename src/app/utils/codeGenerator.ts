import { CanvasNode } from '../store/canvasContext';

function esc(s: any): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Per-node HTML generators ──────────────────────────────────────────────

function nodeHTML(node: CanvasNode): string {
  const p = node.props;
  switch (node.type) {
    case 'navbar': {
      const links = String(p.links || '').split(',').map((l: string) => l.trim()).filter(Boolean);
      return `<nav style="background:${p.background};padding:14px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.08);">
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#9333ea);"></div>
    <span style="font-size:14px;font-family:monospace;color:rgba(255,255,255,0.9);">${esc(p.logo)}</span>
  </div>
  <div style="display:flex;align-items:center;gap:24px;">
    ${links.map(l => `<a href="#" style="font-size:14px;color:rgba(255,255,255,0.6);text-decoration:none;">${esc(l)}</a>`).join('')}
    <a href="#" style="padding:8px 20px;border-radius:8px;background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;text-decoration:none;font-size:14px;">${esc(p.ctaLabel)}</a>
  </div>
</nav>`;
    }

    case 'hero':
      return `<section style="padding:${p.paddingTop}px 64px ${p.paddingBottom}px;text-align:${p.textAlign};">
  ${p.badge ? `<div style="display:inline-block;padding:6px 16px;border-radius:999px;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.25);color:#60a5fa;font-size:12px;font-family:monospace;margin-bottom:24px;">${esc(p.badge)}</div>` : ''}
  <h1 style="font-size:48px;font-weight:700;margin-bottom:24px;background:linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.5));-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:pre-line;line-height:1.15;">${esc(p.title)}</h1>
  <p style="font-size:18px;color:rgba(255,255,255,0.6);max-width:600px;margin:0 auto 32px;line-height:1.6;">${esc(p.subtitle)}</p>
  <div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;">
    ${p.ctaPrimary ? `<a href="#" style="padding:14px 32px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;text-decoration:none;font-weight:600;box-shadow:0 8px 32px rgba(59,130,246,0.3);">${esc(p.ctaPrimary)}</a>` : ''}
    ${p.ctaSecondary ? `<a href="#" style="padding:14px 32px;border-radius:12px;background:rgba(255,255,255,0.06);color:#fff;text-decoration:none;font-weight:500;border:1px solid rgba(255,255,255,0.12);">${esc(p.ctaSecondary)}</a>` : ''}
  </div>
</section>`;

    case 'features': {
      const count = Math.max(1, Math.min(6, p.cardCount || 3));
      const titles = ['Visual Editor','Component Library','One-Click Deploy','Live Preview','Custom Code','Export Ready'];
      const descs = ['Drag and drop components to build stunning layouts.','100+ pre-built sections and components ready to use.','Ship production-ready sites in seconds with zero config.','See changes live across all device breakpoints.','Drop in custom HTML, CSS, or React anywhere.','Export clean, readable code or deploy directly.'];
      const cols = Math.min(count, 3);
      const cards = Array.from({ length: count }, (_, i) => `
    <div style="padding:24px;border-radius:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
      <div style="width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.2));margin-bottom:16px;"></div>
      <h3 style="font-size:16px;font-weight:600;margin-bottom:8px;color:rgba(255,255,255,0.9);">${esc(titles[i])}</h3>
      <p style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;margin:0;">${esc(descs[i])}</p>
    </div>`).join('');
      return `<section style="padding:${p.paddingTop}px 48px ${p.paddingBottom}px;background:rgba(10,10,15,0.4);">
  <div style="text-align:center;margin-bottom:48px;">
    <h2 style="font-size:32px;font-weight:700;margin-bottom:12px;color:rgba(255,255,255,0.95);">${esc(p.title)}</h2>
    <p style="color:rgba(255,255,255,0.55);font-size:16px;">${esc(p.subtitle)}</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:24px;">${cards}
  </div>
</section>`;
    }

    case 'cta':
      return `<section style="padding:${p.paddingTop}px 48px ${p.paddingBottom}px;text-align:center;background:linear-gradient(to bottom,transparent,rgba(10,10,15,0.6));">
  <h2 style="font-size:32px;font-weight:700;margin-bottom:12px;color:rgba(255,255,255,0.95);">${esc(p.title)}</h2>
  <p style="color:rgba(255,255,255,0.55);margin-bottom:28px;font-size:16px;">${esc(p.subtitle)}</p>
  <a href="#" style="padding:14px 40px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 8px 32px rgba(59,130,246,0.3);">${esc(p.ctaLabel)}</a>
</section>`;

    case 'text':
      return `<div style="padding:${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px;">
  <p style="font-size:${p.fontSize}px;font-weight:${p.fontWeight};color:${p.color};text-align:${p.textAlign};white-space:pre-wrap;margin:0;">${esc(p.content)}</p>
</div>`;

    case 'button': {
      const sizes: Record<string, string> = { sm: '8px 20px', md: '12px 28px', lg: '16px 40px' };
      const variants: Record<string, string> = {
        primary: 'background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;border:none;',
        secondary: 'background:rgba(255,255,255,0.08);color:#fff;border:1px solid rgba(255,255,255,0.15);',
        outline: 'background:transparent;color:rgba(255,255,255,0.9);border:1px solid rgba(255,255,255,0.25);',
      };
      const alignMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
      return `<div style="display:flex;justify-content:${alignMap[p.align] || 'center'};padding:12px 16px;">
  <a href="#" style="${variants[p.variant] || variants.primary}padding:${sizes[p.size] || sizes.md};border-radius:${p.borderRadius}px;cursor:pointer;font-weight:500;font-size:14px;text-decoration:none;display:inline-block;">${esc(p.label)}</a>
</div>`;
    }

    case 'image':
      return `<div style="border-radius:${p.borderRadius}px;overflow:hidden;">
  <img src="${esc(p.src)}" alt="${esc(p.alt)}" style="width:100%;height:${p.height}px;object-fit:${p.objectFit};display:block;" loading="lazy" />
</div>`;

    case 'divider':
      return `<div style="margin:${p.marginTop}px 0 ${p.marginBottom}px;padding:0 16px;">
  <hr style="border:none;border-top:${p.thickness}px solid ${p.color};margin:0;" />
</div>`;

    case 'card':
      return `<div style="padding:${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px;background:${p.background};border-radius:${p.borderRadius}px;border:1px solid rgba(255,255,255,0.08);">
  <div style="width:48px;height:48px;border-radius:10px;background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.2));margin-bottom:16px;"></div>
  <h3 style="font-size:17px;font-weight:600;margin-bottom:8px;color:rgba(255,255,255,0.9);">${esc(p.title)}</h3>
  <p style="font-size:14px;color:rgba(255,255,255,0.5);line-height:1.6;margin:0;">${esc(p.description)}</p>
</div>`;

    case 'form': {
      const fields = String(p.fields || '').split(',').map((f: string) => f.trim()).filter(Boolean);
      return `<div style="padding:${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px;background:${p.background};border-radius:${p.borderRadius}px;border:1px solid rgba(255,255,255,0.08);max-width:520px;margin:0 auto;">
  <h3 style="font-size:22px;font-weight:600;margin-bottom:24px;color:rgba(255,255,255,0.95);">${esc(p.title)}</h3>
  ${fields.map(f => `<div style="margin-bottom:16px;">
    <label style="display:block;font-size:12px;color:rgba(255,255,255,0.5);font-family:monospace;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">${esc(f)}</label>
    ${f.toLowerCase() === 'message' ? `<textarea rows="4" style="width:100%;padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-size:14px;resize:vertical;box-sizing:border-box;"></textarea>` : `<input type="text" style="width:100%;padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-size:14px;box-sizing:border-box;" />`}
  </div>`).join('')}
  <button type="submit" style="width:100%;padding:13px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;border:none;font-weight:600;cursor:pointer;margin-top:8px;font-size:15px;">${esc(p.submitLabel)}</button>
</div>`;
    }

    default:
      return `<!-- Unknown component: ${node.type} -->`;
  }
}

// ── Per-node JSX generators ───────────────────────────────────────────────

function nodeJSX(node: CanvasNode, indent = '      '): string {
  const p = node.props;
  switch (node.type) {
    case 'navbar': {
      const links = String(p.links || '').split(',').map((l: string) => l.trim()).filter(Boolean);
      return `${indent}<nav style={{ background: '${p.background}', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
${indent}  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
${indent}    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }} />
${indent}    <span style={{ fontSize: 14, fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>${p.logo}</span>
${indent}  </div>
${indent}  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
${indent}    ${links.map(l => `<a href="#" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>${l}</a>`).join(`\n${indent}    `)}
${indent}    <a href="#" style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', textDecoration: 'none', fontSize: 14 }}>${p.ctaLabel}</a>
${indent}  </div>
${indent}</nav>`;
    }

    case 'hero':
      return `${indent}<section style={{ padding: '${p.paddingTop}px 64px ${p.paddingBottom}px', textAlign: '${p.textAlign}' }}>
${indent}  ${p.badge ? `<div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: 12, fontFamily: 'monospace', marginBottom: 24 }}>${p.badge}</div>` : ''}
${indent}  <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'pre-line', lineHeight: 1.15 }}>
${indent}    {${JSON.stringify(p.title)}}
${indent}  </h1>
${indent}  <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>${p.subtitle}</p>
${indent}  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
${indent}    ${p.ctaPrimary ? `<a href="#" style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>${p.ctaPrimary}</a>` : ''}
${indent}    ${p.ctaSecondary ? `<a href="#" style={{ padding: '14px 32px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>${p.ctaSecondary}</a>` : ''}
${indent}  </div>
${indent}</section>`;

    case 'features': {
      const count = Math.max(1, Math.min(6, p.cardCount || 3));
      return `${indent}<section style={{ padding: '${p.paddingTop}px 48px ${p.paddingBottom}px', background: 'rgba(10,10,15,0.4)' }}>
${indent}  <div style={{ textAlign: 'center', marginBottom: 48 }}>
${indent}    <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>${p.title}</h2>
${indent}    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16 }}>${p.subtitle}</p>
${indent}  </div>
${indent}  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(${Math.min(count, 3)}, 1fr)', gap: 24 }}>
${indent}    {/* ${count} feature cards */}
${indent}  </div>
${indent}</section>`;
    }

    case 'cta':
      return `${indent}<section style={{ padding: '${p.paddingTop}px 48px ${p.paddingBottom}px', textAlign: 'center', background: 'linear-gradient(to bottom, transparent, rgba(10,10,15,0.6))' }}>
${indent}  <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>${p.title}</h2>
${indent}  <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 28, fontSize: 16 }}>${p.subtitle}</p>
${indent}  <a href="#" style={{ padding: '14px 40px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>${p.ctaLabel}</a>
${indent}</section>`;

    case 'text':
      return `${indent}<div style={{ padding: '${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px' }}>
${indent}  <p style={{ fontSize: ${p.fontSize}, fontWeight: '${p.fontWeight}', color: '${p.color}', textAlign: '${p.textAlign}', whiteSpace: 'pre-wrap', margin: 0 }}>
${indent}    {${JSON.stringify(p.content)}}
${indent}  </p>
${indent}</div>`;

    case 'button': {
      const alignMap: Record<string, string> = { left: 'flex-start', center: 'center', right: 'flex-end' };
      return `${indent}<div style={{ display: 'flex', justifyContent: '${alignMap[p.align] || 'center'}', padding: '12px 16px' }}>
${indent}  <a href="#" style={{ padding: '12px 28px', borderRadius: ${p.borderRadius}, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>
${indent}    ${p.label}
${indent}  </a>
${indent}</div>`;
    }

    case 'image':
      return `${indent}<div style={{ borderRadius: ${p.borderRadius}, overflow: 'hidden' }}>
${indent}  <img src="${p.src}" alt="${p.alt}" style={{ width: '100%', height: ${p.height}, objectFit: '${p.objectFit}', display: 'block' }} loading="lazy" />
${indent}</div>`;

    case 'divider':
      return `${indent}<div style={{ margin: '${p.marginTop}px 0 ${p.marginBottom}px', padding: '0 16px' }}>
${indent}  <hr style={{ border: 'none', borderTop: '${p.thickness}px solid ${p.color}', margin: 0 }} />
${indent}</div>`;

    case 'card':
      return `${indent}<div style={{ padding: '${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px', background: '${p.background}', borderRadius: ${p.borderRadius}, border: '1px solid rgba(255,255,255,0.08)' }}>
${indent}  <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.2))', marginBottom: 16 }} />
${indent}  <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>${p.title}</h3>
${indent}  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>${p.description}</p>
${indent}</div>`;

    case 'form': {
      const fields = String(p.fields || '').split(',').map((f: string) => f.trim()).filter(Boolean);
      return `${indent}<div style={{ padding: '${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px', background: '${p.background}', borderRadius: ${p.borderRadius}, border: '1px solid rgba(255,255,255,0.08)', maxWidth: 520, margin: '0 auto' }}>
${indent}  <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>${p.title}</h3>
${indent}  ${fields.map(f => `<div style={{ marginBottom: 16 }}>
${indent}    <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>${f}</label>
${indent}    <input type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: 14 }} />
${indent}  </div>`).join('\n')}
${indent}  <button style={{ width: '100%', padding: 13, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>${p.submitLabel}</button>
${indent}</div>`;
    }

    default:
      return `${indent}{/* Unknown component: ${node.type} */}`;
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export function generateHTML(nodes: CanvasNode[], projectName = 'My Page'): string {
  const body = nodes.map(n => nodeHTML(n)).join('\n\n');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(projectName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #050509; color: #fff; }
    a { cursor: pointer; }
  </style>
</head>
<body>

${body}

</body>
</html>`;
}

export function generateReact(nodes: CanvasNode[], projectName = 'MyPage'): string {
  const componentName = projectName.replace(/[^a-zA-Z0-9]/g, '') || 'MyPage';
  const jsx = nodes.map(n => nodeJSX(n)).join('\n\n');
  return `import React from 'react';

export default function ${componentName}() {
  return (
    <div style={{ background: '#050509', color: '#fff', minHeight: '100vh', fontFamily: "system-ui, -apple-system, sans-serif" }}>

${jsx}

    </div>
  );
}`;
}
