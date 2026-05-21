import { Suspense, lazy, useRef } from 'react';
import { Sidebar } from './features/sidebar/Sidebar';
import { FlowCanvas } from './features/canvas/FlowCanvas';
import { SummaryPanel } from './features/summary/SummaryPanel';
import { OcrModal } from './features/ocr/OcrModal';
import { SettingsModal } from './features/settings/SettingsModal';
import { useAccountActions } from '@/store/accountStore';
import { useModalStore } from '@/store/modalStore';
import { useTranslation, useI18nStore } from '@/lib/i18n';
import { Trash2, Compass } from 'lucide-react';

const EquationModal = lazy(() => import('./features/equations/EquationModal').then(module => ({ default: module.EquationModal })));
const StepsModal = lazy(() => import('./features/equations/StepsModal').then(module => ({ default: module.StepsModal })));

function App() {
  const { clearAll } = useAccountActions();
  const { isOpen, isStepsOpen } = useModalStore();
  const t = useTranslation();
  const lang = useI18nStore(state => state.lang);

  // Track if modals have ever been opened to avoid loading them before needed,
  // while preserving the Framer Motion exit animation when they close.
  const hasOpenedEquation = useRef(false);
  if (isOpen) hasOpenedEquation.current = true;

  const hasOpenedSteps = useRef(false);
  if (isStepsOpen) hasOpenedSteps.current = true;

    return (
    <>
      <div id="app-wrapper" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <header id="main-header" className="relative">
          <div className="brand-logo z-10"><Compass size={24} strokeWidth={2.5} style={{ flexShrink: 0 }} />  Mohamed Khedr - AccountSketch <span style={{ fontSize: '14px', opacity: 0.6, fontFamily: 'Cairo, sans-serif' }}>{t('app.title').replace('AccountSketch ', '')}</span></div>
            
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
                    <Trash2 size={16} strokeWidth={2.5} /> {t('app.clear_board')}
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
