import { useState, useCallback } from 'react';
import { X, Copy, Download, Check, Code2, FileCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCanvas } from '../store/canvasContext';
import { generateHTML, generateReact } from '../utils/codeGenerator';

type Tab = 'html' | 'react';

interface Props {
  onClose: () => void;
}

export function ExportModal({ onClose }: Props) {
  const { nodes, projectName } = useCanvas();
  const [tab, setTab] = useState<Tab>('html');
  const [copied, setCopied] = useState(false);

  const code = tab === 'html'
    ? generateHTML(nodes, projectName)
    : generateReact(nodes, projectName);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleDownload = useCallback(() => {
    const ext = tab === 'html' ? 'html' : 'tsx';
    const filename = `${projectName.replace(/\s+/g, '-').toLowerCase() || 'page'}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, tab, projectName]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(5,5,9,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-3xl mx-4 rounded-2xl border border-white/10 bg-[#0d0d12] overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="font-mono text-sm font-semibold">Export Code</h2>
                <p className="text-xs text-white/40 font-mono mt-0.5">{nodes.length} components → {tab === 'html' ? 'HTML + CSS' : 'React JSX'}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-1 px-6 py-3 border-b border-white/10 bg-[#0a0a0f]/60">
            {([
              { id: 'html' as Tab, label: 'HTML + CSS', icon: FileCode },
              { id: 'react' as Tab, label: 'React / JSX', icon: Code2 },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-3 h-8 rounded-lg text-xs font-mono transition-all ${
                  tab === id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white/70 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-mono text-blue-400 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>

          {/* Code area */}
          <div className="relative" style={{ maxHeight: '60vh' }}>
            {nodes.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-white/30 text-sm font-mono">
                Add components to the canvas first
              </div>
            ) : (
              <pre className="overflow-auto p-6 text-xs font-mono text-white/80 leading-relaxed" style={{ maxHeight: '60vh', background: '#080810', tabSize: 2 }}>
                <code>{code}</code>
              </pre>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-white/8 bg-[#0a0a0f]/60 flex items-center justify-between">
            <span className="text-xs text-white/30 font-mono">
              {code.split('\n').length} lines · {(new Blob([code]).size / 1024).toFixed(1)} KB
            </span>
            <span className="text-xs text-white/25 font-mono">Generated by BuilderX</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
