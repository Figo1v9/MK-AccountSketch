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
    solver: (v: any) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
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
        solver: (s: any) => (n(s.t_vc) && n(s.t_qty) && s.t_qty > 0) ? r(s.t_vc / s.t_qty) : null
      }},
      {k:'vc',   l:'إجمالي التكاليف المتغيرة',u:'ج.م', helper: { type: 'dynamic_sum', title: 'تجميع البنود المتغيرة' }},
      {k:'cm_pu',l:'هامش المساهمة للوحدة',    u:'ج.م'},
      {k:'cm',   l:'إجمالي هامش المساهمة',    u:'ج.م'},
      {k:'fc',   l:'إجمالي التكاليف الثابتة', u:'ج.م', helper: { type: 'dynamic_sum', title: 'تجميع البنود الثابتة' }},
      {k:'ni',   l:'صافي الدخل التشغيلي',    u:'ج.م'},
      {k:'cmr',  l:'نسبة هامش المساهمة',      u:'%'},
    ],
    solver: (v: any) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;

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
      if (n(v.rev) && v.rev! < 0) v._error = 'المبيعات لا يمكن أن تكون قيمة سالبة';
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
    solver: (v: Record<string, number | null>) => {
      if(n(v.rev) && n(v.cogs) && !n(v.gp)) v.gp=r(v.rev!-v.cogs!);
      if(n(v.rev) && n(v.gp) && !n(v.cogs)) v.cogs=r(v.rev!-v.gp!);
      if(n(v.gp) && n(v.rev) && v.rev!==0 && !n(v.gmp)) v.gmp=r((v.gp!/v.rev!)*100);
      if(n(v.gmp) && n(v.rev) && !n(v.gp)) v.gp=r((v.gmp!/100)*v.rev!);
      return v;
    },
    formula: 'هامش المساهمة (٪) = (مجمل الربح ÷ الإيراد) × 100',
    latex: '\\text{نسبة هامش الربح} = \\left( \\frac{\\text{مجمل الربح}}{\\text{الإيرادات}} \\right) \\times 100'
  },
  {
    id: 'breakeven', title: 'نقطة التعادل', icon: '⚖️', color: '#FFBD2E',
    desc: 'حجم التغطية لتكاليف التشغيل',
    fields:[
      {k:'fc',  l:'التكاليف الثابتة',     u:'ج.م', helper: { type: 'dynamic_sum', title: 'جمع التكاليف الثابتة' }},
      {k:'p',   l:'سعر بيع للوحدة',       u:'ج.م'},
      {k:'vc',  l:'ت. متغيرة للوحدة',u:'ج.م', helper: {
         type: 'formula', title: 'حساب التكلفة للوحدة',
         fields: [{k:'total_vc', l:'إجمالي التكاليف المتغيرة', u:'ج.م'}, {k:'qty', l:'إجمالي الوحدات', u:'وحدة'}],
         solver: (s: any) => (n(s.total_vc) && n(s.qty) && s.qty > 0) ? r(s.total_vc / s.qty) : null
      }},
      {k:'cmr', l:'نسبة هامش المساهمة',    u:'%'},
      {k:'beq', l:'التعادل بالكمية',         u:'وحدة'},
      {k:'bes', l:'التعادل بالقيمة',         u:'ج.م'}
    ],
    solver: (v: any) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        const cm = (n(v.p) && n(v.vc)) ? (v.p! - v.vc!) : null;

        if (cm !== null && cm <= 0) {
            v._error = 'سعر البيع يجب أن يكون أكبر من التكلفة المتغيرة للوحدة';
            break;
        }

        // CMR = CM / P * 100
        if(cm !== null && n(v.p) && v.p! > 0 && !n(v.cmr)) { v.cmr = r((cm / v.p!) * 100); c=true; }
        if(n(v.cmr) && n(v.p) && !n(v.vc)) { v.vc = r(v.p! * (1 - v.cmr!/100)); c=true; }

        // BE Qty = FC / CM
        if(n(v.fc) && cm !== null && !n(v.beq)) { v.beq = Math.ceil(v.fc! / cm); c = true; }
        if(n(v.beq) && cm !== null && !n(v.fc)) { v.fc = r(v.beq! * cm); c = true; }
        if(n(v.fc) && n(v.beq) && v.beq !== 0) {
             const reqCm = v.fc! / v.beq!;
             if (n(v.p) && !n(v.vc)) { v.vc = r(v.p! - reqCm); c=true; }
             if (n(v.vc) && !n(v.p)) { v.p = r(v.vc! + reqCm); c=true; }
        }

        // BES = FC / CMR  (by value)
        if(n(v.fc) && n(v.cmr) && v.cmr! > 0 && !n(v.bes)) { v.bes = r(v.fc! / (v.cmr!/100)); c=true; }
        if(n(v.bes) && n(v.cmr) && v.cmr! > 0 && !n(v.fc)) { v.fc = r(v.bes! * (v.cmr!/100)); c=true; }

        // BES = BEQ * P
        if(n(v.beq) && n(v.p) && !n(v.bes)) { v.bes = r(v.beq! * v.p!); c = true; }
        if(n(v.bes) && n(v.p) && v.p !== 0 && !n(v.beq)) { v.beq = r(v.bes! / v.p!); c = true; }
        if(n(v.bes) && n(v.beq) && v.beq !== 0 && !n(v.p)) { v.p = r(v.bes! / v.beq!); c = true; }
      }
      return v;
    },
    formula: 'كمية التعادل = ت.ثابتة ÷ هامش الوحدة | قيمة التعادل = ت.ثابتة ÷ نسبة الهامش',
    latex: '\\text{كمية التعادل} = \\frac{\\text{التكاليف الثابتة}}{\\text{سعر البيع} - \\text{التكلفة المتغيرة}}'
  },
  {
    id: 'balance', title: 'معادلة الميزانية', icon: '🏦', color: '#8AFF92',
    desc: 'توازن الأصول مع الخصوم وحقوق الملكية',
    fields:[
      {k:'a', l:'إجمالي الأصول',        u:'ج.م'},
      {k:'l', l:'إجمالي الخصوم',        u:'ج.م'},
      {k:'e', l:'حقوق الملكية',         u:'ج.م'},
    ],
    solver: (v: Record<string, number | null>) => {
      if(n(v.a) && n(v.l) && !n(v.e)) v.e = r(v.a! - v.l!);
      if(n(v.a) && n(v.e) && !n(v.l)) v.l = r(v.a! - v.e!);
      if(n(v.l) && n(v.e) && !n(v.a)) v.a = r(v.l! + v.e!);
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
    solver: (v: any) => {
      delete v._error;
      if(n(v.assets) && v.assets === 0) {
         v._error = 'متوسط الأصول لا يمكن أن يكون صفراً';
         return v;
      }
      if(n(v.ni) && n(v.assets) && v.assets!==0 && !n(v.roi)) v.roi = r((v.ni!/v.assets!)*100);
      if(n(v.roi) && n(v.assets) && !n(v.ni)) v.ni = r((v.roi!/100)*v.assets!);
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
    solver: (v: any) => {
      delete v._error;
      if(n(v.hc) && n(v.lc) && n(v.ha) && n(v.la)) {
        if((v.ha! - v.la!) === 0) {
            v._error = 'أعلى نشاط يجب أن يختلف عن أدنى نشاط';
        } else if(!n(v.vc)) {
            v.vc = r((v.hc! - v.lc!) / (v.ha! - v.la!));
        }
        if(n(v.vc) && !n(v.fc)) v.fc = r(v.hc! - (v.vc! * v.ha!));
      }
      // Y = a + b*X
      if(n(v.fc) && n(v.vc) && n(v.x) && !n(v.y)) v.y = r(v.fc! + v.vc! * v.x!);
      if(n(v.y) && n(v.fc) && n(v.vc) && v.vc! !== 0 && !n(v.x)) v.x = r((v.y! - v.fc!) / v.vc!);
      return v;
    },
    formula: 'ب = فرق التكلفة ÷ فرق النشاط | ص = أ + ب×س',
    latex: '\\text{ص} = \\text{أ} + \\text{ب} \\times \\text{س}'
  },
  {
    id: 'target_sales', title: 'المبيعات المستهدفة', icon: '🎯', color: '#BDECB6',
    desc: 'الوصول لهدف ربحي محدد (قبل أو بعد الضريبة)',
    fields:[
      {k:'fc',  l:'تكاليف ثابتة',     u:'ج.م'},
      {k:'tp',  l:'الربح المستهدف',    u:'ج.م'},
      {k:'tax', l:'نسبة الضريبة',     u:'%'},
      {k:'cm',  l:'هامش مساهمة الوحدة',u:'ج.م', helper: {
          type: 'formula', title: 'استنتاج الهامش للوحدة',
          fields: [{k:'p', l:'سعر البيع', u:'ج.م'}, {k:'v', l:'ت. متغيرة للوحدة', u:'ج.م'}],
          solver: (s: any) => (n(s.p) && n(s.v)) ? r(s.p - s.v) : null
      }},
      {k:'price',  l:'سعر البيع (اختياري)',u:'ج.م'},
      {k:'qty', l:'المبيعات المطلوبة (كمية)',         u:'وحدة'},
      {k:'val', l:'المبيعات المستهدفة (قيمة)',        u:'ج.م'},
    ],
    solver: (v: any) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
        
        // If Net Profit (tp) and Tax are given, we need Pre-tax Profit for the volume formula
        let reqPreTax = v.tp;
        if(n(v.tp) && n(v.tax)) {
            reqPreTax = v.tp! / (1 - (v.tax! / 100));
        }

        if (n(v.cm) && v.cm! <= 0) {
            v._error = 'هامش المساهمة يجب أن يكون أكبر من الصفر';
            break;
        }

        // QTY = (FC + PreTax) / CM
        if(n(v.fc) && n(reqPreTax) && n(v.cm) && !n(v.qty)) { v.qty = Math.ceil((v.fc! + reqPreTax!) / v.cm!); c = true; }
        
        // (FC + PreTax) = QTY * CM
        if(n(v.qty) && n(v.cm)) {
            const currentPreTaxTotal = v.qty! * v.cm! - (v.fc || 0);
            if(!n(v.tp)) { 
                v.tp = n(v.tax) ? r(currentPreTaxTotal * (1 - (v.tax!/100))) : r(currentPreTaxTotal);
                c = true; 
            }
            if(n(v.tp) && !n(v.fc)) { v.fc = r((v.qty! * v.cm!) - (n(v.tax) ? v.tp! / (1-(v.tax!/100)) : v.tp!)); c = true; }
        }

        // CM = (FC + PreTax) / QTY
        if(n(v.fc) && n(reqPreTax) && n(v.qty) && v.qty! > 0 && !n(v.cm)) {
            v.cm = r((v.fc! + reqPreTax!) / v.qty!); c = true;
        }

        // VAL = QTY * PRICE
        if (n(v.qty) && n(v.price) && !n(v.val)) { v.val = r(v.qty! * v.price!); c = true; }
        // QTY = VAL / PRICE
        if (n(v.val) && n(v.price) && v.price! > 0 && !n(v.qty)) { v.qty = r(v.val! / v.price!); c = true; }
        // PRICE = VAL / QTY
        if (n(v.val) && n(v.qty) && v.qty! > 0 && !n(v.price)) { v.price = r(v.val! / v.qty!); c = true; }
      }
      return v;
    },
    formula: 'المبيعات المستهدفة = (ثابتة + ربح) / هامش | لو الربح بعد الضريبة: ربح_قبل = بعد / (1-ض)',
    latex: '\\text{كمية المبيعات} = \\frac{\\text{التكاليف الثابتة} + \\frac{\\text{صافي الربح}}{1 - \\text{نسبة الضريبة}}}{\\text{هامش المساهمة للوحدة}}'
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
    solver: (v: any) => {
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
    solver: (v: any) => {
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
    solver: (v: Record<string, number | null>) => {
      if(n(v.es) && n(v.end_inv) && n(v.start_inv) && !n(v.prod)) {
          v.prod = r(v.es! + v.end_inv! - v.start_inv!);
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
    solver: (v: Record<string, number | null>) => {
      if(n(v.prod) && n(v.m_pu) && !n(v.t_mat)) {
          v.t_mat = r(v.prod! * v.m_pu!);
      }
      if(n(v.t_mat) && n(v.end_inv) && n(v.start_inv) && !n(v.purch)) {
          v.purch = r(v.t_mat! + v.end_inv! - v.start_inv!);
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
    solver: (v: Record<string, number | null>) => {
      if(n(v.vmfg) && n(v.fmfg) && !n(v.make_cost)) v.make_cost = r(v.vmfg! + v.fmfg!);
      if(n(v.buy_p) && n(v.buy_e) && !n(v.buy_cost)) v.buy_cost = r(v.buy_p! + v.buy_e!);
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
    solver: (v: Record<string, number | null>) => {
      if(n(v.avoid_c) && n(v.rev_lost) && !n(v.net)) {
          v.net = r(v.avoid_c! - v.rev_lost!); // Negative means drop is bad. Positive means drop saves money.
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
    solver: (v: Record<string, number | null>) => {
      if(n(v.est_qty) && n(v.est_price) && !n(v.est_sales)) {
          v.est_sales = r(v.est_qty! * v.est_price!); 
      }
      if(n(v.est_sales) && n(v.est_price) && !n(v.est_qty)) {
          v.est_qty = r(v.est_sales! / v.est_price!); 
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
    solver: (v: Record<string, number | null>) => {
      if(n(v.ca)&&n(v.cl)&&v.cl!==0) v.cr = r(v.ca!/v.cl!);
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
    solver: (v: Record<string, number | null>) => {
      if(n(v.oi) && n(v.pur) && n(v.ci)) v.cog = r(v.oi! + v.pur! - v.ci!);
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
    solver: (v: any) => v,
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
         solver: (s: any) => r((s.m_pu||0) + (s.l_pu||0) + (s.voh_pu||0))
      }},
    ],
    solver: (v: any) => {
        delete v._error;
        if(n(v.vc) && n(v.qty) && v.qty! > 0 && !n(v.vc_pu)) v.vc_pu = r(v.vc! / v.qty!);
        if(n(v.vc_pu) && n(v.qty) && !n(v.vc)) v.vc = r(v.vc_pu! * v.qty!);
        if(n(v.vc) && n(v.vc_pu) && v.vc_pu! > 0 && !n(v.qty)) v.qty = Math.ceil(v.vc! / v.vc_pu!);
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
    solver: (v: any) => {
      delete v._error;
      let c=true, i=0;
      while(c && i<10){
        c=false; i++;
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
      if(n(v.cost) && n(v.salvage) && v.salvage! > v.cost!) v._error = 'القيمة التخريدية لا يمكن أن تتجاوز تكلفة الأصل';
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
    solver: (v: any) => {
      delete v._error;
      if(n(v.qty) && n(v.sp) && !n(v.order_rev)) v.order_rev = r(v.qty! * v.sp!);
      if(n(v.qty) && n(v.vc_pu)) {
        const vc_total = r(v.qty! * v.vc_pu!);
        if(!n(v.order_cost)) v.order_cost = r(vc_total + (v.extra_fc || 0));
      }
      if(n(v.order_rev) && n(v.order_cost) && !n(v.net)) v.net = r(v.order_rev! - v.order_cost!);
      if(n(v.net)) {
        if(v.net! > 0) v._decision = 'قبول الطلبية (ربح)';
        else v._decision = 'رفض الطلبية (خسارة)';
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
    solver: (v: any) => {
      delete v._error;
      if(n(v.rev_further) && n(v.rev_split) && !n(v.inc_rev)) v.inc_rev = r(v.rev_further! - v.rev_split!);
      if(n(v.inc_rev) && n(v.add_cost) && !n(v.net)) v.net = r(v.inc_rev! - v.add_cost!);
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
    solver: (v: any) => {
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
  }
];
