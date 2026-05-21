import { AccountingModuleDef } from './types';

const n = (v: number | null | undefined): boolean => v !== null && v !== undefined && !isNaN(v as number) && String(v) !== '';
// Intermediate rounding helper: returns raw high-precision float to prevent cumulative rounding errors.
// Final outputs are automatically rounded to 2 decimals after calculation completion.
const r = (v: number) => v;

export const MODULES: AccountingModuleDef[] = [
  {
    id: 'income', title: 'قائمة الدخل', icon: '💰', color: '#FF90E8',
    desc: 'الإيراد، التكلفة، وصافي الربح بعد الفوائد والضرائب',
    fields:[
      {k:'rev',   l:'الإيراد (المبيعات)',       u:'ج.م'},
      {k:'cogs',  l:'تكلفة البضاعة المباعة',    u:'ج.م'},
      {k:'gp',    l:'مجمل الربح',               u:'ج.م'},
      {k:'opex',  l:'مصاريف التشغيل',           u:'ج.م'},
      {k:'ebit',  l:'قبل فوائد وضرائب',     u:'ج.م'},
      {k:'int',   l:'المصاريف التمويلية',       u:'ج.م'},
      {k:'tax',   l:'الضرائب',                  u:'ج.م'},
      {k:'ni',    l:'صافي الدخل النهائي',       u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rev) && v.rev! < 0) { v._error = 'الإيراد لا يمكن أن يكون سالباً'; break; }
        if(n(v.cogs) && v.cogs! < 0) { v._error = 'التكلفة لا يمكن أن تكون سالبة'; break; }
        if(n(v.rev) && n(v.cogs) && !n(v.gp)){ v.gp = r(v.rev!-v.cogs!); c=true; }
        if(n(v.rev) && n(v.gp) && !n(v.cogs)){ v.cogs = r(v.rev!-v.gp!); c=true; }
        if(n(v.cogs) && n(v.gp) && !n(v.rev)){ v.rev = r(v.cogs!+v.gp!); c=true; }
        if(n(v.gp) && n(v.opex) && !n(v.ebit)){ v.ebit = r(v.gp!-v.opex!); c=true; }
        if(n(v.gp) && n(v.ebit) && !n(v.opex)){ v.opex = r(v.gp!-v.ebit!); c=true; }
        const invTax = (v.int||0) + (v.tax||0);
        if(n(v.ebit) && !n(v.ni)){ v.ni = r(v.ebit!-invTax); c=true; }
        if(n(v.ni) && !n(v.ebit)){ v.ebit = r(v.ni!+invTax); c=true; }
      }
      return v;
    },
    formula: 'الإيراد − COGS = مجمل الربح | EBIT − فوائد − ضرائب = صافي الدخل',
    latex: '\\text{صافي الدخل} = \\text{الإيرادات} - \\text{التكاليف} - \\text{الضرائب والفوائد}'
  },
  {
    id: 'cvp_income', title: 'قائمة المساهمة', icon: '📝', color: '#FCD8E3',
    desc: 'تصنيف التكاليف لمتغيرة وثابتة مع بيانات الوحدة',
    fields:[
      {k:'qty',  l:'الكمية المبيعة',          u:'وحدة'},
      {k:'price',l:'سعر البيع للوحدة',        u:'ج.م'},
      {k:'rev',  l:'إجمالي المبيعات',         u:'ج.م', helper: { type: 'dynamic_sum', title: 'تجميع بنود المبيعات' }},
      {k:'vc_pu',l:'التكلفة المتغيرة للوحدة', u:'ج.م', helper: {
        type: 'formula', title: 'حساب من الإجمالي',
        fields: [{k:'t_vc', l:'إجمالي المتغيرة', u:'ج.م'}, {k:'t_qty', l:'عدد الوحدات', u:'وحدة'}],
        solver: (s: Record<string, number | null>) => (n(s.t_vc) && n(s.t_qty) && s.t_qty! > 0) ? r(s.t_vc! / s.t_qty!) : null
      }},
      {k:'vc',   l:'إجمالي التكاليف المتغيرة',u:'ج.م', helper: { type: 'dynamic_sum', title: 'تجميع البنود المتغيرة' }},
      {k:'cm_pu',l:'هامش المساهمة للوحدة',    u:'ج.م'},
      {k:'cm',   l:'إجمالي هامش المساهمة',    u:'ج.م'},
      {k:'fc',   l:'إجمالي التكاليف الثابتة', u:'ج.م', helper: { type: 'dynamic_sum', title: 'تجميع البنود الثابتة' }},
      {k:'ni',   l:'صافي الدخل التشغيلي',    u:'ج.م'},
      {k:'cmr',  l:'نسبة هامش المساهمة',      u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.qty) && v.qty! < 0) { v._error = 'الكمية يجب ألا تكون سالبة'; break; }
        if(n(v.price) && v.price! < 0) { v._error = 'سعر البيع لا يمكن أن يكون سالباً'; break; }
        if(n(v.rev) && v.rev! < 0) { v._error = 'المبيعات لا يمكن أن تكون قيمة سالبة'; break; }

        // --- Totals chain ---
        // REV = QTY * PRICE
        if(n(v.qty) && n(v.price) && !n(v.rev)) { v.rev = r(v.qty! * v.price!); c=true; }
        if(n(v.rev) && n(v.price) && v.price!>0 && !n(v.qty)) { v.qty = r(v.rev! / v.price!); c=true; }
        if(n(v.rev) && n(v.qty) && v.qty!>0 && !n(v.price)) { v.price = r(v.rev! / v.qty!); c=true; }

        // VC = QTY * VC_PU
        if(n(v.qty) && n(v.vc_pu) && !n(v.vc)) { v.vc = r(v.qty! * v.vc_pu!); c=true; }
        if(n(v.vc) && n(v.qty) && v.qty!>0 && !n(v.vc_pu)) { v.vc_pu = r(v.vc! / v.qty!); c=true; }
        if(n(v.vc) && n(v.vc_pu) && v.vc_pu!>0 && !n(v.qty)) { v.qty = r(v.vc! / v.vc_pu!); c=true; }

        // CM_PU = PRICE - VC_PU
        if(n(v.price) && n(v.vc_pu) && !n(v.cm_pu)) { v.cm_pu = r(v.price! - v.vc_pu!); c=true; }
        if(n(v.cm_pu) && n(v.vc_pu) && !n(v.price)) { v.price = r(v.cm_pu! + v.vc_pu!); c=true; }
        if(n(v.price) && n(v.cm_pu) && !n(v.vc_pu)) { v.vc_pu = r(v.price! - v.cm_pu!); c=true; }

        // CM = QTY * CM_PU
        if(n(v.qty) && n(v.cm_pu) && !n(v.cm)) { v.cm = r(v.qty! * v.cm_pu!); c=true; }
        if(n(v.cm) && n(v.qty) && v.qty!>0 && !n(v.cm_pu)) { v.cm_pu = r(v.cm! / v.qty!); c=true; }

        // CM = REV - VC
        if(n(v.rev) && n(v.vc) && !n(v.cm)) { v.cm = r(v.rev! - v.vc!); c=true; }
        if(n(v.rev) && n(v.cm) && !n(v.vc)) { v.vc = r(v.rev! - v.cm!); c=true; }
        if(n(v.vc) && n(v.cm) && !n(v.rev)) { v.rev = r(v.vc! + v.cm!); c=true; }
        
        // NI = CM - FC
        if(n(v.cm) && n(v.fc) && !n(v.ni)) { v.ni = r(v.cm! - v.fc!); c=true; }
        if(n(v.ni) && n(v.fc) && !n(v.cm)) { v.cm = r(v.ni! + v.fc!); c=true; }
        if(n(v.cm) && n(v.ni) && !n(v.fc)) { v.fc = r(v.cm! - v.ni!); c=true; }

        // CMR = (CM / REV) * 100  OR  (CM_PU / PRICE) * 100
        if(n(v.cm) && n(v.rev) && v.rev!>0 && !n(v.cmr)) { v.cmr = r((v.cm!/v.rev!)*100); c=true; }
        if(n(v.cm_pu) && n(v.price) && v.price!>0 && !n(v.cmr)) { v.cmr = r((v.cm_pu!/v.price!)*100); c=true; }
        if(n(v.cmr) && n(v.rev) && v.rev!>0 && !n(v.cm)) { v.cm = r((v.cmr!/100)*v.rev!); c=true; }
        if(n(v.cmr) && n(v.cm) && v.cmr!>0 && !n(v.rev)) { v.rev = r(v.cm!/(v.cmr!/100)); c=true; }
        if(n(v.cmr) && n(v.price) && !n(v.cm_pu)) { v.cm_pu = r((v.cmr!/100)*v.price!); c=true; }
      }
      if(n(v.rev) && v.rev! < 0) v._error = 'الإيراد لا يمكن أن يكون قيمة سالبة';
      if(n(v.qty) && v.qty! < 0) v._error = 'الكميات يجب ألا تكون سالبة';
      if(n(v.price) && v.price! < 0) v._error = 'السعر لا يمكن أن يكون بالقيمة السالبة';
      return v;
    },
    formula: 'المبيعات - متغيرة = المساهمة | المساهمة - ثابتة = الدخل',
    latex: '\\text{صافي الدخل} = (\\text{المبيعات} - \\text{م.متغيرة}) - \\text{م.ثابتة}'
  },
  {
    id: 'gmargin', title: 'هامش الربح الإجمالي', icon: '📊', color: '#74F0ED',
    desc: 'نسبة مجمل الربح من المبيعات',
    fields:[
      {k:'rev',  l:'الإيراد الكلي',         u:'ج.م'},
      {k:'cogs', l:'تكلفة البضاعة',        u:'ج.م'},
      {k:'gp',   l:'مجمل الربح',           u:'ج.م'},
      {k:'gmp',  l:'الهامش الإجمالي',     u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rev) && v.rev! < 0) { v._error = 'الإيراد لا يمكن أن يكون سالباً'; break; }
        if(n(v.cogs) && v.cogs! < 0) { v._error = 'التكلفة المباشرة لا يمكن أن تكون سالبة'; break; }
        
        if(n(v.rev) && n(v.cogs) && !n(v.gp)) { v.gp=r(v.rev!-v.cogs!); c=true; }
        if(n(v.rev) && n(v.gp) && !n(v.cogs)) { v.cogs=r(v.rev!-v.gp!); c=true; }
        if(n(v.cogs) && n(v.gp) && !n(v.rev)) { v.rev=r(v.cogs!+v.gp!); c=true; }
        if(n(v.gp) && n(v.rev) && v.rev!==0 && !n(v.gmp)) { v.gmp=r((v.gp!/v.rev!)*100); c=true; }
        if(n(v.gmp) && n(v.rev) && !n(v.gp)) { v.gp=r((v.gmp!/100)*v.rev!); c=true; }
        if(n(v.gmp) && n(v.gp) && v.gmp!==0 && !n(v.rev)) { v.rev=r(v.gp!/(v.gmp!/100)); c=true; }
      }
      return v;
    },
    formula: 'هامش المساهمة (٪) = (مجمل الربح ÷ الإيراد) × 100',
    latex: '\\text{نسبة هامش الربح} = \\left( \\frac{\\text{مجمل الربح}}{\\text{الإيرادات}} \\right) \\times 100'
  },
  {
    id: 'breakeven', title: 'نقطة التعادل', icon: '⚖️', color: '#FFBD2E',
    desc: 'حجم التغطية لتكاليف التشغيل',
    fields:[
      {k:'fc',  l:'التكاليف الثابتة',     u:'ج.م', helper: { type: 'dynamic_sum', title: 'جمع الثابتة' }},
      {k:'p',   l:'سعر بيع للوحدة',       u:'ج.م'},
      {k:'vc',  l:'ت. متغيرة للوحدة',    u:'ج.م'},
      {k:'cm',  l:'هامش الوحدة',          u:'ج.م'},
      {k:'rev', l:'إجمالي المبيعات (نقل مباشر)', u:'ج.م'},
      {k:'t_vc',l:'إجمالي التكاليف المتغيرة',u:'ج.م', helper: { type: 'dynamic_sum', title: 'تجميع المتغيرة' }},
      {k:'cmr', l:'نسبة هامش المساهمة',    u:'%'},
      {k:'beq', l:'التعادل بالكمية',         u:'وحدة'},
      {k:'bes', l:'التعادل بالقيمة',         u:'ج.م'}
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        
        if(n(v.p) && n(v.vc) && v.p! <= v.vc!) { v._error = 'سعر البيع يجب أن يكون أكبر من التكلفة المتغيرة للوحدة'; break; }
        
        if(n(v.p) && n(v.vc) && !n(v.cm)) { v.cm = r(v.p! - v.vc!); c=true; }
        if(n(v.cm) && n(v.vc) && !n(v.p)) { v.p = r(v.cm! + v.vc!); c=true; }
        if(n(v.p) && n(v.cm) && !n(v.vc)) { v.vc = r(v.p! - v.cm!); c=true; }

        if(n(v.rev) && n(v.t_vc) && v.rev!>0 && !n(v.cmr)) { v.cmr = r(((v.rev! - v.t_vc!)/v.rev!)*100); c=true; }
        
        let q = null;
        if(n(v.rev) && n(v.p) && v.p!>0) q = v.rev! / v.p!;
        
        if(q !== null && n(v.t_vc) && !n(v.vc)) { v.vc = r(v.t_vc! / q); c=true; }
        if(q !== null && n(v.vc) && !n(v.t_vc)) { v.t_vc = r(v.vc! * q); c=true; }

        if(n(v.cm) && n(v.p) && v.p!>0 && !n(v.cmr)) { v.cmr = r((v.cm! / v.p!) * 100); c=true; }
        if(n(v.cmr) && n(v.p) && !n(v.cm)) { v.cm = r(v.p! * (v.cmr!/100)); c=true; }

        if(n(v.fc) && n(v.cm) && !n(v.beq)) { v.beq = Math.ceil(v.fc! / v.cm!); c = true; }
        if(n(v.beq) && n(v.cm) && !n(v.fc)) { v.fc = r(v.beq! * v.cm!); c = true; }
        if(n(v.fc) && n(v.beq) && v.beq! !== 0 && !n(v.cm)) { v.cm = r(v.fc! / v.beq!); c=true; }

        if(n(v.fc) && n(v.cmr) && v.cmr! > 0 && !n(v.bes)) { v.bes = r(v.fc! / (v.cmr!/100)); c=true; }
        if(n(v.bes) && n(v.cmr) && v.cmr! > 0 && !n(v.fc)) { v.fc = r(v.bes! * (v.cmr!/100)); c=true; }

        if(n(v.beq) && n(v.p) && !n(v.bes)) { v.bes = r(v.beq! * v.p!); c = true; }
        if(n(v.bes) && n(v.p) && v.p! !== 0 && !n(v.beq)) { v.beq = r(v.bes! / v.p!); c = true; }
        if(n(v.bes) && n(v.beq) && v.beq! !== 0 && !n(v.p)) { v.p = r(v.bes! / v.beq!); c = true; }
      }
      return v;
    },
    formula: 'كمية التعادل = ت.ثابتة ÷ هامش الوحدة | قيمة التعادل = ت.ثابتة ÷ نسبة الهامش',
    latex: '\\text{كمية التعادل} = \\frac{\\text{التكاليف الثابتة}}{\\text{سعر البيع} - \\text{التكلفة المتغيرة}}',

  },
  {
    id: 'balance', title: 'معادلة الميزانية', icon: '🏦', color: '#8AFF92',
    desc: 'توازن الأصول مع الخصوم وحقوق الملكية',
    fields:[
      {k:'a', l:'إجمالي الأصول',        u:'ج.م'},
      {k:'l', l:'إجمالي الخصوم',        u:'ج.م'},
      {k:'e', l:'حقوق الملكية',         u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.a) && n(v.l) && !n(v.e)) { v.e = r(v.a! - v.l!); c=true; }
        if(n(v.a) && n(v.e) && !n(v.l)) { v.l = r(v.a! - v.e!); c=true; }
        if(n(v.l) && n(v.e) && !n(v.a)) { v.a = r(v.l! + v.e!); c=true; }
      }
      return v;
    },
    formula: 'الأصول = الخصوم + حقوق الملكية',
    latex: '\\text{الأصول} = \\text{الخصوم} + \\text{حقوق الملكية}'
  },
  {
    id: 'roi', title: 'العائد على الاستثمار', icon: '📈', color: '#AEFFED',
    desc: 'معدل العائد لاستثمارات الأصول التشغيلية',
    fields:[
      {k:'ni',   l:'الدخل التشغيلي',   u:'ج.م'},
      {k:'assets', l:'متوسط الأصول',  u:'ج.م'},
      {k:'roi',  l:'معدل العائد (ROI)', u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.assets) && v.assets === 0) { v._error = 'متوسط الأصول لا يمكن أن يكون صفراً'; break; }
        if(n(v.ni) && n(v.assets) && v.assets!==0 && !n(v.roi)) { v.roi = r((v.ni!/v.assets!)*100); c=true; }
        if(n(v.roi) && n(v.assets) && !n(v.ni)) { v.ni = r((v.roi!/100)*v.assets!); c=true; }
        if(n(v.roi) && n(v.ni) && v.roi!==0 && !n(v.assets)) { v.assets = r(v.ni! / (v.roi!/100)); c=true; }
      }
      return v;
    },
    formula: 'ROI = (الدخل التشغيلي ÷ متوسط الأصول) × 100',
    latex: '\\text{ROI} = \\left( \\frac{\\text{الدخل التشغيلي}}{\\text{متوسط الأصول}} \\right) \\times 100'
  },
  {
    id: 'mixed_cost', title: 'التكاليف المختلطة', icon: '📉', color: '#FFD1DC',
    desc: 'طريقة الحدين لفصل التكاليف المختلطة + التنبؤ',
    fields:[
      {k:'hc', l:'تكلفة أعلى نشاط', u:'ج.م'},
      {k:'lc', l:'تكلفة أدنى نشاط', u:'ج.م'},
      {k:'ha', l:'أعلى نشاط', u:'وحدة'},
      {k:'la', l:'أدنى نشاط', u:'وحدة'},
      {k:'vc', l:'التكلفة المتغيرة (ب)', u:'ج.م/و'},
      {k:'fc', l:'التكلفة الثابتة (أ)', u:'ج.م'},
      {k:'x',  l:'حجم النشاط المتوقع (س)', u:'وحدة'},
      {k:'y',  l:'التكلفة المتوقعة (ص)', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.hc) && n(v.lc) && n(v.ha) && n(v.la)) {
          if((v.ha! - v.la!) === 0) {
              v._error = 'أعلى نشاط يجب أن يختلف عن أدنى نشاط لتجنب القسمة على صفر'; break;
          } else if(!n(v.vc)) {
              v.vc = r((v.hc! - v.lc!) / (v.ha! - v.la!)); c=true;
          }
          if(n(v.vc) && !n(v.fc)) { v.fc = r(v.hc! - (v.vc! * v.ha!)); c=true; }
        }
        
        if (n(v.vc) && v.vc! < 0) {
            v._error = 'التكلفة المتغيرة سالبة، تأكد من أن تكلفة أعلى نشاط أكبر من أدنى نشاط والعكس صحيح للكميات'; break;
        }

        // Y = a + b*X
        if(n(v.fc) && n(v.vc) && n(v.x) && !n(v.y)) { v.y = r(v.fc! + v.vc! * v.x!); c=true; }
        if(n(v.y) && n(v.fc) && n(v.vc) && v.vc! !== 0 && !n(v.x)) { v.x = r((v.y! - v.fc!) / v.vc!); c=true; }
        if(n(v.y) && n(v.x) && n(v.fc) && v.x!==0 && !n(v.vc)) { v.vc = r((v.y! - v.fc!) / v.x!); c=true; }
        if(n(v.y) && n(v.x) && n(v.vc) && !n(v.fc)) { v.fc = r(v.y! - (v.vc! * v.x!)); c=true; }
      }
      return v;
    },
    formula: 'ب = فرق التكلفة ÷ فرق النشاط | ص = أ + ب×س',
    latex: '\\text{ص} = \\text{أ} + \\text{ب} \\times \\text{س}'
  },
  {
    id: 'target_sales', title: 'المبيعات المستهدفة', icon: '🎯', color: '#BDECB6',
    desc: 'الوصول لهدف ربحي محدد (قبل أو بعد الضريبة)',
    fields:[
      {k:'fc',      l:'التكاليف الثابتة',     u:'ج.م', helper: { type: 'dynamic_sum', title: 'جمع الثابتة' }},
      {k:'tax',     l:'نسبة الضريبة',        u:'%'},
      {k:'cm',      l:'هامش مساهمة الوحدة',   u:'ج.م'},
      {k:'cmr',     l:'نسبة هامش المساهمة',   u:'%'},
      {k:'tp_pre',  l:'الربح المستهدف (قبل ض)', u:'ج.م'},
      {k:'tp_post', l:'الربح المستهدف (بعد ض)', u:'ج.م'},
      {k:'price',   l:'سعر البيع',           u:'ج.م'},
      {k:'qty',     l:'المبيعات المطلوبة (كمية)', u:'وحدة'},
      {k:'val',     l:'المبيعات المستهدفة (قيمة)',u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        
        if (n(v.tax) && v.tax === 100) { v._error = 'نسبة الضريبة لا يمكن أن تكون 100% لتجنب القسمة على صفر'; break; }
        
        if(n(v.tp_post) && n(v.tax) && !n(v.tp_pre)) { v.tp_pre = r(v.tp_post! / (1 - (v.tax! / 100))); c = true; }
        if(n(v.tp_pre) && n(v.tax) && !n(v.tp_post)) { v.tp_post = r(v.tp_pre! * (1 - (v.tax! / 100))); c = true; }

        let req_cm = null;
        if (n(v.fc) && n(v.tp_pre)) req_cm = v.fc! + v.tp_pre!;

        if(req_cm !== null && n(v.cm) && v.cm! > 0 && !n(v.qty)) { v.qty = Math.ceil(req_cm / v.cm!); c = true; }
        if(n(v.qty) && n(v.cm) && !n(v.tp_pre) && n(v.fc)) { v.tp_pre = r((v.qty! * v.cm!) - v.fc!); c = true; }
        if(n(v.qty) && n(v.cm) && !n(v.fc) && n(v.tp_pre)) { v.fc = r((v.qty! * v.cm!) - v.tp_pre!); c = true; }
        if(req_cm !== null && n(v.qty) && v.qty! > 0 && !n(v.cm)) { v.cm = r(req_cm / v.qty!); c=true; }

        if(req_cm !== null && n(v.cmr) && v.cmr! > 0 && !n(v.val)) { v.val = r(req_cm / (v.cmr!/100)); c=true; }
        if(n(v.val) && n(v.cmr) && !n(v.tp_pre) && n(v.fc)) { v.tp_pre = r(v.val! * (v.cmr!/100) - v.fc!); c = true; }
        if(n(v.val) && n(v.cmr) && !n(v.fc) && n(v.tp_pre)) { v.fc = r(v.val! * (v.cmr!/100) - v.tp_pre!); c=true; }
        if(req_cm !== null && n(v.val) && v.val! > 0 && !n(v.cmr)) { v.cmr = r((req_cm / v.val!) * 100); c=true; }

        if (n(v.qty) && n(v.price) && !n(v.val)) { v.val = r(v.qty! * v.price!); c = true; }
        if (n(v.val) && n(v.price) && v.price! > 0 && !n(v.qty)) { v.qty = r(v.val! / v.price!); c = true; }
        if (n(v.val) && n(v.qty) && v.qty! > 0 && !n(v.price)) { v.price = r(v.val! / v.qty!); c = true; }
        
        if (n(v.cm) && n(v.price) && v.price! > 0 && !n(v.cmr)) { v.cmr = r((v.cm! / v.price!) * 100); c=true; }
        if (n(v.cmr) && n(v.price) && !n(v.cm)) { v.cm = r(v.price! * (v.cmr!/100)); c=true; }
      }

      if (n(v.cm) && v.cm! <= 0) v._error = 'هامش المساهمة يجب أن يكون أكبر من الصفر';
      if (n(v.cmr) && v.cmr! <= 0) v._error = 'نسبة المساهمة يجب أن تكون موجبة';
      return v;
    },
    formula: 'المبيعات المستهدفة = (ثابتة + ربح قبل ض) / هامش | ربح قبل = بعد / (1-ض)',
    latex: '\\text{كمية المبيعات} = \\frac{\\text{التكاليف الثابتة} + \\text{الربح المستهدف قبل الضريبة}}{\\text{هامش المساهمة للوحدة}}',

  },
  {
    id: 'mos', title: 'هامش الأمان', icon: '🛡️', color: '#FFDFBA',
    desc: 'قياس أمان المبيعات فوق نقطة التعادل',
    fields:[
      {k:'es',  l:'المبيعات المتوقعة', u:'ج.م/وحدة'},
      {k:'bs',  l:'مبيعات التعادل',    u:'ج.م/وحدة'},
      {k:'mosv', l:'قيمة هامش الأمان',     u:'ج.م/وحدة'},
      {k:'mosr', l:'نسبة هامش الأمان',     u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        // MOS V = ES - BS
        if(n(v.es) && n(v.bs) && !n(v.mosv)) { v.mosv = r(v.es! - v.bs!); c=true; }
        // ES = MOS V + BS
        if(n(v.mosv) && n(v.bs) && !n(v.es)) { v.es = r(v.mosv! + v.bs!); c=true; }
        // BS = ES - MOS V
        if(n(v.es) && n(v.mosv) && !n(v.bs)) { v.bs = r(v.es! - v.mosv!); c=true; }

        // MOS R = (MOS V / ES) * 100
        if(n(v.mosv) && n(v.es) && v.es! > 0 && !n(v.mosr)) { v.mosr = r((v.mosv! / v.es!) * 100); c=true; }
        
        // MOS V = (MOS R / 100) * ES
        if(n(v.mosr) && n(v.es) && !n(v.mosv)) { v.mosv = r((v.mosr! / 100) * v.es!); c=true; }
        
        // ES = MOS V / (MOS R / 100)
        if(n(v.mosv) && n(v.mosr) && v.mosr! > 0 && !n(v.es)) { v.es = r(v.mosv! / (v.mosr! / 100)); c=true; }

        // Shortcut: BS = ES * (1 - MOS R%) => ES = BS / (1 - MOS R%)
        if(n(v.mosr)) {
           const remainder = 1 - (v.mosr!/100);
           if (n(v.es) && !n(v.bs)) { v.bs = r(v.es! * remainder); c = true; }
           if (n(v.bs) && remainder !== 0 && !n(v.es)) { v.es = r(v.bs! / remainder); c = true; }
        }
      }
      return v;
    },
    formula: 'هامش الأمان = مبيعات متوقعة − مبيعات التعادل | النسبة = (الهامش ÷ المبيعات) × 100',
    latex: '\\text{نسبة هامش الأمان} = \\left( \\frac{\\text{المبيعات المتوقعة} - \\text{مبيعات التعادل}}{\\text{المبيعات المتوقعة}} \\right) \\times 100'
  },
  {
    id: 'op_leverage', title: 'الرافعة التشغيلية', icon: '⚙️', color: '#CFFBFF',
    desc: 'مضاعف الأرباح عند زيادة المبيعات',
    fields:[
      {k:'cm',  l:'إجمالي هامش المساهمة', u:'ج.م'},
      {k:'oni', l:'صافي الربح التشغيلي',  u:'ج.م'},
      {k:'dol', l:'درجة الرافعة التشغيلية', u:'مرة'},
      {k:'sales_chg', l:'نسبة الزيادة في المبيعات', u:'%'},
      {k:'income_chg', l:'نسبة الزيادة في الدخل', u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.cm) && n(v.oni) && v.oni!==0 && !n(v.dol)) { v.dol = r(v.cm! / v.oni!); c=true; }
        if(n(v.dol) && n(v.oni) && !n(v.cm)) { v.cm = r(v.dol! * v.oni!); c=true; }
        if(n(v.cm) && n(v.dol) && v.dol!==0 && !n(v.oni)) { v.oni = r(v.cm! / v.dol!); c=true; }
        // income_chg = DOL * sales_chg
        if(n(v.dol) && n(v.sales_chg) && !n(v.income_chg)) { v.income_chg = r(v.dol! * v.sales_chg!); c=true; }
        if(n(v.income_chg) && n(v.dol) && v.dol!==0 && !n(v.sales_chg)) { v.sales_chg = r(v.income_chg! / v.dol!); c=true; }
        if(n(v.income_chg) && n(v.sales_chg) && v.sales_chg!==0 && !n(v.dol)) { v.dol = r(v.income_chg! / v.sales_chg!); c=true; }
      }
      return v;
    },
    formula: 'DOL = هامش المساهمة ÷ صافي الربح | %زيادة الدخل = DOL × %زيادة المبيعات',
    latex: '\\text{نسبة زيادة الدخل} = \\text{DOL} \\times \\text{نسبة زيادة المبيعات}'
  },
  {
    id: 'prod_budget', title: 'موازنة الإنتاج', icon: '📦', color: '#E2F0CB',
    desc: 'احتساب كميات الإنتاج المطلوبة',
    fields:[
      {k:'es',  l:'المبيعات المتوقعة', u:'وحدة'},
      {k:'end_inv', l:'مخزون آخر المدة (+)', u:'وحدة'},
      {k:'start_inv', l:'مخزون أول المدة (-)', u:'وحدة'},
      {k:'prod', l:'الإنتاج المطلوب', u:'وحدة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.es) && n(v.end_inv) && n(v.start_inv) && !n(v.prod)) { v.prod = r(v.es! + v.end_inv! - v.start_inv!); c=true; }
        if(n(v.prod) && n(v.end_inv) && n(v.start_inv) && !n(v.es)) { v.es = r(v.prod! - v.end_inv! + v.start_inv!); c=true; }
        if(n(v.prod) && n(v.es) && n(v.start_inv) && !n(v.end_inv)) { v.end_inv = r(v.prod! - v.es! + v.start_inv!); c=true; }
        if(n(v.prod) && n(v.es) && n(v.end_inv) && !n(v.start_inv)) { v.start_inv = r(v.es! + v.end_inv! - v.prod!); c=true; }
      }
      return v;
    },
    formula: 'الإنتاج المطلوبة = المبيعات المتوقعة + مساهمة آخر المدة − أولاً المدة',
    latex: '\\text{ت.الإنتاج} = \\text{المبيعات} + \\text{مخزون آخر} - \\text{مخزون أول}'
  },
  {
    id: 'mat_budget', title: 'موازنة المواد', icon: '🛒', color: '#FFB7B2',
    desc: 'احتساب مشتريات المواد المباشرة',
    fields:[
      {k:'prod',  l:'الإنتاج المطلوب', u:'وحدة'},
      {k:'m_pu',  l:'المواد للوحدة', u:'كمية'},
      {k:'t_mat', l:'إجمالي احتياجات الإنتاج', u:'كمية'},
      {k:'end_inv', l:'مخزون مواد آخر (+)', u:'كمية'},
      {k:'start_inv', l:'مخزون مواد أول (-)', u:'كمية'},
      {k:'purch', l:'المشتريات المطلوبة', u:'كمية'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.prod) && n(v.m_pu) && !n(v.t_mat)) { v.t_mat = r(v.prod! * v.m_pu!); c=true; }
        if(n(v.t_mat) && n(v.m_pu) && v.m_pu!==0 && !n(v.prod)) { v.prod = r(v.t_mat! / v.m_pu!); c=true; }
        if(n(v.t_mat) && n(v.prod) && v.prod!==0 && !n(v.m_pu)) { v.m_pu = r(v.t_mat! / v.prod!); c=true; }

        if(n(v.t_mat) && n(v.end_inv) && n(v.start_inv) && !n(v.purch)) { v.purch = r(v.t_mat! + v.end_inv! - v.start_inv!); c=true; }
        if(n(v.purch) && n(v.end_inv) && n(v.start_inv) && !n(v.t_mat)) { v.t_mat = r(v.purch! - v.end_inv! + v.start_inv!); c=true; }
        if(n(v.purch) && n(v.t_mat) && n(v.start_inv) && !n(v.end_inv)) { v.end_inv = r(v.purch! - v.t_mat! + v.start_inv!); c=true; }
        if(n(v.purch) && n(v.t_mat) && n(v.end_inv) && !n(v.start_inv)) { v.start_inv = r(v.t_mat! + v.end_inv! - v.purch!); c=true; }
      }
      return v;
    },
    formula: 'المشتريات = (الإنتاج × مواد للوحدة) + مخزون آخر − مخزون أول',
    latex: '\\text{المشتريات} = \\text{الاحتياجات الكلية} + \\text{مخزون آخر} - \\text{مخزون أول}'
  },
  {
    id: 'make_buy', title: 'الصنع أم الشراء', icon: '🏭', color: '#D4A5A5',
    desc: 'مقارنة تكاليف التصنيع الداخلي مع الموارد الخارجية',
    fields:[
      {k:'vmfg',  l:'التكلفة المتغيرة للصنع', u:'ج.م'},
      {k:'fmfg',  l:'تكاليف ثابتة يمكن تجنبها', u:'ج.م'},
      {k:'make_cost', l:'إجمالي تكلفة الصنع', u:'ج.م'},
      {k:'buy_p', l:'سعر الشراء من الخارج', u:'ج.م'},
      {k:'buy_e', l:'مصروفات الشراء الإضافية', u:'ج.م'},
      {k:'buy_cost', l:'إجمالي تكلفة الشراء', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.vmfg) && v.vmfg! < 0) { v._error = 'التكلفة المتغيرة للصنع لا يمكن أن تكون سالبة'; break; }
        if(n(v.fmfg) && v.fmfg! < 0) { v._error = 'التكاليف الثابتة لا يمكن أن تكون سالبة'; break; }
        if(n(v.buy_p) && v.buy_p! < 0) { v._error = 'سعر الشراء لا يمكن أن يكون سالباً'; break; }
        if(n(v.vmfg) && n(v.fmfg) && !n(v.make_cost)) { v.make_cost = r(v.vmfg! + v.fmfg!); c=true; }
        if(n(v.make_cost) && n(v.fmfg) && !n(v.vmfg)) { v.vmfg = r(v.make_cost! - v.fmfg!); c=true; }
        if(n(v.make_cost) && n(v.vmfg) && !n(v.fmfg)) { v.fmfg = r(v.make_cost! - v.vmfg!); c=true; }

        if(n(v.buy_p) && n(v.buy_e) && !n(v.buy_cost)) { v.buy_cost = r(v.buy_p! + v.buy_e!); c=true; }
        if(n(v.buy_cost) && n(v.buy_e) && !n(v.buy_p)) { v.buy_p = r(v.buy_cost! - v.buy_e!); c=true; }
        if(n(v.buy_cost) && n(v.buy_p) && !n(v.buy_e)) { v.buy_e = r(v.buy_cost! - v.buy_p!); c=true; }
      }
      if(n(v.make_cost) && n(v.buy_cost)) {
        if(v.make_cost! < v.buy_cost!) v._decision = '🏭 الصنع أفضل — وفر ' + r(v.buy_cost! - v.make_cost!) + ' ج.م';
        else if(v.buy_cost! < v.make_cost!) v._decision = '🛒 الشراء أفضل — وفر ' + r(v.make_cost! - v.buy_cost!) + ' ج.م';
        else v._decision = '⚖️ التكلفتان متساويتان';
      }
      return v;
    },
    formula: 'يُقارن إجمالي التكلفة التفاضلية للصنع بالشراء الخارجي للمفاضلة للقرار الأمثل',
    latex: '\\min(\\text{تكلفة الشراء التفاضلية}, \\text{تكلفة الصنع التفاضلية})'
  },
  {
    id: 'drop_keep', title: 'قرار الاستبعاد', icon: '✂️', color: '#97C1A9',
    desc: 'مفاضلة الاستمرار بنشاط أو استبعاده',
    fields:[
      {k:'rev_lost',  l:'الإيرادات المفقودة', u:'ج.م'},
      {k:'avoid_c',  l:'التكاليف التي يمكن تجنبها', u:'ج.م'},
      {k:'net', l:'التأثير على صافي الربح', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rev_lost) && v.rev_lost! < 0) { v._error = 'الإيرادات المفقودة لا يمكن أن تكون سالبة'; break; }
        if(n(v.avoid_c) && v.avoid_c! < 0) { v._error = 'التكاليف المتجنبة لا يمكن أن تكون سالبة'; break; }
        if(n(v.avoid_c) && n(v.rev_lost) && !n(v.net)) { v.net = r(v.avoid_c! - v.rev_lost!); c=true; }
        if(n(v.net) && n(v.rev_lost) && !n(v.avoid_c)) { v.avoid_c = r(v.net! + v.rev_lost!); c=true; }
        if(n(v.net) && n(v.avoid_c) && !n(v.rev_lost)) { v.rev_lost = r(v.avoid_c! - v.net!); c=true; }
      }
      if(n(v.net)) {
        if(v.net! > 0) v._decision = '✂️ الاستبعاد أفضل — زيادة في الربح ' + v.net! + ' ج.م';
        else if(v.net! < 0) v._decision = '✅ الاستمرار أفضل — الاستبعاد يخسر ' + Math.abs(v.net!) + ' ج.م';
        else v._decision = '⚖️ لا فرق — نقطة التعادل';
      }
      return v;
    },
    formula: 'التأثير = التكاليف التى تجنبها (الوفر) − الإيرادات المفقودة (إذا كان الموجب فهو مكسب من الاستبعاد)',
    latex: '\\text{التأثير = التكاليف المتجنبة - الإيرادات المفقودة}'
  },
  {
    id: 'sales_budget', title: 'موازنة المبيعات', icon: '🏷️', color: '#B5EAD7',
    desc: 'قيمة المبيعات التقديرية',
    fields:[
      {k:'est_qty',  l:'كمية المبيعات التقديرية', u:'وحدة'},
      {k:'est_price',  l:'سعر البيع التقديري', u:'ج.م'},
      {k:'est_sales', l:'قيمة المبيعات التقديرية', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.est_qty) && n(v.est_price) && !n(v.est_sales)) { v.est_sales = r(v.est_qty! * v.est_price!); c=true; }
        if(n(v.est_sales) && n(v.est_price) && v.est_price!==0 && !n(v.est_qty)) { v.est_qty = r(v.est_sales! / v.est_price!); c=true; }
        if(n(v.est_sales) && n(v.est_qty) && v.est_qty!==0 && !n(v.est_price)) { v.est_price = r(v.est_sales! / v.est_qty!); c=true; }
      }
      return v;
    },
    formula: 'قيمة المبيعات التقديرية = كمية المبيعات التقديرية × سعر البيع التقديري',
    latex: '\\text{قيمة المبيعات التقديرية} = \\text{كمية المبيعات التقديرية} \\times \\text{سعر البيع التقديري}'
  },
  {
    id: 'liquidity', title: 'نسب السيولة', icon: '💳', color: '#DABFFF',
    desc: 'النسبة الجارية للقدرة على السداد',
    fields:[
      {k:'ca',  l:'أصول متداولة',    u:'ج.م'},
      {k:'cl',  l:'خصوم متداولة',   u:'ج.م'},
      {k:'cr',  l:'النسبة الجارية',  u:':1'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.cl) && v.cl === 0) { v._error = 'الخصوم المتداولة لا يمكن أن تكون صفراً (خطأ القسمة)'; break; }
        
        if(n(v.ca)&&n(v.cl)&&v.cl!==0&&!n(v.cr)) { v.cr = r(v.ca!/v.cl!); c=true; }
        if(n(v.cr)&&n(v.cl)&&!n(v.ca)) { v.ca = r(v.cr! * v.cl!); c=true; }
        if(n(v.ca)&&n(v.cr)&&v.cr!==0&&!n(v.cl)) { v.cl = r(v.ca! / v.cr!); c=true; }
      }
      return v;
    },
    formula: 'النسبة الجارية = أصول متداولة ÷ خصوم متداولة',
    latex: '\\text{النسبة الجارية} = \\frac{\\text{أصول متداولة}}{\\text{خصوم متداولة}}'
  },
  {
    id: 'cogs', title: 'تكلفة البضاعة', icon: '📦', color: '#CFFBFF',
    desc: 'حساب COGS بالتفصيل',
    fields:[
      {k:'oi',  l:'مخزون أول',         u:'ج.م'},
      {k:'pur', l:'المشتريات',         u:'ج.م'},
      {k:'ci',  l:'مخزون آخر',         u:'ج.م'},
      {k:'cog', l:'تكلفة المباع',     u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.oi) && n(v.pur) && n(v.ci) && !n(v.cog)) { v.cog = r(v.oi! + v.pur! - v.ci!); c=true; }
        if(n(v.cog) && n(v.pur) && n(v.ci) && !n(v.oi)) { v.oi = r(v.cog! - v.pur! + v.ci!); c=true; }
        if(n(v.cog) && n(v.oi) && n(v.ci) && !n(v.pur)) { v.pur = r(v.cog! - v.oi! + v.ci!); c=true; }
        if(n(v.oi) && n(v.pur) && n(v.cog) && !n(v.ci)) { v.ci = r(v.oi! + v.pur! - v.cog!); c=true; }
      }
      return v;
    },
    formula: 'COGS = (أول المدة + المشتريات) − آخر المدة',
    latex: '\\text{COGS} = \\text{مخزون أول} + \\text{المشتريات} - \\text{مخزون آخر}'
  },
  {
    id: 'total_vc', title: 'تجميع التكاليف', icon: '📎', color: '#FFF2CC',
    desc: 'تجميع سريع لعدة بنود للحصول على رقم إجمالي',
    fields:[
      {k:'vc', l:'الإجمالي המجمع', u:'ج.م', helper: { type: 'dynamic_sum', title: 'مساعد تجميع عناصر التكاليف' }},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => v,
    formula: 'مجموع البنود (يستخدم المساعد)',
  },
  {
    id: 'vc_pu', title: 'تكلفة الوحدة', icon: '🔋', color: '#E1D5E7',
    desc: 'حساب التكلفة المتغيرة للوحدة الواحدة',
    fields:[
      {k:'vc', l:'إجمالي التكلفة المتغيرة', u:'ج.م'},
      {k:'qty', l:'حجم الإنتاج', u:'وحدة'},
      {k:'vc_pu', l:'التكلفة المتغيرة للوحدة', u:'ج.م/وحدة', helper: {
         type: 'formula', title: 'حساب من البنود المباشرة',
         fields: [{k:'m_pu', l:'مواد للوحدة', u:'ج.م'}, {k:'l_pu', l:'أجور للوحدة', u:'ج.م'}, {k:'voh_pu', l:'أ. إضافية للوحدة', u:'ج.م'}],
         solver: (s: Record<string, number | null>) => r((s.m_pu||0) + (s.l_pu||0) + (s.voh_pu||0))
      }},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
        delete v._error;
        let c=true, i=0;
        while(c && i<10){
            c=false; i++;
            if(n(v.vc) && n(v.qty) && v.qty! > 0 && !n(v.vc_pu)) { v.vc_pu = r(v.vc! / v.qty!); c=true; }
            if(n(v.vc_pu) && n(v.qty) && !n(v.vc)) { v.vc = r(v.vc_pu! * v.qty!); c=true; }
            if(n(v.vc) && n(v.vc_pu) && v.vc_pu! > 0 && !n(v.qty)) { v.qty = Math.ceil(v.vc! / v.vc_pu!); c=true; }
        }
        return v;
    },
    formula: 'تكلفة الوحدة = الإجمالي ÷ عدد الوحدات',
  },
  {
    id: 'depreciation', title: 'الإهلاك (القسط الثابت)', icon: '🏗️', color: '#C3E8BD',
    desc: 'حساب قسط الإهلاك السنوي والقيمة الدفترية',
    fields:[
      {k:'cost',   l:'تكلفة الأصل',               u:'ج.م'},
      {k:'salvage',l:'القيمة التخريدية (المتبقية)',    u:'ج.م'},
      {k:'life',   l:'العمر الإنتاجي',            u:'سنة'},
      {k:'dep',    l:'قسط الإهلاك السنوي',        u:'ج.م'},
      {k:'years',  l:'عدد السنوات المنقضية',      u:'سنة'},
      {k:'acc_dep',l:'مجمع الإهلاك',              u:'ج.م'},
      {k:'bv',     l:'القيمة الدفترية (الصافية)',    u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.life) && v.life! <= 0) { v._error = 'العمر الإنتاجي يجب أن يكون موجباً التيمة'; break; }
        if(n(v.cost) && v.cost! < 0) { v._error = 'التكلفة يجب أن تكون قيمة موجبة'; break; }
        // dep = (cost - salvage) / life
        if(n(v.cost) && n(v.salvage) && n(v.life) && v.life! > 0 && !n(v.dep)) { v.dep = r((v.cost! - v.salvage!) / v.life!); c=true; }
        // cost = dep * life + salvage
        if(n(v.dep) && n(v.life) && n(v.salvage) && !n(v.cost)) { v.cost = r(v.dep! * v.life! + v.salvage!); c=true; }
        // salvage = cost - dep * life
        if(n(v.cost) && n(v.dep) && n(v.life) && !n(v.salvage)) { v.salvage = r(v.cost! - v.dep! * v.life!); c=true; }
        // life = (cost - salvage) / dep
        if(n(v.cost) && n(v.salvage) && n(v.dep) && v.dep! > 0 && !n(v.life)) { v.life = r((v.cost! - v.salvage!) / v.dep!); c=true; }

        // acc_dep = dep * years
        if(n(v.dep) && n(v.years) && !n(v.acc_dep)) { v.acc_dep = r(v.dep! * v.years!); c=true; }
        if(n(v.acc_dep) && n(v.years) && v.years! > 0 && !n(v.dep)) { v.dep = r(v.acc_dep! / v.years!); c=true; }
        if(n(v.acc_dep) && n(v.dep) && v.dep! > 0 && !n(v.years)) { v.years = r(v.acc_dep! / v.dep!); c=true; }

        // bv = cost - acc_dep
        if(n(v.cost) && n(v.acc_dep) && !n(v.bv)) { v.bv = r(v.cost! - v.acc_dep!); c=true; }
        if(n(v.cost) && n(v.bv) && !n(v.acc_dep)) { v.acc_dep = r(v.cost! - v.bv!); c=true; }
        if(n(v.bv) && n(v.acc_dep) && !n(v.cost)) { v.cost = r(v.bv! + v.acc_dep!); c=true; }
      }
      
      if(n(v.life) && v.life! <= 0) v._error = 'العمر الإنتاجي يجب أن يكون أكبر من الصفر'; 
      else if(n(v.cost) && n(v.salvage) && v.salvage! > v.cost!) v._error = 'القيمة التخريدية لا يمكن أن تتجاوز تكلفة الأصل';
      else if(n(v.years) && n(v.life) && v.years! > v.life!) v._error = 'عدد السنوات المنقضية لا يمكن أن يتجاوز العمر الإنتاجي';
      
      return v;
    },
    formula: 'قسط الإهلاك = (التكلفة − القيمة التخريدية) ÷ العمر | القيمة الدفترية = التكلفة − مجمع الإهلاك',
    latex: '\\text{قسط الإهلاك} = \\frac{\\text{التكلفة} - \\text{القيمة التخريدية}}{\\text{العمر الإنتاجي}}'
  },
  {
    id: 'special_order', title: 'الطلبية الخاصة', icon: '📋', color: '#FFE4B5',
    desc: 'قرار قبول أو رفض طلبية خاصة',
    fields:[
      {k:'qty',    l:'كمية الطلبية',           u:'وحدة'},
      {k:'sp',     l:'سعر البيع الخاص',        u:'ج.م'},
      {k:'order_rev', l:'إيرادات الطلبية',      u:'ج.م'},
      {k:'vc_pu',  l:'ت. متغيرة للوحدة',       u:'ج.م'},
      {k:'extra_fc',l:'تكاليف ثابتة إضافية',    u:'ج.م'},
      {k:'order_cost',l:'تكلفة الطلبية التفاضلية',u:'ج.م'},
      {k:'net',    l:'صافي الأثر (ربح/خسارة)',  u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.qty) && n(v.sp) && !n(v.order_rev)) { v.order_rev = r(v.qty! * v.sp!); c=true; }
        if(n(v.order_rev) && n(v.sp) && v.sp!==0 && !n(v.qty)) { v.qty = r(v.order_rev! / v.sp!); c=true; }
        if(n(v.order_rev) && n(v.qty) && v.qty!==0 && !n(v.sp)) { v.sp = r(v.order_rev! / v.qty!); c=true; }

        const hc = (typeof v.extra_fc === 'number' ? v.extra_fc : 0);
        if(n(v.qty) && n(v.vc_pu) && !n(v.order_cost)) { v.order_cost = r(v.qty! * v.vc_pu! + hc); c=true; }
        if(n(v.order_cost) && n(v.qty) && v.qty!==0 && !n(v.vc_pu)) { v.vc_pu = r((v.order_cost! - hc)/v.qty!); c=true; }
        
        if(n(v.order_rev) && n(v.order_cost) && !n(v.net)) { v.net = r(v.order_rev! - v.order_cost!); c=true; }
        if(n(v.net) && n(v.order_cost) && !n(v.order_rev)) { v.order_rev = r(v.net! + v.order_cost!); c=true; }
        if(n(v.net) && n(v.order_rev) && !n(v.order_cost)) { v.order_cost = r(v.order_rev! - v.net!); c=true; }
      }
      if(n(v.net)) {
        if(v.net! > 0) v._decision = 'قبول الطلبية (ربح)';
        else if (v.net! < 0) v._decision = 'رفض الطلبية (خسارة)';
        else v._decision = 'نقطة التعادل (لا ربح ولا خسارة)';
      }
      return v;
    },
    formula: 'صافي الأثر = إيرادات الطلبية − تكاليفها التفاضلية | تُقبل إذا صافي > 0',
    latex: '\\text{صافي الأثر} = \\text{إيرادات الطلبية} - \\text{تكاليف تفاضلية}'
  },
  {
    id: 'sell_or_process', title: 'بيع أم تصنيع إضافي', icon: '🔀', color: '#E6E6FA',
    desc: 'قرار البيع عند الانفصال أو التصنيع الإضافي',
    fields:[
      {k:'rev_split',  l:'إيراد البيع عند الانفصال', u:'ج.م'},
      {k:'rev_further',l:'إيراد بعد التصنيع الإضافي',u:'ج.م'},
      {k:'inc_rev',    l:'الزيادة في الإيراد',       u:'ج.م'},
      {k:'add_cost',   l:'تكاليف التصنيع الإضافي',   u:'ج.م'},
      {k:'net',        l:'صافي الأثر',               u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.add_cost) && v.add_cost! < 0) { v._error = 'تكاليف التصنيع الإضافي لا يمكن أن تكون سالبة'; break; }
        if(n(v.rev_further) && n(v.rev_split) && !n(v.inc_rev)) { v.inc_rev = r(v.rev_further! - v.rev_split!); c=true; }
        if(n(v.inc_rev) && n(v.rev_split) && !n(v.rev_further)) { v.rev_further = r(v.inc_rev! + v.rev_split!); c=true; }
        if(n(v.inc_rev) && n(v.rev_further) && !n(v.rev_split)) { v.rev_split = r(v.rev_further! - v.inc_rev!); c=true; }

        if(n(v.inc_rev) && n(v.add_cost) && !n(v.net)) { v.net = r(v.inc_rev! - v.add_cost!); c=true; }
        if(n(v.net) && n(v.add_cost) && !n(v.inc_rev)) { v.inc_rev = r(v.net! + v.add_cost!); c=true; }
        if(n(v.net) && n(v.inc_rev) && !n(v.add_cost)) { v.add_cost = r(v.inc_rev! - v.net!); c=true; }
      }
      if(n(v.net)) {
        if(v.net! > 0) v._decision = '🔀 التصنيع الإضافي أفضل — ربح إضافي ' + v.net! + ' ج.م';
        else if(v.net! < 0) v._decision = '🏷️ البيع عند الانفصال أفضل — خسارة التصنيع ' + Math.abs(v.net!) + ' ج.م';
        else v._decision = '⚖️ لا فرق — نقطة التعادل';
      }
      return v;
    },
    formula: 'صافي الأثر = الزيادة في الإيراد − تكاليف التصنيع الإضافي',
    latex: '\\text{صافي الأثر} = (\\text{إيراد بعد التصنيع} - \\text{إيراد عند الانفصال}) - \\text{تكاليف إضافية}'
  },
  {
    id: 'labor_budget', title: 'موازنة الأجور', icon: '👷', color: '#B0E0E6',
    desc: 'حساب تكلفة العمالة المباشرة',
    fields:[
      {k:'prod',   l:'الوحدات المنتجة',       u:'وحدة'},
      {k:'hrs_pu', l:'ساعات العمل للوحدة',    u:'ساعة'},
      {k:'total_hrs', l:'إجمالي الساعات',      u:'ساعة'},
      {k:'rate',   l:'تكلفة الساعة',           u:'ج.م'},
      {k:'total_cost', l:'إجمالي تكلفة الأجور',u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.prod) && n(v.hrs_pu) && !n(v.total_hrs)) { v.total_hrs = r(v.prod! * v.hrs_pu!); c=true; }
        if(n(v.total_hrs) && n(v.hrs_pu) && v.hrs_pu!>0 && !n(v.prod)) { v.prod = r(v.total_hrs! / v.hrs_pu!); c=true; }
        if(n(v.total_hrs) && n(v.prod) && v.prod!>0 && !n(v.hrs_pu)) { v.hrs_pu = r(v.total_hrs! / v.prod!); c=true; }
        if(n(v.total_hrs) && n(v.rate) && !n(v.total_cost)) { v.total_cost = r(v.total_hrs! * v.rate!); c=true; }
        if(n(v.total_cost) && n(v.rate) && v.rate!>0 && !n(v.total_hrs)) { v.total_hrs = r(v.total_cost! / v.rate!); c=true; }
        if(n(v.total_cost) && n(v.total_hrs) && v.total_hrs!>0 && !n(v.rate)) { v.rate = r(v.total_cost! / v.total_hrs!); c=true; }
      }
      return v;
    },
    formula: 'إجمالي الأجور = الوحدات × ساعات/وحدة × تكلفة الساعة',
    latex: '\\text{إجمالي الأجور} = \\text{الوحدات} \\times \\text{ساعات/وحدة} \\times \\text{تكلفة الساعة}'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 1 — النسب المالية المتقدمة
  // ══════════════════════════════════════════════════════
  {
    id: 'quick_ratio', title: 'النسبة السريعة', icon: '⚡', color: '#E8D5FF',
    desc: 'اختبار السيولة بدون المخزون (Acid-Test Ratio)',
    fields:[
      {k:'ca',  l:'أصول متداولة',   u:'ج.م'},
      {k:'inv', l:'المخزون',         u:'ج.م'},
      {k:'cl',  l:'خصوم متداولة',  u:'ج.م'},
      {k:'qr',  l:'النسبة السريعة', u:':1'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.ca) && v.ca! < 0) { v._error = 'الأصول المتداولة لا يمكن أن تكون سالبة'; break; }
        if(n(v.inv) && v.inv! < 0) { v._error = 'المخزون لا يمكن أن يكون سالباً'; break; }
        if(n(v.cl) && v.cl! <= 0) { v._error = 'الخصوم المتداولة يجب أن تكون أكبر من صفر'; break; }
        if(n(v.ca) && n(v.inv) && v.inv! > v.ca!) { v._error = 'المخزون لا يمكن أن يتجاوز الأصول المتداولة'; break; }
        if(n(v.ca) && n(v.inv) && n(v.cl) && v.cl!>0 && !n(v.qr)) { v.qr = r((v.ca! - v.inv!) / v.cl!); c=true; }
        if(n(v.qr) && n(v.cl) && n(v.inv) && !n(v.ca)) { v.ca = r(v.qr! * v.cl! + v.inv!); c=true; }
        if(n(v.ca) && n(v.qr) && n(v.cl) && !n(v.inv)) { v.inv = r(v.ca! - v.qr! * v.cl!); c=true; }
        if(n(v.ca) && n(v.inv) && n(v.qr) && v.qr!>0 && !n(v.cl)) { v.cl = r((v.ca! - v.inv!) / v.qr!); c=true; }
      }
      if(n(v.qr)) { v._decision = v.qr! >= 1 ? '✅ سيولة جيدة (≥ 1)' : '⚠️ سيولة منخفضة (< 1)'; }
      return v;
    },
    formula: 'النسبة السريعة = (أصول متداولة − المخزون) ÷ خصوم متداولة',
    latex: '\\\\text{QR} = \\\\frac{\\\\text{أصول متداولة} - \\\\text{المخزون}}{\\\\text{خصوم متداولة}}'
  },
  {
    id: 'roe', title: 'العائد على حقوق الملكية', icon: '💎', color: '#FFD6E0',
    desc: 'مقياس ربحية أموال المساهمين (ROE)',
    fields:[
      {k:'ni',  l:'صافي الدخل',       u:'ج.م'},
      {k:'eq',  l:'حقوق الملكية',    u:'ج.م'},
      {k:'roe', l:'العائد ROE',       u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.eq) && v.eq! <= 0) { v._error = 'حقوق الملكية يجب أن تكون موجبة'; break; }
        if(n(v.ni) && n(v.eq) && v.eq!>0 && !n(v.roe)) { v.roe = r((v.ni!/v.eq!)*100); c=true; }
        if(n(v.roe) && n(v.eq) && !n(v.ni)) { v.ni = r((v.roe!/100)*v.eq!); c=true; }
        if(n(v.roe) && n(v.ni) && v.roe!>0 && !n(v.eq)) { v.eq = r(v.ni!/(v.roe!/100)); c=true; }
      }
      if(n(v.roe)) {
        if(v.roe! >= 15) v._decision = '🟢 عائد ممتاز (≥ 15%)';
        else if(v.roe! >= 10) v._decision = '🟡 عائد مقبول (10-15%)';
        else v._decision = '🔴 عائد ضعيف (< 10%)';
      }
      return v;
    },
    formula: 'ROE = (صافي الدخل ÷ حقوق الملكية) × 100',
    latex: '\\\\text{ROE} = \\\\frac{\\\\text{صافي الدخل}}{\\\\text{حقوق الملكية}} \\\\times 100'
  },
  {
    id: 'inventory_turnover', title: 'دوران المخزون', icon: '🔄', color: '#C8E6C9',
    desc: 'كفاءة إدارة المخزون ومتوسط أيام البيع',
    fields:[
      {k:'cogs',    l:'تكلفة البضاعة المباعة', u:'ج.م'},
      {k:'avg_inv', l:'متوسط المخزون',        u:'ج.م'},
      {k:'it',      l:'معدل الدوران',         u:'مرة'},
      {k:'days',    l:'أيام المخزون',          u:'يوم'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.cogs) && v.cogs! < 0) { v._error = 'تكلفة البضاعة لا يمكن أن تكون سالبة'; break; }
        if(n(v.avg_inv) && v.avg_inv! <= 0) { v._error = 'متوسط المخزون يجب أن يكون أكبر من صفر'; break; }
        if(n(v.cogs) && n(v.avg_inv) && v.avg_inv!>0 && !n(v.it)) { v.it = r(v.cogs!/v.avg_inv!); c=true; }
        if(n(v.it) && n(v.avg_inv) && !n(v.cogs)) { v.cogs = r(v.it!*v.avg_inv!); c=true; }
        if(n(v.cogs) && n(v.it) && v.it!>0 && !n(v.avg_inv)) { v.avg_inv = r(v.cogs!/v.it!); c=true; }
        if(n(v.it) && v.it!>0 && !n(v.days)) { v.days = r(365/v.it!); c=true; }
        if(n(v.days) && v.days!>0 && !n(v.it)) { v.it = r(365/v.days!); c=true; }
      }
      if(n(v.it)) {
        if(v.it! >= 8) v._decision = '🟢 دوران سريع (≥ 8)';
        else if(v.it! >= 4) v._decision = '🟡 دوران متوسط (4-8)';
        else v._decision = '🔴 دوران بطيء (< 4) — مخزون راكد';
      }
      return v;
    },
    formula: 'الدوران = COGS ÷ متوسط المخزون | الأيام = 365 ÷ الدوران',
    latex: '\\\\text{دوران المخزون} = \\\\frac{\\\\text{COGS}}{\\\\text{متوسط المخزون}}'
  },
  {
    id: 'receivables_turnover', title: 'دوران المدينين', icon: '📋', color: '#BBDEFB',
    desc: 'كفاءة التحصيل ومتوسط فترة التحصيل',
    fields:[
      {k:'sales',   l:'صافي المبيعات الآجلة', u:'ج.م'},
      {k:'avg_rec', l:'متوسط المدينين',       u:'ج.م'},
      {k:'rt',      l:'معدل دوران المدينين',  u:'مرة'},
      {k:'days',    l:'متوسط فترة التحصيل',   u:'يوم'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.sales) && v.sales! < 0) { v._error = 'المبيعات لا يمكن أن تكون سالبة'; break; }
        if(n(v.avg_rec) && v.avg_rec! <= 0) { v._error = 'متوسط المدينين يجب أن يكون أكبر من صفر'; break; }
        if(n(v.sales) && n(v.avg_rec) && v.avg_rec!>0 && !n(v.rt)) { v.rt = r(v.sales!/v.avg_rec!); c=true; }
        if(n(v.rt) && n(v.avg_rec) && !n(v.sales)) { v.sales = r(v.rt!*v.avg_rec!); c=true; }
        if(n(v.sales) && n(v.rt) && v.rt!>0 && !n(v.avg_rec)) { v.avg_rec = r(v.sales!/v.rt!); c=true; }
        if(n(v.rt) && v.rt!>0 && !n(v.days)) { v.days = r(365/v.rt!); c=true; }
        if(n(v.days) && v.days!>0 && !n(v.rt)) { v.rt = r(365/v.days!); c=true; }
      }
      if(n(v.days)) {
        if(v.days! <= 30) v._decision = '🟢 تحصيل ممتاز (≤ 30 يوم)';
        else if(v.days! <= 60) v._decision = '🟡 تحصيل مقبول (30-60 يوم)';
        else v._decision = '🔴 تحصيل بطيء (> 60 يوم)';
      }
      return v;
    },
    formula: 'الدوران = المبيعات ÷ متوسط المدينين | الأيام = 365 ÷ الدوران',
    latex: '\\\\text{فترة التحصيل} = \\\\frac{365}{\\\\text{دوران المدينين}}'
  },
  {
    id: 'asset_turnover', title: 'دوران الأصول', icon: '🔁', color: '#D1C4E9',
    desc: 'كفاءة استخدام الأصول في توليد المبيعات',
    fields:[
      {k:'sales',      l:'صافي المبيعات',   u:'ج.م'},
      {k:'avg_assets', l:'متوسط الأصول',   u:'ج.م'},
      {k:'at',         l:'معدل دوران الأصول', u:'مرة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.sales) && v.sales! < 0) { v._error = 'المبيعات لا يمكن أن تكون سالبة'; break; }
        if(n(v.avg_assets) && v.avg_assets! <= 0) { v._error = 'متوسط الأصول يجب أن يكون أكبر من صفر'; break; }
        if(n(v.sales) && n(v.avg_assets) && v.avg_assets!>0 && !n(v.at)) { v.at = r(v.sales!/v.avg_assets!); c=true; }
        if(n(v.at) && n(v.avg_assets) && !n(v.sales)) { v.sales = r(v.at!*v.avg_assets!); c=true; }
        if(n(v.sales) && n(v.at) && v.at!>0 && !n(v.avg_assets)) { v.avg_assets = r(v.sales!/v.at!); c=true; }
      }
      return v;
    },
    formula: 'دوران الأصول = صافي المبيعات ÷ متوسط الأصول',
    latex: '\\\\text{دوران الأصول} = \\\\frac{\\\\text{صافي المبيعات}}{\\\\text{متوسط الأصول}}'
  },
  {
    id: 'debt_equity', title: 'نسبة الدين للملكية', icon: '⚠️', color: '#FFCDD2',
    desc: 'مقياس الرافعة المالية والمخاطر',
    fields:[
      {k:'td', l:'إجمالي الديون',     u:'ج.م'},
      {k:'eq', l:'حقوق الملكية',     u:'ج.م'},
      {k:'de', l:'نسبة الدين/الملكية', u:':1'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.td) && v.td! < 0) { v._error = 'الديون لا يمكن أن تكون سالبة'; break; }
        if(n(v.eq) && v.eq! <= 0) { v._error = 'حقوق الملكية يجب أن تكون أكبر من صفر'; break; }
        if(n(v.td) && n(v.eq) && v.eq!>0 && !n(v.de)) { v.de = r(v.td!/v.eq!); c=true; }
        if(n(v.de) && n(v.eq) && !n(v.td)) { v.td = r(v.de!*v.eq!); c=true; }
        if(n(v.td) && n(v.de) && v.de!>0 && !n(v.eq)) { v.eq = r(v.td!/v.de!); c=true; }
      }
      if(n(v.de)) {
        if(v.de! <= 0.5) v._decision = '🟢 رافعة محافظة (≤ 0.5)';
        else if(v.de! <= 1) v._decision = '🟡 رافعة متوسطة (0.5-1)';
        else if(v.de! <= 2) v._decision = '🟠 رافعة عالية (1-2)';
        else v._decision = '🔴 رافعة خطيرة (> 2)';
      }
      return v;
    },
    formula: 'نسبة الدين = إجمالي الديون ÷ حقوق الملكية',
    latex: '\\\\text{D/E} = \\\\frac{\\\\text{إجمالي الديون}}{\\\\text{حقوق الملكية}}'
  },
  {
    id: 'net_margin', title: 'هامش الربح الصافي', icon: '📊', color: '#F0F4C3',
    desc: 'نسبة صافي الربح من كل جنيه مبيعات',
    fields:[
      {k:'ni',  l:'صافي الدخل',     u:'ج.م'},
      {k:'rev', l:'صافي المبيعات', u:'ج.م'},
      {k:'npm', l:'هامش الربح الصافي', u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rev) && v.rev! <= 0) { v._error = 'المبيعات يجب أن تكون أكبر من صفر'; break; }
        if(n(v.ni) && n(v.rev) && v.rev!>0 && !n(v.npm)) { v.npm = r((v.ni!/v.rev!)*100); c=true; }
        if(n(v.npm) && n(v.rev) && !n(v.ni)) { v.ni = r((v.npm!/100)*v.rev!); c=true; }
        if(n(v.npm) && n(v.ni) && v.npm!>0 && !n(v.rev)) { v.rev = r(v.ni!/(v.npm!/100)); c=true; }
      }
      if(n(v.npm)) {
        if(v.npm! >= 20) v._decision = '🟢 هامش ممتاز (≥ 20%)';
        else if(v.npm! >= 10) v._decision = '🟡 هامش جيد (10-20%)';
        else if(v.npm! >= 0) v._decision = '🟠 هامش ضعيف (0-10%)';
        else v._decision = '🔴 خسارة صافية!';
      }
      return v;
    },
    formula: 'هامش الربح الصافي = (صافي الدخل ÷ المبيعات) × 100',
    latex: '\\\\text{NPM} = \\\\frac{\\\\text{صافي الدخل}}{\\\\text{المبيعات}} \\\\times 100'
  },
  {
    id: 'eps', title: 'ربحية السهم', icon: '📈', color: '#FFE0B2',
    desc: 'نصيب السهم الواحد من صافي الأرباح (EPS)',
    fields:[
      {k:'ni',       l:'صافي الدخل',           u:'ج.م'},
      {k:'pref_div', l:'توزيعات أسهم ممتازة', u:'ج.م'},
      {k:'shares',   l:'عدد الأسهم العادية',   u:'سهم'},
      {k:'eps',      l:'ربحية السهم (EPS)',     u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(!n(v.pref_div)) v.pref_div = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.shares) && v.shares! <= 0) { v._error = 'عدد الأسهم يجب أن يكون أكبر من صفر'; break; }
        if(n(v.pref_div) && v.pref_div! < 0) { v._error = 'توزيعات الأسهم الممتازة لا يمكن أن تكون سالبة'; break; }
        if(n(v.ni) && n(v.shares) && v.shares!>0 && !n(v.eps)) { v.eps = r((v.ni! - (v.pref_div||0)) / v.shares!); c=true; }
        if(n(v.eps) && n(v.shares) && !n(v.ni)) { v.ni = r(v.eps! * v.shares! + (v.pref_div||0)); c=true; }
        if(n(v.ni) && n(v.eps) && v.eps!>0 && !n(v.shares)) { v.shares = r((v.ni! - (v.pref_div||0)) / v.eps!); c=true; }
      }
      return v;
    },
    formula: 'EPS = (صافي الدخل − توزيعات ممتازة) ÷ عدد الأسهم العادية',
    latex: '\\\\text{EPS} = \\\\frac{\\\\text{صافي الدخل} - \\\\text{توزيعات ممتازة}}{\\\\text{عدد الأسهم}}'
  },
  {
    id: 'working_capital', title: 'رأس المال العامل', icon: '🏧', color: '#B2EBF2',
    desc: 'الفرق بين الأصول والخصوم المتداولة',
    fields:[
      {k:'ca', l:'أصول متداولة',      u:'ج.م'},
      {k:'cl', l:'خصوم متداولة',     u:'ج.م'},
      {k:'wc', l:'رأس المال العامل', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.ca) && v.ca! < 0) { v._error = 'الأصول المتداولة لا يمكن أن تكون سالبة'; break; }
        if(n(v.cl) && v.cl! < 0) { v._error = 'الخصوم المتداولة لا يمكن أن تكون سالبة'; break; }
        if(n(v.ca) && n(v.cl) && !n(v.wc)) { v.wc = r(v.ca! - v.cl!); c=true; }
        if(n(v.wc) && n(v.cl) && !n(v.ca)) { v.ca = r(v.wc! + v.cl!); c=true; }
        if(n(v.ca) && n(v.wc) && !n(v.cl)) { v.cl = r(v.ca! - v.wc!); c=true; }
      }
      if(n(v.wc)) {
        if(v.wc! > 0) v._decision = '✅ رأس مال عامل موجب — قدرة على السداد';
        else if(v.wc! === 0) v._decision = '🟡 رأس مال عامل صفري — حد التعادل';
        else v._decision = '🔴 رأس مال عامل سالب — خطر عجز السيولة!';
      }
      return v;
    },
    formula: 'رأس المال العامل = أصول متداولة − خصوم متداولة',
    latex: '\\\\text{رأس المال العامل} = \\\\text{أصول متداولة} - \\\\text{خصوم متداولة}'
  },
  // ══════════════════════════════════════════════════════
  //  القوائم المالية الأساسية
  // ══════════════════════════════════════════════════════
  {
    id: 'cash_flow', title: 'قائمة التدفقات النقدية', icon: '💸', color: '#A5D6A7',
    desc: 'ملخص التدفقات التشغيلية والاستثمارية والتمويلية',
    fields:[
      {k:'oper',  l:'صافي التدفق التشغيلي',    u:'ج.م'},
      {k:'invest',l:'صافي التدفق الاستثماري',  u:'ج.م'},
      {k:'fin',   l:'صافي التدفق التمويلي',    u:'ج.م'},
      {k:'net',   l:'صافي التغير في النقدية',   u:'ج.م'},
      {k:'open',  l:'رصيد النقدية أول المدة',   u:'ج.م'},
      {k:'close', l:'رصيد النقدية آخر المدة',   u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.oper) && n(v.invest) && n(v.fin) && !n(v.net)) { v.net = r(v.oper! + v.invest! + v.fin!); c=true; }
        if(n(v.net) && n(v.invest) && n(v.fin) && !n(v.oper)) { v.oper = r(v.net! - v.invest! - v.fin!); c=true; }
        if(n(v.net) && n(v.oper) && n(v.fin) && !n(v.invest)) { v.invest = r(v.net! - v.oper! - v.fin!); c=true; }
        if(n(v.net) && n(v.oper) && n(v.invest) && !n(v.fin)) { v.fin = r(v.net! - v.oper! - v.invest!); c=true; }
        if(n(v.open) && n(v.net) && !n(v.close)) { v.close = r(v.open! + v.net!); c=true; }
        if(n(v.close) && n(v.net) && !n(v.open)) { v.open = r(v.close! - v.net!); c=true; }
        if(n(v.close) && n(v.open) && !n(v.net)) { v.net = r(v.close! - v.open!); c=true; }
      }
      if(n(v.close)) {
        if(v.close! > 0) v._decision = '✅ رصيد نقدي موجب';
        else v._decision = '🔴 عجز نقدي — يجب توفير تمويل!';
      }
      return v;
    },
    formula: 'صافي التغير = تشغيلي + استثماري + تمويلي | الرصيد الختامي = الافتتاحي + التغير',
    latex: '\\\\text{رصيد آخر المدة} = \\\\text{رصيد أول} + \\\\text{تشغيلي} + \\\\text{استثماري} + \\\\text{تمويلي}'
  },
  {
    id: 'equity_statement', title: 'قائمة حقوق الملكية', icon: '📜', color: '#CE93D8',
    desc: 'التغيرات في حقوق المساهمين خلال الفترة',
    fields:[
      {k:'open_eq',   l:'حقوق ملكية أول المدة', u:'ج.م'},
      {k:'ni',        l:'صافي الدخل (+)',       u:'ج.م'},
      {k:'div',       l:'التوزيعات (−)',         u:'ج.م'},
      {k:'add_cap',   l:'إضافات رأس المال (+)', u:'ج.م'},
      {k:'other',     l:'تغيرات أخرى (±)',       u:'ج.م'},
      {k:'close_eq',  l:'حقوق ملكية آخر المدة', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(!n(v.add_cap)) v.add_cap = 0;
      if(!n(v.other)) v.other = 0;
      if(!n(v.div)) v.div = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.div) && v.div! < 0) { v._error = 'التوزيعات لا يمكن أن تكون سالبة'; break; }
        if(n(v.open_eq) && n(v.ni) && !n(v.close_eq)) {
          v.close_eq = r(v.open_eq! + v.ni! - (v.div||0) + (v.add_cap||0) + (v.other||0)); c=true;
        }
        if(n(v.close_eq) && n(v.ni) && !n(v.open_eq)) {
          v.open_eq = r(v.close_eq! - v.ni! + (v.div||0) - (v.add_cap||0) - (v.other||0)); c=true;
        }
        if(n(v.close_eq) && n(v.open_eq) && !n(v.ni)) {
          v.ni = r(v.close_eq! - v.open_eq! + (v.div||0) - (v.add_cap||0) - (v.other||0)); c=true;
        }
      }
      return v;
    },
    formula: 'حقوق الملكية (آخر) = أول + صافي دخل − توزيعات + إضافات ± تغيرات أخرى',
    latex: '\\\\text{حقوق آخر} = \\\\text{حقوق أول} + \\\\text{صافي الدخل} - \\\\text{توزيعات}'
  },
  // ══════════════════════════════════════════════════════
  //  الموازنات المفقودة
  // ══════════════════════════════════════════════════════
  {
    id: 'opex_budget', title: 'موازنة م. التشغيل', icon: '🗂️', color: '#FFE082',
    desc: 'مصاريف البيع والإدارة والإهلاك',
    fields:[
      {k:'sell',  l:'مصاريف البيع والتوزيع', u:'ج.م', helper: { type: 'dynamic_sum', title: 'تفصيل البيع' }},
      {k:'admin', l:'مصاريف إدارية وعمومية', u:'ج.م', helper: { type: 'dynamic_sum', title: 'تفصيل الإدارية' }},
      {k:'dep',   l:'مصروف الإهلاك (غير نقدي)', u:'ج.م'},
      {k:'total', l:'إجمالي مصاريف التشغيل', u:'ج.م'},
      {k:'cash_opex', l:'المدفوعات النقدية الفعلية', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      if(!n(v.dep)) v.dep = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.sell) && v.sell! < 0) { v._error = 'مصاريف البيع لا يمكن أن تكون سالبة'; break; }
        if(n(v.admin) && v.admin! < 0) { v._error = 'المصاريف الإدارية لا يمكن أن تكون سالبة'; break; }
        if(n(v.sell) && n(v.admin) && !n(v.total)) { v.total = r(v.sell! + v.admin! + (v.dep||0)); c=true; }
        if(n(v.total) && n(v.admin) && !n(v.sell)) { v.sell = r(v.total! - v.admin! - (v.dep||0)); c=true; }
        if(n(v.total) && n(v.sell) && !n(v.admin)) { v.admin = r(v.total! - v.sell! - (v.dep||0)); c=true; }
        if(n(v.total) && !n(v.cash_opex)) { v.cash_opex = r(v.total! - (v.dep||0)); c=true; }
        if(n(v.cash_opex) && n(v.dep) && !n(v.total)) { v.total = r(v.cash_opex! + v.dep!); c=true; }
      }
      return v;
    },
    formula: 'الإجمالي = بيع + إدارة + إهلاك | النقدي = الإجمالي − الإهلاك',
    latex: '\\\\text{م.تشغيل نقدية} = \\\\text{م.بيع} + \\\\text{م.إدارة}'
  },
  {
    id: 'cash_budget', title: 'الموازنة النقدية', icon: '🏦', color: '#80DEEA',
    desc: 'تخطيط المقبوضات والمدفوعات النقدية',
    fields:[
      {k:'open',     l:'رصيد أول المدة',   u:'ج.م'},
      {k:'receipts', l:'إجمالي المقبوضات', u:'ج.م', helper: { type: 'dynamic_sum', title: 'تفصيل المقبوضات' }},
      {k:'payments', l:'إجمالي المدفوعات', u:'ج.م', helper: { type: 'dynamic_sum', title: 'تفصيل المدفوعات' }},
      {k:'net',      l:'صافي التدفق النقدي', u:'ج.م'},
      {k:'close',    l:'رصيد آخر المدة',    u:'ج.م'},
      {k:'min_bal',  l:'الحد الأدنى المطلوب', u:'ج.م'},
      {k:'surplus',  l:'الفائض / (العجز)',   u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.receipts) && v.receipts! < 0) { v._error = 'المقبوضات لا يمكن أن تكون سالبة'; break; }
        if(n(v.payments) && v.payments! < 0) { v._error = 'المدفوعات لا يمكن أن تكون سالبة'; break; }
        if(n(v.receipts) && n(v.payments) && !n(v.net)) { v.net = r(v.receipts! - v.payments!); c=true; }
        if(n(v.net) && n(v.payments) && !n(v.receipts)) { v.receipts = r(v.net! + v.payments!); c=true; }
        if(n(v.net) && n(v.receipts) && !n(v.payments)) { v.payments = r(v.receipts! - v.net!); c=true; }
        if(n(v.open) && n(v.net) && !n(v.close)) { v.close = r(v.open! + v.net!); c=true; }
        if(n(v.close) && n(v.net) && !n(v.open)) { v.open = r(v.close! - v.net!); c=true; }
        if(n(v.close) && n(v.open) && !n(v.net)) { v.net = r(v.close! - v.open!); c=true; }
        if(n(v.close) && n(v.min_bal) && !n(v.surplus)) { v.surplus = r(v.close! - v.min_bal!); c=true; }
        if(n(v.surplus) && n(v.min_bal) && !n(v.close)) { v.close = r(v.surplus! + v.min_bal!); c=true; }
      }
      if(n(v.surplus)) {
        if(v.surplus! >= 0) v._decision = '✅ فائض نقدي — يمكن استثمار الفائض';
        else v._decision = '🔴 عجز نقدي — يجب ترتيب تمويل بقيمة ' + Math.abs(v.surplus!) + ' ج.م';
      }
      return v;
    },
    formula: 'الختامي = الافتتاحي + مقبوضات − مدفوعات | الفائض = الختامي − الحد الأدنى',
    latex: '\\\\text{رصيد آخر} = \\\\text{رصيد أول} + \\\\text{مقبوضات} - \\\\text{مدفوعات}'
  },
  {
    id: 'overhead_budget', title: 'موازنة ت. صناعية', icon: '🏭', color: '#FFAB91',
    desc: 'التكاليف الصناعية غير المباشرة (متغيرة + ثابتة)',
    fields:[
      {k:'prod_hrs', l:'ساعات العمل المباشر', u:'ساعة'},
      {k:'voh_rate', l:'معدل التحميل المتغير', u:'ج.م/ساعة'},
      {k:'voh',      l:'إجمالي المتغيرة',      u:'ج.م'},
      {k:'foh',      l:'إجمالي الثابتة',        u:'ج.م', helper: { type: 'dynamic_sum', title: 'تفصيل الثابتة' }},
      {k:'total',    l:'إجمالي ت. صناعية',     u:'ج.م'},
      {k:'dep',      l:'إهلاك ضمن الثابتة',    u:'ج.م'},
      {k:'cash_oh',  l:'المدفوعات النقدية',     u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      if(!n(v.dep)) v.dep = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.prod_hrs) && v.prod_hrs! < 0) { v._error = 'ساعات العمل لا يمكن أن تكون سالبة'; break; }
        if(n(v.voh_rate) && v.voh_rate! < 0) { v._error = 'معدل التحميل لا يمكن أن يكون سالباً'; break; }
        if(n(v.prod_hrs) && n(v.voh_rate) && !n(v.voh)) { v.voh = r(v.prod_hrs! * v.voh_rate!); c=true; }
        if(n(v.voh) && n(v.voh_rate) && v.voh_rate!>0 && !n(v.prod_hrs)) { v.prod_hrs = r(v.voh! / v.voh_rate!); c=true; }
        if(n(v.voh) && n(v.prod_hrs) && v.prod_hrs!>0 && !n(v.voh_rate)) { v.voh_rate = r(v.voh! / v.prod_hrs!); c=true; }
        if(n(v.voh) && n(v.foh) && !n(v.total)) { v.total = r(v.voh! + v.foh!); c=true; }
        if(n(v.total) && n(v.foh) && !n(v.voh)) { v.voh = r(v.total! - v.foh!); c=true; }
        if(n(v.total) && n(v.voh) && !n(v.foh)) { v.foh = r(v.total! - v.voh!); c=true; }
        if(n(v.total) && !n(v.cash_oh)) { v.cash_oh = r(v.total! - (v.dep||0)); c=true; }
        if(n(v.cash_oh) && n(v.dep) && !n(v.total)) { v.total = r(v.cash_oh! + v.dep!); c=true; }
      }
      return v;
    },
    formula: 'متغيرة = ساعات × معدل | الإجمالي = متغيرة + ثابتة | النقدي = الإجمالي − إهلاك',
    latex: '\\\\text{ت.صناعية نقدية} = (\\\\text{ساعات} \\\\times \\\\text{معدل}) + \\\\text{ثابتة} - \\\\text{إهلاك}'
  },
  // ══════════════════════════════════════════════════════
  //  تحليل الانحرافات والتكاليف المتقدمة
  // ══════════════════════════════════════════════════════
  {
    id: 'material_variance', title: 'انحراف المواد', icon: '🧪', color: '#EF9A9A',
    desc: 'انحراف سعر وكمية المواد المباشرة (مؤاتٍ / غير مؤاتٍ)',
    fields:[
      {k:'sq', l:'الكمية المعيارية', u:'وحدة'},
      {k:'sp', l:'السعر المعياري',   u:'ج.م'},
      {k:'aq', l:'الكمية الفعلية',   u:'وحدة'},
      {k:'ap', l:'السعر الفعلي',     u:'ج.م'},
      {k:'mpv', l:'انحراف السعر',    u:'ج.م'},
      {k:'mqv', l:'انحراف الكمية',   u:'ج.م'},
      {k:'mtv', l:'إجمالي انحراف المواد', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.sq) && v.sq! < 0) { v._error = 'الكمية المعيارية لا يمكن أن تكون سالبة'; break; }
        if(n(v.aq) && v.aq! < 0) { v._error = 'الكمية الفعلية لا يمكن أن تكون سالبة'; break; }
        if(n(v.sp) && v.sp! < 0) { v._error = 'السعر المعياري لا يمكن أن يكون سالباً'; break; }
        if(n(v.ap) && v.ap! < 0) { v._error = 'السعر الفعلي لا يمكن أن يكون سالباً'; break; }
        // MPV = (SP - AP) × AQ  → موجب = مؤاتٍ
        if(n(v.sp) && n(v.ap) && n(v.aq) && !n(v.mpv)) { v.mpv = r((v.sp! - v.ap!) * v.aq!); c=true; }
        // MQV = (SQ - AQ) × SP  → موجب = مؤاتٍ
        if(n(v.sq) && n(v.aq) && n(v.sp) && !n(v.mqv)) { v.mqv = r((v.sq! - v.aq!) * v.sp!); c=true; }
        // MTV = MPV + MQV
        if(n(v.mpv) && n(v.mqv) && !n(v.mtv)) { v.mtv = r(v.mpv! + v.mqv!); c=true; }
        if(n(v.mtv) && n(v.mpv) && !n(v.mqv)) { v.mqv = r(v.mtv! - v.mpv!); c=true; }
        if(n(v.mtv) && n(v.mqv) && !n(v.mpv)) { v.mpv = r(v.mtv! - v.mqv!); c=true; }
      }
      if(n(v.mtv)) {
        if(v.mtv! > 0) v._decision = '🟢 انحراف مؤاتٍ (وفر) بقيمة ' + v.mtv! + ' ج.م';
        else if(v.mtv! < 0) v._decision = '🔴 انحراف غير مؤاتٍ (تجاوز) بقيمة ' + Math.abs(v.mtv!) + ' ج.م';
        else v._decision = '✅ لا يوجد انحراف';
      }
      return v;
    },
    formula: 'انحراف السعر = (معياري−فعلي)×كمية فعلية | الكمية = (معيارية−فعلية)×سعر معياري',
    latex: '\\\\text{انحراف السعر} = (\\\\text{SP} - \\\\text{AP}) \\\\times \\\\text{AQ}'
  },
  {
    id: 'labor_variance', title: 'انحراف الأجور', icon: '👨‍🏭', color: '#90CAF9',
    desc: 'انحراف معدل وكفاءة العمل المباشر',
    fields:[
      {k:'sh', l:'الساعات المعيارية', u:'ساعة'},
      {k:'sr', l:'المعدل المعياري',   u:'ج.م/ساعة'},
      {k:'ah', l:'الساعات الفعلية',   u:'ساعة'},
      {k:'ar', l:'المعدل الفعلي',     u:'ج.م/ساعة'},
      {k:'lrv', l:'انحراف المعدل',    u:'ج.م'},
      {k:'lev', l:'انحراف الكفاءة',   u:'ج.م'},
      {k:'ltv', l:'إجمالي انحراف الأجور', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.sh) && v.sh! < 0) { v._error = 'الساعات المعيارية لا يمكن أن تكون سالبة'; break; }
        if(n(v.ah) && v.ah! < 0) { v._error = 'الساعات الفعلية لا يمكن أن تكون سالبة'; break; }
        if(n(v.sr) && v.sr! < 0) { v._error = 'المعدل المعياري لا يمكن أن يكون سالباً'; break; }
        if(n(v.ar) && v.ar! < 0) { v._error = 'المعدل الفعلي لا يمكن أن يكون سالباً'; break; }
        // LRV = (SR - AR) × AH
        if(n(v.sr) && n(v.ar) && n(v.ah) && !n(v.lrv)) { v.lrv = r((v.sr! - v.ar!) * v.ah!); c=true; }
        // LEV = (SH - AH) × SR
        if(n(v.sh) && n(v.ah) && n(v.sr) && !n(v.lev)) { v.lev = r((v.sh! - v.ah!) * v.sr!); c=true; }
        // LTV = LRV + LEV
        if(n(v.lrv) && n(v.lev) && !n(v.ltv)) { v.ltv = r(v.lrv! + v.lev!); c=true; }
        if(n(v.ltv) && n(v.lrv) && !n(v.lev)) { v.lev = r(v.ltv! - v.lrv!); c=true; }
        if(n(v.ltv) && n(v.lev) && !n(v.lrv)) { v.lrv = r(v.ltv! - v.lev!); c=true; }
      }
      if(n(v.ltv)) {
        if(v.ltv! > 0) v._decision = '🟢 انحراف مؤاتٍ (وفر) بقيمة ' + v.ltv! + ' ج.م';
        else if(v.ltv! < 0) v._decision = '🔴 انحراف غير مؤاتٍ (تجاوز) بقيمة ' + Math.abs(v.ltv!) + ' ج.م';
        else v._decision = '✅ لا يوجد انحراف';
      }
      return v;
    },
    formula: 'انحراف المعدل = (معياري−فعلي)×ساعات فعلية | الكفاءة = (معيارية−فعلية)×معدل معياري',
    latex: '\\\\text{انحراف المعدل} = (\\\\text{SR} - \\\\text{AR}) \\\\times \\\\text{AH}'
  },
  {
    id: 'overhead_variance', title: 'انحراف ت. إضافية', icon: '📐', color: '#CE93D8',
    desc: 'الفرق بين التكاليف الإضافية المحمّلة والفعلية',
    fields:[
      {k:'std_hrs',  l:'الساعات المعيارية',    u:'ساعة'},
      {k:'oh_rate',  l:'معدل التحميل المحدد',  u:'ج.م/ساعة'},
      {k:'applied',  l:'التكاليف المحمّلة',     u:'ج.م'},
      {k:'actual',   l:'التكاليف الفعلية',      u:'ج.م'},
      {k:'total_var',l:'إجمالي الانحراف',       u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.std_hrs) && v.std_hrs! < 0) { v._error = 'الساعات لا يمكن أن تكون سالبة'; break; }
        if(n(v.oh_rate) && v.oh_rate! < 0) { v._error = 'معدل التحميل لا يمكن أن يكون سالباً'; break; }
        if(n(v.std_hrs) && n(v.oh_rate) && !n(v.applied)) { v.applied = r(v.std_hrs! * v.oh_rate!); c=true; }
        if(n(v.applied) && n(v.oh_rate) && v.oh_rate!>0 && !n(v.std_hrs)) { v.std_hrs = r(v.applied! / v.oh_rate!); c=true; }
        if(n(v.applied) && n(v.std_hrs) && v.std_hrs!>0 && !n(v.oh_rate)) { v.oh_rate = r(v.applied! / v.std_hrs!); c=true; }
        // Total Var = Applied - Actual → موجب = تحميل زائد (مؤاتٍ)
        if(n(v.applied) && n(v.actual) && !n(v.total_var)) { v.total_var = r(v.applied! - v.actual!); c=true; }
        if(n(v.total_var) && n(v.actual) && !n(v.applied)) { v.applied = r(v.total_var! + v.actual!); c=true; }
        if(n(v.total_var) && n(v.applied) && !n(v.actual)) { v.actual = r(v.applied! - v.total_var!); c=true; }
      }
      if(n(v.total_var)) {
        if(v.total_var! > 0) v._decision = '🟢 تحميل زائد (Over-applied) — مؤاتٍ';
        else if(v.total_var! < 0) v._decision = '🔴 تحميل ناقص (Under-applied) — غير مؤاتٍ';
        else v._decision = '✅ التحميل مطابق للفعلي';
      }
      return v;
    },
    formula: 'المحمّلة = ساعات معيارية × معدل | الانحراف = محمّلة − فعلية',
    latex: '\\\\text{الانحراف} = \\\\text{المحمّلة} - \\\\text{الفعلية}'
  },
  {
    id: 'standard_cost', title: 'بطاقة التكلفة المعيارية', icon: '📇', color: '#A5D6A7',
    desc: 'التكلفة المعيارية للوحدة (مواد + أجور + إضافية)',
    fields:[
      {k:'dm_qty',  l:'كمية المواد للوحدة',   u:'وحدة'},
      {k:'dm_price',l:'سعر المادة المعياري',  u:'ج.م'},
      {k:'dm_cost', l:'تكلفة المواد المعيارية',u:'ج.م'},
      {k:'dl_hrs',  l:'ساعات العمل للوحدة',   u:'ساعة'},
      {k:'dl_rate', l:'معدل الأجر المعياري',  u:'ج.م/ساعة'},
      {k:'dl_cost', l:'تكلفة الأجور المعيارية',u:'ج.م'},
      {k:'oh_hrs',  l:'ساعات التحميل للوحدة', u:'ساعة'},
      {k:'oh_rate', l:'معدل التحميل الإضافي', u:'ج.م/ساعة'},
      {k:'oh_cost', l:'ت. إضافية معيارية',    u:'ج.م'},
      {k:'total',   l:'إجمالي التكلفة المعيارية', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        // DM
        if(n(v.dm_qty) && n(v.dm_price) && !n(v.dm_cost)) { v.dm_cost = r(v.dm_qty! * v.dm_price!); c=true; }
        if(n(v.dm_cost) && n(v.dm_price) && v.dm_price!>0 && !n(v.dm_qty)) { v.dm_qty = r(v.dm_cost! / v.dm_price!); c=true; }
        if(n(v.dm_cost) && n(v.dm_qty) && v.dm_qty!>0 && !n(v.dm_price)) { v.dm_price = r(v.dm_cost! / v.dm_qty!); c=true; }
        // DL
        if(n(v.dl_hrs) && n(v.dl_rate) && !n(v.dl_cost)) { v.dl_cost = r(v.dl_hrs! * v.dl_rate!); c=true; }
        if(n(v.dl_cost) && n(v.dl_rate) && v.dl_rate!>0 && !n(v.dl_hrs)) { v.dl_hrs = r(v.dl_cost! / v.dl_rate!); c=true; }
        if(n(v.dl_cost) && n(v.dl_hrs) && v.dl_hrs!>0 && !n(v.dl_rate)) { v.dl_rate = r(v.dl_cost! / v.dl_hrs!); c=true; }
        // OH
        if(n(v.oh_hrs) && n(v.oh_rate) && !n(v.oh_cost)) { v.oh_cost = r(v.oh_hrs! * v.oh_rate!); c=true; }
        if(n(v.oh_cost) && n(v.oh_rate) && v.oh_rate!>0 && !n(v.oh_hrs)) { v.oh_hrs = r(v.oh_cost! / v.oh_rate!); c=true; }
        if(n(v.oh_cost) && n(v.oh_hrs) && v.oh_hrs!>0 && !n(v.oh_rate)) { v.oh_rate = r(v.oh_cost! / v.oh_hrs!); c=true; }
        // Total
        if(n(v.dm_cost) && n(v.dl_cost) && n(v.oh_cost) && !n(v.total)) { v.total = r(v.dm_cost! + v.dl_cost! + v.oh_cost!); c=true; }
        if(n(v.total) && n(v.dm_cost) && n(v.dl_cost) && !n(v.oh_cost)) { v.oh_cost = r(v.total! - v.dm_cost! - v.dl_cost!); c=true; }
        if(n(v.total) && n(v.dm_cost) && n(v.oh_cost) && !n(v.dl_cost)) { v.dl_cost = r(v.total! - v.dm_cost! - v.oh_cost!); c=true; }
        if(n(v.total) && n(v.dl_cost) && n(v.oh_cost) && !n(v.dm_cost)) { v.dm_cost = r(v.total! - v.dl_cost! - v.oh_cost!); c=true; }
      }
      return v;
    },
    formula: 'ت. معيارية = مواد + أجور + إضافية | كل عنصر = كمية × سعر',
    latex: '\\\\text{ت.معيارية} = \\\\text{DM} + \\\\text{DL} + \\\\text{MOH}'
  },
  {
    id: 'absorption_variable', title: 'كلية vs متغيرة', icon: '🔄', color: '#B39DDB',
    desc: 'الفرق بين صافي الدخل بالتكلفة الكلية والمتغيرة',
    fields:[
      {k:'prod',    l:'وحدات الإنتاج',         u:'وحدة'},
      {k:'sold',    l:'وحدات المبيعات',        u:'وحدة'},
      {k:'foh',     l:'إجمالي ت. ثابتة صناعية',u:'ج.م'},
      {k:'foh_pu',  l:'ت. ثابتة للوحدة',       u:'ج.م'},
      {k:'inv_chg', l:'التغير في المخزون',      u:'وحدة'},
      {k:'diff',    l:'الفرق في صافي الدخل',    u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.prod) && v.prod! <= 0) { v._error = 'وحدات الإنتاج يجب أن تكون أكبر من صفر'; break; }
        if(n(v.sold) && v.sold! < 0) { v._error = 'وحدات المبيعات لا يمكن أن تكون سالبة'; break; }
        // FOH/PU
        if(n(v.foh) && n(v.prod) && v.prod!>0 && !n(v.foh_pu)) { v.foh_pu = r(v.foh! / v.prod!); c=true; }
        if(n(v.foh_pu) && n(v.prod) && !n(v.foh)) { v.foh = r(v.foh_pu! * v.prod!); c=true; }
        // Inv change
        if(n(v.prod) && n(v.sold) && !n(v.inv_chg)) { v.inv_chg = r(v.prod! - v.sold!); c=true; }
        if(n(v.inv_chg) && n(v.sold) && !n(v.prod)) { v.prod = r(v.inv_chg! + v.sold!); c=true; }
        if(n(v.inv_chg) && n(v.prod) && !n(v.sold)) { v.sold = r(v.prod! - v.inv_chg!); c=true; }
        // Diff = inv_chg × FOH/PU
        if(n(v.inv_chg) && n(v.foh_pu) && !n(v.diff)) { v.diff = r(v.inv_chg! * v.foh_pu!); c=true; }
        if(n(v.diff) && n(v.foh_pu) && v.foh_pu!>0 && !n(v.inv_chg)) { v.inv_chg = r(v.diff! / v.foh_pu!); c=true; }
      }
      if(n(v.diff)) {
        if(v.diff! > 0) v._decision = '📊 الإنتاج > المبيعات → دخل الكلية أعلى بـ ' + v.diff! + ' ج.م';
        else if(v.diff! < 0) v._decision = '📊 الإنتاج < المبيعات → دخل المتغيرة أعلى بـ ' + Math.abs(v.diff!) + ' ج.م';
        else v._decision = '✅ الإنتاج = المبيعات → الدخلان متساويان';
      }
      return v;
    },
    formula: 'الفرق = (إنتاج − مبيعات) × ت.ثابتة/وحدة | إنتاج>مبيعات = كلية أعلى',
    latex: '\\\\text{الفرق} = (\\\\text{إنتاج} - \\\\text{مبيعات}) \\\\times \\\\text{FOH/وحدة}'
  },
  {
    id: 'multi_bep', title: 'تعادل متعدد المنتجات', icon: '🎯', color: '#FFCC80',
    desc: 'نقطة التعادل بالمزيج البيعي (Weighted Average CM)',
    fields:[
      {k:'wavg_cm',  l:'هامش المساهمة المرجح', u:'ج.م/وحدة', helper: {
        type: 'formula', title: 'حساب المرجح من المزيج',
        fields: [
          {k:'cm1', l:'هامش المنتج ①', u:'ج.م'}, {k:'mix1', l:'نسبة المزيج ①', u:'%'},
          {k:'cm2', l:'هامش المنتج ②', u:'ج.م'}, {k:'mix2', l:'نسبة المزيج ②', u:'%'},
        ],
        solver: (s: Record<string, number | null>) => {
          if(s.cm1 != null && s.mix1 != null && s.cm2 != null && s.mix2 != null) {
            return r(s.cm1 * (s.mix1/100) + s.cm2 * (s.mix2/100));
          }
          return null;
        }
      }},
      {k:'wavg_cmr', l:'نسبة المساهمة المرجحة', u:'%'},
      {k:'fc',       l:'إجمالي التكاليف الثابتة', u:'ج.م', helper: { type: 'dynamic_sum', title: 'جمع الثابتة' }},
      {k:'beq',      l:'التعادل الكلي (كمية)',     u:'وحدة'},
      {k:'bes',      l:'التعادل الكلي (قيمة)',     u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.wavg_cm) && v.wavg_cm! <= 0) { v._error = 'هامش المساهمة المرجح يجب أن يكون أكبر من صفر'; break; }
        if(n(v.wavg_cmr) && v.wavg_cmr! <= 0) { v._error = 'نسبة المساهمة المرجحة يجب أن تكون موجبة'; break; }
        if(n(v.fc) && v.fc! < 0) { v._error = 'التكاليف الثابتة لا يمكن أن تكون سالبة'; break; }
        if(n(v.fc) && n(v.wavg_cm) && v.wavg_cm!>0 && !n(v.beq)) { v.beq = Math.ceil(v.fc! / v.wavg_cm!); c=true; }
        if(n(v.beq) && n(v.wavg_cm) && !n(v.fc)) { v.fc = r(v.beq! * v.wavg_cm!); c=true; }
        if(n(v.fc) && n(v.beq) && v.beq!>0 && !n(v.wavg_cm)) { v.wavg_cm = r(v.fc! / v.beq!); c=true; }
        if(n(v.fc) && n(v.wavg_cmr) && v.wavg_cmr!>0 && !n(v.bes)) { v.bes = r(v.fc! / (v.wavg_cmr!/100)); c=true; }
        if(n(v.bes) && n(v.wavg_cmr) && v.wavg_cmr!>0 && !n(v.fc)) { v.fc = r(v.bes! * (v.wavg_cmr!/100)); c=true; }
        if(n(v.fc) && n(v.bes) && v.bes!>0 && !n(v.wavg_cmr)) { v.wavg_cmr = r((v.fc!/v.bes!)*100); c=true; }
      }
      return v;
    },
    formula: 'تعادل كمية = ثابتة ÷ CM مرجح | تعادل قيمة = ثابتة ÷ CMR مرجح',
    latex: '\\\\text{BEQ} = \\\\frac{\\\\text{FC}}{\\\\text{WACM}}'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 2 — أدوات التميز
  // ══════════════════════════════════════════════════════
  {
    id: 'tvm', title: 'القيمة الزمنية للنقود', icon: '⏳', color: '#FFD54F',
    desc: 'القيمة الحالية والمستقبلية (PV / FV)',
    fields:[
      {k:'pv',   l:'القيمة الحالية (PV)',    u:'ج.م'},
      {k:'fv',   l:'القيمة المستقبلية (FV)', u:'ج.م'},
      {k:'rate', l:'معدل الفائدة',           u:'%'},
      {k:'n',    l:'عدد الفترات',             u:'فترة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rate) && v.rate! < 0) { v._error = 'معدل الفائدة لا يمكن أن يكون سالباً'; break; }
        if(n(v.n) && v.n! <= 0) { v._error = 'عدد الفترات يجب أن يكون أكبر من صفر'; break; }
        if(n(v.pv) && v.pv! < 0) { v._error = 'القيمة الحالية لا يمكن أن تكون سالبة'; break; }
        const rr = n(v.rate) ? v.rate!/100 : null;
        if(n(v.pv) && rr !== null && n(v.n) && !n(v.fv)) { v.fv = r(v.pv! * Math.pow(1+rr, v.n!)); c=true; }
        if(n(v.fv) && rr !== null && n(v.n) && !n(v.pv)) { v.pv = r(v.fv! / Math.pow(1+rr, v.n!)); c=true; }
        if(n(v.pv) && n(v.fv) && n(v.n) && v.pv!>0 && !n(v.rate)) {
          v.rate = r((Math.pow(v.fv!/v.pv!, 1/v.n!) - 1)*100); c=true;
        }
        if(n(v.pv) && n(v.fv) && rr !== null && rr>0 && v.pv!>0 && !n(v.n)) {
          v.n = r(Math.log(v.fv!/v.pv!) / Math.log(1+rr)); c=true;
        }
      }
      return v;
    },
    formula: 'FV = PV × (1+r)ⁿ | PV = FV ÷ (1+r)ⁿ',
    latex: '\\\\text{FV} = \\\\text{PV} \\\\times (1+r)^n'
  },
  {
    id: 'annuity', title: 'القسط السنوي', icon: '📅', color: '#81D4FA',
    desc: 'أقساط دورية متساوية (قروض / استثمارات)',
    fields:[
      {k:'pv',   l:'القيمة الحالية للدفعات', u:'ج.م'},
      {k:'pmt',  l:'قيمة القسط الدوري',     u:'ج.م'},
      {k:'rate', l:'معدل الفائدة للفترة',    u:'%'},
      {k:'n',    l:'عدد الفترات',             u:'فترة'},
      {k:'total',l:'إجمالي المدفوعات',       u:'ج.م'},
      {k:'int_total',l:'إجمالي الفوائد',      u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rate) && v.rate! < 0) { v._error = 'معدل الفائدة لا يمكن أن يكون سالباً'; break; }
        if(n(v.n) && v.n! <= 0) { v._error = 'عدد الفترات يجب أن يكون أكبر من صفر'; break; }
        if(n(v.pmt) && v.pmt! < 0) { v._error = 'قيمة القسط لا يمكن أن تكون سالبة'; break; }
        const rr = n(v.rate) ? v.rate!/100 : null;
        // PMT = PV × r / (1-(1+r)^-n)
        if(n(v.pv) && rr !== null && rr>0 && n(v.n) && !n(v.pmt)) {
          v.pmt = r(v.pv! * rr / (1 - Math.pow(1+rr, -v.n!))); c=true;
        }
        // PV = PMT × (1-(1+r)^-n) / r
        if(n(v.pmt) && rr !== null && rr>0 && n(v.n) && !n(v.pv)) {
          v.pv = r(v.pmt! * (1 - Math.pow(1+rr, -v.n!)) / rr); c=true;
        }
        if(n(v.pmt) && n(v.n) && !n(v.total)) { v.total = r(v.pmt! * v.n!); c=true; }
        if(n(v.total) && n(v.pv) && !n(v.int_total)) { v.int_total = r(v.total! - v.pv!); c=true; }
      }
      return v;
    },
    formula: 'القسط = PV × r ÷ (1−(1+r)⁻ⁿ) | إجمالي الفوائد = إجمالي الأقساط − المبلغ الأصلي',
    latex: '\\\\text{PMT} = \\\\frac{\\\\text{PV} \\\\times r}{1-(1+r)^{-n}}'
  },
  {
    id: 'dupont', title: 'تحليل DuPont', icon: '🔬', color: '#F48FB1',
    desc: 'تفكيك العائد على حقوق الملكية لثلاثة مكونات',
    fields:[
      {k:'npm',  l:'هامش الربح الصافي',   u:'%'},
      {k:'at',   l:'معدل دوران الأصول',   u:'مرة'},
      {k:'em',   l:'مضاعف حقوق الملكية',  u:'مرة'},
      {k:'roa',  l:'العائد على الأصول (ROA)',u:'%'},
      {k:'roe',  l:'العائد على الملكية (ROE)',u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.em) && v.em! < 1) { v._error = 'مضاعف الملكية لا يمكن أن يقل عن 1 (أصول ≥ ملكية)'; break; }
        // ROA = NPM × AT
        if(n(v.npm) && n(v.at) && !n(v.roa)) { v.roa = r((v.npm!/100)*v.at!*100); c=true; }
        if(n(v.roa) && n(v.at) && v.at!>0 && !n(v.npm)) { v.npm = r((v.roa!/100)/v.at!*100); c=true; }
        if(n(v.roa) && n(v.npm) && v.npm!>0 && !n(v.at)) { v.at = r((v.roa!/100)/(v.npm!/100)); c=true; }
        // ROE = ROA × EM
        if(n(v.roa) && n(v.em) && !n(v.roe)) { v.roe = r((v.roa!/100)*v.em!*100); c=true; }
        if(n(v.roe) && n(v.em) && v.em!>0 && !n(v.roa)) { v.roa = r((v.roe!/100)/v.em!*100); c=true; }
        if(n(v.roe) && n(v.roa) && v.roa!>0 && !n(v.em)) { v.em = r((v.roe!/100)/(v.roa!/100)); c=true; }
        // Direct: ROE = NPM × AT × EM
        if(n(v.npm) && n(v.at) && n(v.em) && !n(v.roe)) { v.roe = r((v.npm!/100)*v.at!*v.em!*100); c=true; }
      }
      if(n(v.roe)) {
        if(v.roe! >= 20) v._decision = '🟢 أداء ممتاز (ROE ≥ 20%)';
        else if(v.roe! >= 12) v._decision = '🟡 أداء جيد (ROE 12-20%)';
        else v._decision = '🔴 أداء ضعيف (ROE < 12%)';
      }
      return v;
    },
    formula: 'ROE = هامش صافي × دوران أصول × مضاعف ملكية | ROA = هامش × دوران',
    latex: '\\\\text{ROE} = \\\\text{NPM} \\\\times \\\\text{AT} \\\\times \\\\text{EM}'
  },
  {
    id: 'dep_declining', title: 'إهلاك القسط المتناقص', icon: '📉', color: '#EF9A9A',
    desc: 'الطريقة المعجّلة — ضعف معدل القسط الثابت',
    fields:[
      {k:'cost',    l:'تكلفة الأصل',           u:'ج.م'},
      {k:'salvage', l:'القيمة التخريدية',       u:'ج.م'},
      {k:'life',    l:'العمر الإنتاجي',        u:'سنة'},
      {k:'rate',    l:'معدل الإهلاك المضاعف',  u:'%'},
      {k:'year',    l:'السنة المطلوبة',         u:'سنة'},
      {k:'dep',     l:'قسط إهلاك هذه السنة',   u:'ج.م'},
      {k:'bv',      l:'القيمة الدفترية بعدها', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.life) && v.life! <= 0) { v._error = 'العمر الإنتاجي يجب أن يكون أكبر من صفر'; break; }
        if(n(v.cost) && v.cost! < 0) { v._error = 'التكلفة يجب أن تكون موجبة'; break; }
        if(n(v.year) && v.year! <= 0) { v._error = 'رقم السنة يجب أن يكون أكبر من صفر'; break; }
        if(n(v.year) && n(v.life) && v.year! > v.life!) { v._error = 'رقم السنة لا يمكن أن يتجاوز العمر الإنتاجي'; break; }
        if(n(v.cost) && n(v.salvage) && v.salvage! > v.cost!) { v._error = 'القيمة التخريدية لا يمكن أن تتجاوز التكلفة'; break; }
        if(n(v.life) && !n(v.rate)) { v.rate = r((1/v.life!)*2*100); c=true; }
        if(n(v.cost) && n(v.rate) && n(v.year) && n(v.salvage)) {
          const rt = v.rate!/100;
          let bv = v.cost!;
          let depY = 0;
          for(let y=1; y<=v.year!; y++){
            depY = r(bv * rt);
            if(bv - depY < v.salvage!) depY = r(bv - v.salvage!);
            if(depY < 0) depY = 0;
            bv = r(bv - depY);
          }
          if(!n(v.dep)) { v.dep = depY; c=true; }
          if(!n(v.bv)) { v.bv = bv; c=true; }
        }
      }
      return v;
    },
    formula: 'معدل = (1/عمر)×2 | القسط = القيمة الدفترية × المعدل (لا تقل عن التخريدية)',
    latex: '\\\\text{قسط} = \\\\text{القيمة الدفترية} \\\\times \\\\frac{2}{\\\\text{العمر}}'
  },
  {
    id: 'dep_syd', title: 'إهلاك مجموع الأرقام', icon: '🔢', color: '#CE93D8',
    desc: 'طريقة مجموع أرقام السنوات (Sum-of-Years-Digits)',
    fields:[
      {k:'cost',    l:'تكلفة الأصل',        u:'ج.م'},
      {k:'salvage', l:'القيمة التخريدية',    u:'ج.م'},
      {k:'life',    l:'العمر الإنتاجي',     u:'سنة'},
      {k:'syd',     l:'مجموع أرقام السنوات',u:''},
      {k:'year',    l:'السنة المطلوبة',      u:'سنة'},
      {k:'dep',     l:'قسط إهلاك هذه السنة',u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.life) && v.life! <= 0) { v._error = 'العمر الإنتاجي يجب أن يكون أكبر من صفر'; break; }
        if(n(v.cost) && v.cost! < 0) { v._error = 'التكلفة يجب أن تكون موجبة'; break; }
        if(n(v.year) && v.year! <= 0) { v._error = 'رقم السنة يجب أن يكون أكبر من صفر'; break; }
        if(n(v.year) && n(v.life) && v.year! > v.life!) { v._error = 'رقم السنة لا يمكن أن يتجاوز العمر'; break; }
        if(n(v.cost) && n(v.salvage) && v.salvage! > v.cost!) { v._error = 'التخريدية لا يمكن أن تتجاوز التكلفة'; break; }
        if(n(v.life) && !n(v.syd)) { v.syd = (v.life! * (v.life!+1)) / 2; c=true; }
        if(n(v.cost) && n(v.salvage) && n(v.life) && n(v.syd) && n(v.year) && !n(v.dep)) {
          const remaining = v.life! - v.year! + 1;
          v.dep = r((v.cost! - v.salvage!) * remaining / v.syd!); c=true;
        }
      }
      return v;
    },
    formula: 'SYD = n(n+1)/2 | القسط = (التكلفة−التخريدية) × السنوات المتبقية / SYD',
    latex: '\\\\text{القسط} = \\\\frac{(\\\\text{التكلفة}-\\\\text{التخريدية}) \\\\times \\\\text{متبقي}}{\\\\text{SYD}}'
  },
  {
    id: 'dep_units', title: 'إهلاك وحدات الإنتاج', icon: '⚙️', color: '#A5D6A7',
    desc: 'الإهلاك بناءً على الاستخدام الفعلي',
    fields:[
      {k:'cost',      l:'تكلفة الأصل',            u:'ج.م'},
      {k:'salvage',   l:'القيمة التخريدية',        u:'ج.م'},
      {k:'total_units',l:'إجمالي الوحدات المتوقعة',u:'وحدة'},
      {k:'rate_pu',   l:'معدل الإهلاك للوحدة',    u:'ج.م/وحدة'},
      {k:'actual',    l:'الوحدات الفعلية للفترة',  u:'وحدة'},
      {k:'dep',       l:'قسط الإهلاك للفترة',     u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.total_units) && v.total_units! <= 0) { v._error = 'إجمالي الوحدات يجب أن يكون أكبر من صفر'; break; }
        if(n(v.cost) && v.cost! < 0) { v._error = 'التكلفة يجب أن تكون موجبة'; break; }
        if(n(v.actual) && v.actual! < 0) { v._error = 'الوحدات الفعلية لا يمكن أن تكون سالبة'; break; }
        if(n(v.cost) && n(v.salvage) && v.salvage! > v.cost!) { v._error = 'التخريدية لا يمكن أن تتجاوز التكلفة'; break; }
        if(n(v.cost) && n(v.salvage) && n(v.total_units) && v.total_units!>0 && !n(v.rate_pu)) {
          v.rate_pu = r((v.cost! - v.salvage!) / v.total_units!); c=true;
        }
        if(n(v.rate_pu) && n(v.actual) && !n(v.dep)) { v.dep = r(v.rate_pu! * v.actual!); c=true; }
        if(n(v.dep) && n(v.rate_pu) && v.rate_pu!>0 && !n(v.actual)) { v.actual = r(v.dep! / v.rate_pu!); c=true; }
        if(n(v.dep) && n(v.actual) && v.actual!>0 && !n(v.rate_pu)) { v.rate_pu = r(v.dep! / v.actual!); c=true; }
      }
      return v;
    },
    formula: 'المعدل = (التكلفة−التخريدية) ÷ الوحدات الكلية | القسط = المعدل × الفعلية',
    latex: '\\\\text{القسط} = \\\\frac{\\\\text{التكلفة}-\\\\text{التخريدية}}{\\\\text{إجمالي الوحدات}} \\\\times \\\\text{الفعلية}'
  },
  {
    id: 'constraint', title: 'تحليل القيود', icon: '🔒', color: '#FFAB91',
    desc: 'ترتيب الأولوية عند وجود مورد محدود (Scarce Resource)',
    fields:[
      {k:'cm_pu',      l:'هامش المساهمة للوحدة',      u:'ج.م'},
      {k:'res_pu',     l:'المورد المطلوب للوحدة',     u:'وحدة مورد'},
      {k:'cm_per_res', l:'هامش المساهمة لوحدة المورد', u:'ج.م/وحدة مورد'},
      {k:'avail',      l:'المورد المتاح',              u:'وحدة مورد'},
      {k:'max_units',  l:'أقصى إنتاج ممكن',           u:'وحدة'},
      {k:'max_cm',     l:'أقصى هامش مساهمة',          u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.res_pu) && v.res_pu! <= 0) { v._error = 'المورد المطلوب يجب أن يكون أكبر من صفر'; break; }
        if(n(v.cm_pu) && v.cm_pu! < 0) { v._error = 'هامش المساهمة لا يمكن أن يكون سالباً'; break; }
        if(n(v.cm_pu) && n(v.res_pu) && v.res_pu!>0 && !n(v.cm_per_res)) {
          v.cm_per_res = r(v.cm_pu! / v.res_pu!); c=true;
        }
        if(n(v.cm_per_res) && n(v.res_pu) && !n(v.cm_pu)) { v.cm_pu = r(v.cm_per_res! * v.res_pu!); c=true; }
        if(n(v.cm_pu) && n(v.cm_per_res) && v.cm_per_res!>0 && !n(v.res_pu)) { v.res_pu = r(v.cm_pu! / v.cm_per_res!); c=true; }
        if(n(v.avail) && n(v.res_pu) && v.res_pu!>0 && !n(v.max_units)) {
          v.max_units = Math.floor(v.avail! / v.res_pu!); c=true;
        }
        if(n(v.max_units) && n(v.cm_pu) && !n(v.max_cm)) { v.max_cm = r(v.max_units! * v.cm_pu!); c=true; }
      }
      if(n(v.cm_per_res)) {
        v._decision = '📊 أولوية الإنتاج حسب هامش المساهمة لوحدة المورد = ' + v.cm_per_res! + ' ج.م';
      }
      return v;
    },
    formula: 'CM/مورد = هامش الوحدة ÷ المورد للوحدة | الأعلى = الأولوية',
    latex: '\\\\text{CM/مورد} = \\\\frac{\\\\text{هامش الوحدة}}{\\\\text{المورد للوحدة}}'
  },
  {
    id: 'payback', title: 'فترة الاسترداد', icon: '⏱️', color: '#80CBC4',
    desc: 'المدة اللازمة لاسترداد الاستثمار الأولي',
    fields:[
      {k:'invest',    l:'الاستثمار الأولي',     u:'ج.م'},
      {k:'annual_cf', l:'التدفق النقدي السنوي', u:'ج.م'},
      {k:'payback',   l:'فترة الاسترداد',       u:'سنة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.invest) && v.invest! < 0) { v._error = 'الاستثمار لا يمكن أن يكون سالباً'; break; }
        if(n(v.annual_cf) && v.annual_cf! <= 0) { v._error = 'التدفق النقدي يجب أن يكون أكبر من صفر'; break; }
        if(n(v.invest) && n(v.annual_cf) && v.annual_cf!>0 && !n(v.payback)) { v.payback = r(v.invest!/v.annual_cf!); c=true; }
        if(n(v.payback) && n(v.annual_cf) && !n(v.invest)) { v.invest = r(v.payback!*v.annual_cf!); c=true; }
        if(n(v.invest) && n(v.payback) && v.payback!>0 && !n(v.annual_cf)) { v.annual_cf = r(v.invest!/v.payback!); c=true; }
      }
      if(n(v.payback)) {
        if(v.payback! <= 3) v._decision = '🟢 استرداد سريع (≤ 3 سنوات)';
        else if(v.payback! <= 5) v._decision = '🟡 استرداد متوسط (3-5 سنوات)';
        else v._decision = '🔴 استرداد بطيء (> 5 سنوات)';
      }
      return v;
    },
    formula: 'فترة الاسترداد = الاستثمار ÷ التدفق النقدي السنوي',
    latex: '\\\\text{Payback} = \\\\frac{\\\\text{الاستثمار}}{\\\\text{التدفق السنوي}}'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 3 — أدوات عالمية
  // ══════════════════════════════════════════════════════
  {
    id: 'npv', title: 'صافي القيمة الحالية', icon: '💰', color: '#AED581',
    desc: 'NPV — تقييم جدوى المشروع الاستثماري',
    fields:[
      {k:'invest',    l:'الاستثمار الأولي (−)',   u:'ج.م'},
      {k:'annual_cf', l:'التدفق النقدي السنوي',  u:'ج.م'},
      {k:'n',         l:'عدد السنوات',            u:'سنة'},
      {k:'rate',      l:'معدل الخصم',             u:'%'},
      {k:'pv_cf',     l:'القيمة الحالية للتدفقات',u:'ج.م'},
      {k:'npv',       l:'صافي القيمة الحالية',    u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.invest) && v.invest! < 0) { v._error = 'الاستثمار يُدخل بالقيمة الموجبة'; break; }
        if(n(v.rate) && v.rate! < 0) { v._error = 'معدل الخصم لا يمكن أن يكون سالباً'; break; }
        if(n(v.n) && v.n! <= 0) { v._error = 'عدد السنوات يجب أن يكون أكبر من صفر'; break; }
        const rr = n(v.rate) ? v.rate!/100 : null;
        if(n(v.annual_cf) && rr !== null && rr>0 && n(v.n) && !n(v.pv_cf)) {
          v.pv_cf = r(v.annual_cf! * (1 - Math.pow(1+rr, -v.n!)) / rr); c=true;
        }
        if(n(v.pv_cf) && n(v.invest) && !n(v.npv)) { v.npv = r(v.pv_cf! - v.invest!); c=true; }
        if(n(v.npv) && n(v.invest) && !n(v.pv_cf)) { v.pv_cf = r(v.npv! + v.invest!); c=true; }
      }
      if(n(v.npv)) {
        if(v.npv! > 0) v._decision = '🟢 المشروع مجدي — NPV موجب بـ ' + v.npv! + ' ج.م';
        else if(v.npv! < 0) v._decision = '🔴 المشروع غير مجدي — NPV سالب بـ ' + Math.abs(v.npv!) + ' ج.م';
        else v._decision = '🟡 NPV = صفر — عائد يساوي تكلفة رأس المال';
      }
      return v;
    },
    formula: 'NPV = Σ(CF/(1+r)ⁿ) − الاستثمار | NPV > 0 = مشروع مجدي',
    latex: '\\\\text{NPV} = \\\\sum \\\\frac{\\\\text{CF}}{(1+r)^n} - \\\\text{I₀}'
  },
  {
    id: 'vat', title: 'ضريبة القيمة المضافة', icon: '🧾', color: '#FFE082',
    desc: 'حساب VAT وفصل الضريبة عن المبلغ',
    fields:[
      {k:'net',      l:'المبلغ قبل الضريبة', u:'ج.م'},
      {k:'vat_rate', l:'نسبة الضريبة',       u:'%'},
      {k:'vat_amt',  l:'قيمة الضريبة',       u:'ج.م'},
      {k:'gross',    l:'المبلغ شامل الضريبة',u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.vat_rate) && v.vat_rate! < 0) { v._error = 'نسبة الضريبة لا يمكن أن تكون سالبة'; break; }
        if(n(v.net) && v.net! < 0) { v._error = 'المبلغ لا يمكن أن يكون سالباً'; break; }
        if(n(v.net) && n(v.vat_rate) && !n(v.vat_amt)) { v.vat_amt = r(v.net! * v.vat_rate!/100); c=true; }
        if(n(v.net) && n(v.vat_amt) && !n(v.gross)) { v.gross = r(v.net! + v.vat_amt!); c=true; }
        if(n(v.gross) && n(v.vat_rate) && !n(v.net)) { v.net = r(v.gross! / (1 + v.vat_rate!/100)); c=true; }
        if(n(v.gross) && n(v.net) && !n(v.vat_amt)) { v.vat_amt = r(v.gross! - v.net!); c=true; }
        if(n(v.vat_amt) && n(v.net) && v.net!>0 && !n(v.vat_rate)) { v.vat_rate = r((v.vat_amt!/v.net!)*100); c=true; }
        if(n(v.gross) && n(v.vat_amt) && !n(v.net)) { v.net = r(v.gross! - v.vat_amt!); c=true; }
      }
      return v;
    },
    formula: 'الضريبة = صافي × نسبة | الإجمالي = صافي + ضريبة | صافي = إجمالي ÷ (1+نسبة)',
    latex: '\\\\text{VAT} = \\\\text{المبلغ} \\\\times \\\\text{النسبة}'
  },
  {
    id: 'zakat', title: 'حساب الزكاة', icon: '🕌', color: '#C8E6C9',
    desc: 'زكاة الأموال والشركات (2.5% على الوعاء)',
    fields:[
      {k:'base',     l:'وعاء الزكاة',         u:'ج.م', helper: { type: 'dynamic_sum', title: 'تجميع بنود الوعاء' }},
      {k:'zakat_rate',l:'نسبة الزكاة',        u:'%'},
      {k:'zakat',    l:'مبلغ الزكاة المستحق', u:'ج.م'},
      {k:'nisab',    l:'النصاب (الحد الأدنى)', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(!n(v.zakat_rate)) v.zakat_rate = 2.5;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.base) && v.base! < 0) { v._error = 'وعاء الزكاة لا يمكن أن يكون سالباً'; break; }
        if(n(v.base) && n(v.zakat_rate) && !n(v.zakat)) { v.zakat = r(v.base! * v.zakat_rate!/100); c=true; }
        if(n(v.zakat) && n(v.zakat_rate) && v.zakat_rate!>0 && !n(v.base)) { v.base = r(v.zakat! / (v.zakat_rate!/100)); c=true; }
      }
      if(n(v.base) && n(v.nisab)) {
        if(v.base! >= v.nisab!) v._decision = '✅ بلغ النصاب — الزكاة واجبة بمبلغ ' + (v.zakat||0) + ' ج.م';
        else v._decision = '⚪ لم يبلغ النصاب — لا تجب الزكاة';
      }
      return v;
    },
    formula: 'الزكاة = وعاء الزكاة × 2.5% | تجب إذا بلغ النصاب',
    latex: '\\\\text{الزكاة} = \\\\text{الوعاء} \\\\times 2.5\\\\%'
  },
  {
    id: 'currency', title: 'تحويل العملات', icon: '💱', color: '#B3E5FC',
    desc: 'تحويل المبالغ بين العملات وأثر سعر الصرف',
    fields:[
      {k:'amount',  l:'المبلغ بالعملة المحلية',  u:''},
      {k:'rate',    l:'سعر الصرف',              u:''},
      {k:'foreign', l:'المبلغ بالعملة الأجنبية', u:''},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rate) && v.rate! <= 0) { v._error = 'سعر الصرف يجب أن يكون أكبر من صفر'; break; }
        if(n(v.amount) && v.amount! < 0) { v._error = 'المبلغ لا يمكن أن يكون سالباً'; break; }
        if(n(v.amount) && n(v.rate) && v.rate!>0 && !n(v.foreign)) { v.foreign = r(v.amount! / v.rate!); c=true; }
        if(n(v.foreign) && n(v.rate) && !n(v.amount)) { v.amount = r(v.foreign! * v.rate!); c=true; }
        if(n(v.amount) && n(v.foreign) && v.foreign!>0 && !n(v.rate)) { v.rate = r(v.amount! / v.foreign!); c=true; }
      }
      return v;
    },
    formula: 'أجنبي = محلي ÷ سعر الصرف | محلي = أجنبي × سعر الصرف',
    latex: '\\\\text{أجنبي} = \\\\frac{\\\\text{محلي}}{\\\\text{سعر الصرف}}'
  },
  {
    id: 'horizontal_analysis', title: 'التحليل الأفقي', icon: '📏', color: '#FFCCBC',
    desc: 'مقارنة بند مالي بين سنتين (التغير المطلق والنسبي)',
    fields:[
      {k:'base_yr',   l:'مبلغ سنة الأساس',  u:'ج.م'},
      {k:'curr_yr',   l:'مبلغ السنة الحالية',u:'ج.م'},
      {k:'abs_chg',   l:'التغير المطلق',      u:'ج.م'},
      {k:'pct_chg',   l:'التغير النسبي',      u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.base_yr) && v.base_yr! === 0) { v._error = 'سنة الأساس لا يمكن أن تكون صفراً (لحساب النسبة)'; break; }
        if(n(v.curr_yr) && n(v.base_yr) && !n(v.abs_chg)) { v.abs_chg = r(v.curr_yr! - v.base_yr!); c=true; }
        if(n(v.abs_chg) && n(v.base_yr) && !n(v.curr_yr)) { v.curr_yr = r(v.base_yr! + v.abs_chg!); c=true; }
        if(n(v.abs_chg) && n(v.curr_yr) && !n(v.base_yr)) { v.base_yr = r(v.curr_yr! - v.abs_chg!); c=true; }
        if(n(v.abs_chg) && n(v.base_yr) && v.base_yr!>0 && !n(v.pct_chg)) { v.pct_chg = r((v.abs_chg!/v.base_yr!)*100); c=true; }
        if(n(v.pct_chg) && n(v.base_yr) && !n(v.abs_chg)) { v.abs_chg = r((v.pct_chg!/100)*v.base_yr!); c=true; }
      }
      if(n(v.pct_chg)) {
        if(v.pct_chg! > 0) v._decision = '📈 زيادة بنسبة ' + v.pct_chg! + '%';
        else if(v.pct_chg! < 0) v._decision = '📉 انخفاض بنسبة ' + Math.abs(v.pct_chg!) + '%';
        else v._decision = '➡️ لا تغيير';
      }
      return v;
    },
    formula: 'التغير المطلق = الحالية − الأساس | النسبي = (التغير ÷ الأساس) × 100',
    latex: '\\\\text{التغير\\%} = \\\\frac{\\\\text{الحالية} - \\\\text{الأساس}}{\\\\text{الأساس}} \\\\times 100'
  },
  {
    id: 'vertical_analysis', title: 'التحليل الرأسي', icon: '📊', color: '#D1C4E9',
    desc: 'نسبة كل بند إلى إجمالي القائمة المالية',
    fields:[
      {k:'item',  l:'قيمة البند',         u:'ج.م'},
      {k:'total', l:'إجمالي القائمة',    u:'ج.م'},
      {k:'pct',   l:'النسبة المئوية',     u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.total) && v.total! === 0) { v._error = 'الإجمالي لا يمكن أن يساوي صفراً'; break; }
        if(n(v.item) && n(v.total) && v.total!>0 && !n(v.pct)) { v.pct = r((v.item!/v.total!)*100); c=true; }
        if(n(v.pct) && n(v.total) && !n(v.item)) { v.item = r((v.pct!/100)*v.total!); c=true; }
        if(n(v.item) && n(v.pct) && v.pct!>0 && !n(v.total)) { v.total = r(v.item!/(v.pct!/100)); c=true; }
      }
      return v;
    },
    formula: 'النسبة = (البند ÷ الإجمالي) × 100',
    latex: '\\\\text{النسبة} = \\\\frac{\\\\text{البند}}{\\\\text{الإجمالي}} \\\\times 100'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 4 — نسب مالية أساسية مفقودة
  // ══════════════════════════════════════════════════════
  {
    id: 'interest_coverage', title: 'نسبة تغطية الفوائد', icon: '🛡️', color: '#FF8A80',
    desc: 'قدرة الشركة على سداد الفوائد من الأرباح التشغيلية',
    fields:[
      {k:'ebit',     l:'الربح التشغيلي (EBIT)', u:'ج.م'},
      {k:'int_exp',  l:'مصاريف الفوائد',        u:'ج.م'},
      {k:'icr',      l:'نسبة التغطية',          u:'مرة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.int_exp) && v.int_exp! <= 0) { v._error = 'مصاريف الفوائد يجب أن تكون أكبر من صفر'; break; }
        if(n(v.ebit) && n(v.int_exp) && v.int_exp!>0 && !n(v.icr)) { v.icr = r(v.ebit!/v.int_exp!); c=true; }
        if(n(v.icr) && n(v.int_exp) && !n(v.ebit)) { v.ebit = r(v.icr!*v.int_exp!); c=true; }
        if(n(v.ebit) && n(v.icr) && v.icr!>0 && !n(v.int_exp)) { v.int_exp = r(v.ebit!/v.icr!); c=true; }
      }
      if(n(v.icr)) {
        if(v.icr! >= 5) v._decision = '🟢 تغطية ممتازة (≥ 5x)';
        else if(v.icr! >= 2.5) v._decision = '🟡 تغطية مقبولة (2.5-5x)';
        else if(v.icr! >= 1) v._decision = '🟠 تغطية ضعيفة (1-2.5x)';
        else v._decision = '🔴 عجز تغطية — خطر تعثر!';
      }
      return v;
    },
    formula: 'نسبة التغطية = EBIT ÷ مصاريف الفوائد',
    latex: '\\\\text{ICR} = \\\\frac{\\\\text{EBIT}}{\\\\text{مصاريف الفوائد}}'
  },
  {
    id: 'payables_turnover', title: 'دوران الدائنين', icon: '🏪', color: '#EA80FC',
    desc: 'كفاءة سداد الموردين ومتوسط فترة السداد',
    fields:[
      {k:'purch',    l:'إجمالي المشتريات',     u:'ج.م'},
      {k:'avg_pay',  l:'متوسط الدائنين',       u:'ج.م'},
      {k:'pt',       l:'معدل دوران الدائنين',   u:'مرة'},
      {k:'days',     l:'متوسط فترة السداد',     u:'يوم'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.purch) && v.purch! < 0) { v._error = 'المشتريات لا يمكن أن تكون سالبة'; break; }
        if(n(v.avg_pay) && v.avg_pay! <= 0) { v._error = 'متوسط الدائنين يجب أن يكون أكبر من صفر'; break; }
        if(n(v.purch) && n(v.avg_pay) && v.avg_pay!>0 && !n(v.pt)) { v.pt = r(v.purch!/v.avg_pay!); c=true; }
        if(n(v.pt) && n(v.avg_pay) && !n(v.purch)) { v.purch = r(v.pt!*v.avg_pay!); c=true; }
        if(n(v.purch) && n(v.pt) && v.pt!>0 && !n(v.avg_pay)) { v.avg_pay = r(v.purch!/v.pt!); c=true; }
        if(n(v.pt) && v.pt!>0 && !n(v.days)) { v.days = r(365/v.pt!); c=true; }
        if(n(v.days) && v.days!>0 && !n(v.pt)) { v.pt = r(365/v.days!); c=true; }
      }
      if(n(v.days)) {
        if(v.days! <= 30) v._decision = '🟢 سداد سريع (≤ 30 يوم)';
        else if(v.days! <= 60) v._decision = '🟡 سداد مقبول (30-60 يوم)';
        else v._decision = '🔴 سداد بطيء (> 60 يوم)';
      }
      return v;
    },
    formula: 'الدوران = المشتريات ÷ متوسط الدائنين | الأيام = 365 ÷ الدوران',
    latex: '\\\\text{فترة السداد} = \\\\frac{365}{\\\\text{دوران الدائنين}}'
  },
  {
    id: 'debt_ratio', title: 'نسبة الدين للأصول', icon: '📊', color: '#FF80AB',
    desc: 'نسبة تمويل الأصول بالديون',
    fields:[
      {k:'td',     l:'إجمالي الديون',  u:'ج.م'},
      {k:'ta',     l:'إجمالي الأصول', u:'ج.م'},
      {k:'dr',     l:'نسبة الدين',     u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.td) && v.td! < 0) { v._error = 'الديون لا يمكن أن تكون سالبة'; break; }
        if(n(v.ta) && v.ta! <= 0) { v._error = 'الأصول يجب أن تكون أكبر من صفر'; break; }
        if(n(v.td) && n(v.ta) && v.ta!>0 && !n(v.dr)) { v.dr = r((v.td!/v.ta!)*100); c=true; }
        if(n(v.dr) && n(v.ta) && !n(v.td)) { v.td = r((v.dr!/100)*v.ta!); c=true; }
        if(n(v.td) && n(v.dr) && v.dr!>0 && !n(v.ta)) { v.ta = r(v.td!/(v.dr!/100)); c=true; }
      }
      if(n(v.dr)) {
        if(v.dr! <= 30) v._decision = '🟢 ديون منخفضة (≤ 30%)';
        else if(v.dr! <= 50) v._decision = '🟡 ديون متوسطة (30-50%)';
        else if(v.dr! <= 70) v._decision = '🟠 ديون مرتفعة (50-70%)';
        else v._decision = '🔴 ديون خطيرة (> 70%)';
      }
      return v;
    },
    formula: 'نسبة الدين = (إجمالي الديون ÷ إجمالي الأصول) × 100',
    latex: '\\\\text{Debt Ratio} = \\\\frac{\\\\text{الديون}}{\\\\text{الأصول}} \\\\times 100'
  },
  {
    id: 'cash_conversion', title: 'دورة التحويل النقدي', icon: '🔄', color: '#B388FF',
    desc: 'CCC — الوقت بين الدفع للموردين واستلام النقد من العملاء',
    fields:[
      {k:'dio', l:'أيام المخزون (DIO)',      u:'يوم'},
      {k:'dso', l:'أيام المدينين (DSO)',      u:'يوم'},
      {k:'dpo', l:'أيام الدائنين (DPO)',      u:'يوم'},
      {k:'ccc', l:'دورة التحويل النقدي (CCC)',u:'يوم'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.dio) && v.dio! < 0) { v._error = 'أيام المخزون لا يمكن أن تكون سالبة'; break; }
        if(n(v.dso) && v.dso! < 0) { v._error = 'أيام المدينين لا يمكن أن تكون سالبة'; break; }
        if(n(v.dpo) && v.dpo! < 0) { v._error = 'أيام الدائنين لا يمكن أن تكون سالبة'; break; }
        if(n(v.dio) && n(v.dso) && n(v.dpo) && !n(v.ccc)) { v.ccc = r(v.dio! + v.dso! - v.dpo!); c=true; }
        if(n(v.ccc) && n(v.dso) && n(v.dpo) && !n(v.dio)) { v.dio = r(v.ccc! - v.dso! + v.dpo!); c=true; }
        if(n(v.ccc) && n(v.dio) && n(v.dpo) && !n(v.dso)) { v.dso = r(v.ccc! - v.dio! + v.dpo!); c=true; }
        if(n(v.ccc) && n(v.dio) && n(v.dso) && !n(v.dpo)) { v.dpo = r(v.dio! + v.dso! - v.ccc!); c=true; }
      }
      if(n(v.ccc)) {
        if(v.ccc! <= 30) v._decision = '🟢 دورة قصيرة — كفاءة عالية (≤ 30 يوم)';
        else if(v.ccc! <= 60) v._decision = '🟡 دورة متوسطة (30-60 يوم)';
        else if(v.ccc! <= 90) v._decision = '🟠 دورة طويلة (60-90 يوم)';
        else v._decision = '🔴 دورة طويلة جداً (> 90 يوم) — ضغط على السيولة';
      }
      return v;
    },
    formula: 'CCC = أيام المخزون + أيام المدينين − أيام الدائنين',
    latex: '\\\\text{CCC} = \\\\text{DIO} + \\\\text{DSO} - \\\\text{DPO}'
  },
  {
    id: 'operating_margin', title: 'هامش التشغيل', icon: '⚙️', color: '#82B1FF',
    desc: 'نسبة الربح التشغيلي من كل جنيه مبيعات',
    fields:[
      {k:'ebit', l:'الربح التشغيلي (EBIT)', u:'ج.م'},
      {k:'rev',  l:'صافي المبيعات',         u:'ج.م'},
      {k:'opm',  l:'هامش التشغيل',          u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rev) && v.rev! <= 0) { v._error = 'المبيعات يجب أن تكون أكبر من صفر'; break; }
        if(n(v.ebit) && n(v.rev) && v.rev!>0 && !n(v.opm)) { v.opm = r((v.ebit!/v.rev!)*100); c=true; }
        if(n(v.opm) && n(v.rev) && !n(v.ebit)) { v.ebit = r((v.opm!/100)*v.rev!); c=true; }
        if(n(v.opm) && n(v.ebit) && v.opm!>0 && !n(v.rev)) { v.rev = r(v.ebit!/(v.opm!/100)); c=true; }
      }
      if(n(v.opm)) {
        if(v.opm! >= 25) v._decision = '🟢 هامش تشغيلي ممتاز (≥ 25%)';
        else if(v.opm! >= 15) v._decision = '🟡 هامش تشغيلي جيد (15-25%)';
        else if(v.opm! >= 5) v._decision = '🟠 هامش تشغيلي ضعيف (5-15%)';
        else v._decision = '🔴 هامش سلبي أو شبه معدوم';
      }
      return v;
    },
    formula: 'هامش التشغيل = (EBIT ÷ المبيعات) × 100',
    latex: '\\\\text{OPM} = \\\\frac{\\\\text{EBIT}}{\\\\text{المبيعات}} \\\\times 100'
  },
  {
    id: 'ebitda_margin', title: 'هامش EBITDA', icon: '📈', color: '#80D8FF',
    desc: 'الربحية التشغيلية قبل الإهلاك والاستهلاك',
    fields:[
      {k:'ebit', l:'الربح التشغيلي (EBIT)',        u:'ج.م'},
      {k:'dep',  l:'الإهلاك والاستهلاك (D&A)',     u:'ج.م'},
      {k:'ebitda', l:'EBITDA',                       u:'ج.م'},
      {k:'rev',  l:'صافي المبيعات',                  u:'ج.م'},
      {k:'margin', l:'هامش EBITDA',                  u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(!n(v.dep)) v.dep = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rev) && v.rev! <= 0) { v._error = 'المبيعات يجب أن تكون أكبر من صفر'; break; }
        if(n(v.ebit) && n(v.dep) && !n(v.ebitda)) { v.ebitda = r(v.ebit! + v.dep!); c=true; }
        if(n(v.ebitda) && n(v.dep) && !n(v.ebit)) { v.ebit = r(v.ebitda! - v.dep!); c=true; }
        if(n(v.ebitda) && n(v.ebit) && !n(v.dep)) { v.dep = r(v.ebitda! - v.ebit!); c=true; }
        if(n(v.ebitda) && n(v.rev) && v.rev!>0 && !n(v.margin)) { v.margin = r((v.ebitda!/v.rev!)*100); c=true; }
        if(n(v.margin) && n(v.rev) && !n(v.ebitda)) { v.ebitda = r((v.margin!/100)*v.rev!); c=true; }
        if(n(v.margin) && n(v.ebitda) && v.margin!>0 && !n(v.rev)) { v.rev = r(v.ebitda!/(v.margin!/100)); c=true; }
      }
      if(n(v.margin)) {
        if(v.margin! >= 30) v._decision = '🟢 هامش EBITDA ممتاز (≥ 30%)';
        else if(v.margin! >= 15) v._decision = '🟡 هامش EBITDA جيد (15-30%)';
        else v._decision = '🔴 هامش EBITDA ضعيف (< 15%)';
      }
      return v;
    },
    formula: 'EBITDA = EBIT + D&A | الهامش = (EBITDA ÷ المبيعات) × 100',
    latex: '\\\\text{EBITDA Margin} = \\\\frac{\\\\text{EBIT} + \\\\text{D\\&A}}{\\\\text{المبيعات}} \\\\times 100'
  },
  {
    id: 'roa', title: 'العائد على الأصول', icon: '🏛️', color: '#A7FFEB',
    desc: 'كفاءة الأصول في توليد الأرباح (ROA مستقل)',
    fields:[
      {k:'ni',         l:'صافي الدخل',      u:'ج.م'},
      {k:'avg_assets', l:'متوسط الأصول',   u:'ج.م'},
      {k:'roa',        l:'العائد على الأصول',u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.avg_assets) && v.avg_assets! <= 0) { v._error = 'متوسط الأصول يجب أن يكون أكبر من صفر'; break; }
        if(n(v.ni) && n(v.avg_assets) && v.avg_assets!>0 && !n(v.roa)) { v.roa = r((v.ni!/v.avg_assets!)*100); c=true; }
        if(n(v.roa) && n(v.avg_assets) && !n(v.ni)) { v.ni = r((v.roa!/100)*v.avg_assets!); c=true; }
        if(n(v.roa) && n(v.ni) && v.roa!>0 && !n(v.avg_assets)) { v.avg_assets = r(v.ni!/(v.roa!/100)); c=true; }
      }
      if(n(v.roa)) {
        if(v.roa! >= 10) v._decision = '🟢 عائد ممتاز (≥ 10%)';
        else if(v.roa! >= 5) v._decision = '🟡 عائد مقبول (5-10%)';
        else v._decision = '🔴 عائد ضعيف (< 5%)';
      }
      return v;
    },
    formula: 'ROA = (صافي الدخل ÷ متوسط الأصول) × 100',
    latex: '\\\\text{ROA} = \\\\frac{\\\\text{صافي الدخل}}{\\\\text{متوسط الأصول}} \\\\times 100'
  },
  {
    id: 'pe_ratio', title: 'مكرر الأرباح', icon: '💹', color: '#CCFF90',
    desc: 'سعر السهم مقارنة بربحيته (P/E Ratio)',
    fields:[
      {k:'price', l:'سعر السهم السوقي', u:'ج.م'},
      {k:'eps',   l:'ربحية السهم (EPS)', u:'ج.م'},
      {k:'pe',    l:'مكرر الأرباح (P/E)',u:'مرة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.price) && v.price! < 0) { v._error = 'سعر السهم لا يمكن أن يكون سالباً'; break; }
        if(n(v.eps) && v.eps! <= 0) { v._error = 'ربحية السهم يجب أن تكون أكبر من صفر'; break; }
        if(n(v.price) && n(v.eps) && v.eps!>0 && !n(v.pe)) { v.pe = r(v.price!/v.eps!); c=true; }
        if(n(v.pe) && n(v.eps) && !n(v.price)) { v.price = r(v.pe!*v.eps!); c=true; }
        if(n(v.price) && n(v.pe) && v.pe!>0 && !n(v.eps)) { v.eps = r(v.price!/v.pe!); c=true; }
      }
      if(n(v.pe)) {
        if(v.pe! <= 10) v._decision = '🟢 سهم رخيص (P/E ≤ 10)';
        else if(v.pe! <= 20) v._decision = '🟡 تقييم عادل (P/E 10-20)';
        else if(v.pe! <= 40) v._decision = '🟠 تقييم مرتفع (P/E 20-40)';
        else v._decision = '🔴 مُبالغ في التقييم (P/E > 40)';
      }
      return v;
    },
    formula: 'P/E = سعر السهم ÷ ربحية السهم',
    latex: '\\\\text{P/E} = \\\\frac{\\\\text{سعر السهم}}{\\\\text{EPS}}'
  },
  {
    id: 'book_value_ps', title: 'القيمة الدفترية للسهم', icon: '📖', color: '#F4FF81',
    desc: 'نصيب السهم من حقوق الملكية',
    fields:[
      {k:'eq',     l:'حقوق الملكية',       u:'ج.م'},
      {k:'pref',   l:'أسهم ممتازة (خصم)',   u:'ج.م'},
      {k:'shares', l:'عدد الأسهم العادية', u:'سهم'},
      {k:'bvps',   l:'القيمة الدفترية/سهم', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      if(!n(v.pref)) v.pref = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.shares) && v.shares! <= 0) { v._error = 'عدد الأسهم يجب أن يكون أكبر من صفر'; break; }
        if(n(v.eq) && n(v.shares) && v.shares!>0 && !n(v.bvps)) { v.bvps = r((v.eq! - (v.pref||0)) / v.shares!); c=true; }
        if(n(v.bvps) && n(v.shares) && !n(v.eq)) { v.eq = r(v.bvps! * v.shares! + (v.pref||0)); c=true; }
        if(n(v.eq) && n(v.bvps) && v.bvps!>0 && !n(v.shares)) { v.shares = r((v.eq! - (v.pref||0)) / v.bvps!); c=true; }
      }
      return v;
    },
    formula: 'BVPS = (حقوق الملكية − أسهم ممتازة) ÷ عدد الأسهم',
    latex: '\\\\text{BVPS} = \\\\frac{\\\\text{حقوق الملكية} - \\\\text{ممتازة}}{\\\\text{عدد الأسهم}}'
  },
  {
    id: 'pb_ratio', title: 'السعر / القيمة الدفترية', icon: '📐', color: '#84FFFF',
    desc: 'مقارنة سعر السهم بقيمته الدفترية (P/B)',
    fields:[
      {k:'price', l:'سعر السهم السوقي', u:'ج.م'},
      {k:'bvps',  l:'القيمة الدفترية/سهم', u:'ج.م'},
      {k:'pb',    l:'نسبة P/B',           u:'مرة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.bvps) && v.bvps! <= 0) { v._error = 'القيمة الدفترية يجب أن تكون أكبر من صفر'; break; }
        if(n(v.price) && n(v.bvps) && v.bvps!>0 && !n(v.pb)) { v.pb = r(v.price!/v.bvps!); c=true; }
        if(n(v.pb) && n(v.bvps) && !n(v.price)) { v.price = r(v.pb!*v.bvps!); c=true; }
        if(n(v.price) && n(v.pb) && v.pb!>0 && !n(v.bvps)) { v.bvps = r(v.price!/v.pb!); c=true; }
      }
      if(n(v.pb)) {
        if(v.pb! < 1) v._decision = '🟢 السهم أقل من قيمته الدفترية (P/B < 1)';
        else if(v.pb! <= 3) v._decision = '🟡 تقييم معقول (P/B 1-3)';
        else v._decision = '🔴 تقييم مرتفع (P/B > 3)';
      }
      return v;
    },
    formula: 'P/B = سعر السهم ÷ القيمة الدفترية للسهم',
    latex: '\\\\text{P/B} = \\\\frac{\\\\text{سعر السوق}}{\\\\text{BVPS}}'
  },
  {
    id: 'dividend_payout', title: 'نسبة توزيع الأرباح', icon: '💵', color: '#B9F6CA',
    desc: 'نسبة الأرباح الموزعة من صافي الدخل',
    fields:[
      {k:'div',  l:'إجمالي التوزيعات', u:'ج.م'},
      {k:'ni',   l:'صافي الدخل',       u:'ج.م'},
      {k:'dpr',  l:'نسبة التوزيع',     u:'%'},
      {k:'rr',   l:'نسبة الاحتفاظ',    u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.ni) && v.ni! <= 0) { v._error = 'صافي الدخل يجب أن يكون أكبر من صفر'; break; }
        if(n(v.div) && v.div! < 0) { v._error = 'التوزيعات لا يمكن أن تكون سالبة'; break; }
        if(n(v.div) && n(v.ni) && v.ni!>0 && !n(v.dpr)) { v.dpr = r((v.div!/v.ni!)*100); c=true; }
        if(n(v.dpr) && n(v.ni) && !n(v.div)) { v.div = r((v.dpr!/100)*v.ni!); c=true; }
        if(n(v.div) && n(v.dpr) && v.dpr!>0 && !n(v.ni)) { v.ni = r(v.div!/(v.dpr!/100)); c=true; }
        if(n(v.dpr) && !n(v.rr)) { v.rr = r(100 - v.dpr!); c=true; }
        if(n(v.rr) && !n(v.dpr)) { v.dpr = r(100 - v.rr!); c=true; }
      }
      return v;
    },
    formula: 'نسبة التوزيع = (التوزيعات ÷ صافي الدخل) × 100 | الاحتفاظ = 100 − التوزيع',
    latex: '\\\\text{DPR} = \\\\frac{\\\\text{التوزيعات}}{\\\\text{صافي الدخل}} \\\\times 100'
  },
  {
    id: 'dividend_yield', title: 'عائد التوزيعات', icon: '🌿', color: '#69F0AE',
    desc: 'نسبة العائد النقدي للمستثمر من التوزيعات',
    fields:[
      {k:'dps',   l:'توزيعات السهم السنوية', u:'ج.م'},
      {k:'price', l:'سعر السهم السوقي',      u:'ج.م'},
      {k:'dy',    l:'عائد التوزيعات',        u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.price) && v.price! <= 0) { v._error = 'سعر السهم يجب أن يكون أكبر من صفر'; break; }
        if(n(v.dps) && v.dps! < 0) { v._error = 'التوزيعات لا يمكن أن تكون سالبة'; break; }
        if(n(v.dps) && n(v.price) && v.price!>0 && !n(v.dy)) { v.dy = r((v.dps!/v.price!)*100); c=true; }
        if(n(v.dy) && n(v.price) && !n(v.dps)) { v.dps = r((v.dy!/100)*v.price!); c=true; }
        if(n(v.dps) && n(v.dy) && v.dy!>0 && !n(v.price)) { v.price = r(v.dps!/(v.dy!/100)); c=true; }
      }
      if(n(v.dy)) {
        if(v.dy! >= 5) v._decision = '🟢 عائد توزيعات مرتفع (≥ 5%)';
        else if(v.dy! >= 2) v._decision = '🟡 عائد توزيعات معتدل (2-5%)';
        else v._decision = '🔴 عائد توزيعات منخفض (< 2%)';
      }
      return v;
    },
    formula: 'عائد التوزيعات = (توزيعات السهم ÷ سعر السوق) × 100',
    latex: '\\\\text{DY} = \\\\frac{\\\\text{DPS}}{\\\\text{سعر السوق}} \\\\times 100'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 5 — التقييم والاستثمار المتقدم
  // ══════════════════════════════════════════════════════
  {
    id: 'capm', title: 'نموذج CAPM', icon: '📐', color: '#FF9E80',
    desc: 'تسعير الأصول الرأسمالية لتقدير تكلفة حقوق الملكية',
    fields:[
      {k:'rf',  l:'معدل العائد الخالي من المخاطر', u:'%'},
      {k:'beta',l:'معامل بيتا (β)',                u:''},
      {k:'rm',  l:'عائد السوق المتوقع',            u:'%'},
      {k:'rp',  l:'علاوة المخاطر (Rm−Rf)',          u:'%'},
      {k:'ke',  l:'تكلفة حقوق الملكية (Ke)',       u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rf) && v.rf! < 0) { v._error = 'معدل العائد الخالي من المخاطر لا يمكن أن يكون سالباً'; break; }
        if(n(v.rm) && n(v.rf) && !n(v.rp)) { v.rp = r(v.rm! - v.rf!); c=true; }
        if(n(v.rp) && n(v.rf) && !n(v.rm)) { v.rm = r(v.rf! + v.rp!); c=true; }
        if(n(v.rm) && n(v.rp) && !n(v.rf)) { v.rf = r(v.rm! - v.rp!); c=true; }
        if(n(v.rf) && n(v.beta) && n(v.rp) && !n(v.ke)) { v.ke = r(v.rf! + v.beta! * v.rp!); c=true; }
        if(n(v.ke) && n(v.rf) && n(v.rp) && v.rp!>0 && !n(v.beta)) { v.beta = r((v.ke! - v.rf!) / v.rp!); c=true; }
        if(n(v.ke) && n(v.beta) && n(v.rp) && !n(v.rf)) { v.rf = r(v.ke! - v.beta! * v.rp!); c=true; }
      }
      if(n(v.beta)) {
        if(v.beta! < 1) v._decision = '🟢 مخاطر أقل من السوق (β < 1)';
        else if(v.beta! === 1) v._decision = '🟡 مخاطر مساوية للسوق (β = 1)';
        else v._decision = '🔴 مخاطر أعلى من السوق (β > 1)';
      }
      return v;
    },
    formula: 'Ke = Rf + β × (Rm − Rf)',
    latex: '\\\\text{Ke} = R_f + \\\\beta \\\\times (R_m - R_f)'
  },
  {
    id: 'wacc', title: 'WACC — تكلفة رأس المال', icon: '⚖️', color: '#FFD180',
    desc: 'المتوسط المرجح لتكلفة رأس المال (حقوق ملكية + ديون)',
    fields:[
      {k:'ke',   l:'تكلفة حقوق الملكية (Ke)', u:'%'},
      {k:'we',   l:'نسبة حقوق الملكية',       u:'%'},
      {k:'kd',   l:'تكلفة الدين (Kd)',         u:'%'},
      {k:'wd',   l:'نسبة الديون',              u:'%'},
      {k:'tax',  l:'معدل الضريبة',             u:'%'},
      {k:'kd_at',l:'تكلفة الدين بعد الضريبة', u:'%'},
      {k:'wacc', l:'WACC',                      u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(!n(v.tax)) v.tax = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.we) && n(v.wd) && Math.abs(v.we! + v.wd! - 100) > 0.01) {
          v._error = 'مجموع نسبة الملكية + الديون يجب أن يساوي 100%'; break;
        }
        if(n(v.we) && !n(v.wd)) { v.wd = r(100 - v.we!); c=true; }
        if(n(v.wd) && !n(v.we)) { v.we = r(100 - v.wd!); c=true; }
        if(n(v.kd) && n(v.tax) && !n(v.kd_at)) { v.kd_at = r(v.kd! * (1 - v.tax!/100)); c=true; }
        if(n(v.kd_at) && n(v.tax) && (100-v.tax!)>0 && !n(v.kd)) { v.kd = r(v.kd_at! / (1 - v.tax!/100)); c=true; }
        if(n(v.ke) && n(v.we) && n(v.kd_at) && n(v.wd) && !n(v.wacc)) {
          v.wacc = r(v.ke! * (v.we!/100) + v.kd_at! * (v.wd!/100)); c=true;
        }
      }
      return v;
    },
    formula: 'WACC = Ke×We + Kd×(1−T)×Wd',
    latex: '\\\\text{WACC} = K_e \\\\times W_e + K_d(1-T) \\\\times W_d'
  },
  {
    id: 'irr', title: 'معدل العائد الداخلي', icon: '🎯', color: '#FF8A65',
    desc: 'IRR — المعدل الذي يجعل NPV = صفر (Newton-Raphson)',
    fields:[
      {k:'invest',  l:'الاستثمار الأولي',       u:'ج.م'},
      {k:'cf1',     l:'تدفق السنة 1',           u:'ج.م'},
      {k:'cf2',     l:'تدفق السنة 2',           u:'ج.م'},
      {k:'cf3',     l:'تدفق السنة 3',           u:'ج.م'},
      {k:'cf4',     l:'تدفق السنة 4',           u:'ج.م'},
      {k:'cf5',     l:'تدفق السنة 5',           u:'ج.م'},
      {k:'irr_val', l:'معدل العائد الداخلي IRR', u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(!n(v.invest) || v.invest! <= 0) { if(n(v.invest)) v._error = 'الاستثمار يجب أن يكون أكبر من صفر'; return v; }
      const cfs: number[] = [-v.invest!];
      const cfKeys = ['cf1','cf2','cf3','cf4','cf5'];
      let hasCF = false;
      for(const k of cfKeys) {
        if(n(v[k])) { cfs.push(v[k]!); hasCF = true; }
        else break;
      }
      if(!hasCF) return v;
      // Newton-Raphson IRR calculation
      const npvAt = (rate: number): number => {
        let s = 0;
        for(let t=0; t<cfs.length; t++) s += cfs[t] / Math.pow(1+rate, t);
        return s;
      };
      const dnpvAt = (rate: number): number => {
        let s = 0;
        for(let t=1; t<cfs.length; t++) s += -t * cfs[t] / Math.pow(1+rate, t+1);
        return s;
      };
      let guess = 0.1;
      for(let iter=0; iter<200; iter++){
        const f = npvAt(guess);
        const df = dnpvAt(guess);
        if(Math.abs(df) < 1e-14) break;
        const next = guess - f / df;
        if(Math.abs(next - guess) < 1e-10) { guess = next; break; }
        guess = next;
        if(guess < -0.99) { guess = -0.99; break; }
        if(guess > 10) { guess = 10; break; }
      }
      if(!n(v.irr_val)) v.irr_val = r(guess * 100);
      if(n(v.irr_val)) {
        if(v.irr_val! >= 20) v._decision = '🟢 IRR ممتاز (≥ 20%)';
        else if(v.irr_val! >= 10) v._decision = '🟡 IRR مقبول (10-20%)';
        else if(v.irr_val! >= 0) v._decision = '🟠 IRR ضعيف (0-10%)';
        else v._decision = '🔴 IRR سالب — المشروع غير مجدي';
      }
      return v;
    },
    formula: 'IRR هو المعدل الذي يجعل NPV = 0 | يُحسب بخوارزمية Newton-Raphson',
    latex: '\\\\sum_{t=0}^{n} \\\\frac{CF_t}{(1+IRR)^t} = 0'
  },
  {
    id: 'npv_uneven', title: 'NPV تدفقات غير متساوية', icon: '📊', color: '#FFE57F',
    desc: 'صافي القيمة الحالية لتدفقات مختلفة كل سنة',
    fields:[
      {k:'invest', l:'الاستثمار الأولي',   u:'ج.م'},
      {k:'rate',   l:'معدل الخصم',          u:'%'},
      {k:'cf1',    l:'تدفق السنة 1',        u:'ج.م'},
      {k:'cf2',    l:'تدفق السنة 2',        u:'ج.م'},
      {k:'cf3',    l:'تدفق السنة 3',        u:'ج.م'},
      {k:'cf4',    l:'تدفق السنة 4',        u:'ج.م'},
      {k:'cf5',    l:'تدفق السنة 5',        u:'ج.م'},
      {k:'pv_total',l:'إجمالي PV للتدفقات',u:'ج.م'},
      {k:'npv',    l:'صافي القيمة الحالية', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(n(v.rate) && v.rate! < 0) { v._error = 'معدل الخصم لا يمكن أن يكون سالباً'; return v; }
      const rr = n(v.rate) ? v.rate!/100 : null;
      if(rr === null) return v;
      const cfKeys = ['cf1','cf2','cf3','cf4','cf5'];
      let pvSum = 0;
      let hasCF = false;
      for(let t=0; t<cfKeys.length; t++) {
        if(n(v[cfKeys[t]])) {
          pvSum += v[cfKeys[t]]! / Math.pow(1+rr, t+1);
          hasCF = true;
        }
      }
      if(!hasCF) return v;
      if(!n(v.pv_total)) v.pv_total = r(pvSum);
      if(n(v.pv_total) && n(v.invest) && !n(v.npv)) v.npv = r(v.pv_total! - v.invest!);
      if(n(v.npv)) {
        if(v.npv! > 0) v._decision = '🟢 NPV موجب — مشروع مجدي';
        else if(v.npv! < 0) v._decision = '🔴 NPV سالب — مشروع غير مجدي';
        else v._decision = '🟡 NPV = صفر — عائد يساوي تكلفة رأس المال';
      }
      return v;
    },
    formula: 'NPV = Σ(CFt/(1+r)^t) − الاستثمار',
    latex: '\\\\text{NPV} = \\\\sum_{t=1}^{n} \\\\frac{CF_t}{(1+r)^t} - I_0'
  },
  {
    id: 'eva', title: 'القيمة الاقتصادية المضافة', icon: '💎', color: '#FF80AB',
    desc: 'EVA — هل الشركة تخلق قيمة فعلية لمساهميها؟',
    fields:[
      {k:'nopat',  l:'صافي الربح التشغيلي بعد الضريبة', u:'ج.م'},
      {k:'capital',l:'رأس المال المستثمر',              u:'ج.م'},
      {k:'wacc',   l:'WACC',                             u:'%'},
      {k:'cap_charge',l:'تكلفة رأس المال',              u:'ج.م'},
      {k:'eva',    l:'EVA',                               u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.capital) && v.capital! < 0) { v._error = 'رأس المال لا يمكن أن يكون سالباً'; break; }
        if(n(v.capital) && n(v.wacc) && !n(v.cap_charge)) { v.cap_charge = r(v.capital! * (v.wacc!/100)); c=true; }
        if(n(v.cap_charge) && n(v.wacc) && v.wacc!>0 && !n(v.capital)) { v.capital = r(v.cap_charge! / (v.wacc!/100)); c=true; }
        if(n(v.cap_charge) && n(v.capital) && v.capital!>0 && !n(v.wacc)) { v.wacc = r((v.cap_charge!/v.capital!)*100); c=true; }
        if(n(v.nopat) && n(v.cap_charge) && !n(v.eva)) { v.eva = r(v.nopat! - v.cap_charge!); c=true; }
        if(n(v.eva) && n(v.cap_charge) && !n(v.nopat)) { v.nopat = r(v.eva! + v.cap_charge!); c=true; }
        if(n(v.eva) && n(v.nopat) && !n(v.cap_charge)) { v.cap_charge = r(v.nopat! - v.eva!); c=true; }
      }
      if(n(v.eva)) {
        if(v.eva! > 0) v._decision = '🟢 الشركة تخلق قيمة — EVA موجب بـ ' + v.eva! + ' ج.م';
        else if(v.eva! < 0) v._decision = '🔴 الشركة تدمر قيمة — EVA سالب بـ ' + Math.abs(v.eva!) + ' ج.م';
        else v._decision = '🟡 EVA = صفر — لا قيمة مضافة';
      }
      return v;
    },
    formula: 'EVA = NOPAT − (Capital × WACC)',
    latex: '\\\\text{EVA} = \\\\text{NOPAT} - (\\\\text{Capital} \\\\times \\\\text{WACC})'
  },
  {
    id: 'fcf', title: 'التدفق النقدي الحر', icon: '💸', color: '#A7FFEB',
    desc: 'FCF — النقد المتاح بعد الإنفاق الرأسمالي',
    fields:[
      {k:'ocf',   l:'التدفق النقدي التشغيلي', u:'ج.م'},
      {k:'capex', l:'الإنفاق الرأسمالي (CapEx)',u:'ج.م'},
      {k:'fcf',   l:'التدفق النقدي الحر (FCF)', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.capex) && v.capex! < 0) { v._error = 'الإنفاق الرأسمالي لا يمكن أن يكون سالباً'; break; }
        if(n(v.ocf) && n(v.capex) && !n(v.fcf)) { v.fcf = r(v.ocf! - v.capex!); c=true; }
        if(n(v.fcf) && n(v.capex) && !n(v.ocf)) { v.ocf = r(v.fcf! + v.capex!); c=true; }
        if(n(v.ocf) && n(v.fcf) && !n(v.capex)) { v.capex = r(v.ocf! - v.fcf!); c=true; }
      }
      if(n(v.fcf)) {
        if(v.fcf! > 0) v._decision = '🟢 تدفق حر موجب — قدرة على التوزيع والنمو';
        else v._decision = '🔴 تدفق حر سالب — الشركة تستهلك أكثر مما تولد';
      }
      return v;
    },
    formula: 'FCF = التدفق التشغيلي − الإنفاق الرأسمالي',
    latex: '\\\\text{FCF} = \\\\text{OCF} - \\\\text{CapEx}'
  },
  {
    id: 'dcf', title: 'تقييم DCF', icon: '🏆', color: '#FFD740',
    desc: 'تقييم الشركة بالتدفقات النقدية المخصومة + القيمة النهائية',
    fields:[
      {k:'fcf',    l:'التدفق الحر السنوي الحالي', u:'ج.م'},
      {k:'g',      l:'معدل النمو',                u:'%'},
      {k:'wacc',   l:'WACC (معدل الخصم)',          u:'%'},
      {k:'n',      l:'سنوات التوقع',               u:'سنة'},
      {k:'pv_fcf', l:'PV التدفقات المتوقعة',       u:'ج.م'},
      {k:'tv',     l:'القيمة النهائية (Terminal)',   u:'ج.م'},
      {k:'pv_tv',  l:'PV القيمة النهائية',          u:'ج.م'},
      {k:'ev',     l:'قيمة المنشأة (EV)',           u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.wacc) && n(v.g) && v.wacc! <= v.g!) { v._error = 'WACC يجب أن يكون أكبر من معدل النمو (شرط Gordon)'; break; }
        if(n(v.n) && v.n! <= 0) { v._error = 'عدد السنوات يجب أن يكون أكبر من صفر'; break; }
        if(n(v.fcf) && v.fcf! < 0) { v._error = 'التدفق الحر لا يمكن أن يكون سالباً'; break; }
        const rr = n(v.wacc) ? v.wacc!/100 : null;
        const gg = n(v.g) ? v.g!/100 : null;
        // PV of growing FCFs
        if(n(v.fcf) && rr !== null && gg !== null && n(v.n) && !n(v.pv_fcf)) {
          let pv = 0;
          let cf = v.fcf!;
          for(let t=1; t<=v.n!; t++){
            cf = (t === 1) ? v.fcf! * (1+gg) : cf * (1+gg);
            pv += cf / Math.pow(1+rr, t);
          }
          v.pv_fcf = r(pv); c=true;
        }
        // Terminal Value (Gordon Growth)
        if(n(v.fcf) && rr !== null && gg !== null && n(v.n) && (rr-gg)>0 && !n(v.tv)) {
          let lastFCF = v.fcf!;
          for(let t=0; t<v.n!; t++) lastFCF *= (1+gg);
          v.tv = r(lastFCF * (1+gg) / (rr - gg)); c=true;
        }
        // PV of TV
        if(n(v.tv) && rr !== null && n(v.n) && !n(v.pv_tv)) {
          v.pv_tv = r(v.tv! / Math.pow(1+rr, v.n!)); c=true;
        }
        // Enterprise Value
        if(n(v.pv_fcf) && n(v.pv_tv) && !n(v.ev)) { v.ev = r(v.pv_fcf! + v.pv_tv!); c=true; }
      }
      return v;
    },
    formula: 'EV = PV(FCFs) + PV(Terminal Value) | TV = FCF(1+g)/(WACC−g)',
    latex: '\\\\text{EV} = \\\\sum \\\\frac{FCF(1+g)^t}{(1+WACC)^t} + \\\\frac{TV}{(1+WACC)^n}'
  },
  {
    id: 'profitability_index', title: 'مؤشر الربحية', icon: '📊', color: '#80CBC4',
    desc: 'PI — العائد لكل جنيه استثمار لترتيب المشاريع',
    fields:[
      {k:'pv_cf',  l:'PV التدفقات المستقبلية', u:'ج.م'},
      {k:'invest', l:'الاستثمار الأولي',        u:'ج.م'},
      {k:'pi',     l:'مؤشر الربحية (PI)',       u:''},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.invest) && v.invest! <= 0) { v._error = 'الاستثمار يجب أن يكون أكبر من صفر'; break; }
        if(n(v.pv_cf) && n(v.invest) && v.invest!>0 && !n(v.pi)) { v.pi = r(v.pv_cf!/v.invest!); c=true; }
        if(n(v.pi) && n(v.invest) && !n(v.pv_cf)) { v.pv_cf = r(v.pi!*v.invest!); c=true; }
        if(n(v.pv_cf) && n(v.pi) && v.pi!>0 && !n(v.invest)) { v.invest = r(v.pv_cf!/v.pi!); c=true; }
      }
      if(n(v.pi)) {
        if(v.pi! > 1) v._decision = '🟢 مشروع مجدي (PI > 1)';
        else if(v.pi! === 1) v._decision = '🟡 نقطة التعادل (PI = 1)';
        else v._decision = '🔴 مشروع غير مجدي (PI < 1)';
      }
      return v;
    },
    formula: 'PI = PV(التدفقات) ÷ الاستثمار',
    latex: '\\\\text{PI} = \\\\frac{\\\\text{PV(CFs)}}{\\\\text{I_0}}'
  },
  {
    id: 'discounted_payback', title: 'فترة الاسترداد المخصومة', icon: '⏳', color: '#E6EE9C',
    desc: 'فترة استرداد الاستثمار مع مراعاة القيمة الزمنية للنقود',
    fields:[
      {k:'invest',    l:'الاستثمار الأولي',     u:'ج.م'},
      {k:'annual_cf', l:'التدفق النقدي السنوي', u:'ج.م'},
      {k:'rate',      l:'معدل الخصم',            u:'%'},
      {k:'dpb',       l:'فترة الاسترداد المخصومة',u:'سنة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.invest) && v.invest! <= 0) { v._error = 'الاستثمار يجب أن يكون أكبر من صفر'; break; }
        if(n(v.annual_cf) && v.annual_cf! <= 0) { v._error = 'التدفق النقدي يجب أن يكون أكبر من صفر'; break; }
        if(n(v.rate) && v.rate! < 0) { v._error = 'معدل الخصم لا يمكن أن يكون سالباً'; break; }
        if(n(v.invest) && n(v.annual_cf) && n(v.rate) && !n(v.dpb)) {
          const rr = v.rate!/100;
          let cumPV = 0;
          let found = false;
          for(let t=1; t<=100; t++) {
            cumPV += v.annual_cf! / Math.pow(1+rr, t);
            if(cumPV >= v.invest!) {
              const prevCum = cumPV - v.annual_cf! / Math.pow(1+rr, t);
              const remaining = v.invest! - prevCum;
              const pvThisYear = v.annual_cf! / Math.pow(1+rr, t);
              v.dpb = r(t - 1 + remaining / pvThisYear);
              found = true;
              break;
            }
          }
          if(!found) v._error = 'الاستثمار لا يُسترد خلال 100 سنة';
          c=true;
        }
      }
      if(n(v.dpb)) {
        if(v.dpb! <= 3) v._decision = '🟢 استرداد سريع (≤ 3 سنوات)';
        else if(v.dpb! <= 5) v._decision = '🟡 استرداد متوسط (3-5 سنوات)';
        else v._decision = '🔴 استرداد بطيء (> 5 سنوات)';
      }
      return v;
    },
    formula: 'مثل Payback لكن التدفقات تُخصم بمعدل r',
    latex: '\\\\sum_{t=1}^{DPB} \\\\frac{CF}{(1+r)^t} = I_0'
  },
  {
    id: 'terminal_value', title: 'القيمة النهائية', icon: '🏁', color: '#FFD180',
    desc: 'Terminal Value — قيمة الشركة بعد فترة التوقع (Gordon Growth)',
    fields:[
      {k:'fcf',  l:'آخر تدفق حر متوقع',     u:'ج.م'},
      {k:'g',    l:'معدل النمو الدائم',       u:'%'},
      {k:'wacc', l:'WACC (معدل الخصم)',        u:'%'},
      {k:'tv',   l:'القيمة النهائية',          u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.wacc) && n(v.g) && v.wacc! <= v.g!) { v._error = 'WACC يجب أن يكون أكبر من معدل النمو'; break; }
        if(n(v.fcf) && v.fcf! < 0) { v._error = 'التدفق الحر لا يمكن أن يكون سالباً'; break; }
        const rr = n(v.wacc) ? v.wacc!/100 : null;
        const gg = n(v.g) ? v.g!/100 : null;
        if(n(v.fcf) && rr !== null && gg !== null && (rr-gg)>0 && !n(v.tv)) {
          v.tv = r(v.fcf! * (1+gg) / (rr - gg)); c=true;
        }
        if(n(v.tv) && rr !== null && gg !== null && (rr-gg)>0 && !n(v.fcf)) {
          v.fcf = r(v.tv! * (rr - gg) / (1+gg)); c=true;
        }
      }
      return v;
    },
    formula: 'TV = FCF × (1+g) ÷ (WACC − g)',
    latex: '\\\\text{TV} = \\\\frac{\\\\text{FCF} \\\\times (1+g)}{\\\\text{WACC} - g}'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 6 — الضرائب المتقدمة
  // ══════════════════════════════════════════════════════
  {
    id: 'progressive_tax', title: 'ضريبة الدخل التصاعدية', icon: '🏛️', color: '#FFAB91',
    desc: 'حساب الضريبة على شرائح الدخل المتصاعدة',
    fields:[
      {k:'income',   l:'الدخل الخاضع للضريبة',u:'ج.م'},
      {k:'exempt',   l:'حد الإعفاء',           u:'ج.م'},
      {k:'rate1',    l:'نسبة الشريحة 1',       u:'%'},
      {k:'limit1',   l:'حد الشريحة 1',         u:'ج.م'},
      {k:'rate2',    l:'نسبة الشريحة 2',       u:'%'},
      {k:'limit2',   l:'حد الشريحة 2',         u:'ج.م'},
      {k:'rate3',    l:'نسبة الشريحة 3 (المتبقي)',u:'%'},
      {k:'tax',      l:'إجمالي الضريبة',       u:'ج.م'},
      {k:'eff_rate', l:'المعدل الفعلي',        u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      if(!n(v.exempt)) v.exempt = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.income) && v.income! < 0) { v._error = 'الدخل لا يمكن أن يكون سالباً'; break; }
        if(n(v.income) && n(v.rate1) && n(v.limit1) && n(v.rate2) && n(v.limit2) && n(v.rate3) && !n(v.tax)) {
          let taxable = v.income! - (v.exempt||0);
          if(taxable < 0) taxable = 0;
          let tax = 0;
          // Bracket 1
          const b1 = Math.min(taxable, v.limit1!);
          tax += b1 * (v.rate1!/100);
          taxable -= b1;
          // Bracket 2
          if(taxable > 0) {
            const b2 = Math.min(taxable, v.limit2! - v.limit1!);
            tax += b2 * (v.rate2!/100);
            taxable -= b2;
          }
          // Bracket 3 (remainder)
          if(taxable > 0) {
            tax += taxable * (v.rate3!/100);
          }
          v.tax = r(tax); c=true;
        }
        if(n(v.tax) && n(v.income) && v.income!>0 && !n(v.eff_rate)) {
          v.eff_rate = r((v.tax!/v.income!)*100); c=true;
        }
      }
      return v;
    },
    formula: 'الضريبة = مجموع (كل شريحة × نسبتها) | المعدل الفعلي = الضريبة ÷ الدخل',
    latex: '\\\\text{Tax} = \\\\sum (\\\\text{شريحة}_i \\\\times \\\\text{نسبة}_i)'
  },
  {
    id: 'deferred_tax', title: 'الضريبة المؤجلة', icon: '📋', color: '#BCAAA4',
    desc: 'الفرق بين الضريبة المحاسبية والضريبية (مؤجلة/مدفوعة مقدماً)',
    fields:[
      {k:'book_inc',l:'الدخل المحاسبي',          u:'ج.م'},
      {k:'tax_inc', l:'الدخل الضريبي',            u:'ج.م'},
      {k:'temp_diff',l:'الفرق المؤقت',             u:'ج.م'},
      {k:'tax_rate',l:'معدل الضريبة',             u:'%'},
      {k:'dtl',     l:'التزام ضريبي مؤجل (DTL)', u:'ج.م'},
      {k:'dta',     l:'أصل ضريبي مؤجل (DTA)',    u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.tax_rate) && (v.tax_rate! < 0 || v.tax_rate! > 100)) { v._error = 'معدل الضريبة يجب أن يكون بين 0 و 100%'; break; }
        if(n(v.book_inc) && n(v.tax_inc) && !n(v.temp_diff)) { v.temp_diff = r(v.book_inc! - v.tax_inc!); c=true; }
        if(n(v.temp_diff) && n(v.tax_inc) && !n(v.book_inc)) { v.book_inc = r(v.temp_diff! + v.tax_inc!); c=true; }
        if(n(v.temp_diff) && n(v.book_inc) && !n(v.tax_inc)) { v.tax_inc = r(v.book_inc! - v.temp_diff!); c=true; }
        if(n(v.temp_diff) && n(v.tax_rate)) {
          if(v.temp_diff! > 0 && !n(v.dtl)) { v.dtl = r(v.temp_diff! * (v.tax_rate!/100)); v.dta = 0; c=true; }
          if(v.temp_diff! < 0 && !n(v.dta)) { v.dta = r(Math.abs(v.temp_diff!) * (v.tax_rate!/100)); v.dtl = 0; c=true; }
          if(v.temp_diff! === 0) { v.dtl = 0; v.dta = 0; c=true; }
        }
      }
      if(n(v.temp_diff)) {
        if(v.temp_diff! > 0) v._decision = '📊 فرق موجب → التزام ضريبي مؤجل (DTL)';
        else if(v.temp_diff! < 0) v._decision = '📊 فرق سالب → أصل ضريبي مؤجل (DTA)';
        else v._decision = '✅ لا يوجد فرق مؤقت';
      }
      return v;
    },
    formula: 'الفرق المؤقت = دخل محاسبي − دخل ضريبي | DTL/DTA = الفرق × معدل الضريبة',
    latex: '\\\\text{DTL} = (\\\\text{محاسبي} - \\\\text{ضريبي}) \\\\times T'
  },
  {
    id: 'effective_tax_rate', title: 'معدل الضريبة الفعلي', icon: '📊', color: '#D7CCC8',
    desc: 'المعدل الحقيقي للضريبة المدفوعة من الدخل',
    fields:[
      {k:'tax_exp', l:'مصروف الضريبة',       u:'ج.م'},
      {k:'ebt',     l:'الدخل قبل الضريبة',   u:'ج.م'},
      {k:'etr',     l:'المعدل الفعلي',        u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.ebt) && v.ebt! <= 0) { v._error = 'الدخل قبل الضريبة يجب أن يكون أكبر من صفر'; break; }
        if(n(v.tax_exp) && n(v.ebt) && v.ebt!>0 && !n(v.etr)) { v.etr = r((v.tax_exp!/v.ebt!)*100); c=true; }
        if(n(v.etr) && n(v.ebt) && !n(v.tax_exp)) { v.tax_exp = r((v.etr!/100)*v.ebt!); c=true; }
        if(n(v.tax_exp) && n(v.etr) && v.etr!>0 && !n(v.ebt)) { v.ebt = r(v.tax_exp!/(v.etr!/100)); c=true; }
      }
      return v;
    },
    formula: 'ETR = (مصروف الضريبة ÷ الدخل قبل الضريبة) × 100',
    latex: '\\\\text{ETR} = \\\\frac{\\\\text{مصروف الضريبة}}{\\\\text{EBT}} \\\\times 100'
  },
  {
    id: 'tax_shield', title: 'الدرع الضريبي', icon: '🛡️', color: '#CFD8DC',
    desc: 'الوفر الضريبي من تكلفة الفوائد على الديون',
    fields:[
      {k:'int_exp', l:'مصاريف الفوائد',    u:'ج.م'},
      {k:'dep_exp', l:'مصروف الإهلاك',      u:'ج.م'},
      {k:'tax_rate',l:'معدل الضريبة',       u:'%'},
      {k:'shield',  l:'إجمالي الدرع الضريبي',u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      if(!n(v.dep_exp)) v.dep_exp = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.tax_rate) && (v.tax_rate! < 0 || v.tax_rate! > 100)) { v._error = 'المعدل يجب أن يكون بين 0 و 100'; break; }
        if(n(v.int_exp) && n(v.tax_rate) && !n(v.shield)) {
          v.shield = r((v.int_exp! + (v.dep_exp||0)) * (v.tax_rate!/100)); c=true;
        }
      }
      return v;
    },
    formula: 'الدرع = (فوائد + إهلاك) × معدل الضريبة',
    latex: '\\\\text{Shield} = (\\\\text{Int} + \\\\text{Dep}) \\\\times T'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 7 — الموازنات والتخطيط المتقدم
  // ══════════════════════════════════════════════════════
  {
    id: 'flex_budget', title: 'الموازنة المرنة', icon: '📏', color: '#B2DFDB',
    desc: 'إعادة حساب الموازنة على حجم النشاط الفعلي',
    fields:[
      {k:'vc_pu',    l:'التكلفة المتغيرة للوحدة', u:'ج.م'},
      {k:'fc',       l:'إجمالي التكاليف الثابتة', u:'ج.م'},
      {k:'act_qty',  l:'الحجم الفعلي',             u:'وحدة'},
      {k:'flex_vc',  l:'إجمالي متغيرة مرنة',      u:'ج.م'},
      {k:'flex_total',l:'إجمالي الموازنة المرنة',  u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.act_qty) && v.act_qty! < 0) { v._error = 'الحجم الفعلي لا يمكن أن يكون سالباً'; break; }
        if(n(v.vc_pu) && n(v.act_qty) && !n(v.flex_vc)) { v.flex_vc = r(v.vc_pu! * v.act_qty!); c=true; }
        if(n(v.flex_vc) && n(v.act_qty) && v.act_qty!>0 && !n(v.vc_pu)) { v.vc_pu = r(v.flex_vc! / v.act_qty!); c=true; }
        if(n(v.flex_vc) && n(v.fc) && !n(v.flex_total)) { v.flex_total = r(v.flex_vc! + v.fc!); c=true; }
        if(n(v.flex_total) && n(v.fc) && !n(v.flex_vc)) { v.flex_vc = r(v.flex_total! - v.fc!); c=true; }
        if(n(v.flex_total) && n(v.flex_vc) && !n(v.fc)) { v.fc = r(v.flex_total! - v.flex_vc!); c=true; }
      }
      return v;
    },
    formula: 'الموازنة المرنة = (ت. متغيرة × الحجم الفعلي) + ت. ثابتة',
    latex: '\\\\text{Flex} = (\\\\text{VC/u} \\\\times \\\\text{حجم فعلي}) + \\\\text{FC}'
  },
  {
    id: 'flex_budget_var', title: 'انحرافات الموازنة المرنة', icon: '📐', color: '#C8E6C9',
    desc: 'مقارنة الفعلي بالموازنة المرنة والأصلية',
    fields:[
      {k:'static_b',  l:'الموازنة الأصلية (ثابتة)', u:'ج.م'},
      {k:'flex_b',    l:'الموازنة المرنة',           u:'ج.م'},
      {k:'actual',    l:'التكلفة الفعلية',            u:'ج.م'},
      {k:'vol_var',   l:'انحراف الحجم (ثابتة−مرنة)', u:'ج.م'},
      {k:'spend_var', l:'انحراف الإنفاق (مرنة−فعلي)', u:'ج.م'},
      {k:'total_var', l:'إجمالي الانحراف',            u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.static_b) && n(v.flex_b) && !n(v.vol_var)) { v.vol_var = r(v.static_b! - v.flex_b!); c=true; }
        if(n(v.flex_b) && n(v.actual) && !n(v.spend_var)) { v.spend_var = r(v.flex_b! - v.actual!); c=true; }
        if(n(v.vol_var) && n(v.spend_var) && !n(v.total_var)) { v.total_var = r(v.vol_var! + v.spend_var!); c=true; }
        if(n(v.static_b) && n(v.actual) && !n(v.total_var)) { v.total_var = r(v.static_b! - v.actual!); c=true; }
        if(n(v.total_var) && n(v.vol_var) && !n(v.spend_var)) { v.spend_var = r(v.total_var! - v.vol_var!); c=true; }
        if(n(v.total_var) && n(v.spend_var) && !n(v.vol_var)) { v.vol_var = r(v.total_var! - v.spend_var!); c=true; }
        if(n(v.vol_var) && n(v.flex_b) && !n(v.static_b)) { v.static_b = r(v.flex_b! + v.vol_var!); c=true; }
        if(n(v.spend_var) && n(v.actual) && !n(v.flex_b)) { v.flex_b = r(v.actual! + v.spend_var!); c=true; }
      }
      if(n(v.total_var)) {
        if(v.total_var! > 0) v._decision = '🟢 انحراف مؤاتٍ (وفر) بقيمة ' + v.total_var! + ' ج.م';
        else if(v.total_var! < 0) v._decision = '🔴 انحراف غير مؤاتٍ (تجاوز) بقيمة ' + Math.abs(v.total_var!) + ' ج.م';
        else v._decision = '✅ لا يوجد انحراف';
      }
      return v;
    },
    formula: 'انحراف الحجم = ثابتة − مرنة | الإنفاق = مرنة − فعلي | الإجمالي = ثابتة − فعلي',
    latex: '\\\\text{الإجمالي} = \\\\text{الثابتة} - \\\\text{الفعلي}'
  },
  {
    id: 'sensitivity', title: 'تحليل الحساسية', icon: '🔍', color: '#DCEDC8',
    desc: 'أثر تغير عامل واحد على صافي الدخل/التعادل',
    fields:[
      {k:'base_val',  l:'القيمة الأساسية',    u:'ج.م'},
      {k:'change_pct',l:'نسبة التغير',        u:'%'},
      {k:'new_val',   l:'القيمة الجديدة',     u:'ج.م'},
      {k:'abs_impact',l:'الأثر المطلق',       u:'ج.م'},
      {k:'pct_impact',l:'نسبة التأثير على الربح',u:'%'},
      {k:'base_profit',l:'الربح الأساسي',     u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.base_val) && n(v.change_pct) && !n(v.new_val)) {
          v.new_val = r(v.base_val! * (1 + v.change_pct!/100)); c=true;
        }
        if(n(v.new_val) && n(v.base_val) && !n(v.change_pct)) {
          if(v.base_val! !== 0) { v.change_pct = r(((v.new_val! - v.base_val!)/v.base_val!)*100); c=true; }
        }
        if(n(v.new_val) && n(v.base_val) && !n(v.abs_impact)) {
          v.abs_impact = r(v.new_val! - v.base_val!); c=true;
        }
        if(n(v.abs_impact) && n(v.base_profit) && v.base_profit!>0 && !n(v.pct_impact)) {
          v.pct_impact = r((v.abs_impact!/v.base_profit!)*100); c=true;
        }
      }
      if(n(v.pct_impact)) {
        v._decision = 'تغير ' + (v.change_pct||0) + '% يؤثر على الربح بنسبة ' + v.pct_impact! + '%';
      }
      return v;
    },
    formula: 'القيمة الجديدة = الأساسية × (1 + نسبة التغير) | الأثر = الجديدة − الأساسية',
    latex: '\\\\text{جديدة} = \\\\text{أساسية} \\\\times (1 + \\\\Delta\\\\%)'
  },
  {
    id: 'capex_budget', title: 'موازنة المصاريف الرأسمالية', icon: '🏗️', color: '#F0F4C3',
    desc: 'تخطيط الإنفاق على الأصول الثابتة والمشاريع',
    fields:[
      {k:'equip',    l:'شراء معدات وآلات',    u:'ج.م', helper: { type: 'dynamic_sum', title: 'تفصيل المعدات' }},
      {k:'building', l:'شراء مباني',           u:'ج.م'},
      {k:'vehicle',  l:'سيارات ومركبات',      u:'ج.م'},
      {k:'tech',     l:'أنظمة وتكنولوجيا',    u:'ج.م'},
      {k:'other',    l:'أصول أخرى',            u:'ج.م'},
      {k:'total',    l:'إجمالي الإنفاق الرأسمالي',u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      if(!n(v.building)) v.building = 0;
      if(!n(v.vehicle)) v.vehicle = 0;
      if(!n(v.tech)) v.tech = 0;
      if(!n(v.other)) v.other = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.equip) && !n(v.total)) {
          v.total = r(v.equip! + (v.building||0) + (v.vehicle||0) + (v.tech||0) + (v.other||0)); c=true;
        }
        if(n(v.total) && n(v.building) && n(v.vehicle) && n(v.tech) && n(v.other) && !n(v.equip)) {
          v.equip = r(v.total! - v.building! - v.vehicle! - v.tech! - v.other!); c=true;
        }
      }
      return v;
    },
    formula: 'إجمالي CapEx = معدات + مباني + سيارات + تكنولوجيا + أخرى',
    latex: '\\\\text{CapEx} = \\\\sum \\\\text{بنود الأصول}'
  },
  {
    id: 'scenario', title: 'تحليل السيناريوهات', icon: '🎭', color: '#E1BEE7',
    desc: 'مقارنة أفضل / أسوأ / متوسط حالة',
    fields:[
      {k:'best',   l:'السيناريو المتفائل',  u:'ج.م'},
      {k:'worst',  l:'السيناريو المتشائم',   u:'ج.م'},
      {k:'likely', l:'السيناريو الأرجح',     u:'ج.م'},
      {k:'expected',l:'القيمة المتوقعة (PERT)',u:'ج.م'},
      {k:'range',  l:'مدى التباين',          u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        // PERT Expected = (Best + 4×Likely + Worst) / 6
        if(n(v.best) && n(v.worst) && n(v.likely) && !n(v.expected)) {
          v.expected = r((v.best! + 4*v.likely! + v.worst!) / 6); c=true;
        }
        if(n(v.best) && n(v.worst) && !n(v.range)) {
          v.range = r(v.best! - v.worst!); c=true;
        }
      }
      if(n(v.range)) {
        v._decision = '📊 مدى التباين = ' + v.range! + ' ج.م | المتوقع = ' + (v.expected||'—') + ' ج.م';
      }
      return v;
    },
    formula: 'PERT = (متفائل + 4×أرجح + متشائم) ÷ 6 | المدى = متفائل − متشائم',
    latex: '\\\\text{PERT} = \\\\frac{O + 4M + P}{6}'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 8 — التكاليف المتقدمة
  // ══════════════════════════════════════════════════════
  {
    id: 'abc_costing', title: 'التكلفة على أساس النشاط', icon: '🔬', color: '#F8BBD0',
    desc: 'ABC — تخصيص التكاليف حسب مُسبب التكلفة الفعلي',
    fields:[
      {k:'oh_total',  l:'إجمالي التكاليف غير المباشرة', u:'ج.م'},
      {k:'driver_qty',l:'إجمالي وحدات مُسبب التكلفة',  u:'وحدة'},
      {k:'act_rate',  l:'معدل النشاط',                   u:'ج.م/وحدة'},
      {k:'prod_qty',  l:'وحدات مُسبب للمنتج',           u:'وحدة'},
      {k:'alloc',     l:'التكلفة المخصصة للمنتج',       u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.driver_qty) && v.driver_qty! <= 0) { v._error = 'وحدات المُسبب يجب أن تكون أكبر من صفر'; break; }
        if(n(v.oh_total) && n(v.driver_qty) && v.driver_qty!>0 && !n(v.act_rate)) {
          v.act_rate = r(v.oh_total! / v.driver_qty!); c=true;
        }
        if(n(v.act_rate) && n(v.driver_qty) && !n(v.oh_total)) { v.oh_total = r(v.act_rate! * v.driver_qty!); c=true; }
        if(n(v.act_rate) && n(v.prod_qty) && !n(v.alloc)) { v.alloc = r(v.act_rate! * v.prod_qty!); c=true; }
        if(n(v.alloc) && n(v.act_rate) && v.act_rate!>0 && !n(v.prod_qty)) { v.prod_qty = r(v.alloc! / v.act_rate!); c=true; }
        if(n(v.alloc) && n(v.prod_qty) && v.prod_qty!>0 && !n(v.act_rate)) { v.act_rate = r(v.alloc! / v.prod_qty!); c=true; }
      }
      return v;
    },
    formula: 'معدل النشاط = إجمالي التكلفة ÷ إجمالي المُسبب | المخصص = المعدل × وحدات المنتج',
    latex: '\\\\text{Rate} = \\\\frac{\\\\text{OH}}{\\\\text{Driver}} \\\\quad \\\\text{Alloc} = \\\\text{Rate} \\\\times \\\\text{وحدات}'
  },
  {
    id: 'job_order', title: 'تسعير أوامر الإنتاج', icon: '📋', color: '#F48FB1',
    desc: 'Job-Order Costing — تجميع تكاليف الأمر الإنتاجي',
    fields:[
      {k:'dm',    l:'مواد مباشرة',              u:'ج.م'},
      {k:'dl',    l:'أجور مباشرة',              u:'ج.م'},
      {k:'oh',    l:'تكاليف صناعية غير مباشرة', u:'ج.م'},
      {k:'total', l:'إجمالي تكلفة الأمر',       u:'ج.م'},
      {k:'qty',   l:'وحدات الأمر',              u:'وحدة'},
      {k:'cost_pu',l:'تكلفة الوحدة',            u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.dm) && n(v.dl) && n(v.oh) && !n(v.total)) { v.total = r(v.dm! + v.dl! + v.oh!); c=true; }
        if(n(v.total) && n(v.dl) && n(v.oh) && !n(v.dm)) { v.dm = r(v.total! - v.dl! - v.oh!); c=true; }
        if(n(v.total) && n(v.dm) && n(v.oh) && !n(v.dl)) { v.dl = r(v.total! - v.dm! - v.oh!); c=true; }
        if(n(v.total) && n(v.dm) && n(v.dl) && !n(v.oh)) { v.oh = r(v.total! - v.dm! - v.dl!); c=true; }
        if(n(v.total) && n(v.qty) && v.qty!>0 && !n(v.cost_pu)) { v.cost_pu = r(v.total! / v.qty!); c=true; }
        if(n(v.cost_pu) && n(v.qty) && !n(v.total)) { v.total = r(v.cost_pu! * v.qty!); c=true; }
        if(n(v.total) && n(v.cost_pu) && v.cost_pu!>0 && !n(v.qty)) { v.qty = r(v.total! / v.cost_pu!); c=true; }
      }
      return v;
    },
    formula: 'تكلفة الأمر = مواد + أجور + ت. صناعية | تكلفة الوحدة = الإجمالي ÷ الكمية',
    latex: '\\\\text{Job Cost} = \\\\text{DM} + \\\\text{DL} + \\\\text{MOH}'
  },
  {
    id: 'process_costing', title: 'تسعير المراحل', icon: '🏭', color: '#CE93D8',
    desc: 'Process Costing — تكلفة الوحدة المكافئة',
    fields:[
      {k:'completed',  l:'وحدات تامة',             u:'وحدة'},
      {k:'wip',        l:'وحدات تحت التشغيل',     u:'وحدة'},
      {k:'wip_pct',    l:'نسبة الإتمام',           u:'%'},
      {k:'equiv_units',l:'الوحدات المكافئة',       u:'وحدة'},
      {k:'total_cost', l:'إجمالي تكاليف الفترة',  u:'ج.م'},
      {k:'cost_pu',    l:'تكلفة الوحدة المكافئة', u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.wip_pct) && (v.wip_pct! < 0 || v.wip_pct! > 100)) { v._error = 'نسبة الإتمام يجب أن تكون بين 0 و 100%'; break; }
        if(n(v.completed) && n(v.wip) && n(v.wip_pct) && !n(v.equiv_units)) {
          v.equiv_units = r(v.completed! + v.wip! * (v.wip_pct!/100)); c=true;
        }
        if(n(v.total_cost) && n(v.equiv_units) && v.equiv_units!>0 && !n(v.cost_pu)) {
          v.cost_pu = r(v.total_cost! / v.equiv_units!); c=true;
        }
        if(n(v.cost_pu) && n(v.equiv_units) && !n(v.total_cost)) {
          v.total_cost = r(v.cost_pu! * v.equiv_units!); c=true;
        }
      }
      return v;
    },
    formula: 'وحدات مكافئة = تامة + (WIP × نسبة إتمام) | تكلفة الوحدة = الإجمالي ÷ المكافئة',
    latex: '\\\\text{EU} = \\\\text{تامة} + (\\\\text{WIP} \\\\times \\\\text{\\\\% إتمام})'
  },
  {
    id: 'equivalent_units', title: 'الوحدات المكافئة', icon: '🔢', color: '#B39DDB',
    desc: 'حساب الوحدات المكافئة بطريقة المتوسط المرجح أو FIFO',
    fields:[
      {k:'beg_wip',    l:'WIP أول المدة',         u:'وحدة'},
      {k:'beg_pct',    l:'نسبة إتمام أول المدة',  u:'%'},
      {k:'started',    l:'وحدات بدأت وتمت',       u:'وحدة'},
      {k:'end_wip',    l:'WIP آخر المدة',          u:'وحدة'},
      {k:'end_pct',    l:'نسبة إتمام آخر المدة',  u:'%'},
      {k:'eu_wavg',    l:'مكافئة (متوسط مرجح)',    u:'وحدة'},
      {k:'eu_fifo',    l:'مكافئة (FIFO)',           u:'وحدة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        const completed = (n(v.beg_wip) && n(v.started)) ? v.beg_wip! + v.started! : null;
        // Weighted Average
        if(completed !== null && n(v.end_wip) && n(v.end_pct) && !n(v.eu_wavg)) {
          v.eu_wavg = r(completed - v.end_wip! + v.end_wip! * (v.end_pct!/100)); c=true;
        }
        // FIFO
        if(n(v.beg_wip) && n(v.beg_pct) && n(v.started) && n(v.end_wip) && n(v.end_pct) && !n(v.eu_fifo)) {
          const completeBeg = v.beg_wip! * (1 - v.beg_pct!/100);
          const endEU = v.end_wip! * (v.end_pct!/100);
          const startedAndDone = (v.beg_wip! + v.started!) - v.beg_wip! - v.end_wip!;
          v.eu_fifo = r(completeBeg + (startedAndDone > 0 ? startedAndDone : 0) + endEU); c=true;
        }
      }
      return v;
    },
    formula: 'متوسط مرجح = تامة + (WIP آخر × %) | FIFO = إكمال أول + بدأت وتمت + (WIP آخر × %)',
    latex: '\\\\text{EU}_{WA} = \\\\text{Completed} + (\\\\text{EWIP} \\\\times \\\\%)'
  },
  {
    id: 'pdoh_rate', title: 'معدل التحميل المحدد', icon: '⚙️', color: '#9FA8DA',
    desc: 'معدل تحميل التكاليف الإضافية المحدد مقدماً (PDOH)',
    fields:[
      {k:'est_oh',    l:'التكاليف المقدرة',     u:'ج.م'},
      {k:'est_base',  l:'أساس التحميل المقدر', u:'ساعة/وحدة'},
      {k:'pdoh',      l:'معدل التحميل المحدد',  u:'ج.م/وحدة'},
      {k:'act_base',  l:'الأساس الفعلي',        u:'ساعة/وحدة'},
      {k:'applied_oh',l:'التكاليف المحملة',     u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.est_base) && v.est_base! <= 0) { v._error = 'أساس التحميل يجب أن يكون أكبر من صفر'; break; }
        if(n(v.est_oh) && n(v.est_base) && v.est_base!>0 && !n(v.pdoh)) { v.pdoh = r(v.est_oh! / v.est_base!); c=true; }
        if(n(v.pdoh) && n(v.est_base) && !n(v.est_oh)) { v.est_oh = r(v.pdoh! * v.est_base!); c=true; }
        if(n(v.pdoh) && n(v.act_base) && !n(v.applied_oh)) { v.applied_oh = r(v.pdoh! * v.act_base!); c=true; }
        if(n(v.applied_oh) && n(v.pdoh) && v.pdoh!>0 && !n(v.act_base)) { v.act_base = r(v.applied_oh! / v.pdoh!); c=true; }
      }
      return v;
    },
    formula: 'PDOH = التكاليف المقدرة ÷ الأساس المقدر | المحملة = PDOH × الأساس الفعلي',
    latex: '\\\\text{PDOH} = \\\\frac{\\\\text{Est. OH}}{\\\\text{Est. Base}}'
  },
  {
    id: 'target_costing', title: 'التكلفة المستهدفة', icon: '🎯', color: '#80DEEA',
    desc: 'تحديد التكلفة المسموحة من سعر السوق والهامش المطلوب',
    fields:[
      {k:'market_price', l:'سعر البيع السوقي',      u:'ج.م'},
      {k:'target_margin',l:'هامش الربح المستهدف',   u:'%'},
      {k:'target_profit',l:'الربح المستهدف',         u:'ج.م'},
      {k:'target_cost',  l:'التكلفة المستهدفة',     u:'ج.م'},
      {k:'actual_cost',  l:'التكلفة الحالية',        u:'ج.م'},
      {k:'gap',          l:'فجوة التكلفة',           u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.market_price) && v.market_price! <= 0) { v._error = 'سعر السوق يجب أن يكون أكبر من صفر'; break; }
        if(n(v.market_price) && n(v.target_margin) && !n(v.target_profit)) {
          v.target_profit = r(v.market_price! * (v.target_margin!/100)); c=true;
        }
        if(n(v.target_profit) && n(v.market_price) && v.market_price!>0 && !n(v.target_margin)) {
          v.target_margin = r((v.target_profit!/v.market_price!)*100); c=true;
        }
        if(n(v.market_price) && n(v.target_profit) && !n(v.target_cost)) {
          v.target_cost = r(v.market_price! - v.target_profit!); c=true;
        }
        if(n(v.target_cost) && n(v.target_profit) && !n(v.market_price)) {
          v.market_price = r(v.target_cost! + v.target_profit!); c=true;
        }
        if(n(v.target_cost) && n(v.actual_cost) && !n(v.gap)) {
          v.gap = r(v.actual_cost! - v.target_cost!); c=true;
        }
      }
      if(n(v.gap)) {
        if(v.gap! <= 0) v._decision = '🟢 التكلفة الحالية ≤ المستهدفة — ممتاز';
        else v._decision = '🔴 فجوة ' + v.gap! + ' ج.م — يجب خفض التكلفة';
      }
      return v;
    },
    formula: 'التكلفة المستهدفة = سعر السوق − الربح المستهدف | الفجوة = الفعلية − المستهدفة',
    latex: '\\\\text{Target Cost} = \\\\text{Price} - \\\\text{Target Profit}'
  },
  {
    id: 'value_chain', title: 'تحليل سلسلة القيمة', icon: '🔗', color: '#B2EBF2',
    desc: 'تفكيك تكاليف الأنشطة لتحديد القيمة المضافة',
    fields:[
      {k:'activity',  l:'تكلفة النشاط',         u:'ج.م'},
      {k:'total_cost',l:'إجمالي تكاليف الشركة', u:'ج.م'},
      {k:'pct',       l:'نسبة النشاط من الإجمالي',u:'%'},
      {k:'revenue',   l:'إيراد النشاط',           u:'ج.م'},
      {k:'va',        l:'القيمة المضافة',         u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.activity) && n(v.total_cost) && v.total_cost!>0 && !n(v.pct)) {
          v.pct = r((v.activity!/v.total_cost!)*100); c=true;
        }
        if(n(v.pct) && n(v.total_cost) && !n(v.activity)) { v.activity = r((v.pct!/100)*v.total_cost!); c=true; }
        if(n(v.revenue) && n(v.activity) && !n(v.va)) { v.va = r(v.revenue! - v.activity!); c=true; }
        if(n(v.va) && n(v.activity) && !n(v.revenue)) { v.revenue = r(v.va! + v.activity!); c=true; }
      }
      if(n(v.va)) {
        if(v.va! > 0) v._decision = '🟢 نشاط يضيف قيمة بـ ' + v.va! + ' ج.م';
        else v._decision = '🔴 نشاط يدمر قيمة بـ ' + Math.abs(v.va!) + ' ج.م — راجع الاستبعاد';
      }
      return v;
    },
    formula: 'القيمة المضافة = إيراد النشاط − تكلفته | النسبة = تكلفة النشاط ÷ الإجمالي',
    latex: '\\\\text{VA} = \\\\text{Revenue} - \\\\text{Activity Cost}'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 9 — المراجعة والحوكمة
  // ══════════════════════════════════════════════════════
  {
    id: 'zscore', title: 'نموذج Altman Z-Score', icon: '🔮', color: '#EF9A9A',
    desc: 'التنبؤ بالإفلاس باستخدام 5 نسب مالية مرجحة',
    fields:[
      {k:'wc_ta',    l:'رأس المال العامل / الأصول (X1)', u:''},
      {k:'re_ta',    l:'أرباح محتجزة / الأصول (X2)',      u:''},
      {k:'ebit_ta',  l:'EBIT / الأصول (X3)',               u:''},
      {k:'mv_td',    l:'القيمة السوقية / الديون (X4)',     u:''},
      {k:'sales_ta', l:'المبيعات / الأصول (X5)',           u:''},
      {k:'zscore',   l:'Z-Score',                           u:''},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(n(v.wc_ta) && n(v.re_ta) && n(v.ebit_ta) && n(v.mv_td) && n(v.sales_ta) && !n(v.zscore)) {
        v.zscore = r(1.2*v.wc_ta! + 1.4*v.re_ta! + 3.3*v.ebit_ta! + 0.6*v.mv_td! + 1.0*v.sales_ta!);
      }
      if(n(v.zscore)) {
        if(v.zscore! > 2.99) v._decision = '🟢 منطقة آمنة (Z > 2.99) — احتمال إفلاس منخفض جداً';
        else if(v.zscore! >= 1.81) v._decision = '🟡 منطقة رمادية (1.81-2.99) — يحتاج مراقبة';
        else v._decision = '🔴 منطقة خطر (Z < 1.81) — احتمال إفلاس مرتفع!';
      }
      return v;
    },
    formula: 'Z = 1.2×X1 + 1.4×X2 + 3.3×X3 + 0.6×X4 + 1.0×X5',
    latex: 'Z = 1.2X_1 + 1.4X_2 + 3.3X_3 + 0.6X_4 + 1.0X_5'
  },
  {
    id: 'journal_entries', title: 'قيود اليومية', icon: '📝', color: '#FFCC80',
    desc: 'تسجيل القيود المحاسبية والتحقق من توازن مدين/دائن',
    fields:[
      {k:'debit1',  l:'مدين ①',   u:'ج.م'},
      {k:'debit2',  l:'مدين ②',   u:'ج.م'},
      {k:'debit3',  l:'مدين ③',   u:'ج.م'},
      {k:'credit1', l:'دائن ①',   u:'ج.م'},
      {k:'credit2', l:'دائن ②',   u:'ج.م'},
      {k:'credit3', l:'دائن ③',   u:'ج.م'},
      {k:'total_d', l:'إجمالي المدين', u:'ج.م'},
      {k:'total_c', l:'إجمالي الدائن', u:'ج.م'},
      {k:'diff',    l:'الفرق',          u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        const td = (v.debit1||0) + (v.debit2||0) + (v.debit3||0);
        const tc = (v.credit1||0) + (v.credit2||0) + (v.credit3||0);
        if(!n(v.total_d) && (n(v.debit1) || n(v.debit2) || n(v.debit3))) { v.total_d = r(td); c=true; }
        if(!n(v.total_c) && (n(v.credit1) || n(v.credit2) || n(v.credit3))) { v.total_c = r(tc); c=true; }
        if(n(v.total_d) && n(v.total_c) && !n(v.diff)) { v.diff = r(v.total_d! - v.total_c!); c=true; }
      }
      if(n(v.diff)) {
        if(v.diff! === 0) v._decision = '✅ القيد متوازن — مدين = دائن';
        else v._decision = '🔴 القيد غير متوازن — فرق = ' + v.diff! + ' ج.م';
      }
      return v;
    },
    formula: 'إجمالي المدين يجب أن يساوي إجمالي الدائن',
    latex: '\\\\sum \\\\text{مدين} = \\\\sum \\\\text{دائن}'
  },
  {
    id: 'trial_balance', title: 'ميزان المراجعة', icon: '⚖️', color: '#FFE0B2',
    desc: 'تجميع أرصدة الحسابات والتحقق من التوازن',
    fields:[
      {k:'dr1', l:'رصيد مدين ①', u:'ج.م'},
      {k:'dr2', l:'رصيد مدين ②', u:'ج.م'},
      {k:'dr3', l:'رصيد مدين ③', u:'ج.م'},
      {k:'dr4', l:'رصيد مدين ④', u:'ج.م'},
      {k:'cr1', l:'رصيد دائن ①', u:'ج.م'},
      {k:'cr2', l:'رصيد دائن ②', u:'ج.م'},
      {k:'cr3', l:'رصيد دائن ③', u:'ج.م'},
      {k:'cr4', l:'رصيد دائن ④', u:'ج.م'},
      {k:'total_dr', l:'إجمالي مدين', u:'ج.م'},
      {k:'total_cr', l:'إجمالي دائن', u:'ج.م'},
      {k:'diff',     l:'الفرق',        u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        const td = (v.dr1||0)+(v.dr2||0)+(v.dr3||0)+(v.dr4||0);
        const tc = (v.cr1||0)+(v.cr2||0)+(v.cr3||0)+(v.cr4||0);
        if(!n(v.total_dr) && (n(v.dr1)||n(v.dr2)||n(v.dr3)||n(v.dr4))) { v.total_dr = r(td); c=true; }
        if(!n(v.total_cr) && (n(v.cr1)||n(v.cr2)||n(v.cr3)||n(v.cr4))) { v.total_cr = r(tc); c=true; }
        if(n(v.total_dr) && n(v.total_cr) && !n(v.diff)) { v.diff = r(v.total_dr! - v.total_cr!); c=true; }
      }
      if(n(v.diff)) {
        if(v.diff! === 0) v._decision = '✅ ميزان المراجعة متوازن';
        else v._decision = '🔴 ميزان غير متوازن — فرق = ' + v.diff! + ' ج.م — ابحث عن الخطأ';
      }
      return v;
    },
    formula: 'إجمالي الأرصدة المدينة = إجمالي الأرصدة الدائنة',
    latex: '\\\\sum \\\\text{Dr} = \\\\sum \\\\text{Cr}'
  },
  {
    id: 'benford', title: 'قانون Benford', icon: '🔍', color: '#FFCDD2',
    desc: 'كشف التلاعب بالبيانات المالية عبر توزيع الأرقام الأولى',
    fields:[
      {k:'digit',     l:'الرقم الأول (1-9)',              u:''},
      {k:'expected',  l:'النسبة المتوقعة (Benford)',     u:'%'},
      {k:'actual_pct',l:'النسبة الفعلية',                u:'%'},
      {k:'deviation', l:'الانحراف',                       u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.digit) && (v.digit! < 1 || v.digit! > 9 || v.digit! !== Math.floor(v.digit!))) {
          v._error = 'الرقم يجب أن يكون عدد صحيح من 1 إلى 9'; break;
        }
        if(n(v.digit) && !n(v.expected)) {
          v.expected = r(Math.log10(1 + 1/v.digit!) * 100); c=true;
        }
        if(n(v.actual_pct) && n(v.expected) && !n(v.deviation)) {
          v.deviation = r(v.actual_pct! - v.expected!); c=true;
        }
      }
      if(n(v.deviation)) {
        if(Math.abs(v.deviation!) <= 2) v._decision = '🟢 انحراف طبيعي (≤ 2%) — لا يوجد شبهة';
        else if(Math.abs(v.deviation!) <= 5) v._decision = '🟡 انحراف ملحوظ (2-5%) — يستحق المراجعة';
        else v._decision = '🔴 انحراف كبير (> 5%) — شبهة تلاعب!';
      }
      return v;
    },
    formula: 'النسبة المتوقعة = log₁₀(1 + 1/d) × 100',
    latex: 'P(d) = \\\\log_{10}\\\\left(1 + \\\\frac{1}{d}\\\\right)'
  },
  {
    id: 'trend_analysis', title: 'تحليل الاتجاه', icon: '📈', color: '#C5CAE9',
    desc: 'تتبع بند مالي عبر عدة سنوات (سنة الأساس = 100)',
    fields:[
      {k:'base',  l:'قيمة سنة الأساس',  u:'ج.م'},
      {k:'yr1',   l:'قيمة السنة 1',      u:'ج.م'},
      {k:'yr2',   l:'قيمة السنة 2',      u:'ج.م'},
      {k:'yr3',   l:'قيمة السنة 3',      u:'ج.م'},
      {k:'idx1',  l:'مؤشر السنة 1',      u:'%'},
      {k:'idx2',  l:'مؤشر السنة 2',      u:'%'},
      {k:'idx3',  l:'مؤشر السنة 3',      u:'%'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.base) && v.base! === 0) { v._error = 'سنة الأساس لا يمكن أن تكون صفراً'; break; }
        if(n(v.base) && v.base!>0) {
          if(n(v.yr1) && !n(v.idx1)) { v.idx1 = r((v.yr1!/v.base!)*100); c=true; }
          if(n(v.yr2) && !n(v.idx2)) { v.idx2 = r((v.yr2!/v.base!)*100); c=true; }
          if(n(v.yr3) && !n(v.idx3)) { v.idx3 = r((v.yr3!/v.base!)*100); c=true; }
          if(n(v.idx1) && !n(v.yr1)) { v.yr1 = r((v.idx1!/100)*v.base!); c=true; }
          if(n(v.idx2) && !n(v.yr2)) { v.yr2 = r((v.idx2!/100)*v.base!); c=true; }
          if(n(v.idx3) && !n(v.yr3)) { v.yr3 = r((v.idx3!/100)*v.base!); c=true; }
        }
      }
      if(n(v.idx3)) {
        if(v.idx3! > 100) v._decision = '📈 اتجاه صاعد — السنة 3 = ' + v.idx3! + '% من الأساس';
        else if(v.idx3! < 100) v._decision = '📉 اتجاه هابط — السنة 3 = ' + v.idx3! + '% من الأساس';
        else v._decision = '➡️ ثبات — لا تغيير عن الأساس';
      }
      return v;
    },
    formula: 'المؤشر = (قيمة السنة ÷ سنة الأساس) × 100',
    latex: '\\\\text{Index} = \\\\frac{\\\\text{قيمة السنة}}{\\\\text{سنة الأساس}} \\\\times 100'
  },
  {
    id: 'mscore', title: 'نموذج Beneish M-Score', icon: '🕵️', color: '#FFAB91',
    desc: 'كشف التلاعب بالأرباح (Earnings Manipulation)',
    fields:[
      {k:'dsri', l:'مؤشر المدينين/المبيعات (DSRI)',   u:''},
      {k:'gmi',  l:'مؤشر هامش الربح (GMI)',            u:''},
      {k:'aqi',  l:'مؤشر جودة الأصول (AQI)',           u:''},
      {k:'sgi',  l:'مؤشر نمو المبيعات (SGI)',          u:''},
      {k:'depi', l:'مؤشر الإهلاك (DEPI)',              u:''},
      {k:'sgai', l:'مؤشر م.بيع وإدارة (SGAI)',         u:''},
      {k:'lvgi', l:'مؤشر الرافعة (LVGI)',              u:''},
      {k:'tata', l:'إجمالي الاستحقاق (TATA)',          u:''},
      {k:'mscore',l:'M-Score',                          u:''},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(n(v.dsri) && n(v.gmi) && n(v.aqi) && n(v.sgi) && n(v.depi) && n(v.sgai) && n(v.lvgi) && n(v.tata) && !n(v.mscore)) {
        v.mscore = r(-4.84 + 0.920*v.dsri! + 0.528*v.gmi! + 0.404*v.aqi! + 0.892*v.sgi! + 0.115*v.depi! - 0.172*v.sgai! + 4.679*v.tata! - 0.327*v.lvgi!);
      }
      if(n(v.mscore)) {
        if(v.mscore! < -2.22) v._decision = '🟢 لا شبهة تلاعب (M < -2.22)';
        else v._decision = '🔴 شبهة تلاعب بالأرباح (M ≥ -2.22) — تحتاج تحقيق!';
      }
      return v;
    },
    formula: 'M = -4.84 + 0.92×DSRI + 0.53×GMI + 0.40×AQI + 0.89×SGI + 0.12×DEPI − 0.17×SGAI + 4.68×TATA − 0.33×LVGI',
    latex: 'M = -4.84 + \\\\sum w_i \\\\times X_i'
  },
  {
    id: 'bank_reconciliation', title: 'التسويات البنكية', icon: '🏦', color: '#B0BEC5',
    desc: 'مطابقة رصيد البنك مع رصيد الدفاتر',
    fields:[
      {k:'bank_bal',   l:'رصيد كشف البنك',        u:'ج.م'},
      {k:'dep_transit',l:'إيداعات في الطريق (+)',  u:'ج.م'},
      {k:'os_checks',  l:'شيكات لم تُصرف (−)',    u:'ج.م'},
      {k:'adj_bank',   l:'الرصيد المعدل (بنك)',   u:'ج.م'},
      {k:'book_bal',   l:'رصيد الدفاتر',          u:'ج.م'},
      {k:'int_earned', l:'فوائد مكتسبة (+)',       u:'ج.م'},
      {k:'nsf',        l:'شيكات مرتجعة (−)',       u:'ج.م'},
      {k:'fees',       l:'عمولات بنكية (−)',        u:'ج.م'},
      {k:'adj_book',   l:'الرصيد المعدل (دفاتر)',  u:'ج.م'},
      {k:'diff',       l:'الفرق',                   u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(!n(v.dep_transit)) v.dep_transit = 0;
      if(!n(v.os_checks)) v.os_checks = 0;
      if(!n(v.int_earned)) v.int_earned = 0;
      if(!n(v.nsf)) v.nsf = 0;
      if(!n(v.fees)) v.fees = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.bank_bal) && !n(v.adj_bank)) {
          v.adj_bank = r(v.bank_bal! + (v.dep_transit||0) - (v.os_checks||0)); c=true;
        }
        if(n(v.book_bal) && !n(v.adj_book)) {
          v.adj_book = r(v.book_bal! + (v.int_earned||0) - (v.nsf||0) - (v.fees||0)); c=true;
        }
        if(n(v.adj_bank) && n(v.adj_book) && !n(v.diff)) {
          v.diff = r(v.adj_bank! - v.adj_book!); c=true;
        }
      }
      if(n(v.diff)) {
        if(v.diff! === 0) v._decision = '✅ التسوية صحيحة — الرصيدان متطابقان';
        else v._decision = '🔴 فرق = ' + v.diff! + ' ج.م — يجب البحث عن السبب';
      }
      return v;
    },
    formula: 'بنك معدل = الرصيد + إيداعات − شيكات | دفاتر معدلة = الرصيد + فوائد − مرتجعات − عمولات',
    latex: '\\\\text{Adj Bank} = \\\\text{Bank} + \\\\text{DIT} - \\\\text{OS Checks}'
  },
  // ══════════════════════════════════════════════════════
  //  المرحلة 10 — أدوات متقدمة للتميز
  // ══════════════════════════════════════════════════════
  {
    id: 'fin_leverage', title: 'الرافعة المالية المركبة', icon: '⚡', color: '#FFE082',
    desc: 'DOL + DFL + DCL — التأثير المضاعف على الأرباح',
    fields:[
      {k:'cm',   l:'إجمالي هامش المساهمة', u:'ج.م'},
      {k:'ebit', l:'الربح التشغيلي (EBIT)', u:'ج.م'},
      {k:'ebt',  l:'الربح قبل الضريبة (EBT)',u:'ج.م'},
      {k:'dol',  l:'درجة الرافعة التشغيلية (DOL)',u:'مرة'},
      {k:'dfl',  l:'درجة الرافعة المالية (DFL)', u:'مرة'},
      {k:'dcl',  l:'درجة الرافعة المركبة (DCL)', u:'مرة'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.ebit) && v.ebit! === 0) { v._error = 'EBIT لا يمكن أن يكون صفراً (قسمة)'; break; }
        if(n(v.ebt) && v.ebt! === 0) { v._error = 'EBT لا يمكن أن يكون صفراً (قسمة)'; break; }
        if(n(v.cm) && n(v.ebit) && v.ebit!!==0 && !n(v.dol)) { v.dol = r(v.cm!/v.ebit!); c=true; }
        if(n(v.dol) && n(v.ebit) && !n(v.cm)) { v.cm = r(v.dol!*v.ebit!); c=true; }
        if(n(v.ebit) && n(v.ebt) && v.ebt!!==0 && !n(v.dfl)) { v.dfl = r(v.ebit!/v.ebt!); c=true; }
        if(n(v.dfl) && n(v.ebt) && !n(v.ebit)) { v.ebit = r(v.dfl!*v.ebt!); c=true; }
        if(n(v.dol) && n(v.dfl) && !n(v.dcl)) { v.dcl = r(v.dol!*v.dfl!); c=true; }
        if(n(v.dcl) && n(v.dol) && v.dol!>0 && !n(v.dfl)) { v.dfl = r(v.dcl!/v.dol!); c=true; }
        if(n(v.dcl) && n(v.dfl) && v.dfl!>0 && !n(v.dol)) { v.dol = r(v.dcl!/v.dfl!); c=true; }
        // Direct: DCL = CM / EBT
        if(n(v.cm) && n(v.ebt) && v.ebt!!==0 && !n(v.dcl)) { v.dcl = r(v.cm!/v.ebt!); c=true; }
      }
      if(n(v.dcl)) {
        if(v.dcl! <= 2) v._decision = '🟢 رافعة محافظة (DCL ≤ 2)';
        else if(v.dcl! <= 5) v._decision = '🟡 رافعة متوسطة (2-5)';
        else v._decision = '🔴 رافعة عالية جداً (> 5) — مخاطر مرتفعة';
      }
      return v;
    },
    formula: 'DOL = CM/EBIT | DFL = EBIT/EBT | DCL = DOL × DFL',
    latex: '\\\\text{DCL} = \\\\text{DOL} \\\\times \\\\text{DFL} = \\\\frac{CM}{EBT}'
  },
  {
    id: 'lease_vs_buy', title: 'التأجير مقابل الشراء', icon: '🔄', color: '#C5E1A5',
    desc: 'مقارنة القيمة الحالية لتكلفة التأجير مع الشراء',
    fields:[
      {k:'buy_cost',  l:'تكلفة الشراء',            u:'ج.م'},
      {k:'lease_pmt', l:'القسط السنوي للتأجير',    u:'ج.م'},
      {k:'n',         l:'عدد سنوات التأجير',        u:'سنة'},
      {k:'rate',      l:'معدل الخصم',               u:'%'},
      {k:'salvage',   l:'القيمة المتبقية عند الشراء',u:'ج.م'},
      {k:'pv_lease',  l:'PV تكلفة التأجير',         u:'ج.م'},
      {k:'net_buy',   l:'صافي تكلفة الشراء',       u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      if(!n(v.salvage)) v.salvage = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.rate) && v.rate! < 0) { v._error = 'معدل الخصم لا يمكن أن يكون سالباً'; break; }
        if(n(v.n) && v.n! <= 0) { v._error = 'عدد السنوات يجب أن يكون أكبر من صفر'; break; }
        const rr = n(v.rate) ? v.rate!/100 : null;
        // PV of Lease
        if(n(v.lease_pmt) && rr !== null && rr>0 && n(v.n) && !n(v.pv_lease)) {
          v.pv_lease = r(v.lease_pmt! * (1 - Math.pow(1+rr, -v.n!)) / rr); c=true;
        }
        // Net buy cost = Buy - PV(Salvage)
        if(n(v.buy_cost) && rr !== null && n(v.n) && !n(v.net_buy)) {
          const pvSalvage = (v.salvage||0) / Math.pow(1+rr, v.n!);
          v.net_buy = r(v.buy_cost! - pvSalvage); c=true;
        }
      }
      if(n(v.pv_lease) && n(v.net_buy)) {
        if(v.pv_lease! < v.net_buy!) v._decision = '🏷️ التأجير أفضل — وفر ' + r(v.net_buy! - v.pv_lease!) + ' ج.م';
        else if(v.net_buy! < v.pv_lease!) v._decision = '🛒 الشراء أفضل — وفر ' + r(v.pv_lease! - v.net_buy!) + ' ج.م';
        else v._decision = '⚖️ التكلفتان متساويتان';
      }
      return v;
    },
    formula: 'PV التأجير = القسط × معامل القسط | صافي الشراء = التكلفة − PV(المتبقية)',
    latex: '\\\\text{PV Lease} = PMT \\\\times \\\\frac{1-(1+r)^{-n}}{r}'
  },
  {
    id: 'bond_pricing', title: 'تسعير السندات', icon: '📜', color: '#B0BEC5',
    desc: 'القيمة الحالية لسند يدفع كوبونات دورية + القيمة الاسمية',
    fields:[
      {k:'face',     l:'القيمة الاسمية',    u:'ج.م'},
      {k:'coupon_r', l:'معدل الكوبون',      u:'%'},
      {k:'coupon',   l:'قيمة الكوبون',      u:'ج.م'},
      {k:'ytm',      l:'العائد حتى الاستحقاق',u:'%'},
      {k:'n',        l:'عدد الفترات',        u:'فترة'},
      {k:'pv_coupon',l:'PV الكوبونات',       u:'ج.م'},
      {k:'pv_face',  l:'PV القيمة الاسمية',  u:'ج.م'},
      {k:'price',    l:'سعر السند',          u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error; delete v._decision;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.n) && v.n! <= 0) { v._error = 'عدد الفترات يجب أن يكون أكبر من صفر'; break; }
        if(n(v.face) && n(v.coupon_r) && !n(v.coupon)) { v.coupon = r(v.face! * (v.coupon_r!/100)); c=true; }
        if(n(v.coupon) && n(v.face) && v.face!>0 && !n(v.coupon_r)) { v.coupon_r = r((v.coupon!/v.face!)*100); c=true; }
        const rr = n(v.ytm) ? v.ytm!/100 : null;
        if(n(v.coupon) && rr !== null && rr>0 && n(v.n) && !n(v.pv_coupon)) {
          v.pv_coupon = r(v.coupon! * (1 - Math.pow(1+rr, -v.n!)) / rr); c=true;
        }
        if(n(v.face) && rr !== null && n(v.n) && !n(v.pv_face)) {
          v.pv_face = r(v.face! / Math.pow(1+rr, v.n!)); c=true;
        }
        if(n(v.pv_coupon) && n(v.pv_face) && !n(v.price)) { v.price = r(v.pv_coupon! + v.pv_face!); c=true; }
      }
      if(n(v.price) && n(v.face)) {
        if(v.price! > v.face!) v._decision = '📈 السند يُباع بعلاوة (Premium)';
        else if(v.price! < v.face!) v._decision = '📉 السند يُباع بخصم (Discount)';
        else v._decision = '➡️ السند بالقيمة الاسمية (Par)';
      }
      return v;
    },
    formula: 'السعر = PV(الكوبونات) + PV(القيمة الاسمية)',
    latex: '\\\\text{Price} = C \\\\times \\\\frac{1-(1+r)^{-n}}{r} + \\\\frac{F}{(1+r)^n}'
  },
  {
    id: 'cash_breakeven', title: 'التعادل النقدي', icon: '💵', color: '#E0F7FA',
    desc: 'نقطة التعادل بعد استبعاد المصاريف غير النقدية (الإهلاك)',
    fields:[
      {k:'fc',   l:'التكاليف الثابتة',        u:'ج.م'},
      {k:'dep',  l:'الإهلاك (غير نقدي)',      u:'ج.م'},
      {k:'cash_fc',l:'الثابتة النقدية فقط',  u:'ج.م'},
      {k:'cm',   l:'هامش مساهمة الوحدة',      u:'ج.م'},
      {k:'cmr',  l:'نسبة هامش المساهمة',      u:'%'},
      {k:'cash_beq',l:'التعادل النقدي (كمية)',u:'وحدة'},
      {k:'cash_bes',l:'التعادل النقدي (قيمة)',u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      if(!n(v.dep)) v.dep = 0;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.fc) && n(v.dep) && !n(v.cash_fc)) { v.cash_fc = r(v.fc! - v.dep!); c=true; }
        if(n(v.cash_fc) && n(v.dep) && !n(v.fc)) { v.fc = r(v.cash_fc! + v.dep!); c=true; }
        if(n(v.cash_fc) && n(v.cm) && v.cm!>0 && !n(v.cash_beq)) { v.cash_beq = Math.ceil(v.cash_fc! / v.cm!); c=true; }
        if(n(v.cash_fc) && n(v.cmr) && v.cmr!>0 && !n(v.cash_bes)) { v.cash_bes = r(v.cash_fc! / (v.cmr!/100)); c=true; }
      }
      return v;
    },
    formula: 'التعادل النقدي = (ثابتة − إهلاك) ÷ هامش الوحدة',
    latex: '\\\\text{Cash BEQ} = \\\\frac{\\\\text{FC} - \\\\text{Dep}}{\\\\text{CM/u}}'
  },
  {
    id: 'master_budget', title: 'ملخص الموازنة الرئيسية', icon: '📋', color: '#BBDEFB',
    desc: 'ربط نتائج كل الموازنات الفرعية في ملخص واحد',
    fields:[
      {k:'sales_rev', l:'إيرادات المبيعات',     u:'ج.م'},
      {k:'cogs',      l:'تكلفة البضاعة المباعة',u:'ج.م'},
      {k:'gross',     l:'مجمل الربح',           u:'ج.م'},
      {k:'opex',      l:'مصاريف التشغيل',       u:'ج.م'},
      {k:'ebit',      l:'الربح التشغيلي',       u:'ج.م'},
      {k:'capex',     l:'الإنفاق الرأسمالي',    u:'ج.م'},
      {k:'net_cf',    l:'صافي التدفق النقدي',   u:'ج.م'},
    ],
    solver: (v: Record<string, number | null> & { _error?: string, _decision?: string }) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        if(n(v.sales_rev) && n(v.cogs) && !n(v.gross)) { v.gross = r(v.sales_rev! - v.cogs!); c=true; }
        if(n(v.gross) && n(v.cogs) && !n(v.sales_rev)) { v.sales_rev = r(v.gross! + v.cogs!); c=true; }
        if(n(v.sales_rev) && n(v.gross) && !n(v.cogs)) { v.cogs = r(v.sales_rev! - v.gross!); c=true; }
        if(n(v.gross) && n(v.opex) && !n(v.ebit)) { v.ebit = r(v.gross! - v.opex!); c=true; }
        if(n(v.ebit) && n(v.opex) && !n(v.gross)) { v.gross = r(v.ebit! + v.opex!); c=true; }
        if(n(v.gross) && n(v.ebit) && !n(v.opex)) { v.opex = r(v.gross! - v.ebit!); c=true; }
        if(n(v.ebit) && n(v.capex) && !n(v.net_cf)) { v.net_cf = r(v.ebit! - (v.capex||0)); c=true; }
      }
      return v;
    },
    formula: 'مجمل الربح = إيرادات − COGS | EBIT = مجمل − OpEx | صافي = EBIT − CapEx',
    latex: '\\\\text{EBIT} = \\\\text{المبيعات} - \\\\text{COGS} - \\\\text{OpEx}'
  }
];

// Auto-wrap all solvers to enforce high precision intermediate calculations
// and perform rounding only at the final output step.
MODULES.forEach(mod => {
  const origSolver = mod.solver;
  mod.solver = (v: any) => {
    const solved = origSolver(v);
    // Round numeric values in the returned object to 2 decimal places
    Object.keys(solved).forEach(k => {
      if (typeof solved[k] === 'number' && k !== '_error' && k !== '_decision') {
        solved[k] = Math.round(solved[k] * 100) / 100;
      }
    });
    return solved;
  };
});
