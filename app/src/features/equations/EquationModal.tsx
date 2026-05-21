import { useModalStore } from '@/store/modalStore';
import { X } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation, useDynamicTranslation, translateLatex } from '@/lib/i18n';

export const EquationModal = () => {
    const { isOpen, title, latex, closeModal } = useModalStore();
    const t = useTranslation();
    const td = useDynamicTranslation();

    const htmlMarkup = useMemo(() => {
        if (!latex) return '';
        const tLatex = translateLatex(latex, td);
        const originalWarn = console.warn;
        let html = '';
        try {
            console.warn = (...args: unknown[]) => {
                if (typeof args[0] === 'string' && args[0].includes('No character metrics for')) return;
                originalWarn(...args);
            };
            html = katex.renderToString(tLatex, {
                throwOnError: false,
                strict: "ignore",
                trust: true
            });
        } finally {
            console.warn = originalWarn;
        }
        return html;
    }, [latex, td]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <motion.div 
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        className="equation-modal bg-white border-4 border-black shadow-[8px_8px_0px_#000] max-w-lg w-full p-0 flex flex-col rounded-[16px]"
                    >
                        <div className="equation-header flex justify-between items-center p-4 border-b-4 border-black bg-yellow-300 rounded-t-[12px]">
                            <h2 className="text-xl font-black">{td(title)}</h2>
                            <button onClick={closeModal} className="equation-close hover:bg-red-400 p-1 rounded-md border-2 border-transparent hover:border-black transition-all">
                                <X size={24} strokeWidth={3} />
                            </button>
                        </div>
                        <div 
                            className="equation-body p-6 text-center overflow-x-auto text-[20px] font-bold" 
                            dir="ltr"
                            dangerouslySetInnerHTML={{ __html: htmlMarkup }}
                        />
                        <div className="equation-footer p-4 border-t-4 border-black bg-gray-100 flex justify-end rounded-b-[12px]">
                            <button onClick={closeModal} className="equation-footer-btn brutal-btn bg-white">
                                {t('app.close')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
