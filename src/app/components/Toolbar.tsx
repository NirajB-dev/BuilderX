import { useState } from 'react';
import { Undo2, Redo2, Monitor, Tablet, Smartphone, Zap, RotateCcw, Download, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useCanvas } from '../store/canvasContext';
import { ExportModal } from './ExportModal';
import { AIGenerateModal } from './AIGenerateModal';

export function Toolbar() {
  const { viewportMode, setViewport, undo, redo, canUndo, canRedo, past, projectName, lastSavedAt, changeCount } = useCanvas();
  const [showExport, setShowExport] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const isSaving = changeCount > 0 && lastSavedAt === null;

  return (
    <>
      <div className="h-14 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-2xl flex items-center px-5 gap-4 flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-mono font-semibold text-sm">BuilderX</span>
          <div className="h-5 w-px bg-white/10 mx-1" />
          <span className="text-xs text-white/45 font-mono truncate max-w-[140px]">{projectName}</span>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1 ml-3">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-3.5 h-3.5 text-white/70" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 className="w-3.5 h-3.5 text-white/70" />
          </button>
          {past.length > 0 && (
            <span className="text-[10px] text-white/25 font-mono ml-0.5">{past.length}</span>
          )}
        </div>

        {/* AI Generate — the star feature */}
        <motion.button
          onClick={() => setShowAI(true)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-3 h-8 rounded-lg bg-gradient-to-r from-violet-600/30 to-blue-500/30 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 text-xs font-mono transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI Generate
        </motion.button>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1 ml-auto">
          {([
            { mode: 'desktop' as const, icon: Monitor, w: '1280' },
            { mode: 'tablet' as const, icon: Tablet, w: '768' },
            { mode: 'mobile' as const, icon: Smartphone, w: '375' },
          ] as const).map(({ mode, icon: Icon, w }) => (
            <button
              key={mode}
              onClick={() => setViewport(mode)}
              title={`${mode} (${w}px)`}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                viewportMode === mode
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/5 text-white/45 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2.5 ml-3">
          {/* Save indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 h-7 rounded-lg border font-mono text-[11px] transition-all ${
            isSaving
              ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {isSaving ? (
              <><RotateCcw className="w-2.5 h-2.5 animate-spin" /><span>Saving…</span></>
            ) : (
              <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><span>Saved</span></>
            )}
          </div>

          {/* Export */}
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-mono text-white/60 hover:text-white/90 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          {/* Publish */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white font-medium text-xs shadow-lg shadow-blue-500/20"
          >
            Publish
          </motion.button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-[11px] font-semibold cursor-pointer select-none">
            NB
          </div>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showAI && <AIGenerateModal onClose={() => setShowAI(false)} />}
    </>
  );
}
