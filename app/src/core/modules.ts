import { AccountingModuleDef } from './types';

const n = (v: number | null | undefined): boolean => v !== null && v !== undefined && !isNaN(v as number) && String(v) !== '';
const r = (v: number) => Math.round(v * 100) / 100;

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
];
