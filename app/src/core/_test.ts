/**
 * ===================================================================
 * AccountSketch — Solver Engine Test Suite
 * ===================================================================
 * 
 * This file is a standalone test runner for all accounting module solvers.
 * It validates forward, reverse, and bidirectional calculations.
 * 
 * Run: npx tsx src/core/_test.ts
 * ===================================================================
 */

import { MODULES } from './modules';

/* ── Helpers ───────────────────────────────── */
let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(
  testName: string,
  moduleId: string,
  inputs: Record<string, number | null>,
  expected: Record<string, number>,
  tolerance = 1 // default tolerance for rounding
) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) {
    failed++;
    errors.push(`[FAIL] ${testName}: Module "${moduleId}" not found`);
    return;
  }

  // Clone inputs, set missing fields to null
  const vals: Record<string, number | null> = {};
  mod.fields.forEach(f => { vals[f.k] = inputs[f.k] !== undefined ? inputs[f.k] : null; });

  const result = mod.solver(vals);

  let testPassed = true;
  const failDetails: string[] = [];

  for (const [key, expectedVal] of Object.entries(expected)) {
    const actual = result[key];
    if (actual === null || actual === undefined) {
      testPassed = false;
      failDetails.push(`  ${key}: expected ${expectedVal}, got NULL`);
    } else if (typeof actual === 'number' && Math.abs(actual - expectedVal) > tolerance) {
      testPassed = false;
      failDetails.push(`  ${key}: expected ${expectedVal}, got ${actual}`);
    }
  }

  // Check for unexpected errors
  if (result['_error'] && !inputs['_expectedError']) {
    testPassed = false;
    failDetails.push(`  Unexpected error: ${result['_error']}`);
  }

  if (testPassed) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    const msg = `  ❌ ${testName}\n${failDetails.join('\n')}`;
    errors.push(msg);
    console.log(msg);
  }
}

/* ═══════════════════════════════════════════
   TEST SUITE 1: مسألة شويبس (شركة المهندس)
   ═══════════════════════════════════════════ */

console.log('\n╔══════════════════════════════════════════╗');
console.log('║  مسألة شويبس — شركة المهندس (الكاملة)     ║');
console.log('╚══════════════════════════════════════════╝\n');

// المعطيات:
// المبيعات = 1,800,000 (360,000 زجاجة × 5 ج)
// التكاليف المتغيرة:
//   مواد مباشرة = 430,000
//   عمالة مباشرة = 360,000
//   ص. غير مباشرة متغيرة = 380,000
//   م. بيع متغيرة = 70,000
//   م. إدارية متغيرة = 20,000
//   ----- الإجمالي = 1,260,000
// التكاليف الثابتة:
//   ص. غير مباشرة ثابتة = 280,000
//   م. بيع ثابتة = 65,000
//   م. إدارية ثابتة = 60,000
//   ----- الإجمالي = 405,000

console.log('--- (أ) قائمة دخل المساهمة ---');

assert(
  'CVP: مسألة شويبس كاملة (إجماليات + وحدة)',
  'cvp_income',
  { qty: 360000, price: 5, vc: 1260000, fc: 405000 },
  { rev: 1800000, vc_pu: 3.5, cm_pu: 1.5, cm: 540000, ni: 135000, cmr: 30 }
);

assert(
  'CVP: من السعر والتكلفة المتغيرة للوحدة والكمية فقط',
  'cvp_income',
  { qty: 360000, price: 5, vc_pu: 3.5, fc: 405000 },
  { rev: 1800000, vc: 1260000, cm_pu: 1.5, cm: 540000, ni: 135000, cmr: 30 }
);

assert(
  'CVP عكسي: من الدخل + الثابتة + المتغيرة → المبيعات',
  'cvp_income',
  { ni: 135000, fc: 405000, vc: 1260000 },
  { cm: 540000, rev: 1800000, cmr: 30 }
);

assert(
  'CVP عكسي: من المساهمة + نسبة المساهمة → المبيعات',
  'cvp_income',
  { cm: 540000, cmr: 30 },
  { rev: 1800000 }
);

assert(
  'CVP: هامش مساهمة الوحدة = سعر - ت.متغيرة',
  'cvp_income',
  { price: 5, vc_pu: 3.5 },
  { cm_pu: 1.5, cmr: 30 }
);

