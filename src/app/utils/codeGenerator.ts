// JSZip is loaded lazily so it doesn't bloat the initial bundle
let _jszip: typeof import('jszip') | null = null;
async function getJSZip() {
  if (!_jszip) _jszip = (await import('jszip')).default as any;
  return _jszip as any;
}
import { CanvasNode } from '../store/canvasContext';

// ── Helpers ───────────────────────────────────────────────────────────────

function esc(s: any) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function slug(name: string) {
  return name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() || 'project';
}

function componentName(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// ── Per-component file generators ─────────────────────────────────────────

const COMPONENT_FILES: Record<string, (node: CanvasNode) => string> = {

  navbar: (node) => {
    const p = node.props;
    const links = String(p.links || '').split(',').map((l: string) => l.trim()).filter(Boolean);
    return `export default function Navbar({ logo = '${esc(p.logo)}', links = ${JSON.stringify(links)}, ctaLabel = '${esc(p.ctaLabel)}', background = '${esc(p.background)}' }) {
  return (
    <nav style={{ background, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#7c3aed,#9333ea)' }} />
        <span style={{ fontSize: 14, fontFamily: 'monospace', color: 'rgba(255,255,255,0.9)' }}>{logo}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {links.map(link => (
          <a key={link} href="#" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{link}</a>
        ))}
        <a href="#" style={{ padding: '8px 20px', borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', textDecoration: 'none', fontSize: 14 }}>{ctaLabel}</a>
      </div>
    </nav>
  );
}`;
  },

  hero: (node) => {
    const p = node.props;
    return `export default function Hero({
  badge = '${esc(p.badge)}',
  title = '${esc(p.title).replace(/\n/g, '\\n')}',
  subtitle = '${esc(p.subtitle)}',
  ctaPrimary = '${esc(p.ctaPrimary)}',
  ctaSecondary = '${esc(p.ctaSecondary)}',
  paddingTop = ${p.paddingTop},
  paddingBottom = ${p.paddingBottom},
  textAlign = '${p.textAlign}',
}) {
  return (
    <section style={{ padding: \`\${paddingTop}px 64px \${paddingBottom}px\`, textAlign }}>
      {badge && (
        <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa', fontSize: 12, marginBottom: 24 }}>
          {badge}
        </div>
      )}
      <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 24, background: 'linear-gradient(135deg,#fff 60%,rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', whiteSpace: 'pre-line', lineHeight: 1.15 }}>
        {title}
      </h1>
      <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>{subtitle}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        {ctaPrimary && <a href="#" style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>{ctaPrimary}</a>}
        {ctaSecondary && <a href="#" style={{ padding: '14px 32px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)' }}>{ctaSecondary}</a>}
      </div>
    </section>
  );
}`;
  },

  features: (node) => {
    const p = node.props;
    return `const FEATURE_DATA = [
  { title: 'Visual Editor',       desc: 'Drag and drop components to build stunning layouts.' },
  { title: 'Component Library',   desc: '100+ pre-built sections and components ready to use.' },
  { title: 'One-Click Deploy',    desc: 'Ship production-ready sites in seconds with zero config.' },
  { title: 'Live Preview',        desc: 'See every change in real time across all breakpoints.' },
  { title: 'Custom Code',         desc: 'Drop in custom HTML, CSS, or React components.' },
  { title: 'Export Ready',        desc: 'Export clean, readable code or deploy directly.' },
];

export default function FeaturesGrid({
  title = '${esc(p.title)}',
  subtitle = '${esc(p.subtitle)}',
  cardCount = ${p.cardCount || 3},
  paddingTop = ${p.paddingTop},
  paddingBottom = ${p.paddingBottom},
}) {
  const cols = Math.min(cardCount, 3);
  return (
    <section style={{ padding: \`\${paddingTop}px 48px \${paddingBottom}px\`, background: 'rgba(10,10,15,0.4)' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16 }}>{subtitle}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: \`repeat(\${cols},1fr)\`, gap: 24 }}>
        {FEATURE_DATA.slice(0, cardCount).map(f => (
          <div key={f.title} style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.2))', marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{f.title}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`;
  },

  cta: (node) => {
    const p = node.props;
    return `export default function CTASection({
  title = '${esc(p.title)}',
  subtitle = '${esc(p.subtitle)}',
  ctaLabel = '${esc(p.ctaLabel)}',
  paddingTop = ${p.paddingTop},
  paddingBottom = ${p.paddingBottom},
}) {
  return (
    <section style={{ padding: \`\${paddingTop}px 48px \${paddingBottom}px\`, textAlign: 'center', background: 'linear-gradient(to bottom,transparent,rgba(10,10,15,0.6))' }}>
      <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      <p style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 28, fontSize: 16 }}>{subtitle}</p>
      <a href="#" style={{ padding: '14px 40px', borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>{ctaLabel}</a>
    </section>
  );
}`;
  },

  text: (node) => {
    const p = node.props;
    return `export default function TextBlock({
  content = '${esc(p.content)}',
  fontSize = ${p.fontSize},
  fontWeight = '${p.fontWeight}',
  color = '${p.color}',
  textAlign = '${p.textAlign}',
}) {
  return (
    <div style={{ padding: '${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px' }}>
      <p style={{ fontSize, fontWeight, color, textAlign, whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>
        {content}
      </p>
    </div>
  );
}`;
  },

  button: (node) => {
    const p = node.props;
    return `const VARIANTS = {
  primary:   { background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', border: 'none' },
  secondary: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' },
  outline:   { background: 'transparent', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.25)' },
};
const SIZES = { sm: '8px 20px', md: '12px 28px', lg: '16px 40px' };

export default function Button({
  label = '${esc(p.label)}',
  variant = '${p.variant}',
  size = '${p.size}',
  borderRadius = ${p.borderRadius},
  align = '${p.align}',
}) {
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  return (
    <div style={{ display: 'flex', justifyContent: alignMap[align] || 'center', padding: '12px 16px' }}>
      <a href="#" style={{ ...VARIANTS[variant], padding: SIZES[size], borderRadius, textDecoration: 'none', fontWeight: 500, fontSize: 14, display: 'inline-block' }}>
        {label}
      </a>
    </div>
  );
}`;
  },

  image: (node) => {
    const p = node.props;
    return `export default function ImageBlock({
  src = '${esc(p.src)}',
  alt = '${esc(p.alt)}',
  height = ${p.height},
  objectFit = '${p.objectFit}',
  borderRadius = ${p.borderRadius},
}) {
  return (
    <div style={{ borderRadius, overflow: 'hidden' }}>
      <img src={src} alt={alt} style={{ width: '100%', height, objectFit, display: 'block' }} loading="lazy" />
    </div>
  );
}`;
  },

  card: (node) => {
    const p = node.props;
    return `export default function Card({
  title = '${esc(p.title)}',
  description = '${esc(p.description)}',
  background = '${p.background}',
  borderRadius = ${p.borderRadius},
}) {
  return (
    <div style={{ padding: '${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px', background, borderRadius, border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(124,58,237,0.2))', marginBottom: 16 }} />
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.9)' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>{description}</p>
    </div>
  );
}`;
  },

  form: (node) => {
    const p = node.props;
    const fields = String(p.fields || '').split(',').map((f: string) => f.trim()).filter(Boolean);
    return `export default function ContactForm({
  title = '${esc(p.title)}',
  fields = ${JSON.stringify(fields)},
  submitLabel = '${esc(p.submitLabel)}',
  background = '${p.background}',
  borderRadius = ${p.borderRadius},
}) {
  return (
    <div style={{ padding: '${p.paddingTop}px ${p.paddingRight}px ${p.paddingBottom}px ${p.paddingLeft}px', background, borderRadius, border: '1px solid rgba(255,255,255,0.08)', maxWidth: 520, margin: '0 auto' }}>
      <h3 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>{title}</h3>
      {fields.map(field => (
        <div key={field} style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field}</label>
          {field.toLowerCase() === 'message'
            ? <textarea rows={4} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
            : <input type="text" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', fontSize: 14, boxSizing: 'border-box' }} />}
        </div>
      ))}
      <button type="submit" style={{ width: '100%', padding: 13, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#7c3aed)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: 8 }}>{submitLabel}</button>
    </div>
  );
}`;
  },

  divider: (node) => {
    const p = node.props;
    return `export default function Divider({
  color = '${p.color}',
  thickness = ${p.thickness},
  marginTop = ${p.marginTop},
  marginBottom = ${p.marginBottom},
}) {
  return (
    <div style={{ margin: \`\${marginTop}px 0 \${marginBottom}px\`, padding: '0 16px' }}>
      <hr style={{ border: 'none', borderTop: \`\${thickness}px solid \${color}\`, margin: 0 }} />
    </div>
  );
}`;
  },
};

// ── Unique component types in the current canvas ──────────────────────────

function uniqueTypes(nodes: CanvasNode[]): string[] {
  return [...new Set(nodes.map(n => n.type))].filter(t => COMPONENT_FILES[t]);
}

// ── Component name map ────────────────────────────────────────────────────

const TYPE_TO_NAME: Record<string, string> = {
  navbar: 'Navbar', hero: 'Hero', features: 'FeaturesGrid', cta: 'CTASection',
  text: 'TextBlock', button: 'Button', image: 'ImageBlock', card: 'Card',
  form: 'ContactForm', divider: 'Divider',
};

function getCompName(type: string) {
  return TYPE_TO_NAME[type] ?? componentName(type);
}

// ── App.jsx (renders all nodes in order) ─────────────────────────────────

function generateAppJsx(nodes: CanvasNode[]): string {
  const types = uniqueTypes(nodes);
  const imports = types.map(t => `import ${getCompName(t)} from './components/${getCompName(t)}';`).join('\n');

  const renders = nodes
    .filter(n => COMPONENT_FILES[n.type])
    .map(n => {
      const props = Object.entries(n.props)
        .map(([k, v]) => {
          if (typeof v === 'string') return `${k}="${v.replace(/"/g, '\\"')}"`;
          if (typeof v === 'number') return `${k}={${v}}`;
          return null;
        })
        .filter(Boolean)
        .join(' ');
      return `      <${getCompName(n.type)} ${props} />`;
    }).join('\n');

  return `import React from 'react';
${imports}
import './index.css';

export default function App() {
  return (
    <div className="app">
${renders}
    </div>
  );
}`;
}

// ── index.css ─────────────────────────────────────────────────────────────

const INDEX_CSS = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #050509;
  color: #fff;
  min-height: 100vh;
}

