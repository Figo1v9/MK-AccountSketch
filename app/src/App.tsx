import { EquationModal } from './features/equations/EquationModal';
import { Sidebar } from './features/sidebar/Sidebar';
import { FlowCanvas } from './features/canvas/FlowCanvas';
import { SummaryPanel } from './features/summary/SummaryPanel';
import { OcrModal } from './features/ocr/OcrModal';
import { StepsModal } from './features/equations/StepsModal';
import { SettingsModal } from './features/settings/SettingsModal';
import { useGlobalShortcuts } from './features/settings/useGlobalShortcuts';
import { useAccountStore } from '@/store/accountStore';

function App() {
  const { clearAll } = useAccountStore();
  useGlobalShortcuts();

  return (
    <>
      <div id="app-wrapper">
        <header id="main-header" className="relative">
          <div className="brand-logo z-10">📐  Mohamed Khedr - AccountSketch <span style={{ fontSize: '14px', opacity: 0.6, fontFamily: 'Cairo, sans-serif' }}>Pro v3.0</span></div>
            
            {/* Quote SVG Centered */}
            <div className="header-quote absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full py-2 pointer-events-none z-0">
              <img src="/quote.svg" alt="Quote" className="h-full object-contain" />
            </div>

            <div className="flex gap-3 z-10">
                <SettingsModal />
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
      <StepsModal />
    </>
  );
}

export default App;
