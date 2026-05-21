import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'ar' | 'en';

type I18nState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
};

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      lang: 'ar',
      setLang: (lang) => set({ lang }),
      toggleLang: () => set((state) => ({ lang: state.lang === 'ar' ? 'en' : 'ar' })),
    }),
    { name: 'mk-i18n-storage' }
  )
);

const ar = {
  'app.title': 'AccountSketch Pro v3.0',
  'app.clear_board': 'تصفية اللوحة',
  'settings.title': 'الإعدادات المتقدمة',
  'settings.theme': 'المظهر',
  'settings.theme.light': 'فاتح',
  'settings.theme.dark': 'داكن',
  'settings.shortcuts': 'اختصارات الكيبورد (Shortcuts)',
  'settings.shortcuts.add': 'إضافة اختصار جديد',
  'settings.shortcuts.module': 'الأداة / المعادلة',
  'settings.shortcuts.key': 'الزر (مثال: a)',
  'settings.shortcuts.no_key': 'لم يتم تعيين زر',
  'settings.shortcuts.action': 'الإجراء',
  'settings.language': 'لغة الواجهة (Language)',
  'settings.language.ar': 'العربية',
  'settings.language.en': 'English',
  'ocr.title': 'قراءة المسألة بالذكاء الاصطناعي',
  'ocr.placeholder': 'أدخل نص المسألة المحاسبية هنا، وسيقوم الذكاء الاصطناعي بتحليلها وإضافة كروت الحل مباشرة إلى اللوحة...',
  'ocr.analyze': 'تحليل وإدراج الكروت',
  'ocr.analyzing': 'جاري التحليل...',
  'sidebar.search': 'بحث عن أداة...',
  'summary.title': 'التقرير الشامل',
  'summary.empty': 'لا توجد كروت على اللوحة حالياً. أضف كروت للبدء.',
  'summary.node': 'كارت رقم',
  'summary.error': 'يوجد خطأ أو تحذير',
  'summary.export_pdf': 'تصدير PDF',
  'summary.export_excel': 'تصدير Excel',
  'node.clear': 'تفريغ الكارت',
  'node.steps': 'خطوات الحل',
  'node.delete': 'حذف الكارت',
  'node.calculated': 'قيمة محسوبة',
  'node.inherited': 'قيمة مستلمة من كارت آخر',
  'node.inputs': 'المعطيات (Inputs)',
  'node.outputs': 'النتائج (Outputs)',
  'node.steps_title': 'خطوات حساب المعادلة:',
  'node.steps_apply': 'تطبيق القاعدة الأساسية المباشرة:',
  'node.steps_derived': 'النواتج المستخلصة بالتعويض في النظام:',
  'node.helper.sum': 'تجميع',
  'node.helper.add_item': 'إضافة بند مالي',
  'node.helper.infer': 'استنتاج',
  'steps.title': 'خطوات الحل الرياضي',
  'steps.inputs': 'المعطيات:',
  'steps.outputs': 'النتائج:',
  'steps.formula': 'القانون الرياضي الأساسي:',
  'steps.custom': 'خطوات الحل:',
  'steps.empty_inputs': 'لا يوجد معطيات حالياً.',
  'steps.empty_outputs': 'لا يوجد نتائج حالياً.',
  'summary.copied': 'تم نسخ النتائج إلى الحافظة',
  'summary.save_pdf': 'حفظ كـ PDF',
  'summary.copy': 'نسخ التقرير',
  'summary.empty_state': 'ضع وحدات وأدخل أرقاماً',
  'summary.empty_hint': 'لرؤية التحليل هنا',
  'summary.clipboard_title': 'تقرير AccountSketch المباشر',
  'canvas.drag_hint_1': 'اسحب أي موديول هنا',
  'canvas.drag_hint_2': 'لإجراء الحسابات فوراً',
  'settings.shortcut_used': 'هذا المفتاح مستخدم بالفعل للأداة:',
  'settings.appearance': 'المظهر',
  'settings.dark_mode': 'الوضع الداكن',
  'settings.light_mode': 'الوضع الفاتح',
  'settings.shortcuts_hint': 'خصّص مفتاح (Ctrl/Alt + حرف) لإضافة أداة مباشرة على اللوحة',
  'settings.no_shortcuts': 'لم يتم إضافة اختصارات بعد',
  'settings.delete': 'حذف',
  'settings.select_tool': 'اختر الأداة:',
  'settings.choose_tool': 'اختر أداة',
  'settings.press_key': 'اضغط المفتاح:',
  'settings.press_key_hint': 'اضغط Ctrl/Alt + حرف...',
  'settings.click_to_record': 'اضغط لتسجيل المفتاح',
  'settings.change': 'تغيير',
  'settings.save_shortcut': 'حفظ الاختصار',
  'settings.cancel': 'إلغاء',
  'settings.add_shortcut': 'إضافة اختصار جديد',
  'sidebar.title': 'الأدوات المحاسبية',
  'sidebar.search_placeholder': 'بحث... (مثال: إهلاك، تعادل، NPV)',
  'sidebar.clear': 'مسح',
  'sidebar.results': 'نتيجة',
  'sidebar.no_results': 'لا توجد نتائج',
  'sidebar.no_match': 'لا توجد أدوات مطابقة',
  'sidebar.try_another': 'جرّب كلمة أخرى',
  'ocr.no_valid_data': 'لم يتم العثور على بيانات صالحة في الرد',
  'ocr.unexpected_error': 'خطأ غير متوقع',
  'ocr.image_only': 'يرجى رفع صورة فقط',
  'ocr.dropzone_text': 'اسحب صورة المسألة هنا أو الصقها (Ctrl+V)',
  'ocr.dropzone_hint': 'أو اضغط لاختيار ملف من الجهاز',
  'ocr.retry': 'إعادة المحاولة',
  'ocr.module_not_found': 'موديول غير موجود',
  'ocr.apply': 'تطبيق على اللوحة',
  'app.close': 'إغلاق',
};

