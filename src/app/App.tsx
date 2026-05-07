import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CanvasProvider } from './store/canvasContext';
import { Toolbar } from './components/Toolbar';
import { ComponentSidebar } from './components/ComponentSidebar';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { StatusBar } from './components/StatusBar';

export default function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <CanvasProvider>
        <div className="size-full flex flex-col bg-[#050509] dark">
          <Toolbar />
          <div className="flex-1 flex overflow-hidden">
            <ComponentSidebar />
            <Canvas />
            <PropertiesPanel />
          </div>
          <StatusBar />
        </div>
      </CanvasProvider>
    </DndProvider>
  );
}
