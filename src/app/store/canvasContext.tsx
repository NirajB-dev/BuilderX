import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { COMPONENT_REGISTRY } from '../registry/componentRegistry';

export interface CanvasNode {
  id: string;
  type: string;
  props: Record<string, any>;
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
  | { type: 'ADD_NODE'; nodeType: string }
  | { type: 'INSERT_NODE_AT'; nodeType: string; index: number }
  | { type: 'REMOVE_NODE'; id: string }
  | { type: 'SELECT_NODE'; id: string | null }
  | { type: 'UPDATE_PROP'; id: string; key: string; value: any }
  | { type: 'MOVE_NODE'; id: string; direction: 'up' | 'down' }
  | { type: 'MOVE_NODE_TO'; id: string; toIndex: number }
  | { type: 'SET_NODES'; nodes: CanvasNode[] }
  | { type: 'SET_VIEWPORT'; mode: 'desktop' | 'tablet' | 'mobile' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'MARK_SAVED' }
  | { type: 'SET_PROJECT_NAME'; name: string };

const MAX_HISTORY = 50;

function pushHistory(past: NodeSnapshot[], nodes: CanvasNode[]): NodeSnapshot[] {
  return [...past.slice(-(MAX_HISTORY - 1)), nodes];
}

const INITIAL_NODES: CanvasNode[] = [];

const INITIAL_STATE: CanvasState = {
  nodes: INITIAL_NODES,
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
      const newNode: CanvasNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: action.nodeType,
        props: { ...def.defaultProps },
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
      const idx = state.nodes.findIndex(n => n.id === action.id);
      const newNodes = state.nodes.filter(n => n.id !== action.id);
      const newSelectedId = state.selectedId === action.id
        ? (newNodes[idx - 1]?.id ?? newNodes[0]?.id ?? null)
        : state.selectedId;
      return {
        ...state,
        nodes: newNodes,
        selectedId: newSelectedId,
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

    case 'INSERT_NODE_AT': {
      const def = COMPONENT_REGISTRY[action.nodeType];
      if (!def) return state;
      const newNode: CanvasNode = {
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: action.nodeType,
        props: { ...def.defaultProps },
      };
      const newNodes = [...state.nodes];
      newNodes.splice(action.index, 0, newNode);
      return {
        ...state,
        nodes: newNodes,
        selectedId: newNode.id,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'MOVE_NODE_TO': {
      const fromIdx = state.nodes.findIndex(n => n.id === action.id);
      if (fromIdx === -1) return state;
      const newNodes = [...state.nodes];
      const [moved] = newNodes.splice(fromIdx, 1);
      const toIdx = action.toIndex > fromIdx ? action.toIndex - 1 : action.toIndex;
      newNodes.splice(Math.max(0, toIdx), 0, moved);
      return {
        ...state,
        nodes: newNodes,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'SET_NODES': {
      return {
        ...state,
        nodes: action.nodes,
        selectedId: null,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'MOVE_NODE': {
      const idx = state.nodes.findIndex(n => n.id === action.id);
      if (idx === -1) return state;
      const newNodes = [...state.nodes];
      if (action.direction === 'up' && idx > 0) {
        [newNodes[idx - 1], newNodes[idx]] = [newNodes[idx], newNodes[idx - 1]];
      } else if (action.direction === 'down' && idx < newNodes.length - 1) {
        [newNodes[idx], newNodes[idx + 1]] = [newNodes[idx + 1], newNodes[idx]];
      } else {
        return state;
      }
      return {
        ...state,
        nodes: newNodes,
        past: pushHistory(state.past, state.nodes),
        future: [],
        changeCount: state.changeCount + 1,
      };
    }

    case 'SET_VIEWPORT':
      return { ...state, viewportMode: action.mode };

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      return {
        ...state,
        nodes: prev,
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
  addNode: (nodeType: string) => void;
  insertNodeAt: (nodeType: string, index: number) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  updateProp: (id: string, key: string, value: any) => void;
  moveNode: (id: string, direction: 'up' | 'down') => void;
  moveNodeTo: (id: string, toIndex: number) => void;
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

  // Debounced auto-save simulation
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevChangeCount = useRef(state.changeCount);

  useEffect(() => {
    if (state.changeCount === prevChangeCount.current) return;
    prevChangeCount.current = state.changeCount;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      // In production: PATCH /canvas/:id with JSON state
      dispatch({ type: 'MARK_SAVED' });
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.changeCount]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if (mod && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      } else if (mod && e.key === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          e.preventDefault();
          dispatch({ type: 'REMOVE_NODE', id: state.selectedId });
        }
      } else if (e.key === 'Escape') {
        dispatch({ type: 'SELECT_NODE', id: null });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.selectedId]);

  const addNode = useCallback((nodeType: string) => dispatch({ type: 'ADD_NODE', nodeType }), []);
  const insertNodeAt = useCallback((nodeType: string, index: number) => dispatch({ type: 'INSERT_NODE_AT', nodeType, index }), []);
  const removeNode = useCallback((id: string) => dispatch({ type: 'REMOVE_NODE', id }), []);
  const selectNode = useCallback((id: string | null) => dispatch({ type: 'SELECT_NODE', id }), []);
  const updateProp = useCallback((id: string, key: string, value: any) => dispatch({ type: 'UPDATE_PROP', id, key, value }), []);
  const moveNode = useCallback((id: string, direction: 'up' | 'down') => dispatch({ type: 'MOVE_NODE', id, direction }), []);
  const moveNodeTo = useCallback((id: string, toIndex: number) => dispatch({ type: 'MOVE_NODE_TO', id, toIndex }), []);
  const setNodes = useCallback((nodes: CanvasNode[]) => dispatch({ type: 'SET_NODES', nodes }), []);
  const setViewport = useCallback((mode: 'desktop' | 'tablet' | 'mobile') => dispatch({ type: 'SET_VIEWPORT', mode }), []);
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);
  const setProjectName = useCallback((name: string) => dispatch({ type: 'SET_PROJECT_NAME', name }), []);

  const selectedNode = state.nodes.find(n => n.id === state.selectedId) ?? null;

  const value: CanvasContextValue = {
    ...state,
    addNode,
    insertNodeAt,
    removeNode,
    selectNode,
    updateProp,
    moveNode,
    moveNodeTo,
    setNodes,
    setViewport,
    undo,
    redo,
    setProjectName,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    selectedNode,
  };

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvas(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvas must be used within CanvasProvider');
  return ctx;
}
