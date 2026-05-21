import { useModalStore } from '@/store/modalStore';
import { X } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { useTranslation, useDynamicTranslation, useI18nStore, translateLatex } from '@/lib/i18n';
import { ListChecks } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { getNodeThemeStyle } from '@/core/themeColors';

// Helper component to safely render KaTeX blocks
const KaTeXBlock = ({ latex, primaryColor }: { latex: string; primaryColor?: string }) => {
    const td = useDynamicTranslation();
    const htmlMarkup = React.useMemo(() => {
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
                trust: true,
                displayMode: true // Centers and makes math large
            });
        } finally {
            console.warn = originalWarn;
        }
        return html;
    }, [latex, td]);

    return (
        <div 
            className="katex-steps-container text-[18px] sm:text-[21px] overflow-x-auto text-center w-full custom-scrollbar my-5 p-5 sm:p-6 rounded-2xl bg-slate-50/40 dark:bg-zinc-900/20 border border-slate-100/60 dark:border-zinc-800/60" 
            style={primaryColor ? { borderInlineStart: `4px solid ${primaryColor}` } : undefined}
            dir="ltr"
            dangerouslySetInnerHTML={{ __html: htmlMarkup }}
        />
    );
};

export const StepsModal = () => {
    const { isStepsOpen, stepsData, closeSteps } = useModalStore();
    const t = useTranslation();
    const td = useDynamicTranslation();
    const lang = useI18nStore(state => state.lang);
    const theme = useSettingsStore(state => state.theme);
    const darkMode = useSettingsStore(state => state.darkMode);

    // Get colors using getNodeThemeStyle
    const style = React.useMemo(() => {
        if (!stepsData || !stepsData.defId) {
            return {
                primaryColor: '#1a73e8',
                lightBg: darkMode ? '#1a273a' : '#e8f0fe',
                softBg: darkMode ? '#202124' : '#f1f3f4',
                borderColor: darkMode ? '#3c4043' : '#dadce0',
                textColor: darkMode ? '#e8eaed' : '#202124',
                cardBg: darkMode ? '#1e1e1e' : '#ffffff',
            };
        }
        return getNodeThemeStyle(stepsData.defId, theme, darkMode, '#1a73e8');
    }, [stepsData, theme, darkMode]);

    const isGoogle = theme === 'google';

    return (
        <AnimatePresence>
            {isStepsOpen && stepsData && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
                    onClick={closeSteps}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className={isGoogle
                            ? "bg-white dark:bg-[#1a1b1e] border border-slate-100 dark:border-zinc-800/80 rounded-[28px] shadow-2xl max-w-3xl w-full p-0 flex flex-col max-h-[85vh] overflow-hidden"
                            : "bg-white dark:bg-zinc-950 border-[4px] border-black dark:border-white rounded-[16px] shadow-[8px_8px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_rgba(255,255,255,1)] max-w-3xl w-full p-0 flex flex-col max-h-[85vh] overflow-hidden"
                        }
                    >
                        {/* Header */}
                        <div 
                            className={isGoogle
                                ? "flex justify-between items-center px-6 py-5 border-b border-slate-100/80 dark:border-zinc-800/50 bg-slate-50/50 dark:bg-zinc-900/20"
                                : "flex justify-between items-center px-5 py-4 border-b-4 border-black dark:border-white bg-slate-50 dark:bg-zinc-900"
                            }
                            dir={lang === 'ar' ? "rtl" : "ltr"}
                        >
                            <h2 
                                className={isGoogle
                                    ? "text-[18px] sm:text-[20px] font-black flex items-center gap-2.5"
                                    : "text-lg font-black flex items-center gap-2 text-black dark:text-white"
                                }
                                style={isGoogle ? { color: style.primaryColor } : undefined}
                            >
                                <ListChecks size={20} strokeWidth={3} />
                                <span>{td(stepsData.title)}</span>
                                <span 
                                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full font-sans tracking-wide uppercase"
                                    style={isGoogle ? { backgroundColor: style.softBg, color: style.primaryColor } : undefined}
                                >
                                    {t('node.steps')}
                                </span>
                            </h2>
                            <button 
                                onClick={closeSteps} 
                                className={isGoogle
                                    ? "w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700 hover:text-slate-800 dark:hover:text-slate-100 active:scale-90 transition-all"
                                    : "w-8 h-8 rounded-full border-2 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-red-400 dark:hover:bg-red-650 flex items-center justify-center active:translate-y-[2px] transition-all"
                                }
                            >
                                <X size={16} strokeWidth={3} />
                            </button>
                        </div>
                        
                        {/* Body */}
                        <div 
                            className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar text-slate-700 dark:text-slate-350" 
                            dir={lang === 'ar' ? "rtl" : "ltr"}
                        >
                            {stepsData.customSteps && stepsData.customSteps.length > 0 ? (
                                <div className="space-y-4">
                                    {stepsData.customSteps.map((block, i) => {
                                        if (block.type === 'header') {
                                            return (
                                                <div key={i} className="flex items-center gap-4 mt-8 mb-4">
                                                    <h3 className={`text-[16px] sm:text-[17px] font-black tracking-tight text-slate-800 dark:text-slate-200 shrink-0 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                                        {td(block.text)}
                                                    </h3>
                                                    <div className="h-[1px] flex-1 bg-slate-100 dark:bg-zinc-800/80" />
                                                </div>
                                            );
                                        } else if (block.type === 'text') {
                                            return (
                                                <p key={i} className={`text-slate-550 dark:text-slate-400 text-[14.5px] leading-relaxed my-2 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                                                    {td(block.text)}
                                                </p>
                                            );
                                        } else if (block.type === 'latex') {
                                            return <KaTeXBlock key={i} latex={block.latex} primaryColor={isGoogle ? style.primaryColor : undefined} />;
                                        }
                                        return null;
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Inputs Block */}
                                    <div 
                                        className={isGoogle
                                            ? "bg-slate-50/40 dark:bg-zinc-900/10 p-5 rounded-[20px] border border-slate-100/80 dark:border-zinc-800/40"
                                            : "bg-gray-50 dark:bg-zinc-900 p-4 border-2 border-black dark:border-white rounded-lg"
                                        }
                                    >
                                        <h3 
                                            className={isGoogle
                                                ? "font-black text-sm mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800/50 flex items-center justify-between text-slate-800 dark:text-slate-200"
                                                : "font-black text-md mb-3 border-b-2 border-black dark:border-white pb-2 text-black dark:text-white"
                                            }
                                        >
                                            <span>{t('node.inputs')}</span>
                                            {isGoogle && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.primaryColor }} />}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {stepsData.inputs.map((inp, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={isGoogle
                                                        ? "flex justify-between items-center bg-white dark:bg-[#1f2023] border border-slate-100 dark:border-zinc-800/60 p-3.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                                                        : "flex justify-between items-center bg-white dark:bg-black border border-black dark:border-white p-2 rounded-md"
                                                    }
                                                >
                                                    <span className="text-slate-650 dark:text-slate-400 text-sm font-semibold">{td(inp.l)}</span>
                                                    <span 
                                                        className={isGoogle
                                                            ? "font-black font-mono text-[14px]"
                                                            : "font-bold font-mono text-amber-600"
                                                        } 
                                                        style={isGoogle ? { color: style.primaryColor } : undefined}
                                                        dir="ltr"
                                                    >
                                                        {inp.v} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-normal">{td(inp.u)}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Outputs Block */}
                                    <div 
                                        className={isGoogle
                                            ? "bg-slate-50/40 dark:bg-zinc-900/10 p-5 rounded-[20px] border border-slate-100/80 dark:border-zinc-800/40"
                                            : "bg-blue-50/50 dark:bg-zinc-900/30 p-4 border-2 border-black dark:border-white rounded-lg"
                                        }
                                    >
                                        <h3 
                                            className={isGoogle
                                                ? "font-black text-sm mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800/50 flex items-center justify-between text-slate-800 dark:text-slate-200"
                                                : "font-black text-md mb-3 border-b-2 border-black dark:border-white pb-2 text-black dark:text-white"
                                            }
                                        >
                                            <span>{t('node.outputs')}</span>
                                            {isGoogle && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {stepsData.outputs.map((out, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className={isGoogle
                                                        ? "flex justify-between items-center bg-white dark:bg-[#1f2023] border border-slate-100 dark:border-zinc-800/60 p-3.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                                                        : "flex justify-between items-center bg-white dark:bg-black p-2 rounded-md border border-black dark:border-white"
                                                    }
                                                >
                                                    <span className="text-slate-650 dark:text-slate-400 text-sm font-semibold">{td(out.l)}</span>
                                                    <span 
                                                        className={isGoogle
                                                            ? "font-black font-mono text-[14px] text-emerald-600 dark:text-emerald-400"
                                                            : "font-bold font-mono text-blue-600 dark:text-blue-400"
                                                        } 
                                                        dir="ltr"
                                                    >
                                                        {out.v} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-normal">{td(out.u)}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