const en = {
  'app.title': 'AccountSketch Pro v3.0',
  'app.clear_board': 'Clear Board',
  'settings.title': 'Advanced Settings',
  'settings.theme': 'Theme',
  'settings.theme.light': 'Light',
  'settings.theme.dark': 'Dark',
  'settings.shortcuts': 'Keyboard Shortcuts',
  'settings.shortcuts.add': 'Add New Shortcut',
  'settings.shortcuts.module': 'Module / Formula',
  'settings.shortcuts.key': 'Key (e.g. a)',
  'settings.shortcuts.no_key': 'No key set',
  'settings.shortcuts.action': 'Action',
  'settings.language': 'Interface Language',
  'settings.language.ar': 'العربية',
  'settings.language.en': 'English',
  'ocr.title': 'AI Problem Reader',
  'ocr.placeholder': 'Enter the accounting problem text here, and AI will analyze it and insert the solution cards directly into the board...',
  'ocr.analyze': 'Analyze & Insert Cards',
  'ocr.analyzing': 'Analyzing...',
  'sidebar.search': 'Search for a tool...',
  'summary.title': 'Comprehensive Report',
  'summary.empty': 'No cards on the board currently. Add cards to start.',
  'summary.node': 'Card #',
  'summary.error': 'Error or Warning',
  'summary.export_pdf': 'Export PDF',
  'summary.export_excel': 'Export Excel',
  'node.clear': 'Clear Card',
  'node.steps': 'Solution Steps',
  'node.delete': 'Delete Card',
  'node.calculated': 'Calculated Value',
  'node.inherited': 'Value Inherited from another card',
  'node.inputs': 'Inputs',
  'node.outputs': 'Outputs',
  'node.steps_title': 'Calculation Steps:',
  'node.steps_apply': 'Applying Basic Formula:',
  'node.steps_derived': 'Derived Results:',
  'node.helper.sum': 'Sum',
  'node.helper.add_item': 'Add Financial Item',
  'node.helper.infer': 'Infer',
  'steps.title': 'Mathematical Solution Steps',
  'steps.inputs': 'Inputs:',
  'steps.outputs': 'Outputs:',
  'steps.formula': 'Basic Mathematical Formula:',
  'steps.custom': 'Solution Steps:',
  'steps.empty_inputs': 'No inputs currently.',
  'steps.empty_outputs': 'No outputs currently.',
  'summary.copied': 'Results copied to clipboard',
  'summary.save_pdf': 'Save as PDF',
  'summary.copy': 'Copy Report',
  'summary.empty_state': 'Drop modules and enter numbers',
  'summary.empty_hint': 'to see analysis here',
  'summary.clipboard_title': 'AccountSketch Live Report',
  'canvas.drag_hint_1': 'Drag any module here',
  'canvas.drag_hint_2': 'to compute instantly',
  'settings.shortcut_used': 'This key is already used by:',
  'settings.appearance': 'Appearance',
  'settings.dark_mode': 'Dark Mode',
  'settings.light_mode': 'Light Mode',
  'settings.shortcuts_hint': 'Assign (Ctrl/Alt + Key) to drop a module instantly',
  'settings.no_shortcuts': 'No shortcuts added yet',
  'settings.delete': 'Delete',
  'settings.select_tool': 'Select Tool:',
  'settings.choose_tool': 'Choose a tool',
  'settings.press_key': 'Press Key:',
  'settings.press_key_hint': 'Press Ctrl/Alt + Key...',
  'settings.click_to_record': 'Click to record key',
  'settings.change': 'Change',
  'settings.save_shortcut': 'Save Shortcut',
  'settings.cancel': 'Cancel',
  'settings.add_shortcut': 'Add New Shortcut',
  'sidebar.title': 'Accounting Tools',
  'sidebar.search_placeholder': 'Search... (e.g. Depreciation, Break-even, NPV)',
  'sidebar.clear': 'Clear',
  'sidebar.results': 'results',
  'sidebar.no_results': 'No results',
  'sidebar.no_match': 'No matching tools',
  'sidebar.try_another': 'Try another word',
  'ocr.no_valid_data': 'No valid data found in response',
  'ocr.unexpected_error': 'Unexpected error',
  'ocr.image_only': 'Please upload an image only',
  'ocr.dropzone_text': 'Drop problem image here or paste (Ctrl+V)',
  'ocr.dropzone_hint': 'Or click to select a file',
  'ocr.retry': 'Retry',
  'ocr.module_not_found': 'Module not found',
  'ocr.apply': 'Apply to Board',
  'app.close': 'Close',
};