console.log('\n--- (ب) نقطة التعادل ---');

// vc/unit = 1,260,000 / 360,000 = 3.5
// cm/unit = 5 - 3.5 = 1.5
// BEQ = 405,000 / 1.5 = 270,000
// BEV = 270,000 × 5 = 1,350,000

assert(
  'BEP: تعادل بالكمية = FC / (P - VC)',
  'breakeven',
  { fc: 405000, p: 5, vc: 3.5 },
  { beq: 270000, bes: 1350000 }
);

assert(
  'BEP عكسي: من BEQ و P → استنتاج FC (إذا كان CM معروف)',
  'breakeven',
  { beq: 270000, p: 5, vc: 3.5 },
  { fc: 405000, bes: 1350000 }
);

assert(
  'BEP عكسي: من BEV و P → BEQ',
  'breakeven',
  { bes: 1350000, p: 5, fc: 405000 },
  { beq: 270000, vc: 3.5 }
);

assert(
  'BEP عكسي: من BEQ و FC → استنتاج VC (إذا P معروف)',
  'breakeven',
  { beq: 270000, fc: 405000, p: 5 },
  { vc: 3.5, bes: 1350000 }
);

console.log('\n--- (ج) هامش الأمان ---');

// MOS V = 360,000 - 270,000 = 90,000 (وحدات)
// أو بالقيمة: 1,800,000 - 1,350,000 = 450,000
// MOS R = 450,000 / 1,800,000 × 100 = 25%

assert(
  'MOS: حساب القيمة والنسبة من المبيعات المتوقعة والتعادل',
  'mos',
  { es: 1800000, bs: 1350000 },
  { mosv: 450000, mosr: 25 }
);

assert(
  'MOS عكسي: من القيمة والنسبة → المبيعات المتوقعة',
  'mos',
  { mosv: 450000, mosr: 25 },
  { es: 1800000, bs: 1350000 }
);

assert(
  'MOS عكسي: من BS + MOS V → ES',
  'mos',
  { bs: 1350000, mosv: 450000 },
  { es: 1800000, mosr: 25 }
);

assert(
  'MOS عكسي: من ES + MOS R → BS و MOS V',
  'mos',
  { es: 1800000, mosr: 25 },
  { bs: 1350000, mosv: 450000 }
);

assert(
  'MOS عكسي: من BS + MOS R → ES و MOS V',
  'mos',
  { bs: 1350000, mosr: 25 },
  { es: 1800000, mosv: 450000 }
);

console.log('\n--- (د) المبيعات المستهدفة (ربح 180,000) ---');

// QTY = (405,000 + 180,000) / 1.5 = 390,000
// VAL = 390,000 × 5 = 1,950,000

assert(
  'Target: كمية المبيعات المستهدفة',
  'target_sales',
  { fc: 405000, tp: 180000, cm: 1.5, price: 5 },
  { qty: 390000, val: 1950000 }
);

assert(
  'Target عكسي: من QTY و CM → استنتاج (FC أو TP)',
  'target_sales',
  { qty: 390000, cm: 1.5, fc: 405000 },
  { tp: 180000 }
);

assert(
  'Target عكسي: من QTY و FC و TP → CM',
  'target_sales',
  { qty: 390000, fc: 405000, tp: 180000 },
  { cm: 1.5 }
);

assert(
  'Target عكسي: من VAL و PRICE → QTY',
  'target_sales',
  { val: 1950000, price: 5, cm: 1.5, fc: 405000 },
  { qty: 390000, tp: 180000 }
);


/* ═══════════════════════════════════════════
   TEST SUITE 2: مسألة أبو الفضل (الإهلاك)
   ═══════════════════════════════════════════ */

console.log('\n╔══════════════════════════════════════════╗');
console.log('║  مسألة أبو الفضل — الإهلاك بالقسط الثابت  ║');
console.log('╚══════════════════════════════════════════╝\n');

// المعطيات:
// تكلفة الآلة = 64,000
// القيمة التخريدية = 8,000
// العمر الإنتاجي = 4 سنوات
// قسط الإهلاك = (64,000 - 8,000) / 4 = 14,000
// في 31/12/2025 (سنة واحدة):
//   مجمع الإهلاك = 14,000
//   القيمة الدفترية = 64,000 - 14,000 = 50,000

