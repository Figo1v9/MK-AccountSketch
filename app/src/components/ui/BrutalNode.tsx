import React, { useCallback, useMemo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion, AnimatePresence } from 'framer-motion';
import { FieldDefinition, FieldHelper, AccountingNodeData } from '@/core/types';

import { MODULES } from '@/core/modules';
import { useAccountStore } from '@/store/accountStore';
import { useModalStore } from '@/store/modalStore';

const formatCommas = (str: string | number | null | undefined) => {
    if (str === null || str === undefined || str === '') return '';
    const parts = str.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
};


export const BrutalNode = ({ id, data }: { id: string, data: AccountingNodeData }) => {
  const def = useMemo(() => MODULES.find(m => m.id === data.defId), [data.defId]);
  const { updateNodeData, removeNode } = useAccountStore();
  const { openModal } = useModalStore();

  const [localVals, setLocalVals] = useState<Record<string, string>>({});
  const [openHelper, setOpenHelper] = useState<string|null>(null);

  const toggleHelper = (k: string) => setOpenHelper(openHelper === k ? null : k);

  const handleInputChange = useCallback((key: string, rawVal: string) => {
    if (!def) return;
    
    // Convert Arabic numerals to English and remove commas
    let val = rawVal.replace(/,/g, '');
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let i = 0; i < 10; i++) {
        val = val.replace(new RegExp(arabicNumbers[i], 'g'), i.toString());
    }

    if (val !== '' && val !== '-' && !/^-?\d*\.?\d*$/.test(val)) return;

    // Update local raw string to preserve typing
    setLocalVals(prev => ({ ...prev, [key]: val }));

    const numVal = (val === '' || val === '-' || val.endsWith('.')) ? null : parseFloat(val);
    
    // Build new Manual Keys set
    let newManualKeys = [...(data.manualKeys || [])];
    if (numVal !== null) {
       if (!newManualKeys.includes(key)) newManualKeys.push(key);
    } else {
       newManualKeys = newManualKeys.filter(k => k !== key);
    }

    const newVals = { ...data.vals, [key]: numVal };
    updateNodeData(id, { vals: newVals, manualKeys: newManualKeys });
  }, [id, data.vals, data.manualKeys, updateNodeData, def]);

  const { nodes: allNodes, edges: allEdges } = useAccountStore();
  const incomingEdges = useMemo(() => allEdges.filter(e => e.target === id), [allEdges, id]);
  
  // Dependency array to determine if parent values changed
  const parentNodeValues = useMemo(() => {
     return incomingEdges.map(e => allNodes.find(n => n.id === e.source)?.data.vals);
  }, [incomingEdges, allNodes]);

  React.useEffect(() => {
    if (!def) return;
    
    // 1. Gather all upstream values
    const inheritedVals: Record<string, number> = {};
    incomingEdges.forEach(e => {
       const sourceNode = allNodes.find(n => n.id === e.source);
       if (sourceNode && sourceNode.data.vals) {
          Object.keys(sourceNode.data.vals).forEach(k => {
             const v = sourceNode.data.vals[k];
             if (v !== null && v !== undefined) inheritedVals[k] = v;
          });
       }
    });

    const valsForSolver: Record<string, number | null> = {};
    const effectiveManualKeys = [...(data.manualKeys || [])];
    const currentInheritedKeys: string[] = [];

    // 2. Resolve values: Manual > Inherited > Existing
    def.fields.forEach(f => {
        const hasInherited = inheritedVals[f.k] !== undefined;
        const isManuallyOverridden = effectiveManualKeys.includes(f.k);

        if (isManuallyOverridden) {
            valsForSolver[f.k] = data.vals[f.k];
        } else if (hasInherited) {
            valsForSolver[f.k] = inheritedVals[f.k];
            currentInheritedKeys.push(f.k);
        } else {
            valsForSolver[f.k] = null; // ALWAYS clear calculated values before solving so the solver doesn't treat them as inputs
        }
    });

    // 3. Solve equations
    const solved = def.solver({...valsForSolver}) as Record<string, number | null | string>;
    const errorMsg = (solved as any)._error as string | undefined;

    const finalVals: Record<string, number | null> = { ...valsForSolver };
    const newCalcKeys: string[] = [];

    def.fields.forEach(f => {
       const hasInherited = currentInheritedKeys.includes(f.k);
       // Valid calculation that wasn't manual or inherited
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

    // 4. Determine if we need to update state to prevent infinite loops
    const prevInheritedKeys = data.inheritedKeys || [];
    const isDifferent = def.fields.some(f => finalVals[f.k] !== data.vals[f.k]) 
        || newCalcKeys.join(',') !== (data.calcKeys||[]).join(',')
        || errorMsg !== data.error
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
  }, [id, data.vals, data.manualKeys, data.calcKeys, data.error, data.inheritedKeys, def, incomingEdges, parentNodeValues, allNodes, updateNodeData]);

  if (!def) return null;

  return (
    <div className="pm border-[4px] border-black bg-white shadow-[8px_8px_0px_#000] relative">
      <Handle type="target" position={Position.Top} className="!bg-black !w-3 !h-3 !border-2 !border-white" />
      <Handle type="source" position={Position.Bottom} className="!bg-black !w-3 !h-3 !border-2 !border-white" />
      
      <div className="pm-head p-3 border-b-4 border-black flex justify-between items-center" style={{ backgroundColor: def.color }}>
        <div className="pm-title font-black text-lg flex items-center gap-2">
            <span>{def.icon}</span> 
            <span className="truncate max-w-[180px]">{def.title}</span>
        </div>
        <div className="flex gap-2 items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); updateNodeData(id, { vals: {}, calcKeys: [], manualKeys: [], error: undefined, helpersVals: {} }); setLocalVals({}); }} 
              className="nodrag w-7 h-7 flex items-center justify-center font-bold text-base bg-white border-2 border-black hover:bg-slate-200 active:translate-y-[2px] shadow-[2px_2px_0px_#000] active:shadow-none rounded-full transition-all"
              title="تفريغ الكارت"
            >
                🔄
            </button>
            {def.latex && (
                <button 
                  onClick={(e) => { e.stopPropagation(); openModal(def.title, def.latex!); }} 
                  className="nodrag w-7 h-7 flex items-center justify-center font-bold text-base bg-yellow-300 border-2 border-black hover:bg-yellow-400 active:translate-y-[2px] shadow-[2px_2px_0px_#000] active:shadow-none rounded-full transition-all"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                    ؟
                </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); removeNode(id); }} 
              className="nodrag w-7 h-7 flex items-center justify-center font-bold text-base bg-red-400 border-2 border-black hover:bg-red-500 active:translate-y-[2px] shadow-[2px_2px_0px_#000] active:shadow-none rounded-full text-white transition-all"
              style={{ fontFamily: 'Cairo, sans-serif' }}
            >
                ✕
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
              displayVal = valNum === null || valNum === undefined ? '' : formatCommas(Number(valNum).toString());
          } else {
              const rawStr = localVals[f.k] !== undefined ? localVals[f.k] : (valNum === null || valNum === undefined ? '' : valNum.toString());
              displayVal = formatCommas(rawStr);
          }

          return (
            <div key={f.k} className="nodrag w-full">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-extrabold text-black flex-1 text-right leading-[1.25] flex items-center justify-end gap-2">
                  {f.helper && (
                    <button 
                       onClick={() => toggleHelper(f.k)} 
                       className={`w-6 h-6 shrink-0 text-[14px] font-black border-2 border-black rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 shadow-[1px_1px_0px_#000] ${openHelper === f.k ? 'bg-black text-white' : 'bg-cyan-200'}`}
                    >
                      !
                    </button>
                  )}
                  {f.l}
                </span>
                <div className="relative w-[130px]">
                    <input 
                      type="text" 
                      inputMode="decimal"
                      dir="ltr"
                      lang="en"
                      style={{ fontFamily: 'Cairo, sans-serif' }}
                      className={`w-full border-2 border-black p-1 text-center font-black text-md outline-none transition-colors ${isCalc ? 'bg-emerald-100' : isInherited ? 'bg-indigo-100 border-indigo-500' : 'bg-white focus:bg-yellow-50'} ${isManual ? 'border-blue-600' : 'border-black'}`}
                      value={displayVal}
                      onChange={e => handleInputChange(f.k, e.target.value)}
                      placeholder="0"
                      readOnly={isCalc || isInherited}
                    />
                    {isCalc && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border border-black rounded-full shadow-[1px_1px_0px_#000]" title="قيمة محسوبة" />}
                    {isInherited && <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 border border-black rounded-full shadow-[1px_1px_0px_#000]" title="قيمة مستلمة من كارت آخر" />}
                </div>
                <span className="w-8 text-[11px] font-bold text-gray-500">{f.u}</span>
              </div>
              
              <AnimatePresence>
                {openHelper === f.k && f.helper && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                     <div className="mt-2 mb-4 bg-slate-50 border-2 border-black p-3 shadow-[4px_4px_0px_#000] z-20 relative">
                        <HelperBlock f={f} data={data} id={id} handleInputChange={handleInputChange} />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <div className="mt-2 p-2 bg-slate-50 border-2 border-dashed border-black text-[10.5px] font-bold text-center text-slate-500 leading-relaxed italic">
            {def.formula}
        </div>

        <AnimatePresence>
            {data.error && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-2 border-2 border-black bg-red-50 text-red-600 font-black text-xs text-center shadow-[3px_3px_0px_var(--border)]"
              >
                ⚠️ {data.error}
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const HelperBlock = ({ f, data, id, handleInputChange }: { f: FieldDefinition, data: AccountingNodeData, id: string, handleInputChange: (k: string, v: string) => void }) => {
    const helper = f.helper as FieldHelper;
    const { updateNodeData } = useAccountStore();
    const hState = (data.helpersVals?.[f.k] || {}) as any;

    const updateHState = (newState: any) => {
       updateNodeData(id, { helpersVals: { ...data.helpersVals, [f.k]: newState } });
    };

    if (helper.type === 'dynamic_sum') {
        const items = (hState.items || [{val: ''}]) as {val: string}[];
        const updateItem = (idx: number, rawVal: string) => {
             let val = rawVal.replace(/,/g, '');
             const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
             for (let i = 0; i < 10; i++) val = val.replace(new RegExp(arabicNumbers[i], 'g'), i.toString());
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
               <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-1">
                   <span className="font-black text-[12px] text-slate-900">{helper.title}</span>
                   <span className="bg-amber-300 px-1 text-[10px] font-black border border-black uppercase rotate-1">Σ تجميع</span>
               </div>
               {items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                     <span className="text-[10px] font-black opacity-30 w-3">{idx+1}</span>
                     <input type="text" inputMode="decimal" dir="ltr" lang="en" className="flex-1 border-2 border-black p-1 text-center font-bold text-sm bg-white outline-none focus:bg-amber-50 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]" value={formatCommas(it.val)} onChange={e => updateItem(idx, e.target.value)} placeholder="0" style={{ fontFamily: 'Cairo, sans-serif' }} />
                  </div>
               ))}
               <button onClick={addItem} className="mt-1 bg-white border-2 border-black hover:bg-black hover:text-white text-[11px] font-black p-1 shadow-[3px_3px_0px_#000] active:shadow-none active:translate-y-[2px] transition-all">
                 + إضافة بند مالي
               </button>
           </div>
        );
    }
    
    if (helper.type === 'formula') {
        const subVals = (hState.vals || {}) as Record<string, number | null>;
        const valsStr = (hState.valsStr || {}) as Record<string, string>;
        const updateSubVal = (subK: string, rawVal: string) => {
             let val = rawVal.replace(/,/g, '');
             const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
             for (let i = 0; i < 10; i++) val = val.replace(new RegExp(arabicNumbers[i], 'g'), i.toString());
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
               <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-1">
                   <span className="font-black text-[12px] text-slate-800">{helper.title}</span>
                   <span className="bg-cyan-200 px-1 text-[10px] font-black border border-black uppercase -rotate-1">ƒ استنتاج</span>
               </div>
               {helper.fields?.map(sf => {
                  const rawDispStr = valsStr[sf.k] !== undefined ? valsStr[sf.k] : (subVals[sf.k] !== null && subVals[sf.k] !== undefined ? String(subVals[sf.k]) : '');
                  return (
                      <div key={sf.k} className="flex gap-2 mb-2 items-center justify-between">
                         <span className="text-[11px] font-black text-right text-slate-600 leading-none">{sf.l}</span>
                         <input 
                           type="text" 
                           inputMode="decimal" 
                           dir="ltr" 
                           lang="en" 
                           className="w-[100px] border-2 border-black p-1 text-center font-bold text-sm bg-white outline-none focus:bg-cyan-50 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]" 
                           value={formatCommas(rawDispStr)} 
                           onChange={e => updateSubVal(sf.k, e.target.value)} 
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
}
