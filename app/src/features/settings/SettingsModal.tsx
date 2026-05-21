import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { MODULES } from '@/core/modules';
import { Settings, X, Moon, Sun, Keyboard, Plus, Trash2, Languages, Check, Palette, Zap, Minimize2, Hexagon, Target } from 'lucide-react';
import { useTranslation, useDynamicTranslation, useI18nStore } from '@/lib/i18n';
import { GoogleIcon } from '@/components/ui/GoogleMulticolorIcons';
import { motion, AnimatePresence } from 'framer-motion';

const KEY_LABELS: Record<string, string> = {
  '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
  '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
  'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E',
  'f': 'F', 'g': 'G', 'h': 'H', 'i': 'I', 'j': 'J',
  'k': 'K', 'l': 'L', 'm': 'M', 'n': 'N', 'o': 'O',
  'p': 'P', 'q': 'Q', 'r': 'R', 's': 'S', 't': 'T',
  'u': 'U', 'v': 'V', 'w': 'W', 'x': 'X', 'y': 'Y', 'z': 'Z',
};

export const SettingsModal = () => {
  const {
    isSettingsOpen, openSettings, closeSettings,
    darkMode, toggleDarkMode,
    theme, setTheme,
    shortcuts, addShortcut, removeShortcut,
  } = useSettingsStore();
  const { lang, setLang } = useI18nStore();
  const t = useTranslation();
  const td = useDynamicTranslation();

  const [isAdding, setIsAdding] = useState(false);
  const [newModuleId, setNewModuleId] = useState('');
  const [listeningForKey, setListeningForKey] = useState(false);
  const [capturedKey, setCapturedKey] = useState('');
  const keyListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // Apply dark mode class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-brutal', 'theme-quiet', 'theme-google');
    root.classList.add(`theme-${theme}`);
    root.classList.toggle('quiet', theme === 'quiet');
  }, [theme]);

  // Capture keyboard shortcut
  useEffect(() => {
    if (!listeningForKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!e.ctrlKey && !e.altKey) return;
      const prefix = e.ctrlKey ? 'ctrl' : 'alt';
      const key = e.key.toLowerCase();
      if (['control', 'alt', 'shift', 'meta'].includes(key)) return;
      const combo = `${prefix}+${key}`;
      setCapturedKey(combo);
      setListeningForKey(false);
    };
    keyListenerRef.current = handler;
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [listeningForKey]);

  const handleSaveShortcut = () => {
    if (!capturedKey || !newModuleId) return;
    const existing = shortcuts.find(s => s.key === capturedKey);
    if (existing) {
      alert(`${t('settings.shortcut_used')} ${td(MODULES.find(m => m.id === existing.moduleId)?.title || '')}`);
      return;
    }
    addShortcut({ key: capturedKey, moduleId: newModuleId });
    setIsAdding(false);
    setCapturedKey('');
    setNewModuleId('');
  };

  const formatKey = (combo: string) => {
    const parts = combo.split('+');
    const mod = parts[0] === 'ctrl' ? 'Ctrl' : 'Alt';
    const key = KEY_LABELS[parts[1]] || parts[1].toUpperCase();
    return `${mod} + ${key}`;
  };

  // Bento Card Component
  const BentoCard = ({ children, title, icon: Icon, className = "" }: any) => (
    <div className={`bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-white/5 rounded-[2rem] p-6 relative overflow-hidden group ${className}`}>
       <div className="absolute inset-0 pointer-events-none rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]" />
       <div className="flex items-center gap-3 mb-6 text-slate-800 dark:text-slate-200">
         <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300">
           <Icon size={18} strokeWidth={2.5} />
         </div>
         <h3 className="font-bold text-lg tracking-tight">{title}</h3>
       </div>
       {children}
    </div>
  );

  return (
    <>
      {!isSettingsOpen && (
        <button
          className="brutal-btn settings-trigger animate-pulse-subtle"
          onClick={openSettings}
          title={t('settings.title')}
        >
          <Settings size={18} strokeWidth={3} />
        </button>
      )}

      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
              onClick={closeSettings}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#f9fafb] dark:bg-zinc-950 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border border-white/20 dark:border-white/10"
            >
               {/* Refraction edge */}
               <div className="absolute inset-0 pointer-events-none rounded-[2.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" />
               
               <div className="flex items-center justify-between mb-8 relative z-10 px-2">
                 <div className="flex items-center gap-4">
                   <div className="p-3 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-slate-200 dark:border-white/10 text-emerald-500">
                     <Settings size={24} strokeWidth={2.5} />
                   </div>
                   <div>
                     <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
                       {t('settings.title')}
                     </h2>
                     <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                       {lang === 'ar' ? 'إدارة التفضيلات والواجهة والاختصارات' : 'Manage preferences, interface, and shortcuts'}
                     </p>
                   </div>
                 </div>
                 <button 
                   onClick={closeSettings}
                   className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-500 dark:text-slate-400"
                 >
                   <X size={20} strokeWidth={2.5} />
                 </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
                 
                 {/* Left Column (Appearance & Language) */}
                 <div className="md:col-span-5 flex flex-col gap-4">
                   
                   {/* Language */}
                   <BentoCard title={t('settings.language')} icon={Languages}>
                     <div className="flex bg-slate-100 dark:bg-zinc-800/50 p-1 rounded-2xl">
                       <button
                         onClick={() => setLang('ar')}
                         className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${lang === 'ar' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                         style={{ fontFamily: 'Cairo, sans-serif' }}
                       >
                         {lang === 'ar' && <Check size={16} strokeWidth={3} className="text-emerald-500" />}
                         العربية
                       </button>
                       <button
                         onClick={() => setLang('en')}
                         className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${lang === 'en' ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                         style={{ fontFamily: 'Inter, sans-serif' }}
                       >
                         {lang === 'en' && <Check size={16} strokeWidth={3} className="text-emerald-500" />}
                         English
                       </button>
                     </div>
                   </BentoCard>

                   {/* Appearance */}
                   <BentoCard title={lang === 'ar' ? 'المظهر' : 'Appearance'} icon={Palette}>
                      {/* Dark Mode Toggle */}
                      <button 
                        onClick={toggleDarkMode}
                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors group mb-4 outline-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                            {darkMode ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
                          </div>
                          <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                            {darkMode ? t('settings.dark_mode') : t('settings.light_mode')}
                          </span>
                        </div>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${darkMode ? 'bg-indigo-500 justify-end' : 'bg-slate-300 dark:bg-zinc-600 justify-start'}`}>
                           <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </button>

                      {/* Theme Selection */}
                      <div className="flex flex-col gap-2">
                        {[
                          { id: 'brutal', Icon: Zap, name: lang === 'ar' ? 'النيوبوتاليزم' : 'Neo-Brutalism', color: '#f59e0b' },
                          { id: 'quiet', Icon: Minimize2, name: lang === 'ar' ? 'بسيط هادئ' : 'Quiet Minimal', color: '#3b82f6' },
                          { id: 'google', Icon: Hexagon, name: lang === 'ar' ? 'جوجل الحديث' : 'Google Modern', color: '#10b981' }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setTheme(t.id as any)}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-[0.98] outline-none ${theme === t.id ? 'bg-white dark:bg-zinc-700 border-slate-300 dark:border-zinc-500 shadow-sm' : 'bg-slate-50 dark:bg-zinc-800/30 border-transparent hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-500 dark:text-slate-400'}`}
                          >
                            <div className="flex items-center gap-3">
                              <t.Icon size={18} strokeWidth={2} style={{ color: theme === t.id ? t.color : undefined }} />
                              <span className={`font-bold text-sm ${theme === t.id ? 'text-slate-900 dark:text-white' : ''}`}>
                                {t.name}
                              </span>
                            </div>
                            {theme === t.id && (
                              <Check size={16} strokeWidth={3} style={{ color: t.color }} />
                            )}
                          </button>
                        ))}
                      </div>
                   </BentoCard>

                 </div>

                 {/* Right Column (Shortcuts) */}
                 <div className="md:col-span-7 h-full">
                   <BentoCard title={t('settings.shortcuts')} icon={Keyboard} className="h-full flex flex-col">
                     <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 leading-relaxed max-w-[400px]">
                       {t('settings.shortcuts_hint')}
                     </p>

                     <div className="space-y-2 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                       {shortcuts.length === 0 && !isAdding && (
                         <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-zinc-600">
                           <Keyboard size={48} strokeWidth={1} className="mb-3 opacity-50" />
                           <span className="font-bold text-sm">{t('settings.no_shortcuts')}</span>
                         </div>
                       )}

                       <AnimatePresence mode="popLayout">
                         {shortcuts.map((s) => {
                           const mod = MODULES.find(m => m.id === s.moduleId);
                           return (
                             <motion.div 
                               layout
                               initial={{ opacity: 0, scale: 0.95 }}
                               animate={{ opacity: 1, scale: 1 }}
                               exit={{ opacity: 0, scale: 0.95 }}
                               key={s.key} 
                               className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/50 dark:border-white/5 group hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                             >
                               <div className="flex items-center gap-4">
                                 <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-700 border border-slate-200 dark:border-zinc-600 shadow-sm font-mono text-xs font-bold text-slate-700 dark:text-slate-300" dir="ltr">
                                   {formatKey(s.key)}
                                 </div>
                                 <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                   <GoogleIcon id={s.moduleId} fallbackEmoji={mod?.icon} size={16} />
                                   <span>{mod ? td(mod.title) : s.moduleId}</span>
                                 </div>
                               </div>
                               <button
                                 onClick={() => removeShortcut(s.key)}
                                 className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                               >
                                 <Trash2 size={16} strokeWidth={2.5} />
                               </button>
                             </motion.div>
                           );
                         })}
                       </AnimatePresence>
                     </div>

                     {/* Add Shortcut Section */}
                     <div className="mt-auto">
                       <AnimatePresence mode="wait">
                         {isAdding ? (
                           <motion.div 
                             initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                             className="bg-slate-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 flex flex-col gap-4"
                           >
                             <div className="flex flex-col gap-1.5">
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                 1. {t('settings.select_tool')}
                               </label>
                               <select
                                 className="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-bold text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-emerald-500 transition-colors appearance-none"
                                 value={newModuleId}
                                 onChange={e => setNewModuleId(e.target.value)}
                               >
                                 <option value="">— {t('settings.choose_tool')} —</option>
                                 {MODULES.map(m => (
                                   <option key={m.id} value={m.id}>{m.icon} {td(m.title)}</option>
                                 ))}
                               </select>
                             </div>

                             <div className="flex flex-col gap-1.5">
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                 2. {t('settings.press_key')}
                               </label>
                               {!capturedKey ? (
                                 <button
                                   className={`w-full p-4 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center font-bold text-sm outline-none ${listeningForKey ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-slate-500 hover:border-slate-400 dark:hover:border-zinc-600'}`}
                                   onClick={() => setListeningForKey(true)}
                                 >
                                   <span className="flex items-center gap-2">
                                     {listeningForKey ? <Keyboard size={16} /> : <Target size={16} />}
                                     {listeningForKey
                                       ? t('settings.press_key_hint')
                                       : t('settings.click_to_record')}
                                   </span>
                                 </button>
                               ) : (
                                 <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500">
                                   <span className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                                     {formatKey(capturedKey)}
                                   </span>
                                   <button 
                                     className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 outline-none"
                                     onClick={() => { setCapturedKey(''); setListeningForKey(true); }}
                                   >
                                     {t('settings.change')}
                                   </button>
                                 </div>
                               )}
                             </div>

                             <div className="flex items-center gap-2 pt-2">
                               <button
                                 className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 outline-none"
                                 onClick={handleSaveShortcut}
                                 disabled={!capturedKey || !newModuleId}
                               >
                                 {t('settings.save_shortcut')}
                               </button>
                               <button
                                 className="px-4 py-3 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-300 dark:hover:bg-zinc-600 active:scale-[0.98] transition-all outline-none"
                                 onClick={() => { setIsAdding(false); setCapturedKey(''); setNewModuleId(''); setListeningForKey(false); }}
                               >
                                 {t('settings.cancel')}
                               </button>
                             </div>
                           </motion.div>
                         ) : (
                           <motion.button
                             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                             className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-zinc-700 text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 hover:border-slate-400 transition-colors active:scale-[0.98] outline-none"
                             onClick={() => setIsAdding(true)}
                           >
                             <Plus size={18} strokeWidth={2.5} /> 
                             {t('settings.add_shortcut')}
                           </motion.button>
                         )}
                       </AnimatePresence>
                     </div>
                   </BentoCard>
                 </div>

               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
