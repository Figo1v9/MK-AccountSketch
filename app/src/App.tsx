import { Suspense, lazy, useRef } from 'react';
import { Sidebar } from './features/sidebar/Sidebar';
import { FlowCanvas } from './features/canvas/FlowCanvas';
import { SummaryPanel } from './features/summary/SummaryPanel';
import { OcrModal } from './features/ocr/OcrModal';
import { SettingsModal } from './features/settings/SettingsModal';
import { useGlobalShortcuts } from './features/settings/useGlobalShortcuts';
import { useAccountStore } from '@/store/accountStore';
import { useModalStore } from '@/store/modalStore';

const EquationModal = lazy(() => import('./features/equations/EquationModal').then(module => ({ default: module.EquationModal })));
const StepsModal = lazy(() => import('./features/equations/StepsModal').then(module => ({ default: module.StepsModal })));

function App() {
  const { clearAll } = useAccountStore();
  const { isOpen, isStepsOpen } = useModalStore();
  useGlobalShortcuts();

  // Track if modals have ever been opened to avoid loading them before needed,
  // while preserving the Framer Motion exit animation when they close.
  const hasOpenedEquation = useRef(false);
  if (isOpen) hasOpenedEquation.current = true;

  const hasOpenedSteps = useRef(false);
  if (isStepsOpen) hasOpenedSteps.current = true;

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
      
      {hasOpenedEquation.current && (
        <Suspense fallback={null}>
          <EquationModal />
        </Suspense>
      )}
      
      {hasOpenedSteps.current && (
        <Suspense fallback={null}>
          <StepsModal />
        </Suspense>
      )}
    </>
  );
}

export default App;
