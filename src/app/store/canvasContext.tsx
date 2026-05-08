import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { COMPONENT_REGISTRY, FULL_WIDTH_TYPES, DEFAULT_SIZE } from '../registry/componentRegistry';

export interface CanvasNode {
  id: string;
  type: string;
  props: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export const CANVAS_WIDTHS = { desktop: 1440, tablet: 768, mobile: 375 } as const;
export const SNAP = 8;

export function snapGrid(v: number) {
  return Math.round(v / SNAP) * SNAP;
}

/** Auto-stack nodes for templates / AI generation */
export function autoLayout(types: string[], canvasWidth: number): CanvasNode[] {
  let y = 0;
  return types.map(type => {
    const def = COMPONENT_REGISTRY[type];
    const ds = DEFAULT_SIZE[type] ?? { width: 400, height: 200 };
    const isFullWidth = FULL_WIDTH_TYPES.has(type);
    const width  = isFullWidth ? canvasWidth : ds.width;
    const height = ds.height;
    const x = isFullWidth ? 0 : Math.round((canvasWidth - width) / 2);
    const node: CanvasNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${type}`,
      type,
      props: { ...(def?.defaultProps ?? {}) },
      position: { x, y },
      size: { width, height },
    };
    y += height;
    return node;
  });
}

type NodeSnapshot = CanvasNode[];

interface CanvasState {
  nodes: CanvasNode[];
  selectedId: string | null;
  viewportMode: 'desktop' | 'tablet' | 'mobile';
  past: NodeSnapshot[];
  future: NodeSnapshot[];
  changeCount: number;
  lastSavedAt: number | null;
  projectName: string;
}

type Action =
  | { type: 'ADD_NODE';        nodeType: string; x?: number; y?: number; canvasWidth?: number }
  | { type: 'REMOVE_NODE';     id: string }
  | { type: 'SELECT_NODE';     id: string | null }
  | { type: 'UPDATE_PROP';     id: string; key: string; value: any }
  | { type: 'UPDATE_POSITION'; id: string; x: number; y: number }
  | { type: 'UPDATE_SIZE';     id: string; width: number; height: number }
  | { type: 'SET_NODES';       nodes: CanvasNode[] }
  | { type: 'SET_VIEWPORT';    mode: 'desktop' | 'tablet' | 'mobile' }
  | { type: 'DUPLICATE_NODE';  id: string }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MARK_SAVED' }
  | { type: 'SET_PROJECT_NAME'; name: string };

const MAX_HISTORY = 50;

function pushHistory(past: NodeSnapshot[], nodes: CanvasNode[]): NodeSnapshot[] {
  return [...past.slice(-(MAX_HISTORY - 1)), nodes];
}

const INITIAL_STATE: CanvasState = {
  nodes: [],
  selectedId: null,
  viewportMode: 'desktop',
  past: [],
  future: [],
  changeCount: 0,
  lastSavedAt: null,
  projectName: 'Untitled Project',
};

function canvasReducer(state: CanvasState, action: Action): CanvasState {
  switch (action.type) {
    case 'ADD_NODE': {
      const def = COMPONENT_REGISTRY[action.nodeType];
      if (!def) return state;
      const cw = action.canvasWidth ?? CANVAS_WIDTHS[state.viewportMode];
      const ds = DEFAULT_SIZE[action.nodeType] ?? { width: 400, height: 200 };
      const isFullWidth = FULL_WIDTH_TYPES.has(action.nodeType);
      const width  = isFullWidth ? cw : ds.width;
      const height = ds.height;
      const x = action.x !== undefined ? snapGrid(action.x) : isFullWidth ? 0 : Math.round((cw - width) / 2);
      const y = action.y !== undefined ? snapGrid(action.y) : Math.max(0, ...state.nodes.map(n => n.position.y + n.size.height));
      const newNode: CanvasNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: action.nodeType,
        props: { ...def.defaultProps },
        position: { x, y },
        size: { width, height },
      };
      return {
        ...state,
        nodes: [...state.nodes, newNode],
        selectedId: newNode.id,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'REMOVE_NODE': {
      const newNodes = state.nodes.filter(n => n.id !== action.id);
      return {
        ...state,
        nodes: newNodes,
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'DUPLICATE_NODE': {
      const src = state.nodes.find(n => n.id === action.id);
      if (!src) return state;
      const dup: CanvasNode = {
        ...src,
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        position: { x: src.position.x + 16, y: src.position.y + 16 },
      };
      return {
        ...state,
        nodes: [...state.nodes, dup],
        selectedId: dup.id,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'SELECT_NODE':
      return { ...state, selectedId: action.id };

    case 'UPDATE_PROP': {
      const newNodes = state.nodes.map(n =>
        n.id === action.id ? { ...n, props: { ...n.props, [action.key]: action.value } } : n
      );
      return {
        ...state,
        nodes: newNodes,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'UPDATE_POSITION': {
      const newNodes = state.nodes.map(n =>
        n.id === action.id ? { ...n, position: { x: action.x, y: action.y } } : n
      );
      return {
        ...state,
        nodes: newNodes,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'UPDATE_SIZE': {
      const newNodes = state.nodes.map(n =>
        n.id === action.id ? { ...n, size: { width: action.width, height: action.height } } : n
      );
      return {
        ...state,
        nodes: newNodes,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'SET_NODES':
      return {
        ...state,
        nodes: action.nodes,
        selectedId: null,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };

    case 'SET_VIEWPORT':
      return { ...state, viewportMode: action.mode };

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...state,
        nodes: prev,
        selectedId: null,
        past: state.past.slice(0, -1),
        future: [state.nodes, ...state.future.slice(0, MAX_HISTORY - 1)],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        ...state,
        nodes: next,
        past: pushHistory(state.past, state.nodes),
        future: rest,
        changeCount: state.changeCount + 1,
      };
    }

    case 'MARK_SAVED':
      return { ...state, lastSavedAt: Date.now() };

    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.name };

    default:
      return state;
  }
}

interface CanvasContextValue extends CanvasState {
  addNode: (nodeType: string, x?: number, y?: number, canvasWidth?: number) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  updateProp: (id: string, key: string, value: any) => void;
  updatePosition: (id: string, x: number, y: number) => void;
  updateSize: (id: string, width: number, height: number) => void;
  setNodes: (nodes: CanvasNode[]) => void;
  setViewport: (mode: 'desktop' | 'tablet' | 'mobile') => void;
  undo: () => void;
  redo: () => void;
  setProjectName: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedNode: CanvasNode | null;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, INITIAL_STATE);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevChangeCount = useRef(state.changeCount);

  useEffect(() => {
    if (state.changeCount === prevChangeCount.current) return;
    prevChangeCount.current = state.changeCount;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => dispatch({ type: 'MARK_SAVED' }), 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [state.changeCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      else if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); dispatch({ type: 'REDO' }); }
      else if (mod && e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); }
      else if (mod && e.key === 'd' && state.selectedId) { e.preventDefault(); dispatch({ type: 'DUPLICATE_NODE', id: state.selectedId }); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId && !isInput) {
        e.preventDefault(); dispatch({ type: 'REMOVE_NODE', id: state.selectedId });
      }
      else if (e.key === 'Escape') { dispatch({ type: 'SELECT_NODE', id: null }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.selectedId]);

  const addNode = useCallback((nodeType: string, x?: number, y?: number, canvasWidth?: number) =>
    dispatch({ type: 'ADD_NODE', nodeType, x, y, canvasWidth }), []);
  const removeNode = useCallback((id: string) => dispatch({ type: 'REMOVE_NODE', id }), []);
  const duplicateNode = useCallback((id: string) => dispatch({ type: 'DUPLICATE_NODE', id }), []);
  const selectNode = useCallback((id: string | null) => dispatch({ type: 'SELECT_NODE', id }), []);
  const updateProp = useCallback((id: string, key: string, value: any) => dispatch({ type: 'UPDATE_PROP', id, key, value }), []);
  const updatePosition = useCallback((id: string, x: number, y: number) => dispatch({ type: 'UPDATE_POSITION', id, x, y }), []);
  const updateSize = useCallback((id: string, width: number, height: number) => dispatch({ type: 'UPDATE_SIZE', id, width, height }), []);
  const setNodes = useCallback((nodes: CanvasNode[]) => dispatch({ type: 'SET_NODES', nodes }), []);
  const setViewport = useCallback((mode: 'desktop' | 'tablet' | 'mobile') => dispatch({ type: 'SET_VIEWPORT', mode }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const setProjectName = useCallback((name: string) => dispatch({ type: 'SET_PROJECT_NAME', name }), []);

  const value: CanvasContextValue = {
    ...state,
    addNode, removeNode, duplicateNode, selectNode,
    updateProp, updatePosition, updateSize, setNodes,
    setViewport, undo, redo, setProjectName,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    selectedNode: state.nodes.find(n => n.id === state.selectedId) ?? null,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvas(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvas must be used within CanvasProvider');
  return ctx;
}
