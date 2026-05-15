import { useModalStore } from '@/store/modalStore';
import { X } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

// Helper component to safely render KaTeX blocks
const KaTeXBlock = ({ latex }: { latex: string }) => {
    const htmlMarkup = React.useMemo(() => {
        if (!latex) return '';
        const originalWarn = console.warn;
        let html = '';
        try {
            console.warn = (...args: unknown[]) => {
                if (typeof args[0] === 'string' && args[0].includes('No character metrics for')) return;
                originalWarn(...args);
            };
            html = katex.renderToString(latex, {
                throwOnError: false,
                strict: "ignore",
                trust: true,
                displayMode: true // Centers and makes math large
            });
        } finally {
            console.warn = originalWarn;
        }
        return html;
    }, [latex]);

    return (
        <div 
            className="katex-steps-container text-[18px] sm:text-[22px] overflow-x-auto text-right w-full custom-scrollbar my-4" 
            dir="ltr"
            dangerouslySetInnerHTML={{ __html: htmlMarkup }}
        />
    );
};

export const StepsModal = () => {
    const { isStepsOpen, stepsData, closeSteps } = useModalStore();

    return (
        <AnimatePresence>
            {isStepsOpen && stepsData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={closeSteps}>
                    <motion.div 
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="steps-modal bg-white text-gray-800 border-2 border-gray-200 rounded-[16px] shadow-2xl max-w-4xl w-full p-0 flex flex-col max-h-[90vh]"
                    >
                        <div className="steps-header flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 rounded-t-[16px]" dir="rtl">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                                <span className="text-xl">📝</span>
                                {stepsData.title} - طريقة الحل
                            </h2>
                            <button onClick={closeSteps} className="hover:bg-red-50 hover:text-red-600 text-gray-500 p-1 rounded-md transition-all">
                                <X size={24} strokeWidth={2.5} />
                            </button>
                        </div>
                        
                        <div className="steps-body p-8 overflow-y-auto" dir="rtl">
                            {stepsData.customSteps && stepsData.customSteps.length > 0 ? (
                                <div className="space-y-4">
                                    {stepsData.customSteps.map((block, i) => {
                                        if (block.type === 'header') {
                                            return (
                                                <h3 key={i} className="text-xl font-bold text-gray-800 mt-8 mb-4 border-b border-gray-200 pb-2 text-right">
                                                    {block.text}
                                                </h3>
                                            );
                                        } else if (block.type === 'text') {
                                            return (
                                                <p key={i} className="text-gray-600 text-lg my-2 text-right">
                                                    {block.text}
                                                </p>
                                            );
                                        } else if (block.type === 'latex') {
                                            return <KaTeXBlock key={i} latex={block.latex} />;
                                        }
                                        return null;
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="steps-inputs bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h3 className="font-bold text-lg mb-3 text-green-700 border-b border-gray-200 pb-2">المعطيات (Inputs)</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {stepsData.inputs.map((inp, idx) => (
                                                <div key={idx} className="steps-item flex justify-between items-center bg-white border border-gray-100 p-2 rounded-md shadow-sm">
                                                    <span className="text-gray-700 text-sm">{inp.l}</span>
                                                    <span className="font-bold font-mono text-amber-600" dir="ltr">{inp.v} <span className="text-xs text-gray-400 font-sans">{inp.u}</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="steps-outputs bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                        <h3 className="font-bold text-lg mb-3 text-blue-700 border-b border-blue-100 pb-2">النتائج (Outputs)</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {stepsData.outputs.map((out, idx) => (
                                                <div key={idx} className="steps-item flex justify-between items-center bg-white p-2 rounded-md border border-blue-100 shadow-sm">
                                                    <span className="text-gray-700 text-sm">{out.l}</span>
                                                    <span className="font-bold font-mono text-blue-600" dir="ltr">{out.v} <span className="text-xs text-gray-400 font-sans">{out.u}</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
