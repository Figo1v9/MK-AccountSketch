import { AccountingNodeData, AccountingModuleDef } from '@/core/types';
import { StepDataBlock } from '@/store/modalStore';

const f = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined) return '\\text{...}';
    let s = val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Format negative numbers properly for LaTeX rendering
    if (s.startsWith('-')) {
        s = '-' + s.substring(1);
    }
    return s;
};

// Create a nice boxed result in LaTeX
const resBox = (val: number | string | null | undefined, unit: string) => `\\boxed{\\text{${f(val)} ${unit}}}`;

export const generateStepsLatex = (def: AccountingModuleDef, data: AccountingNodeData): StepDataBlock[] => {
    const v = data.vals;
    const blocks: StepDataBlock[] = [];
    
    // --------------------------------------------------------------------------------
    // الفصل الثالث: CVP (تحليل العلاقة بين التكلفة والحجم والربح)
    // --------------------------------------------------------------------------------
    if (def.id === 'breakeven') {
        blocks.push({ type: 'header', text: 'أ) نقطة التعادل' });
        
        let denomStr = '\\text{سعر البيع} - \\text{التكلفة المتغيرة للوحدة}';
        let denomVal = `${f(v.p)} - ${f(v.vc)}`;
        if (v.cm && v.cm > 0) {
            denomStr = '\\text{هامش المساهمة للوحدة}';
            denomVal = `${f(v.cm)}`;
        }
        
        blocks.push({ type: 'latex', latex: `\\text{بالوحدات} = \\frac{\\text{إجمالي التكاليف الثابتة}}{${denomStr}} = \\frac{${f(v.fc)}}{${denomVal}} = ${resBox(v.beq, 'وحدة')}` });
        blocks.push({ type: 'latex', latex: `\\text{بالقيمة} = \\text{كمية التعادل} \\times \\text{سعر البيع} = ${f(v.beq)} \\times ${f(v.p)} = ${resBox(v.bes, 'ج.م')}` });
        
        if (v.cmr && v.cmr > 0) {
            blocks.push({ type: 'header', text: 'أو بالقيمة (باستخدام نسبة هامش المساهمة)' });
            blocks.push({ type: 'latex', latex: `\\text{بالقيمة} = \\frac{\\text{التكاليف الثابتة}}{\\text{نسبة هامش المساهمة}} = \\frac{${f(v.fc)}}{${f(v.cmr)}\\%} = ${resBox(v.bes, 'ج.م')}` });
        }
    } 
    else if (def.id === 'cvp_income') {
        blocks.push({ type: 'header', text: 'أ) إجمالي المبيعات' });
        blocks.push({ type: 'latex', latex: `\\text{إجمالي المبيعات} = ${f(v.qty)} \\times ${f(v.price)} = ${resBox(v.rev, 'ج.م')}` });
        
        blocks.push({ type: 'header', text: 'ب) إجمالي التكاليف المتغيرة' });
        blocks.push({ type: 'latex', latex: `\\text{إجمالي المتغيرة} = ${f(v.qty)} \\times ${f(v.vc_pu)} = ${resBox(v.vc, 'ج.م')}` });
        
        blocks.push({ type: 'header', text: 'ج) إجمالي هامش المساهمة' });
        blocks.push({ type: 'latex', latex: `\\text{هامش المساهمة الإجمالي} = ${f(v.rev)} - ${f(v.vc)} = ${resBox(v.cm, 'ج.م')}` });
        
        blocks.push({ type: 'header', text: 'د) صافي الدخل التشغيلي' });
        blocks.push({ type: 'latex', latex: `\\text{صافي الدخل} = ${f(v.cm)} - ${f(v.fc)} = ${resBox(v.ni, 'ج.م')}` });
    }
    else if (def.id === 'target_sales') {
        blocks.push({ type: 'header', text: 'المبيعات المستهدفة' });
        
        const targetProfit = v.tp_pre || 0;
        const tpStr = `\\text{الربح المستهدف (قبل الضريبة)}`;
        
        if (v.tax && v.tax > 0) {
            blocks.push({ type: 'text', text: 'تمت إضافة ضريبة، يجب تحويل الربح المستهدف (بعد الضريبة) إلى ربح قبل الضريبة:' });
            blocks.push({ type: 'latex', latex: `\\text{الربح قبل الضريبة} = \\frac{\\text{الربح (بعد الضريبة)}}{1 - \\text{نسبة الضريبة}} = \\frac{${f(v.tp_post)}}{1 - ${f(v.tax / 100)}} = ${resBox(v.tp_pre, 'ج.م')}` });
        }

        blocks.push({ type: 'latex', latex: `\\text{بالكمية} = \\frac{\\text{التكاليف الثابتة} + ${tpStr}}{\\text{هامش المساهمة للوحدة}} = \\frac{${f(v.fc)} + ${f(targetProfit)}}{${f(v.cm)}} = ${resBox(v.qty, 'وحدة')}` });
        
        blocks.push({ type: 'text', text: 'ولحسابها بالقيمة:' });
        blocks.push({ type: 'latex', latex: `\\text{بالقيمة} = \\text{الكمية المطلوبة} \\times \\text{سعر البيع} = ${f(v.qty)} \\times ${f(v.price)} = ${resBox(v.val, 'ج.م')}` });
    }
    else if (def.id === 'mos') {
        blocks.push({ type: 'header', text: 'هامش الأمان (یقيس الانفراجة للمبيعات ما بعد التعادل)' });
        
        blocks.push({ type: 'latex', latex: `\\text{قيمة هامش الأمان} = \\text{المبيعات} - \\text{مبيعات التعادل} = ${f(v.es)} - ${f(v.bs)} = ${resBox(v.mosv, 'ج.م/وحدة')}` });
        
        blocks.push({ type: 'text', text: 'ولحساب نسبة هذا الهامش الآمن نقوم بقسمته على إجمالي المبيعات الأصلية:' });
        blocks.push({ type: 'latex', latex: `\\text{نسبة هامش الأمان} = \\frac{\\text{قيمة هامش الأمان}}{\\text{المبيعات المتوقعة}} \\times 100 = \\frac{${f(v.mosv)}}{${f(v.es)}} \\times 100 = ${resBox(v.mosr, '\\%')}` });
    }
    else if (def.id === 'op_leverage') {
        blocks.push({ type: 'header', text: 'أ) درجة الرافعة التشغيلية (DOL)' });
        blocks.push({ type: 'latex', latex: `\\text{DOL} = \\frac{\\text{إجمالي هامش المساهمة}}{\\text{صافي الربح التشغيلي}} = \\frac{${f(v.cm)}}{${f(v.oni)}} = ${resBox(v.dol, 'مرة')}` });
        
        if (v.sales_chg) {
            blocks.push({ type: 'header', text: 'ب) نسبة الزيادة المتوقعة في الأرباح' });
            blocks.push({ type: 'latex', latex: `\\% \\text{زيادة الأرباح} = \\text{DOL} \\times \\% \\text{زيادة المبيعات} = ${f(v.dol)} \\times ${f(v.sales_chg)}\\% = ${resBox(v.income_chg, '\\%')}` });
        }
    }
    // --------------------------------------------------------------------------------
    // قوائم الدخل والنسب الأساسية
    // --------------------------------------------------------------------------------
    else if (def.id === 'income') {
        blocks.push({ type: 'header', text: 'أ) مجمل الربح' });
        blocks.push({ type: 'latex', latex: `\\text{مجمل الربح} = \\text{الإيرادات} - \\text{تكلفة البضاعة المباعة}` });
        blocks.push({ type: 'latex', latex: `\\text{مجمل الربح} = ${f(v.rev)} - ${f(v.cogs)} = ${resBox(v.gp, 'ج.م')}` });
        
        blocks.push({ type: 'header', text: 'ب) الربح قبل الفوائد والضرائب (EBIT)' });
        blocks.push({ type: 'latex', latex: `\\text{EBIT} = \\text{مجمل الربح} - \\text{مصاريف التشغيل}` });
        blocks.push({ type: 'latex', latex: `\\text{EBIT} = ${f(v.gp)} - ${f(v.opex)} = ${resBox(v.ebit, 'ج.م')}` });
        
        blocks.push({ type: 'header', text: 'ج) صافي الدخل النهائي' });
        blocks.push({ type: 'latex', latex: `\\text{صافي الدخل} = \\text{EBIT} - (\\text{استقطاعات تمويلية وضرائب})` });
        blocks.push({ type: 'latex', latex: `\\text{صافي الدخل} = ${f(v.ebit)} - (${f(v.int)} + ${f(v.tax)}) = ${resBox(v.ni, 'ج.م')}` });
    }
    else if (def.id === 'gmargin') {
        blocks.push({ type: 'header', text: 'حساب نسبة هامش الربح الإجمالي' });
        blocks.push({ type: 'latex', latex: `\\text{نسبة الهامش} = \\left( \\frac{\\text{مجمل الربح}}{\\text{الإيراد الكلي}} \\right) \\times 100` });
        blocks.push({ type: 'latex', latex: `\\text{نسبة الهامش} = \\left( \\frac{${f(v.gp)}}{${f(v.rev)}} \\right) \\times 100 = ${resBox(v.gmp, '\\%')}` });
    }
    else if (def.id === 'balance') {
        blocks.push({ type: 'header', text: 'معادلة الميزانية العامة' });
        blocks.push({ type: 'text', text: 'توازن الأصول مع الخصوم وحقوق الملكية:' });
        blocks.push({ type: 'latex', latex: `\\text{الأصول} = \\text{الخصوم} + \\text{حقوق الملكية}` });
        
        if (data.calcKeys?.includes('e')) {
            blocks.push({ type: 'latex', latex: `\\text{حقوق الملكية} = \\text{الأصول} - \\text{الخصوم} = ${f(v.a)} - ${f(v.l)} = ${resBox(v.e, 'ج.م')}` });
        } else if (data.calcKeys?.includes('a')) {
            blocks.push({ type: 'latex', latex: `\\text{الأصول} = ${f(v.l)} + ${f(v.e)} = ${resBox(v.a, 'ج.م')}` });
        } else if (data.calcKeys?.includes('l')) {
            blocks.push({ type: 'latex', latex: `\\text{الخصوم} = ${f(v.a)} - ${f(v.e)} = ${resBox(v.l, 'ج.م')}` });
        } else {
            blocks.push({ type: 'latex', latex: `${f(v.a)} = ${f(v.l)} + ${f(v.e)}` });
        }
    }
    // --------------------------------------------------------------------------------
    // الفصل الثاني: فصل التكاليف (High-Low Method)
    // --------------------------------------------------------------------------------
    else if (def.id === 'mixed_cost') {
        blocks.push({ type: 'header', text: 'طريقة الحد الأعلى والأدنى (فصل التكاليف المختلطة)' });
        blocks.push({ type: 'text', text: 'أ) التكلفة المتغيرة للوحدة (ب):' });
        blocks.push({ type: 'latex', latex: `\\text{ب} = \\frac{\\text{تكلفة أعلى نشاط} - \\text{تكلفة أدنى نشاط}}{\\text{أعلى نشاط} - \\text{أدنى نشاط}} = \\frac{${f(v.hc)} - ${f(v.lc)}}{${f(v.ha)} - ${f(v.la)}} = ${resBox(v.vc, 'ج.م/وحدة')}` });
        
        blocks.push({ type: 'text', text: 'ب) التكلفة الثابتة الإجمالية (أ):' });
        blocks.push({ type: 'latex', latex: `\\text{أ} = \\text{التكلفة الكلية} - (\\text{ب} \\times \\text{النشاط}) = ${f(v.hc)} - (${f(v.vc)} \\times ${f(v.ha)}) = ${resBox(v.fc, 'ج.م')}` });
        
        if (v.x) {
            blocks.push({ type: 'text', text: 'ج) التنبؤ بالتكلفة الإجمالية (ص):' });
            blocks.push({ type: 'latex', latex: `\\text{ص} = \\text{أ} + \\text{ب} \\text{ س} = ${f(v.fc)} + (${f(v.vc)} \\times ${f(v.x)}) = ${resBox(v.y, 'ج.م')}` });
        }
    }
    // --------------------------------------------------------------------------------
    // الفصل الرابع: التكاليف الملائمة واتخاذ القرارات
    // --------------------------------------------------------------------------------
    else if (def.id === 'make_buy') {
        blocks.push({ type: 'header', text: 'قرار التصنيع أو الشراء الخارجي' });
        blocks.push({ type: 'text', text: 'أ) تكلفة التصنيع الملائمة (الداخلية):' });
        blocks.push({ type: 'latex', latex: `\\text{التكلفة التفاضلية للمصنع} = \\text{المتغيرة} + \\text{الثابتة الإضافية (الملائمة)} = ${f(v.vmfg)} + ${f(v.fmfg)} = ${resBox(v.make_cost, 'ج.م')}` });
        
        blocks.push({ type: 'text', text: 'ب) تكلفة الشراء من المُورد الخارجى:' });
        blocks.push({ type: 'latex', latex: `\\text{تكلفة الشراء} = \\text{سعر الشراء} + \\text{المصروفات} = ${f(v.buy_p)} + ${f(v.buy_e)} = ${resBox(v.buy_cost, 'ج.م')}` });
        
        blocks.push({ type: 'text', text: 'تتم المقارنة بين تكلفة الشراء والتصنيع، ويتم اتخاذ قرار الاعتماد على البديل صاحب **التكلفة الأقل**.' });
    }
    else if (def.id === 'special_order') {
        blocks.push({ type: 'header', text: 'قرار قبول أو رفض طلبية خاصة' });
        blocks.push({ type: 'text', text: 'يُبنى القرار فقط على التكاليف التفاضلية المرتبطة بالطلبية.' });
        blocks.push({ type: 'latex', latex: `\\text{الإيرادات التفاضلية للطلبية} = ${f(v.qty)} \\times ${f(v.sp)} = ${resBox(v.order_rev, 'ج.م')}` });
        
        let extraCalc = '';
        if (v.extra_fc && v.extra_fc > 0) {
            extraCalc = ` + ${f(v.extra_fc)}\\text{ (ثابتة إضافية)}`;
        }
        blocks.push({ type: 'latex', latex: `\\text{ت. الطلبية التفاضلية} = (${f(v.qty)} \\times ${f(v.vc_pu)})${extraCalc} = ${resBox(v.order_cost, 'ج.م')}` });
        
        blocks.push({ type: 'latex', latex: `\\text{أثر قبول الطلبية} = \\text{الإيرادات} - \\text{التكاليف} = ${f(v.order_rev)} - ${f(v.order_cost)} = ${resBox(v.net, 'ج.م')}` });
        blocks.push({ type: 'text', text: 'تُقبل الطلبية إذا كان الأثر موجباً (تجاوزت الإيرادات التكاليف).' });
    }
    else if (def.id === 'drop_keep') {
        blocks.push({ type: 'header', text: 'قرار استبعاد أو الإبقاء على خط إنتاج' });
        blocks.push({ type: 'text', text: 'نقارن الإيرادات المفقودة مع التكاليف التي يمكن تجنبها لتحديد الموقف:' });
        blocks.push({ type: 'latex', latex: `\\text{التأثير على الصافي} = \\text{التكاليف المتجنبة (الوفر)} - \\text{الإيرادات (أو هامش المساهمة) المفقودة}` });
        blocks.push({ type: 'latex', latex: `\\text{أثر الاستبعاد} = ${f(v.avoid_c)} - ${f(v.rev_lost)} = ${resBox(v.net, 'ج.م')}` });
        blocks.push({ type: 'text', text: 'إذا كان التوفير في التكاليف أضخم من الإيراد الضائع، يُفضل خطوة الاستبعاد.' });
    }
    else if (def.id === 'sell_or_process') {
        blocks.push({ type: 'header', text: 'قرار البيع أو التشغيل الإضافي' });
        blocks.push({ type: 'latex', latex: `\\text{الزيادة التفاضلية في الإيراد} = \\text{إيراد التشغيل} - \\text{إيراد الانفصال} = ${f(v.rev_further)} - ${f(v.rev_split)} = ${resBox(v.inc_rev, 'ج.م')}` });
        blocks.push({ type: 'latex', latex: `\\text{صافي الأثر من التشغيل} = \\text{الزيادة التفاضلية في الإيراد} - \\text{تكاليف التشغيل الإضافي} = ${f(v.inc_rev)} - ${f(v.add_cost)} = ${resBox(v.net, 'ج.م')}` });
        blocks.push({ type: 'text', text: 'إذا طغى الإيراد الجديد على التكاليف الإضافية (الصافي موجب)، يُنفذ مشروع التشغيل الإضافي.' });
    }
    // --------------------------------------------------------------------------------
    // الفصل الخامس: الموازنات التخطيطية
    // --------------------------------------------------------------------------------
    else if (def.id === 'sales_budget') {
        blocks.push({ type: 'header', text: 'موازنة المبيعات التقديرية' });
        blocks.push({ type: 'latex', latex: `\\text{إجمالي المبيعات التقديرية} = \\text{الكمية المقدرة} \\times \\text{سعر البيع} = ${f(v.est_qty)} \\times ${f(v.est_price)} = ${resBox(v.est_sales, 'ج.م')}` });
    }
    else if (def.id === 'prod_budget') {
        blocks.push({ type: 'header', text: 'موازنة كمية الإنتاج' });
        blocks.push({ type: 'latex', latex: `\\text{الإنتاج المطلوب} = \\text{مبيعات مقدرة} + \\text{مخزون رصيد آخر} - \\text{مخزون أول المدة}` });
        blocks.push({ type: 'latex', latex: `\\text{كمية الإنتاج} = ${f(v.es)} + ${f(v.end_inv)} - ${f(v.start_inv)} = ${resBox(v.prod, 'وحدة')}` });
    }
    else if (def.id === 'mat_budget') {
        blocks.push({ type: 'header', text: 'موازنة مشتريات المواد المباشرة' });
        blocks.push({ type: 'text', text: 'أ) الاحتياجات الإجمالية للإنتاج:' });
        blocks.push({ type: 'latex', latex: `\\text{احتياج الإنتاج} = \\text{الكمية المنتجة} \\times \\text{احتياج الوحدة المطلق} = ${f(v.prod)} \\times ${f(v.m_pu)} = ${resBox(v.t_mat, 'كمية')}` });
        blocks.push({ type: 'text', text: 'ب) حساب المشتريات بإضافة أرصدة المخازن:' });
        blocks.push({ type: 'latex', latex: `\\text{المشتريات} = \\text{احتياج الإنتاج} + \\text{مخزون مرغوب آخر} - \\text{مخزون متاح أول}` });
        blocks.push({ type: 'latex', latex: `\\text{كمية الشراء} = ${f(v.t_mat)} + ${f(v.end_inv)} - ${f(v.start_inv)} = ${resBox(v.purch, 'كمية')}` });
    }
    else if (def.id === 'labor_budget') {
        blocks.push({ type: 'header', text: 'موازنة الأجور المباشرة' });
        blocks.push({ type: 'latex', latex: `\\text{إجمالي ساعات العمل} = \\text{حجم الإنتاج} \\times \\text{ساعات الوحدة} = ${f(v.prod)} \\times ${f(v.hrs_pu)} = ${resBox(v.total_hrs, 'ساعة')}` });
        blocks.push({ type: 'latex', latex: `\\text{تكلفة الأجور الكلية} = \\text{إجمالي ساعات} \\times \\text{تكلفة الساعة} = ${f(v.total_hrs)} \\times ${f(v.rate)} = ${resBox(v.total_cost, 'ج.م')}` });
    }
    // --------------------------------------------------------------------------------
    // الفصل السادس وأدوات إضافية (السيولة، الإهلاك، المخزون، العائد على الاستثمار)
    // --------------------------------------------------------------------------------
    else if (def.id === 'roi') {
        blocks.push({ type: 'header', text: 'معدل العائد على الاستثمار (ROI)' });
        blocks.push({ type: 'latex', latex: `\\text{معدل العائد} = \\left(\\frac{\\text{الدخل التشغيلي}}{\\text{متوسط الأصول التشغيلية}}\\right) \\times 100` });
        blocks.push({ type: 'latex', latex: `\\text{العائد} = \\left(\\frac{${f(v.ni)}}{${f(v.assets)}}\\right) \\times 100 = ${resBox(v.roi, '\\%')}` });
    }
    else if (def.id === 'liquidity') {
        blocks.push({ type: 'header', text: 'نسب السيولة (النسبة الجارية)' });
        blocks.push({ type: 'latex', latex: `\\text{النسبة الجارية} = \\frac{\\text{الأصول المتداولة}}{\\text{الخصوم المتداولة}} = \\frac{${f(v.ca)}}{${f(v.cl)}} = ${resBox(v.cr, ': 1')}` });
    }
    else if (def.id === 'cogs') {
        blocks.push({ type: 'header', text: 'تكلفة البضاعة المباعة (المعادلة الكلية)' });
        blocks.push({ type: 'latex', latex: `\\text{تكلفة البضاعة المباعة} = \\text{مخزون أول المدة} + \\text{المشتريات} - \\text{آخر المدة} = ${f(v.oi)} + ${f(v.pur)} - ${f(v.ci)} = ${resBox(v.cog, 'ج.م')}` });
    }
    else if (def.id === 'depreciation') {
        blocks.push({ type: 'header', text: 'حساب الإهلاك (طريقة القسط الثابت)' });
        blocks.push({ type: 'latex', latex: `\\text{القسط السنوي للإهلاك} = \\frac{\\text{التكلفة الأصلية} - \\text{القيمة التخريدية (الخردة)}}{\\text{العمر الإنتاجي المقدر}} = \\frac{${f(v.cost)} - ${f(v.salvage)}}{${f(v.life)}} = ${resBox(v.dep, 'ج.م')}` });
        
        if (v.years || data.calcKeys?.includes('acc_dep') || data.calcKeys?.includes('bv')) {
            blocks.push({ type: 'header', text: 'مجمع الإهلاك والقيمة الدفترية' });
            blocks.push({ type: 'latex', latex: `\\text{مجمع الإهلاك} = \\text{القسط السنوي} \\times \\text{السنوات المنقضية} = ${f(v.dep)} \\times ${f(v.years)} = ${resBox(v.acc_dep, 'ج.م')}` });
            blocks.push({ type: 'latex', latex: `\\text{القيمة الدفترية الصافية} = \\text{التكلفة الأصلية} - \\text{مجمع الإهلاك الكلي} = ${f(v.cost)} - ${f(v.acc_dep)} = ${resBox(v.bv, 'ج.م')}` });
        }
    }
    else {
        // Generic fallback generator
        blocks.push({ type: 'header', text: 'node.steps_title' });
        if (def.latex) {
            blocks.push({ type: 'text', text: 'node.steps_apply' });
            blocks.push({ type: 'latex', latex: def.latex });
        }
        
        const outputs = def.fields.filter(f => (data.calcKeys || []).includes(f.k));
        if (outputs.length > 0) {
            blocks.push({ type: 'header', text: 'node.steps_derived' });
            outputs.forEach(o => {
                blocks.push({ type: 'latex', latex: `\\text{${o.l}} = ${resBox(v[o.k], o.u)}` });
            });
        }
    }
    
    return blocks;
};
