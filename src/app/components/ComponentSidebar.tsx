import { useState } from 'react';
import { Search, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useDrag } from 'react-dnd';
import { REGISTRY_LIST, ComponentDefinition } from '../registry/componentRegistry';
import { useCanvas } from '../store/canvasContext';

function DraggableComponent({ component }: { component: ComponentDefinition }) {
  const { addNode } = useCanvas();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'component',
    item: { id: component.type, name: component.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const Icon = component.icon;

  return (
    <motion.div
      ref={drag}
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => addNode(component.type)}
      className={`p-3 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-white/8 cursor-grab active:cursor-grabbing transition-all group select-none ${
        isDragging ? 'opacity-40 scale-95' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-violet-500/30 transition-all flex-shrink-0">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <span className="text-sm text-white/80 group-hover:text-white/95 transition-colors">{component.name}</span>
      </div>
    </motion.div>
  );
}

const CATEGORIES = [
  { id: 'basic', label: 'Basic' },
  { id: 'layout', label: 'Layout' },
  { id: 'sections', label: 'Sections' },
] as const;

export function ComponentSidebar() {
  const [search, setSearch] = useState('');
  const { nodes } = useCanvas();

  const filtered = search.trim()
    ? REGISTRY_LIST.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div className="w-64 border-r border-white/10 bg-[#0a0a0f]/60 backdrop-blur-2xl flex flex-col">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-white/50" />
          <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Components</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white/90 placeholder:text-white/35 focus:border-blue-500/50 focus:bg-white/8 transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {filtered ? (
          filtered.length > 0 ? (
            <div className="space-y-1.5">
              {filtered.map(c => <DraggableComponent key={c.type} component={c} />)}
            </div>
          ) : (
            <div className="text-center py-8 text-white/30 text-sm">No results</div>
          )
        ) : (
          CATEGORIES.map(({ id, label }) => {
            const items = REGISTRY_LIST.filter(c => c.category === id);
            return (
              <div key={id}>
                <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-2 px-1 font-mono">{label}</h3>
                <div className="space-y-1.5">
                  {items.map(c => <DraggableComponent key={c.type} component={c} />)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Layer count footer */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/30 font-mono">
          <span>{nodes.length} {nodes.length === 1 ? 'layer' : 'layers'}</span>
          <span>Click or drag to add</span>
        </div>
      </div>
    </div>
  );
}