console.log('--- حساب الإهلاك (اتجاه أمامي) ---');

assert(
  'DEP: قسط الإهلاك السنوي',
  'depreciation',
  { cost: 64000, salvage: 8000, life: 4, years: 1 },
  { dep: 14000, acc_dep: 14000, bv: 50000 }
);

console.log('\n--- حساب الإهلاك (اتجاه عكسي) ---');

assert(
  'DEP عكسي: من القسط والعمر والتخريدية → التكلفة',
  'depreciation',
  { dep: 14000, life: 4, salvage: 8000 },
  { cost: 64000 }
);

assert(
  'DEP عكسي: من القيمة الدفترية ومجمع الإهلاك → التكلفة',
  'depreciation',
  { bv: 50000, acc_dep: 14000, life: 4, salvage: 8000 },
  { cost: 64000, dep: 14000 }
);

assert(
  'DEP عكسي: من التكلفة والقسط السنوي → العمر الإنتاجي',
  'depreciation',
  { cost: 64000, salvage: 8000, dep: 14000 },
  { life: 4 }
);

assert(
  'DEP: بعد سنتين',
  'depreciation',
  { cost: 64000, salvage: 8000, life: 4, years: 2 },
  { dep: 14000, acc_dep: 28000, bv: 36000 }
);

assert(
  'DEP: نهاية العمر (4 سنوات)',
  'depreciation',
  { cost: 64000, salvage: 8000, life: 4, years: 4 },
  { dep: 14000, acc_dep: 56000, bv: 8000 }
);


/* ═══════════════════════════════════════════
   TEST SUITE 3: اختبارات عامة للموديولات
   ═══════════════════════════════════════════ */

console.log('\n╔══════════════════════════════════════════╗');
console.log('║  اختبارات عامة — كل الموديولات           ║');
console.log('╚══════════════════════════════════════════╝\n');

console.log('--- قائمة الدخل ---');

assert(
  'Income: حساب صافي الدخل كاملاً',
  'income',
  { rev: 500000, cogs: 300000, opex: 50000, int: 10000, tax: 20000 },
  { gp: 200000, ebit: 150000, ni: 120000 }
);

assert(
  'Income عكسي: من صافي الدخل → EBIT',
  'income',
  { ni: 120000, int: 10000, tax: 20000, rev: 500000, cogs: 300000 },
  { gp: 200000, ebit: 150000 }
);

console.log('\n--- هامش الربح الإجمالي ---');

assert(
  'GMargin: حساب الهامش',
  'gmargin',
  { rev: 1000000, cogs: 600000 },
  { gp: 400000, gmp: 40 }
);

console.log('\n--- معادلة الميزانية ---');

assert(
  'Balance: أصول من خصوم + ملكية',
  'balance',
  { l: 300000, e: 200000 },
  { a: 500000 }
);

assert(
  'Balance عكسي: ملكية من أصول وخصوم',
  'balance',
  { a: 500000, l: 300000 },
  { e: 200000 }
);

console.log('\n--- العائد على الاستثمار ---');

assert(
  'ROI: حساب النسبة',
  'roi',
  { ni: 50000, assets: 200000 },
  { roi: 25 }
);

assert(
  'ROI عكسي: من النسبة والأصول → الدخل',
  'roi',
  { roi: 25, assets: 200000 },
  { ni: 50000 }
);

console.log('\n--- التكاليف المختلطة (طريقة الحدين) ---');

assert(
  'Mixed: حساب VC و FC',
  'mixed_cost',
  { hc: 100000, lc: 60000, ha: 2000, la: 1000 },
  { vc: 40, fc: 20000 }
);

assert(
  'Mixed: التنبؤ ص = أ + ب×س',
  'mixed_cost',
  { hc: 100000, lc: 60000, ha: 2000, la: 1000, x: 1500 },
  { vc: 40, fc: 20000, y: 80000 }
);

console.log('\n--- الرافعة التشغيلية ---');

assert(
  'OL: حساب درجة الرافعة',
  'op_leverage',
  { cm: 540000, oni: 135000 },
  { dol: 4 }
);

