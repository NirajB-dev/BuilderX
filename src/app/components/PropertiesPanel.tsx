import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Trash2, MousePointer, Move, Maximize2 } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useCanvas } from '../store/canvasContext';
import { COMPONENT_REGISTRY, PropDef } from '../registry/componentRegistry';

// ── Prop control components ────────────────────────────────────────────────

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-white/50 font-mono shrink-0">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-28 h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 font-mono focus:border-blue-500/50 focus:bg-white/8 transition-all outline-none"
      />
    </div>
  );
}

function TextareaInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/50 font-mono block">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className="w-full px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 font-mono focus:border-blue-500/50 focus:bg-white/8 transition-all outline-none resize-none"
      />
    </div>
  );
}

function SliderInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/50 font-mono">{label}</label>
        <span className="text-xs text-white/80 font-mono tabular-nums">{value}</span>
      </div>
      <Slider.Root
        className="relative flex items-center w-full h-5"
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([v]) => onChange(v)}
      >
        <Slider.Track className="relative h-1 flex-grow rounded-full bg-white/10">
          <Slider.Range className="absolute h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600" />
        </Slider.Track>
        <Slider.Thumb className="block w-3.5 h-3.5 bg-white rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-grab active:cursor-grabbing" />
      </Slider.Root>
    </div>
  );
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-white/50 font-mono shrink-0">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-28 h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 font-mono focus:border-blue-500/50 focus:bg-white/8 transition-all outline-none"
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-[#0d0d12]">{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Parse the value to a hex for the color picker, fall back gracefully
  const safeHex = value?.startsWith('#') ? value : '#3b82f6';
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-white/50 font-mono shrink-0">{label}</label>
      <div className="flex items-center gap-2">
        <div style={{ width: 24, height: 24, borderRadius: 6, background: value, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
        <input
          type="color"
          value={safeHex}
          onChange={e => onChange(e.target.value)}
          className="w-16 h-7 rounded-lg bg-white/5 border border-white/10 cursor-pointer outline-none"
          style={{ padding: '0 2px' }}
        />
      </div>
    </div>
  );
}

function PropControl({ propDef, value, onChange }: { propDef: PropDef; value: any; onChange: (v: any) => void }) {
  switch (propDef.type) {
    case 'text':
      return <TextInput label={propDef.label} value={String(value ?? '')} onChange={onChange} />;
    case 'textarea':
      return <TextareaInput label={propDef.label} value={String(value ?? '')} onChange={onChange} />;
    case 'number':
      return <TextInput label={propDef.label} value={String(value ?? 0)} onChange={v => onChange(Number(v))} />;
    case 'slider':
      return <SliderInput label={propDef.label} value={Number(value ?? 0)} min={propDef.min ?? 0} max={propDef.max ?? 100} onChange={onChange} />;
    case 'select':
      return <SelectInput label={propDef.label} value={String(value ?? '')} options={propDef.options ?? []} onChange={onChange} />;
    case 'color':
      return <ColorInput label={propDef.label} value={String(value ?? '#ffffff')} onChange={onChange} />;
    default:
      return null;
  }
}

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ title, defaultOpen, children }: { title: string; defaultOpen: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="border-b border-white/8">
        <Collapsible.Trigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/4 transition-colors">
          <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono">{title}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-white/40" /> : <ChevronDown className="w-3.5 h-3.5 text-white/40" />}
        </Collapsible.Trigger>
        <Collapsible.Content className="px-4 pb-4 space-y-3">
          {children}
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────

const SECTION_ORDER = ['content', 'layout', 'typography', 'spacing', 'styling'];
const SECTION_DEFAULT_OPEN: Record<string, boolean> = {
  content: true, layout: true, typography: false, spacing: false, styling: false,
};

function NumberBox({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-white/40 font-mono w-3">{label}</label>
      <input
        type="number"
        value={Math.round(value)}
        min={min}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 font-mono focus:border-blue-500/50 outline-none tabular-nums"
      />
    </div>
  );
}

export function PropertiesPanel() {
  const { selectedNode, updateProp, updatePosition, updateSize, removeNode } = useCanvas();
  const def = selectedNode ? COMPONENT_REGISTRY[selectedNode.type] : null;

  const handleChange = useCallback((key: string, value: any) => {
    if (!selectedNode) return;
    updateProp(selectedNode.id, key, value);
  }, [selectedNode, updateProp]);

  if (!selectedNode || !def) {
    return (
      <div className="w-72 border-l border-white/10 bg-[#0a0a0f]/60 backdrop-blur-2xl flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <MousePointer className="w-5 h-5 text-white/25" />
        </div>
        <div className="text-center px-6">
          <p className="text-sm text-white/40 font-mono">No selection</p>
          <p className="text-xs text-white/25 mt-1">Click a component on the canvas to edit its properties</p>
        </div>
      </div>
    );
  }

  // Group prop defs by section
  const bySection: Record<string, PropDef[]> = {};
  for (const pd of def.propSchema) {
    if (!bySection[pd.section]) bySection[pd.section] = [];
    bySection[pd.section].push(pd);
  }

  return (
    <div className="w-72 border-l border-white/10 bg-[#0a0a0f]/60 backdrop-blur-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-mono text-sm text-white/90 truncate">Properties</h2>
          <p className="text-xs text-blue-400/80 mt-0.5 font-mono truncate">{def.name}</p>
        </div>
        <button
          onClick={() => removeNode(selectedNode.id)}
          className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
          title="Delete component"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">

        {/* Position & Size — always shown */}
        <Section title="Transform" defaultOpen={true}>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Move className="w-3 h-3 text-white/35" />
              <span className="text-[10px] text-white/35 font-mono uppercase tracking-wider">Position</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberBox label="X" value={selectedNode.position.x} onChange={v => updatePosition(selectedNode.id, v, selectedNode.position.y)} />
              <NumberBox label="Y" value={selectedNode.position.y} onChange={v => updatePosition(selectedNode.id, selectedNode.position.x, v)} />
            </div>
            <div className="flex items-center gap-1.5 mt-3 mb-1">
              <Maximize2 className="w-3 h-3 text-white/35" />
              <span className="text-[10px] text-white/35 font-mono uppercase tracking-wider">Size</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumberBox label="W" value={selectedNode.size.width}  min={80}  onChange={v => updateSize(selectedNode.id, v, selectedNode.size.height)} />
              <NumberBox label="H" value={selectedNode.size.height} min={40} onChange={v => updateSize(selectedNode.id, selectedNode.size.width, v)} />
            </div>
          </div>
        </Section>

        {SECTION_ORDER.filter(s => bySection[s]).map(sectionId => (
          <Section key={sectionId} title={sectionId} defaultOpen={SECTION_DEFAULT_OPEN[sectionId] ?? false}>
            {bySection[sectionId].map(pd => (
              <PropControl
                key={pd.key}
                propDef={pd}
                value={selectedNode.props[pd.key]}
                onChange={v => handleChange(pd.key, v)}
              />
            ))}
          </Section>
        ))}
      </div>

      {/* Node ID footer */}
      <div className="p-3 border-t border-white/8">
        <span className="text-[10px] text-white/20 font-mono truncate block">{selectedNode.id}</span>
      </div>
    </div>
  );
}
