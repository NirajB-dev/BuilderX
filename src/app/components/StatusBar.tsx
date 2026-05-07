import { Wifi, Zap, Activity, Clock, Layers } from 'lucide-react';
import { useCanvas } from '../store/canvasContext';

const VIEWPORT_PX = { desktop: 1280, tablet: 768, mobile: 375 };

export function StatusBar() {
  const { nodes, selectedNode, viewportMode, past } = useCanvas();

  return (
    <div className="h-9 border-t border-white/8 bg-[#0a0a0f]/80 backdrop-blur-2xl flex items-center px-5 gap-5 text-[11px] flex-shrink-0">
      <div className="flex items-center gap-1.5 text-white/50 font-mono">
        <Wifi className="w-3 h-3 text-emerald-400" />
        <span>Connected</span>
      </div>

      <div className="h-3 w-px bg-white/10" />

      <div className="flex items-center gap-1.5 text-white/50 font-mono">
        <Zap className="w-3 h-3 text-yellow-400" />
        <span>Render &lt;50ms</span>
      </div>

      <div className="h-3 w-px bg-white/10" />

      <div className="flex items-center gap-1.5 text-white/50 font-mono">
        <Activity className="w-3 h-3 text-blue-400" />
        <span>Lighthouse 94</span>
      </div>

      <div className="h-3 w-px bg-white/10" />

      <div className="flex items-center gap-1.5 text-white/50 font-mono">
        <Clock className="w-3 h-3 text-violet-400" />
        <span>{past.length} {past.length === 1 ? 'change' : 'changes'}</span>
      </div>

      <div className="h-3 w-px bg-white/10" />

      <div className="flex items-center gap-1.5 text-white/50 font-mono">
        <Layers className="w-3 h-3 text-blue-400" />
        <span>{nodes.length} {nodes.length === 1 ? 'layer' : 'layers'}</span>
      </div>

      <div className="ml-auto flex items-center gap-3 text-white/40 font-mono">
        {selectedNode && (
          <>
            <span className="text-blue-400/70">{selectedNode.type}</span>
            <div className="h-3 w-px bg-white/10" />
          </>
        )}
        <span>{VIEWPORT_PX[viewportMode]}px</span>
        <div className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400">
          v0.1.0
        </div>
      </div>
    </div>
  );
}
