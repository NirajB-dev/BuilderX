import { useState, useCallback, useEffect } from 'react';
import { X, Download, Check, ChevronRight, File, Folder, FolderOpen, Loader2, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCanvas } from '../store/canvasContext';
import { getProjectFiles, generateProjectZip, GeneratedFile } from '../utils/codeGenerator';

// ── File tree helpers ─────────────────────────────────────────────────────

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
  file?: GeneratedFile;
}

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: Record<string, any> = {};

  for (const file of files) {
    const parts = file.path.split('/');
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!cur[part]) cur[part] = {};
      if (i === parts.length - 1) cur[part].__file = file;
      else cur = cur[part];
    }
  }

  function traverse(obj: Record<string, any>, base = ''): TreeNode[] {
    return Object.entries(obj)
      .filter(([k]) => k !== '__file')
      .sort(([a], [b]) => {
        const aIsDir = !obj[a].__file;
        const bIsDir = !obj[b].__file;
        if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
        return a.localeCompare(b);
      })
      .map(([name, val]) => {
        const path = base ? `${base}/${name}` : name;
        if (val.__file) {
          return { name, path, isDir: false, file: val.__file };
        }
        return { name, path, isDir: true, children: traverse(val, path) };
      });
  }

  return traverse(root);
}

// ── Tree node component ───────────────────────────────────────────────────

function FileTreeNode({
  node, depth, selected, onSelect,
}: {
  node: TreeNode; depth: number; selected: string | null; onSelect: (f: GeneratedFile) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isSelected = node.file?.path === selected;

  if (node.isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1.5 w-full text-left py-0.5 hover:text-white/80 transition-colors"
          style={{ paddingLeft: depth * 16 + 4 }}
        >
          {open ? <FolderOpen className="w-3.5 h-3.5 text-yellow-400/70 flex-shrink-0" /> : <Folder className="w-3.5 h-3.5 text-yellow-400/70 flex-shrink-0" />}
          <span className="text-xs text-white/60 font-mono">{node.name}</span>
          <ChevronRight className={`w-3 h-3 text-white/25 ml-auto transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
        {open && node.children?.map(child => (
          <FileTreeNode key={child.path} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  const ext = node.name.split('.').pop() ?? '';
  const iconColor: Record<string, string> = {
    jsx: '#61dafb', tsx: '#3b82f6', js: '#f7df1e', ts: '#3b82f6',
    css: '#38bdf8', html: '#f97316', json: '#8bc34a', md: '#a78bfa',
  };

  return (
    <button
      onClick={() => node.file && onSelect(node.file)}
      className={`flex items-center gap-1.5 w-full text-left py-0.5 transition-colors rounded ${
        isSelected ? 'bg-blue-500/15 text-blue-300' : 'hover:text-white/80 text-white/50'
      }`}
      style={{ paddingLeft: depth * 16 + 4 }}
    >
      <File className="w-3.5 h-3.5 flex-shrink-0" style={{ color: iconColor[ext] ?? 'rgba(255,255,255,0.4)' }} />
      <span className="text-xs font-mono">{node.name}</span>
    </button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────

export function ExportModal({ onClose }: { onClose: () => void }) {
  const { nodes, projectName } = useCanvas();
  const files = getProjectFiles(nodes, projectName);
  const tree  = buildTree(files);

  const [selected, setSelected] = useState<GeneratedFile | null>(files.find(f => f.path === 'src/App.jsx') ?? files[0] ?? null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  // Reset downloaded state after 2 s
  useEffect(() => {
    if (!downloaded) return;
    const t = setTimeout(() => setDownloaded(false), 2000);
    return () => clearTimeout(t);
  }, [downloaded]);

  const handleDownloadZip = useCallback(async () => {
    setDownloading(true);
    try {
      const blob = await generateProjectZip(nodes, projectName);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '-').toLowerCase() || 'project'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } finally {
      setDownloading(false);
    }
  }, [nodes, projectName]);

  const handleCopy = useCallback(async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.content);
  }, [selected]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(3,3,7,0.88)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.93, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full flex flex-col rounded-2xl border border-white/10 bg-[#0a0a12] shadow-2xl overflow-hidden"
          style={{ maxWidth: 900, height: '80vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="font-mono text-sm font-semibold">Export Project</h2>
                <p className="text-[11px] text-white/35 font-mono">{files.length} files · React + Vite · ready to run</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/55 transition-all">
                Copy file
              </button>
              <motion.button
                onClick={handleDownloadZip}
                disabled={downloading || nodes.length === 0}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 h-7 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : downloaded ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                {downloading ? 'Zipping…' : downloaded ? 'Downloaded!' : 'Download .zip'}
              </motion.button>
              <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white/50" />
              </button>
            </div>
          </div>

          {nodes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-white/30 text-sm font-mono">
              Add components to the canvas first
            </div>
          ) : (
            <div className="flex flex-1 overflow-hidden">
              {/* File tree */}
              <div className="w-52 border-r border-white/10 overflow-y-auto py-2 px-2 flex-shrink-0 bg-[#080810]/60">
                <p className="text-[9px] text-white/25 font-mono uppercase tracking-widest px-1 mb-1.5">Project files</p>
                {tree.map(node => (
                  <FileTreeNode key={node.path} node={node} depth={0} selected={selected?.path ?? null} onSelect={setSelected} />
                ))}
              </div>

              {/* Code viewer */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {selected && (
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/8 flex-shrink-0 bg-[#080810]/40">
                    <span className="text-xs font-mono text-white/45">{selected.path}</span>
                    <span className="text-[10px] font-mono text-white/25">{selected.content.split('\n').length} lines</span>
                  </div>
                )}
                <pre
                  className="flex-1 overflow-auto p-5 text-xs font-mono leading-relaxed"
                  style={{ background: '#060610', color: 'rgba(255,255,255,0.78)', tabSize: 2 }}
                >
                  <code>{selected?.content ?? '// Select a file'}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-5 py-2.5 border-t border-white/8 flex items-center justify-between flex-shrink-0 bg-[#080810]/60">
            <div className="flex items-center gap-3 text-[10px] font-mono text-white/25">
              <span>npm install</span>
              <span className="text-white/15">→</span>
              <span>npm run dev</span>
              <span className="text-white/15">→</span>
              <span>localhost:5173</span>
            </div>
            <span className="text-[10px] text-white/20 font-mono">Generated by BuilderX</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