assert(
  'OL عكسي: من الرافعة والربح → المساهمة',
  'op_leverage',
  { dol: 4, oni: 135000 },
  { cm: 540000 }
);

assert(
  'OL عكسي: من المساهمة والرافعة → الربح',
  'op_leverage',
  { cm: 540000, dol: 4 },
  { oni: 135000 }
);

assert(
  'OL: نسبة الزيادة في الدخل = DOL × %المبيعات',
  'op_leverage',
  { dol: 4, sales_chg: 10 },
  { income_chg: 40 }
);

console.log('\n--- موازنة الإنتاج ---');

assert(
  'ProdBudget: الإنتاج المطلوب',
  'prod_budget',
  { es: 10000, end_inv: 2000, start_inv: 1500 },
  { prod: 10500 }
);

console.log('\n--- نسب السيولة ---');

assert(
  'Liquidity: النسبة الجارية',
  'liquidity',
  { ca: 150000, cl: 75000 },
  { cr: 2 }
);

console.log('\n--- تكلفة البضاعة (COGS) ---');

assert(
  'COGS: الحساب',
  'cogs',
  { oi: 50000, pur: 200000, ci: 30000 },
  { cog: 220000 }
);

console.log('\n--- تكلفة الوحدة ---');

assert(
  'VC/Unit: من الإجمالي والكمية',
  'vc_pu',
  { vc: 1260000, qty: 360000 },
  { vc_pu: 3.5 }
);

assert(
  'VC/Unit عكسي: من الوحدة والكمية → الإجمالي',
  'vc_pu',
  { vc_pu: 3.5, qty: 360000 },
  { vc: 1260000 }
);


/* ═══════════════════════════════════════════
   TEST SUITE 4: حالات حدية وخاصة
   ═══════════════════════════════════════════ */

console.log('\n╔══════════════════════════════════════════╗');
console.log('║  حالات حدية وأخطاء متوقعة                ║');
console.log('╚══════════════════════════════════════════╝\n');

// Test error handling
{
  const mod = MODULES.find(m => m.id === 'breakeven')!;
  const result = mod.solver({ fc: 100000, p: 5, vc: 5, beq: null, bes: null });
  if (result['_error']) {
    passed++;
    console.log('  ✅ BEP Error: يمنع CM=0 (سعر = تكلفة)');
  } else {
    failed++;
    console.log('  ❌ BEP Error: لم يكتشف خطأ CM=0');
  }
}

{
  const mod = MODULES.find(m => m.id === 'breakeven')!;
  const result = mod.solver({ fc: 100000, p: 3, vc: 5, beq: null, bes: null });
  if (result['_error']) {
    passed++;
    console.log('  ✅ BEP Error: يمنع CM سالب (P < VC)');
  } else {
    failed++;
    console.log('  ❌ BEP Error: لم يكتشف CM سالب');
  }
}

{
  const mod = MODULES.find(m => m.id === 'depreciation')!;
  const result = mod.solver({ cost: 10000, salvage: 20000, life: 5, dep: null, years: null, acc_dep: null, bv: null });
  if (result['_error']) {
    passed++;
    console.log('  ✅ DEP Error: يمنع القيمة التخريدية > التكلفة');
  } else {
    failed++;
    console.log('  ❌ DEP Error: لم يكتشف القيمة التخريدية > التكلفة');
  }
}

{
  const mod = MODULES.find(m => m.id === 'target_sales')!;
  const result = mod.solver({ fc: 20000, cm: 10, tp: 15000, tax: 25, qty: null });
  if (result.qty === 4000) {
    passed++;
    console.log('  ✅ Target Sales with Tax: Qty is 4000');
  } else {
    failed++;
    console.log(`  ❌ Target Sales with Tax: Expected 4000, got ${result.qty}`);
  }
}


/* ═══════════════════════════════════════════
   RESULTS
   ═══════════════════════════════════════════ */

console.log('\n══════════════════════════════════════════');
console.log(`  النتيجة النهائية: ${passed} نجح ✅ | ${failed} فشل ❌`);
console.log('══════════════════════════════════════════');

if (errors.length > 0) {
  console.log('\n--- تفاصيل الأخطاء ---');
  errors.forEach(e => console.log(e));
}

process.exit(failed > 0 ? 1 : 0);
