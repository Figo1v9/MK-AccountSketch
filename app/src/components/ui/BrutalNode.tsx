import React, { useCallback, useMemo, useState, useRef } from 'react';
import { Handle, Position, useStore } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FieldDefinition, FieldHelper, AccountingNodeData } from '@/core/types';

import { MODULES } from '@/core/modules';
import { useAccountActions, useUpstreamValues } from '@/store/accountStore';
import { useModalStore, StepsData } from '@/store/modalStore';
import { generateStepsLatex } from '@/lib/stepsGenerator';

import { useTranslation, useDynamicTranslation } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';
import { getNodeThemeStyle } from '@/core/themeColors';
import { GoogleIcon } from '@/components/ui/GoogleMulticolorIcons';
import { RotateCcw, ListChecks, X, HelpCircle, AlertTriangle, Info, Sigma } from 'lucide-react';


const formatCommas = (str: string | number | null | undefined) => {
    if (str === null || str === undefined || str === '') return '';
    const parts = str.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};

/** Sanitize raw input: Arabic/Persian digits, commas, whitespace */
const sanitizeInput = (rawVal: string): string => {
    let val = rawVal.replace(/,/g, '').replace(/،/g, '').replace(/٬/g, '').replace(/\s/g, '');
    val = val.replace(/٫/g, '.');
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    for (let i = 0; i < 10; i++) {
        val = val.replace(new RegExp(arabicNumbers[i], 'g'), i.toString());
        val = val.replace(new RegExp(persianNumbers[i], 'g'), i.toString());
    }
    return val;
};