export const dictionaries = { ar, en };

export const useTranslation = () => {
  const lang = useI18nStore(state => state.lang);
  return (key: keyof typeof ar, variables?: Record<string, string | number>) => {
    let text = (dictionaries[lang] as Record<string, string>)[key] || key;
    if (variables) {
      Object.keys(variables).forEach(k => {
        text = text.replace(`{{${k}}}`, String(variables[k]));
      });
    }
    return text;
  };
};

import { accountingDictEn } from './i18n_accounting';
import { latexDictEn } from './i18n_latex';

export const translateLatex = (latex: string, td: (s: string) => string) => {
    return latex.replace(/(\\+)text\{([^}]+)\}/g, (_, slashes, text) => {
        return slashes + 'text{' + td(text) + '}';
    });
};

export const tNow = (lang: Lang, key: string, variables?: Record<string, string | number>) => {
    let text = (dictionaries[lang] as Record<string, string>)[key] || key;
    if (variables) {
      Object.keys(variables).forEach(k => {
        text = text.replace(`{{${k}}}`, String(variables[k]));
      });
    }
    return text;
};

export const tDynamic = (str: string, lang: Lang): string => {
  if (lang === 'ar') return str;
  if (!str) return str;
  
  // Direct match
  const directMatch = accountingDictEn[str] || latexDictEn[str];
  if (directMatch) return directMatch;
  
  // Regex fallbacks for dynamic decisions/errors
  let res = str;
  
  // Extract number if exists
  const numMatch = str.match(/([\d.,]+)/);
  const num = numMatch ? numMatch[1] : '';
  
  // Specific dynamic rules based on common templates
  if (str.includes('الصنع أفضل — وفر')) return `🏭 Making is better — Save ${num} EGP`;
  if (str.includes('الشراء أفضل — وفر')) return `🛒 Buying is better — Save ${num} EGP`;
  if (str.includes('الاستبعاد أفضل — زيادة في الربح')) return `✂️ Dropping is better — Profit increase ${num}`;
  if (str.includes('الاستمرار أفضل — الاستبعاد يخسر')) return `✅ Continuing is better — Dropping loses ${num}`;
  if (str.includes('الإنتاج > المبيعات → دخل الكلية أعلى بـ')) return `📊 Production > Sales → Absorption Income higher by ${num} EGP`;
  if (str.includes('الإنتاج < المبيعات → دخل المتغيرة أعلى بـ')) return `📊 Production < Sales → Variable Income higher by ${num} EGP`;
  if (str.includes('انحراف مؤاتٍ (وفر) بقيمة')) return `🟢 Favorable Variance (Savings) of ${num} EGP`;
  if (str.includes('انحراف غير مؤاتٍ (تجاوز) بقيمة')) return `🔴 Unfavorable Variance (Excess) of ${num} EGP`;
  if (str.includes('عجز نقدي — يجب ترتيب تمويل بقيمة')) return `🔴 Cash Deficit — Financing required in amount of ${num} EGP`;
  if (str.includes('بلغ النصاب — الزكاة واجبة بمبلغ')) return `✅ Nisab reached — Zakat is due in amount of ${num}`;
  if (str.includes('زيادة بنسبة')) return `📈 Increase of ${num}%`;
  if (str.includes('انخفاض بنسبة')) return `📉 Decrease of ${num}%`;
  if (str.includes('المشروع مجدي — NPV موجب بـ')) return `🟢 Project is feasible — Positive NPV of ${num}`;
  if (str.includes('المشروع غير مجدي — NPV سالب بـ')) return `🔴 Project is not feasible — Negative NPV of ${num}`;
  if (str.includes('أولوية الإنتاج حسب هامش المساهمة لوحدة المورد =')) return `📊 Production Priority by CM Per Resource Unit = ${num}`;
  
  // Fallback translation checking for partial matches or returning as is
  return res;
};

export const useDynamicTranslation = () => {
  const lang = useI18nStore(state => state.lang);
  return (str: string) => tDynamic(str, lang);
};

