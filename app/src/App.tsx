import { EquationModal } from './features/equations/EquationModal';
import { Sidebar } from './features/sidebar/Sidebar';
import { FlowCanvas } from './features/canvas/FlowCanvas';
import { SummaryPanel } from './features/summary/SummaryPanel';
import { OcrModal } from './features/ocr/OcrModal';
import { useAccountStore } from '@/store/accountStore';

function App() {
  const { clearAll } = useAccountStore();

  return (
    <>
      <div id="app-wrapper">
        <header id="main-header">
            <div className="brand-logo">📐  Mohmaed Khedr - AccountSketch <span style={{ fontSize: '14px', opacity: 0.6, fontFamily: 'Cairo, sans-serif' }}>Pro v3.0</span></div>
            <div className="flex gap-3">
                <OcrModal />
                <button 
                  className="brutal-btn btn-danger"
                  onClick={() => clearAll()}
                >
                    🗑️ تصفية اللوحة
                </button>
            </div>
        </header>

        {/* SIDEBAR */}
        <Sidebar />

        {/* CANVAS */}
        <main id="canvas-area">
            <FlowCanvas />
        </main>

        {/* SUMMARY */}
        <SummaryPanel />
      </div>
      
      <EquationModal />
    </>
  );
}

export default App;