export const BrutalNode = React.memo(({ id, data }: { id: string, data: AccountingNodeData }) => {
  const def = useMemo(() => MODULES.find(m => m.id === data.defId), [data.defId]);
  const { updateNodeData, removeNode } = useAccountActions();
  const { openModal } = useModalStore();
  const t = useTranslation();
  const td = useDynamicTranslation();
  const theme = useSettingsStore(state => state.theme);
  const darkMode = useSettingsStore(state => state.darkMode);

  const tStyle = useMemo(() => {
    return getNodeThemeStyle(data.defId, theme, darkMode, def?.color || '#1a73e8');
  }, [data.defId, theme, darkMode, def?.color]);

  const [localVals, setLocalVals] = useState<Record<string, string>>({});
  const [openHelper, setOpenHelper] = useState<string|null>(null);

  const connection = useStore((state) => state.connection);
  const isConnecting = connection.inProgress;
  const isCurrentNodeOrigin = connection.inProgress ? connection.fromNode?.id === id : false;
  const connectionHandleType = connection.inProgress ? connection.fromHandle?.type : null;
  const isTargetValidDrop = isConnecting && !isCurrentNodeOrigin && connectionHandleType === 'source';
  const isSourceValidDrop = isConnecting && !isCurrentNodeOrigin && connectionHandleType === 'target';

  const isGoogle = theme === 'google';

  const targetClasses = (isGoogle
    ? `!w-2.5 !h-2.5 !border !border-white dark:!border-zinc-800 !bg-[var(--node-color,var(--primary-color))] rounded-full transition-all duration-300 z-30 `
    : `!bg-black !w-4 !h-4 !border-2 !border-white transition-all duration-300 z-30 `
  ) + (isConnecting 
    ? (isTargetValidDrop 
        ? `!bg-emerald-500 !border-emerald-200 scale-125 ${isGoogle ? 'shadow-none' : 'shadow-[0_0_20px_rgba(16,185,129,1)]'}` 
        : 'opacity-0 pointer-events-none')
    : 'hover:scale-125 opacity-100');
  
  const sourceClasses = (isGoogle
    ? `!w-2.5 !h-2.5 !border !border-white dark:!border-zinc-800 !bg-[var(--node-color,var(--primary-color))] rounded-full transition-all duration-300 z-40 `
    : `!bg-black !w-4 !h-4 !border-2 !border-white transition-all duration-300 z-40 `
  ) + (isConnecting 
    ? (isSourceValidDrop 
        ? `!bg-cyan-500 !border-cyan-200 scale-125 ${isGoogle ? 'shadow-none' : 'shadow-[0_0_20px_rgba(6,182,212,1)]'}` 
        : 'opacity-0 pointer-events-none')
    : 'hover:scale-125 opacity-100');

  const toggleHelper = (k: string) => setOpenHelper(openHelper === k ? null : k);

  // ── Debounced store update ──
  const rafRef = useRef<number>(0);
  const pendingUpdate = useRef<Partial<AccountingNodeData> | null>(null);

  const flushUpdate = useCallback(() => {
    if (pendingUpdate.current) {
      updateNodeData(id, pendingUpdate.current);
      pendingUpdate.current = null;
    }
  }, [id, updateNodeData]);

  const scheduleUpdate = useCallback((patch: Partial<AccountingNodeData>) => {
    pendingUpdate.current = patch;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(flushUpdate);
  }, [flushUpdate]);

  const handleInputChange = useCallback((key: string, rawVal: string) => {
    if (!def) return;
    
    const val = sanitizeInput(rawVal);
    if (val !== '' && val !== '-' && !/^-?\d*\.?\d*$/.test(val)) return;

    // 1. Update local state IMMEDIATELY → zero-lag UI
    setLocalVals(prev => ({ ...prev, [key]: val }));

    // 2. Schedule store update via rAF (batched, ~16ms)
    const numVal = (val === '' || val === '-' || val.endsWith('.')) ? null : parseFloat(val);
    
    let newManualKeys = [...(data.manualKeys || [])];
    if (numVal !== null) {
       if (!newManualKeys.includes(key)) newManualKeys.push(key);
    } else {
       newManualKeys = newManualKeys.filter(k => k !== key);
    }

    const newVals = { ...data.vals, [key]: numVal };
    scheduleUpdate({ vals: newVals, manualKeys: newManualKeys });
  }, [id, data.vals, data.manualKeys, scheduleUpdate, def]);

  // Stable ref to hold the latest data to prevent stale closure bugs in the solver effect
  const dataRef = useRef(data);
  dataRef.current = data;

  // ── Solver Effect — uses upstream selector ──
  const inheritedVals = useUpstreamValues(id);
  
  // Stable key for inherited vals to avoid unnecessary solver runs
  const inheritedKey = useMemo(() => {
    const entries = Object.entries(inheritedVals).sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([k, v]) => `${k}:${v}`).join('|');
  }, [inheritedVals]);

  // Stable key for manual inputs to prevent re-running when calculated outputs update the store
  const manualValsKey = useMemo(() => {
    const manualKeys = data.manualKeys || [];
    return manualKeys.sort().map(k => `${k}:${data.vals[k] ?? ''}`).join('|');
  }, [data.vals, data.manualKeys]);

  React.useEffect(() => {
    if (!def) return;
    
    const currentData = dataRef.current;
    const valsForSolver: Record<string, number | null> = {};
    const effectiveManualKeys = [...(currentData.manualKeys || [])];
    const currentInheritedKeys: string[] = [];

    // Resolve values: Manual > Inherited > null
    def.fields.forEach(f => {
        const hasInherited = inheritedVals[f.k] !== undefined;
        const isManuallyOverridden = effectiveManualKeys.includes(f.k);

        if (isManuallyOverridden) {
            valsForSolver[f.k] = currentData.vals[f.k];
        } else if (hasInherited) {
            valsForSolver[f.k] = inheritedVals[f.k];
            currentInheritedKeys.push(f.k);
        } else {
            valsForSolver[f.k] = null;
        }
    });

    // Solve
    const solved = def.solver({...valsForSolver}) as Record<string, number | null | string>;
    const errorMsg = (solved as Record<string, unknown>)._error as string | undefined;

    const finalVals: Record<string, number | null> = { ...valsForSolver };
    const newCalcKeys: string[] = [];

    def.fields.forEach(f => {
       const hasInherited = currentInheritedKeys.includes(f.k);
       if (solved[f.k] !== null && solved[f.k] !== undefined && typeof solved[f.k] === 'number') {
           if (!effectiveManualKeys.includes(f.k) && !hasInherited) {
               finalVals[f.k] = solved[f.k] as number;
               newCalcKeys.push(f.k);
           }
       }
       if (hasInherited) {
           finalVals[f.k] = inheritedVals[f.k];
       }
     });

    // Check if anything actually changed before updating store
    const prevInheritedKeys = currentData.inheritedKeys || [];
    const isDifferent = def.fields.some(f => finalVals[f.k] !== currentData.vals[f.k]) 
        || newCalcKeys.join(',') !== (currentData.calcKeys||[]).join(',')
        || errorMsg !== currentData.error
        || currentInheritedKeys.join(',') !== prevInheritedKeys.join(',');

    if (isDifferent) {
        updateNodeData(id, { 
           vals: finalVals, 
           calcKeys: newCalcKeys, 
           manualKeys: effectiveManualKeys, 
           error: errorMsg,
           inheritedKeys: currentInheritedKeys
        });
    }
  }, [id, def, manualValsKey, inheritedKey, updateNodeData]);

  if (!def) return null;

  return (
    <div 
      data-def-id={def.id}
      className={isGoogle
        ? `pm relative rounded-[20px] transition-all duration-300 shadow-none ${isConnecting && isCurrentNodeOrigin ? 'opacity-80' : 'opacity-100'}`
        : `pm border-[4px] border-black bg-white shadow-none relative rounded-[16px] transition-opacity duration-300 ${isConnecting && isCurrentNodeOrigin ? 'opacity-80' : 'opacity-100'}`
      }
      style={{ 
        ['--node-color' as any]: tStyle.primaryColor,
        ['--node-border' as any]: tStyle.borderColor,
        ['--node-bg' as any]: tStyle.cardBg,
        ['--node-text' as any]: tStyle.textColor,
        ['--node-text-secondary' as any]: tStyle.textSecondary,
        ['--node-head-bg' as any]: tStyle.softBg,
        backgroundColor: tStyle.cardBg,
        color: tStyle.textColor,
        borderTop: isGoogle ? `6px solid ${tStyle.primaryColor}` : undefined,
        borderLeft: isGoogle ? `1px solid ${tStyle.borderColor}` : undefined,
        borderRight: isGoogle ? `1px solid ${tStyle.borderColor}` : undefined,
        borderBottom: isGoogle ? `1px solid ${tStyle.borderColor}` : undefined,
      }}
    >
      <Handle type="target" position={Position.Left} isConnectable={true} className={targetClasses} />
      <Handle type="source" position={Position.Right} isConnectable={true} className={sourceClasses} />
      
      <div 
        className={isGoogle 
          ? "pm-head px-3 py-3 flex justify-between items-center rounded-t-[20px] border-b" 
          : "pm-head px-2 py-2.5 border-b-4 border-black flex justify-between items-center rounded-t-[12px]"
        } 
        style={{
          backgroundColor: isGoogle ? tStyle.softBg : undefined,
          borderColor: isGoogle ? tStyle.borderColor : undefined,
        }}
      >
        <div className={isGoogle 
          ? "pm-title font-black text-[15px] flex items-center gap-2 flex-1 min-w-0 pr-1" 
          : "pm-title font-black text-[15px] flex items-center gap-1.5 flex-1 min-w-0 pr-1"
        }
          style={{ color: isGoogle ? tStyle.primaryColor : undefined }}
        >
            <GoogleIcon id={def.id} fallbackEmoji={def.icon} size={22} className="shrink-0" /> 
            <span className="truncate">{td(def.title)}</span>
        </div>
        <div className="flex gap-1.5 items-center shrink-0">
            <button 
              onClick={(e) => { e.stopPropagation(); updateNodeData(id, { vals: {}, calcKeys: [], manualKeys: [], error: undefined, helpersVals: {} }); setLocalVals({}); }} 
              className={isGoogle
                ? "nodrag w-[28px] h-[28px] flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700/50 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm active:scale-95 transition-all text-[12px]"
                : "nodrag w-[26px] h-[26px] flex items-center justify-center font-bold text-[12px] bg-white border-2 border-black hover:bg-slate-200 active:translate-y-[2px] shadow-[2px_2px_0px_#000] active:shadow-none rounded-full transition-all"
              }
              title={t('node.clear')}
            >
                <RotateCcw size={13} strokeWidth={2.5} />
            </button>
            {def.latex && (
                <button 
                  onClick={(e) => { e.stopPropagation(); openModal(def.title, def.latex!); }} 
                  className={isGoogle
                    ? "nodrag w-[28px] h-[28px] flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700/50 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm active:scale-95 transition-all text-[13px]"
                    : "nodrag w-[26px] h-[26px] flex items-center justify-center font-bold text-[13px] bg-yellow-300 border-2 border-black hover:bg-yellow-400 active:translate-y-[2px] shadow-[2px_2px_0px_#000] active:shadow-none rounded-full transition-all"
                  }
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                    <HelpCircle size={14} strokeWidth={2.5} />
                </button>
            )}
            <button 
              onClick={(e) => { 
                  e.stopPropagation(); 
                  const inputs = def.fields.filter(f => !((data.calcKeys || []).includes(f.k))).map(f => ({ l: td(f.l), v: data.vals[f.k] ?? '', u: td(f.u) }));
                  const outputs = def.fields.filter(f => (data.calcKeys || []).includes(f.k)).map(f => ({ l: td(f.l), v: data.vals[f.k] ?? '', u: td(f.u) }));
                  const stepsData: StepsData = {
                      title: td(def.title),
                      latex: def.latex || '',
                      formula: td(def.formula),
                      inputs,
                      outputs,
                      customSteps: generateStepsLatex(def, data),
                      defId: def.id
                  };
                  useModalStore.getState().openSteps(stepsData);
              }} 
              className={isGoogle
                ? "nodrag w-[28px] h-[28px] flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700/50 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm active:scale-95 transition-all text-[12px]"
                : "nodrag w-[26px] h-[26px] flex items-center justify-center font-bold text-[12px] bg-emerald-300 border-2 border-black hover:bg-emerald-400 active:translate-y-[2px] shadow-[2px_2px_0px_#000] active:shadow-none transition-all rounded-md"
              }
              title={t('node.steps')}
            >
                <ListChecks size={13} strokeWidth={2.5} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); removeNode(id); }} 
              className={isGoogle
                ? "nodrag w-[28px] h-[28px] flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700/50 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm active:scale-95 transition-all text-[13px]"
                : "nodrag w-[26px] h-[26px] flex items-center justify-center font-bold text-[13px] bg-red-400 border-2 border-black hover:bg-red-500 active:translate-y-[2px] shadow-[2px_2px_0px_#000] active:shadow-none rounded-full text-white transition-all"
              }
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
                <X size={14} strokeWidth={2.5} />
            </button>
        </div>
      </div>

      <div className="pm-body p-4 flex flex-col gap-3 nodrag">
        {def.fields.map(f => {
          const valNum = data.vals[f.k];
          const isCalc = (data.calcKeys || []).includes(f.k);
          const isManual = (data.manualKeys || []).includes(f.k);
          const isInherited = (data.inheritedKeys || []).includes(f.k);
          
          let displayVal = '';
          if (isCalc) {
              const displayNum = valNum === null || valNum === undefined 
                  ? '' 
                  : (typeof valNum === 'number' ? Number(valNum.toFixed(2)) : valNum);
              displayVal = formatCommas(displayNum.toString());
          } else {
              const rawStr = localVals[f.k] !== undefined ? localVals[f.k] : (valNum === null || valNum === undefined ? '' : valNum.toString());
              displayVal = formatCommas(rawStr);
          }


          return (
            <div key={f.k} className="nodrag w-full">
              <div className="flex items-center gap-2 mb-1">
                <span 
                  className={isGoogle
                    ? "text-[13.5px] font-black flex-1 text-right leading-[1.25] flex items-center justify-end gap-2 text-slate-800 dark:text-slate-200"
                    : "text-[14px] font-extrabold text-black flex-1 text-right leading-[1.25] flex items-center justify-end gap-2"
                  }
                >
                  {f.helper && (
                    <button 
                       onClick={() => toggleHelper(f.k)} 
                       style={isGoogle ? { backgroundColor: tStyle.softBg, color: tStyle.primaryColor } : undefined}
                       className={isGoogle
                         ? `w-6 h-6 shrink-0 font-bold rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:opacity-95`
                         : `w-6 h-6 shrink-0 font-black border-2 border-black rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-[1px_1px_0px_#000] ${openHelper === f.k ? 'bg-black text-white' : 'bg-cyan-200'}`
                       }
                    >
                      <Info size={14} strokeWidth={2.5} />
                    </button>
                  )}
                  {td(f.l)}
                </span>
                <div className="relative w-[130px]">
                    <input 
                      type="text" 
                      inputMode="decimal"
                      dir="ltr"
                      lang="en"
                      style={{ 
                        fontFamily: 'Cairo, sans-serif',
                        backgroundColor: isGoogle 
                          ? (isCalc 
                              ? (darkMode ? '#1b3a24' : '#e6f4ea') 
                              : (isInherited
                                  ? (darkMode ? '#1a273a' : '#e8f0fe')
                                  : tStyle.inputBg)) 
                          : undefined,
                        color: isGoogle 
                          ? (isCalc 
                              ? (darkMode ? '#81c995' : '#137333') 
                              : (isInherited
                                  ? (darkMode ? '#8ab4f8' : '#1a73e8')
                                  : tStyle.inputText)) 
                          : undefined,
                        border: isGoogle 
                          ? `1.5px solid ${isCalc 
                              ? (darkMode ? '#2e7d32' : '#ceead6') 
                              : (isInherited
                                  ? (darkMode ? '#1e3a5f' : '#d2e3fc')
                                  : tStyle.inputBorder)}` 
                          : undefined,
                        boxShadow: isGoogle ? 'inset 0 1px 2px rgba(0,0,0,0.05)' : undefined,
                      }}
                      className={isGoogle
                        ? `nodrag nopan w-full p-2 text-center font-black text-[15px] outline-none transition-all rounded-[10px] focus:ring-2 focus:ring-slate-300 dark:focus:ring-zinc-600`
                        : `nodrag nopan w-full border-2 border-black p-1 text-center font-black text-md outline-none transition-colors rounded-md ${isCalc ? 'bg-emerald-100' : isInherited ? 'bg-indigo-100 border-indigo-500' : 'bg-white focus:bg-yellow-50'} ${isManual ? 'border-blue-600' : 'border-black'}`
                      }
                      value={displayVal}
                      onChange={e => handleInputChange(f.k, e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder="0"
                      readOnly={isCalc || isInherited}
                    />
                    {isCalc && <div 
                      className={isGoogle ? "absolute -top-1 -right-1 w-2.5 h-2.5 border border-white dark:border-zinc-800 rounded-full shadow-sm" : "absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border border-black rounded-full shadow-[1px_1px_0px_#000]"} 
                      style={isGoogle ? { backgroundColor: '#fbbc05' } : undefined}
                      title={t('node.calculated')} 
                    />}
                    {isInherited && <div 
                      className={isGoogle ? "absolute -top-1 -right-1 w-2.5 h-2.5 border border-white dark:border-zinc-800 rounded-full" : "absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 border border-black rounded-full shadow-[1px_1px_0px_#000]"} 
                      style={isGoogle ? { backgroundColor: tStyle.primaryColor } : undefined}
                      title={t('node.inherited')} 
                    />}
                </div>
                <span 
                  className={isGoogle
                    ? "w-8 text-[11px] font-black text-slate-500 dark:text-slate-400"
                    : "w-8 text-[11px] font-bold text-gray-500"
                  }
                >{td(f.u)}</span>
              </div>
              
              <AnimatePresence>
                {openHelper === f.k && f.helper && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                     <div className={isGoogle
                       ? "mt-2 mb-4 bg-slate-50/50 dark:bg-zinc-800/50 border border-[#dadce0] dark:border-[#3c4043] p-3 z-20 relative rounded-xl"
                       : "mt-2 mb-4 bg-slate-50 border-2 border-black p-3 shadow-[4px_4px_0px_#000] z-20 relative rounded-[12px]"
                     }>
                        <HelperBlock f={f} data={data} id={id} handleInputChange={handleInputChange} isGoogle={isGoogle} />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <div className={isGoogle
          ? "mt-2 p-2 bg-slate-50 dark:bg-zinc-800/40 border border-dashed border-[#dadce0] dark:border-[#3c4043] text-[10.5px] font-medium text-center text-slate-500 dark:text-slate-400 leading-relaxed italic rounded-lg flex items-center justify-center gap-1.5"
          : "mt-2 p-2 bg-slate-50 border-2 border-dashed border-black text-[10.5px] font-bold text-center text-slate-500 leading-relaxed italic rounded-lg flex items-center justify-center gap-1.5"
        }>
            <Sigma size={12} strokeWidth={2} className="shrink-0 opacity-40" />
            <span>{td(def.formula)}</span>
        </div>

        <AnimatePresence>
            {data.error && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={isGoogle ? { backgroundColor: tStyle.errorBg, color: tStyle.errorText, borderColor: tStyle.errorText } : undefined}
                className={isGoogle
                  ? "p-2 font-bold text-xs text-center border rounded-lg"
                  : "p-2 border-2 border-black bg-red-50 text-red-600 font-black text-xs text-center shadow-[3px_3px_0px_var(--border)] rounded-lg"
                }
              >
                <span className="flex items-center justify-center gap-1.5"><AlertTriangle size={13} strokeWidth={2.5} /> {td(data.error)}</span>
              </motion.div>
            )}
            {data.decision && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={isGoogle ? { backgroundColor: tStyle.decisionBg, color: tStyle.decisionText, borderColor: tStyle.decisionText } : undefined}
                className={isGoogle
                  ? "p-2 font-bold text-xs text-center border rounded-lg mt-2"
                  : "p-2 border-2 border-black bg-emerald-50 text-emerald-700 font-black text-xs text-center shadow-[3px_3px_0px_var(--border)] rounded-lg mt-2"
                }
              >
                {td(data.decision)}
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
});

BrutalNode.displayName = 'BrutalNode';

const HelperBlock = ({ f, data, id, handleInputChange, isGoogle }: { f: FieldDefinition, data: AccountingNodeData, id: string, handleInputChange: (k: string, v: string) => void, isGoogle?: boolean }) => {
    const helper = f.helper as FieldHelper;
    const { updateNodeData } = useAccountActions();
    const t = useTranslation();
    const td = useDynamicTranslation();
    const hState = (data.helpersVals?.[f.k] || {}) as Record<string, unknown>;

    const updateHState = (newState: Record<string, unknown>) => {
       updateNodeData(id, { helpersVals: { ...data.helpersVals, [f.k]: newState } });
    };

    if (helper.type === 'dynamic_sum') {
        const items = (hState.items || [{val: ''}]) as {val: string}[];
        const updateItem = (idx: number, rawVal: string) => {
             const val = sanitizeInput(rawVal);
             if (val !== '' && val !== '-' && !/^-?\d*\.?\d*$/.test(val)) return;
             const newItems = [...items];
             newItems[idx] = { val };
             const sum = newItems.reduce((acc, it) => acc + (parseFloat(it.val)||0), 0);
             updateHState({ items: newItems });
             handleInputChange(f.k, sum === 0 ? '' : sum.toString());
        };
        const addItem = () => updateHState({ items: [...items, {val: ''}] });

        return (
           <div className="flex flex-col gap-2">
               <div className={isGoogle 
                 ? "flex items-center justify-between border-b border-[#dadce0] dark:border-[#3c4043] pb-1 mb-2" 
                 : "flex items-center justify-between border-b-2 border-black pb-1 mb-1"
               }>
                   <span className={isGoogle ? "font-bold text-[12px] text-slate-700 dark:text-slate-300" : "font-black text-[12px] text-slate-900"}>{td(helper.title)}</span>
                   <span className={isGoogle 
                     ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold rounded"
                     : "bg-amber-300 px-1 text-[10px] font-black border border-black uppercase rotate-1"
                   }>Σ {t('node.helper.sum')}</span>
               </div>
               {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-1.5">
                     <span className="text-[10px] font-black opacity-30 w-3">{idx+1}</span>
                     <input 
                       type="text" 
                       inputMode="decimal" 
                       dir="ltr" 
                       lang="en" 
                       className={isGoogle 
                         ? "nodrag nopan flex-1 border border-[#dadce0] dark:border-[#3c4043] p-1.5 text-center font-medium text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg" 
                         : "nodrag nopan flex-1 border-2 border-black p-1 text-center font-bold text-sm bg-white outline-none focus:bg-amber-50 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] rounded-md"
                       } 
                       value={formatCommas(it.val)} 
                       onChange={e => updateItem(idx, e.target.value)} 
                       onKeyDown={e => e.stopPropagation()} 
                       onPointerDown={e => e.stopPropagation()} 
                       placeholder="0" 
                       style={{ fontFamily: 'Cairo, sans-serif' }} 
                     />
                  </div>
               ))}
               <button 
                 onClick={addItem} 
                 className={isGoogle 
                   ? "mt-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-[11px] font-bold p-1.5 active:scale-95 transition-all rounded-lg" 
                   : "mt-1 bg-white border-2 border-black hover:bg-black hover:text-white text-[11px] font-black p-1 shadow-[3px_3px_0px_#000] active:shadow-none active:translate-y-[2px] transition-all rounded-md"
                 }
               >
                 + {t('node.helper.add_item')}
               </button>
           </div>
        );
    }
    
    if (helper.type === 'formula') {
        const subVals = (hState.vals || {}) as Record<string, number | null>;
        const valsStr = (hState.valsStr || {}) as Record<string, string>;
        const updateSubVal = (subK: string, rawVal: string) => {
             const val = sanitizeInput(rawVal);
             if (val !== '' && val !== '-' && !/^-?\d*\.?\d*$/.test(val)) return;
             const newSubValsStr = { ...valsStr, [subK]: val };
             const num = parseFloat(val);
             const newSubVals = { ...subVals, [subK]: isNaN(num) ? null : num };
             updateHState({ vals: newSubVals, valsStr: newSubValsStr });
             if (helper.solver) {
                 const res = helper.solver(newSubVals);
                 handleInputChange(f.k, res === null ? '' : res.toString());
             }
        };

        return (
           <div className="flex flex-col gap-2">
               <div className={isGoogle 
                 ? "flex items-center justify-between border-b border-[#dadce0] dark:border-[#3c4043] pb-1 mb-2" 
                 : "flex items-center justify-between border-b-2 border-black pb-1 mb-1"
               }>
                   <span className={isGoogle ? "font-bold text-[12px] text-slate-700 dark:text-slate-300" : "font-black text-[12px] text-slate-800"}>{td(helper.title)}</span>
                   <span className={isGoogle 
                     ? "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 px-1.5 py-0.5 text-[10px] font-bold rounded"
                     : "bg-cyan-200 px-1 text-[10px] font-black border border-black uppercase -rotate-1"
                   }>ƒ {t('node.helper.infer')}</span>
               </div>
               {helper.fields?.map(sf => {
                  const rawDispStr = valsStr[sf.k] !== undefined ? valsStr[sf.k] : (subVals[sf.k] !== null && subVals[sf.k] !== undefined ? String(subVals[sf.k]) : '');
                  return (
                      <div key={sf.k} className="flex gap-2 mb-2 items-center justify-between">
                         <span className={isGoogle ? "text-[11px] font-bold text-right text-slate-500 dark:text-slate-400 leading-none" : "text-[11px] font-black text-right text-slate-600 leading-none"}>{td(sf.l)}</span>
                          <input 
                            type="text" 
                            inputMode="decimal" 
                            dir="ltr" 
                            lang="en" 
                            className={isGoogle 
                              ? "nodrag nopan w-[100px] border border-[#dadce0] dark:border-[#3c4043] p-1.5 text-center font-medium text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg" 
                              : "nodrag nopan w-[100px] border-2 border-black p-1 text-center font-bold text-sm bg-white outline-none focus:bg-cyan-50 shadow-[2px_2px_0px_rgba(0,0,0,0.1)] rounded-md"
                            } 
                            value={formatCommas(rawDispStr)} 
                            onChange={e => updateSubVal(sf.k, e.target.value)} 
                            onKeyDown={e => e.stopPropagation()}
                            onPointerDown={e => e.stopPropagation()}
                            placeholder="0" 
                            style={{ fontFamily: 'Cairo, sans-serif' }} 
                          />
                      </div>
                  );
               })}
           </div>
        );
    }
    return null;
};