.app {
  min-height: 100vh;
}

a { cursor: pointer; }
button { font-family: inherit; }
`;

// ── main.jsx ──────────────────────────────────────────────────────────────

const MAIN_JSX = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

// ── index.html ────────────────────────────────────────────────────────────

function generateIndexHtml(projectName: string) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(projectName)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
}

// ── package.json ──────────────────────────────────────────────────────────

function generatePackageJson(projectName: string) {
  return JSON.stringify({
    name: slug(projectName),
    private: true,
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.0.0',
      vite: '^6.0.0',
    },
  }, null, 2);
}

// ── vite.config.js ────────────────────────────────────────────────────────

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

// ── README.md ─────────────────────────────────────────────────────────────

function generateReadme(projectName: string, nodeCount: number) {
  return `# ${projectName}

> Generated by [BuilderX](https://builder-x-chi.vercel.app/) — ${nodeCount} components

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173).

## Build

\`\`\`bash
npm run build
\`\`\`

Output is in \`dist/\`.

## Project structure

\`\`\`
src/
├── App.jsx              # root component
├── main.jsx             # React entry point
├── index.css            # global styles
└── components/          # one file per component type
\`\`\`
`;
}

// ── Public API: generate ZIP blob ─────────────────────────────────────────

export interface GeneratedFile {
  path: string;
  content: string;
}

export function getProjectFiles(nodes: CanvasNode[], projectName = 'my-project'): GeneratedFile[] {
  const types = uniqueTypes(nodes);
  const files: GeneratedFile[] = [
    { path: 'package.json',      content: generatePackageJson(projectName) },
    { path: 'vite.config.js',    content: VITE_CONFIG },
    { path: 'index.html',        content: generateIndexHtml(projectName) },
    { path: 'src/main.jsx',      content: MAIN_JSX },
    { path: 'src/App.jsx',       content: generateAppJsx(nodes) },
    { path: 'src/index.css',     content: INDEX_CSS },
    { path: 'README.md',         content: generateReadme(projectName, nodes.length) },
    ...types.map(type => ({
      path: `src/components/${getCompName(type)}.jsx`,
      content: COMPONENT_FILES[type]?.(nodes.find(n => n.type === type)!) ?? `// ${type}`,
    })),
  ];
  return files;
}

export async function generateProjectZip(nodes: CanvasNode[], projectName = 'my-project'): Promise<Blob> {
  const JSZip = await getJSZip();
  const zip = new JSZip();
  const folder = zip.folder(slug(projectName))!;

  for (const file of getProjectFiles(nodes, projectName)) {
    folder.file(file.path, file.content);
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}
