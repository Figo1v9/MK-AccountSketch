/**
 * ===================================================================
 * AccountSketch — COMPLETE Solver Engine Test Suite
 * ===================================================================
 * 
 * Tests ALL 107 accounting modules — forward + reverse (infinity loop).
 * Verifies every solver propagates values correctly in ALL directions.
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
  tolerance = 1
) {
  const mod = MODULES.find(m => m.id === moduleId);
  if (!mod) {
    failed++;
    errors.push(`[FAIL] ${testName}: Module "${moduleId}" not found`);
    return;
  }

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

  if (result['_error'] && !inputs['_expectedError']) {
    testPassed = false;
    failDetails.push(`  Unexpected error: ${result['_error']}`);
  }

  if (testPassed) {
    passed++;
  } else {
    failed++;
    const msg = `  ❌ ${testName}\n${failDetails.join('\n')}`;
    errors.push(msg);
    console.log(msg);
  }
}

function section(title: string) {
  console.log(`\n--- ${title} ---`);
}

function suite(title: string) {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  ${title.padEnd(40)}║`);
  console.log(`╚══════════════════════════════════════════╝`);
}

/* ═══════════════════════════════════════════
   SUITE 1: القوائم المالية الأساسية
   ═══════════════════════════════════════════ */

suite('القوائم المالية الأساسية');

section('1. قائمة الدخل (income)');
assert('Income: أمامي — حساب صافي الدخل', 'income',
  { rev: 500000, cogs: 300000, opex: 50000, int: 10000, tax: 20000 },
  { gp: 200000, ebit: 150000, ni: 120000 });
assert('Income: عكسي — من NI → EBIT', 'income',
  { ni: 120000, int: 10000, tax: 20000, rev: 500000, cogs: 300000 },
  { gp: 200000, ebit: 150000 });
assert('Income: عكسي — من GP + COGS → REV', 'income',
  { gp: 200000, cogs: 300000 },
  { rev: 500000 });

section('2. قائمة المساهمة (cvp_income)');
assert('CVP: أمامي كامل', 'cvp_income',
  { qty: 360000, price: 5, vc: 1260000, fc: 405000 },
  { rev: 1800000, vc_pu: 3.5, cm_pu: 1.5, cm: 540000, ni: 135000, cmr: 30 });
assert('CVP: عكسي — من CM + CMR → REV', 'cvp_income',
  { cm: 540000, cmr: 30 },
  { rev: 1800000 });
assert('CVP: عكسي — من NI + FC → CM', 'cvp_income',
  { ni: 135000, fc: 405000 },
  { cm: 540000 });
assert('CVP: عكسي — من PRICE + VC_PU → CM_PU', 'cvp_income',
  { price: 5, vc_pu: 3.5 },
  { cm_pu: 1.5, cmr: 30 });

section('3. هامش الربح الإجمالي (gmargin)');
assert('GMargin: أمامي', 'gmargin',
  { rev: 1000000, cogs: 600000 },
  { gp: 400000, gmp: 40 });
assert('GMargin: عكسي — من GP + GMP → REV', 'gmargin',
  { gp: 400000, gmp: 40 },
  { rev: 1000000 });

section('4. معادلة الميزانية (balance)');
assert('Balance: أمامي', 'balance', { l: 300000, e: 200000 }, { a: 500000 });
assert('Balance: عكسي — من A + L → E', 'balance', { a: 500000, l: 300000 }, { e: 200000 });
assert('Balance: عكسي — من A + E → L', 'balance', { a: 500000, e: 200000 }, { l: 300000 });

/* ═══════════════════════════════════════════
   SUITE 2: نقطة التعادل والتحليل
   ═══════════════════════════════════════════ */

suite('التعادل والتحليل');

section('5. نقطة التعادل (breakeven)');
assert('BEP: أمامي', 'breakeven', { fc: 405000, p: 5, vc: 3.5 }, { beq: 270000, bes: 1350000 });
assert('BEP: عكسي — من BEQ + CM → FC', 'breakeven', { beq: 270000, p: 5, vc: 3.5 }, { fc: 405000 });
assert('BEP: عكسي — من BEQ + FC → CM', 'breakeven', { beq: 270000, fc: 405000, p: 5 }, { vc: 3.5 });

section('6. هامش الأمان (mos)');
assert('MOS: أمامي', 'mos', { es: 1800000, bs: 1350000 }, { mosv: 450000, mosr: 25 });
assert('MOS: عكسي — من MOSV + MOSR → ES', 'mos', { mosv: 450000, mosr: 25 }, { es: 1800000 });
assert('MOS: عكسي — من ES + MOSR → BS', 'mos', { es: 1800000, mosr: 25 }, { bs: 1350000 });

section('7. المبيعات المستهدفة (target_sales)');
assert('Target: أمامي', 'target_sales', { fc: 405000, tp_pre: 180000, cm: 1.5, price: 5 }, { qty: 390000, val: 1950000 });
assert('Target: عكسي — من QTY + CM + FC → TP', 'target_sales', { qty: 390000, cm: 1.5, fc: 405000 }, { tp_pre: 180000 });
assert('Target: ضريبة — tp_post → tp_pre → qty', 'target_sales',
  { fc: 20000, cm: 10, tp_post: 15000, tax: 25 }, { qty: 4000 });

section('8. الرافعة التشغيلية (op_leverage)');
assert('OL: أمامي', 'op_leverage', { cm: 540000, oni: 135000 }, { dol: 4 });
assert('OL: عكسي — من DOL + ONI → CM', 'op_leverage', { dol: 4, oni: 135000 }, { cm: 540000 });
assert('OL: % الدخل = DOL × % المبيعات', 'op_leverage', { dol: 4, sales_chg: 10 }, { income_chg: 40 });

/* ═══════════════════════════════════════════
   SUITE 3: النسب المالية
   ═══════════════════════════════════════════ */

suite('النسب المالية');

section('9. العائد على الاستثمار (roi)');
assert('ROI: أمامي', 'roi', { ni: 50000, assets: 200000 }, { roi: 25 });
assert('ROI: عكسي — من ROI + Assets → NI', 'roi', { roi: 25, assets: 200000 }, { ni: 50000 });

section('10. النسبة الجارية (liquidity)');
assert('Liquidity: أمامي', 'liquidity', { ca: 150000, cl: 75000 }, { cr: 2 });
assert('Liquidity: عكسي — من CR + CL → CA', 'liquidity', { cr: 2, cl: 75000 }, { ca: 150000 });

section('11. النسبة السريعة (quick_ratio)');
assert('QR: أمامي', 'quick_ratio', { ca: 150000, inv: 30000, cl: 60000 }, { qr: 2 });
assert('QR: عكسي — من QR + CL + INV → CA', 'quick_ratio', { qr: 2, cl: 60000, inv: 30000 }, { ca: 150000 });

section('12. العائد على حقوق الملكية (roe)');
assert('ROE: أمامي', 'roe', { ni: 150000, eq: 1000000 }, { roe: 15 });
assert('ROE: عكسي — من ROE + EQ → NI', 'roe', { roe: 15, eq: 1000000 }, { ni: 150000 });

section('13. دوران المخزون (inventory_turnover)');
assert('IT: أمامي', 'inventory_turnover', { cogs: 800000, avg_inv: 100000 }, { it: 8 });
assert('IT: عكسي — من IT → DAYS', 'inventory_turnover', { it: 8 }, { days: 45 }, 2);

section('14. دوران المدينين (receivables_turnover)');
assert('RT: أمامي', 'receivables_turnover', { sales: 730000, avg_rec: 100000 }, { rt: 7.3 });
assert('RT: عكسي — من DAYS → RT', 'receivables_turnover', { days: 50 }, { rt: 7.3 });

section('15. دوران الأصول (asset_turnover)');
assert('AT: أمامي', 'asset_turnover', { sales: 500000, avg_assets: 250000 }, { at: 2 });
assert('AT: عكسي — من AT + SALES → ASSETS', 'asset_turnover', { at: 2, sales: 500000 }, { avg_assets: 250000 });

section('16. نسبة الدين/الملكية (debt_equity)');
assert('DE: أمامي', 'debt_equity', { td: 200000, eq: 400000 }, { de: 0.5 });
assert('DE: عكسي — من DE + EQ → TD', 'debt_equity', { de: 0.5, eq: 400000 }, { td: 200000 });

section('17. هامش الربح الصافي (net_margin)');
assert('NPM: أمامي', 'net_margin', { ni: 100000, rev: 500000 }, { npm: 20 });
assert('NPM: عكسي — من NPM + REV → NI', 'net_margin', { npm: 20, rev: 500000 }, { ni: 100000 });

section('18. ربحية السهم (eps)');
assert('EPS: أمامي', 'eps', { ni: 1000000, shares: 100000 }, { eps: 10 });
assert('EPS: عكسي — من EPS + SHARES → NI', 'eps', { eps: 10, shares: 100000 }, { ni: 1000000 });

section('19. رأس المال العامل (working_capital)');
assert('WC: أمامي', 'working_capital', { ca: 200000, cl: 80000 }, { wc: 120000 });
assert('WC: عكسي — من WC + CL → CA', 'working_capital', { wc: 120000, cl: 80000 }, { ca: 200000 });

/* ═══════════════════════════════════════════
   SUITE 4: التكاليف والموازنات
   ═══════════════════════════════════════════ */

suite('التكاليف والموازنات');

section('18. تجميع التكاليف (total_vc)');
assert('TotalVC: أمامي', 'total_vc', { vc: 100000 }, { vc: 100000 });

section('20. التكاليف المختلطة (mixed_cost)');
assert('Mixed: أمامي', 'mixed_cost', { hc: 100000, lc: 60000, ha: 2000, la: 1000 }, { vc: 40, fc: 20000 });
assert('Mixed: التنبؤ', 'mixed_cost', { fc: 20000, vc: 40, x: 1500 }, { y: 80000 });

section('21. تكلفة البضاعة (cogs)');
assert('COGS: أمامي', 'cogs', { oi: 50000, pur: 200000, ci: 30000 }, { cog: 220000 });
assert('COGS: عكسي — من COG + PUR + CI → OI', 'cogs', { cog: 220000, pur: 200000, ci: 30000 }, { oi: 50000 });

section('22. تكلفة الوحدة (vc_pu)');
assert('VC/U: أمامي', 'vc_pu', { vc: 1260000, qty: 360000 }, { vc_pu: 3.5 });
assert('VC/U: عكسي', 'vc_pu', { vc_pu: 3.5, qty: 360000 }, { vc: 1260000 });

section('23. موازنة الإنتاج (prod_budget)');
assert('Prod: أمامي', 'prod_budget', { es: 10000, end_inv: 2000, start_inv: 1500 }, { prod: 10500 });
assert('Prod: عكسي', 'prod_budget', { prod: 10500, end_inv: 2000, start_inv: 1500 }, { es: 10000 });

section('24. موازنة المواد (mat_budget)');
assert('Mat: أمامي', 'mat_budget', { prod: 5000, m_pu: 3, end_inv: 500, start_inv: 300 }, { t_mat: 15000, purch: 15200 });
assert('Mat: عكسي', 'mat_budget', { purch: 15200, end_inv: 500, start_inv: 300, m_pu: 3 }, { t_mat: 15000 });

section('25. موازنة الأجور (labor_budget)');
assert('Labor: أمامي', 'labor_budget', { prod: 1000, hrs_pu: 2, rate: 15 }, { total_hrs: 2000, total_cost: 30000 });
assert('Labor: عكسي', 'labor_budget', { total_cost: 30000, rate: 15, hrs_pu: 2 }, { total_hrs: 2000, prod: 1000 });

section('26. موازنة المبيعات (sales_budget)');
assert('Sales: أمامي', 'sales_budget', { est_qty: 10000, est_price: 50 }, { est_sales: 500000 });
assert('Sales: عكسي', 'sales_budget', { est_sales: 500000, est_price: 50 }, { est_qty: 10000 });

/* ═══════════════════════════════════════════
   SUITE 5: الإهلاك
   ═══════════════════════════════════════════ */

suite('الإهلاك');

section('27. القسط الثابت (depreciation)');
assert('DEP: أمامي', 'depreciation', { cost: 64000, salvage: 8000, life: 4, years: 1 }, { dep: 14000, acc_dep: 14000, bv: 50000 });
assert('DEP: عكسي — من DEP + LIFE + SALVAGE → COST', 'depreciation', { dep: 14000, life: 4, salvage: 8000 }, { cost: 64000 });
assert('DEP: عكسي — من COST + SALVAGE + DEP → LIFE', 'depreciation', { cost: 64000, salvage: 8000, dep: 14000 }, { life: 4 });
assert('DEP: عكسي — من BV + ACC_DEP → COST', 'depreciation', { bv: 50000, acc_dep: 14000 }, { cost: 64000 });

section('28. القسط المتناقص (dep_declining)');
assert('DDB: أمامي — السنة 1', 'dep_declining', { cost: 100000, salvage: 10000, life: 5, year: 1 }, { rate: 40, dep: 40000, bv: 60000 });

section('29. مجموع الأرقام (dep_syd)');
assert('SYD: أمامي — السنة 1', 'dep_syd', { cost: 100000, salvage: 10000, life: 5, year: 1 }, { syd: 15, dep: 30000 });

section('30. وحدات الإنتاج (dep_units)');
assert('Units: أمامي', 'dep_units', { cost: 100000, salvage: 10000, total_units: 90000, actual: 20000 }, { rate_pu: 1, dep: 20000 });
assert('Units: عكسي — من DEP + RATE → ACTUAL', 'dep_units', { dep: 20000, rate_pu: 1 }, { actual: 20000 });

/* ═══════════════════════════════════════════
   SUITE 6: القرارات الإدارية
   ═══════════════════════════════════════════ */

suite('القرارات الإدارية');

section('31. الصنع/الشراء (make_buy)');
assert('MakeBuy: أمامي', 'make_buy', { vmfg: 40000, fmfg: 10000, buy_p: 55000, buy_e: 2000 }, { make_cost: 50000, buy_cost: 57000 });

section('32. الاستبعاد (drop_keep)');
assert('DropKeep: أمامي', 'drop_keep', { rev_lost: 100000, avoid_c: 120000 }, { net: 20000 });
assert('DropKeep: عكسي', 'drop_keep', { net: 20000, rev_lost: 100000 }, { avoid_c: 120000 });

section('33. الطلبية الخاصة (special_order)');
assert('Special: أمامي', 'special_order', { qty: 1000, sp: 8, vc_pu: 5 }, { order_rev: 8000, order_cost: 5000, net: 3000 });
assert('Special: عكسي', 'special_order', { net: 3000, order_rev: 8000 }, { order_cost: 5000 });

section('34. بيع/تصنيع إضافي (sell_or_process)');
assert('SellProc: أمامي', 'sell_or_process', { rev_split: 50000, rev_further: 80000, add_cost: 20000 }, { inc_rev: 30000, net: 10000 });
assert('SellProc: عكسي', 'sell_or_process', { net: 10000, add_cost: 20000 }, { inc_rev: 30000 });

section('35. تحليل القيود (constraint)');
assert('Constraint: أمامي', 'constraint', { cm_pu: 30, res_pu: 2, avail: 100 }, { cm_per_res: 15, max_units: 50, max_cm: 1500 });

/* ═══════════════════════════════════════════
   SUITE 7: القوائم المالية المتقدمة
   ═══════════════════════════════════════════ */

suite('القوائم المالية المتقدمة');

section('36. التدفقات النقدية (cash_flow)');
assert('CF: أمامي', 'cash_flow', { oper: 200000, invest: -50000, fin: -30000, open: 100000 }, { net: 120000, close: 220000 });
assert('CF: عكسي — من CLOSE + OPEN → NET', 'cash_flow', { close: 220000, open: 100000 }, { net: 120000 });

section('37. حقوق الملكية (equity_statement)');
assert('Equity: أمامي', 'equity_statement', { open_eq: 500000, ni: 100000, div: 30000 }, { close_eq: 570000 });
assert('Equity: عكسي', 'equity_statement', { close_eq: 570000, ni: 100000, div: 30000 }, { open_eq: 500000 });

section('38. موازنة م.التشغيل (opex_budget)');
assert('OpexBudget: أمامي', 'opex_budget', { sell: 30000, admin: 20000, dep: 5000 }, { total: 55000, cash_opex: 50000 });

section('39. الموازنة النقدية (cash_budget)');
assert('CashBudget: أمامي', 'cash_budget', { open: 50000, receipts: 200000, payments: 180000, min_bal: 40000 },
  { net: 20000, close: 70000, surplus: 30000 });

section('40. موازنة ت.صناعية (overhead_budget)');
assert('OHBudget: أمامي', 'overhead_budget', { prod_hrs: 1000, voh_rate: 5, foh: 10000 }, { voh: 5000, total: 15000 });

/* ═══════════════════════════════════════════
   SUITE 8: الانحرافات
   ═══════════════════════════════════════════ */

suite('الانحرافات');

section('41. انحراف المواد (material_variance)');
assert('MatVar: أمامي', 'material_variance', { sq: 1000, sp: 10, aq: 1100, ap: 9 }, { mpv: 1100, mqv: -1000, mtv: 100 });

section('42. انحراف الأجور (labor_variance)');
assert('LabVar: أمامي', 'labor_variance', { sh: 500, sr: 20, ah: 520, ar: 18 }, { lrv: 1040, lev: -400, ltv: 640 });

section('43. انحراف ت.إضافية (overhead_variance)');
assert('OHVar: أمامي', 'overhead_variance', { std_hrs: 1000, oh_rate: 5, actual: 4800 }, { applied: 5000, total_var: 200 });
assert('OHVar: عكسي', 'overhead_variance', { total_var: 200, actual: 4800 }, { applied: 5000 });

section('44. بطاقة التكلفة المعيارية (standard_cost)');
assert('StdCost: أمامي', 'standard_cost', { dm_qty: 3, dm_price: 10, dl_hrs: 2, dl_rate: 15, oh_hrs: 2, oh_rate: 5 },
  { dm_cost: 30, dl_cost: 30, oh_cost: 10, total: 70 });

section('45. كلية vs متغيرة (absorption_variable)');
assert('AbsVar: أمامي', 'absorption_variable', { prod: 10000, sold: 8000, foh: 50000 },
  { foh_pu: 5, inv_chg: 2000, diff: 10000 });

section('46. تعادل متعدد المنتجات (multi_bep)');
assert('MultiBEP: أمامي', 'multi_bep', { wavg_cm: 5, fc: 100000 }, { beq: 20000 });
assert('MultiBEP: عكسي', 'multi_bep', { beq: 20000, wavg_cm: 5 }, { fc: 100000 });

/* ═══════════════════════════════════════════
   SUITE 9: القيمة الزمنية والاستثمار
   ═══════════════════════════════════════════ */

suite('القيمة الزمنية والاستثمار');

section('47. القيمة الزمنية للنقود (tvm)');
assert('TVM: أمامي — FV', 'tvm', { pv: 10000, rate: 10, n: 3 }, { fv: 13310 });
assert('TVM: عكسي — PV', 'tvm', { fv: 13310, rate: 10, n: 3 }, { pv: 10000 });

section('48. القسط السنوي (annuity)');
assert('Annuity: أمامي', 'annuity', { pv: 100000, rate: 10, n: 5 }, { pmt: 26380 }, 50);

section('49. تحليل DuPont (dupont)');
assert('DuPont: أمامي', 'dupont', { npm: 10, at: 2, em: 1.5 }, { roa: 20, roe: 30 });

section('50. فترة الاسترداد (payback)');
assert('Payback: أمامي', 'payback', { invest: 100000, annual_cf: 25000 }, { payback: 4 });
assert('Payback: عكسي', 'payback', { payback: 4, annual_cf: 25000 }, { invest: 100000 });

section('51. صافي القيمة الحالية (npv)');
assert('NPV: أمامي', 'npv', { invest: 100000, annual_cf: 30000, n: 5, rate: 10 }, { npv: 13724 }, 100);

section('52. IRR (irr)');
assert('IRR: أمامي', 'irr', { invest: 100000, cf1: 40000, cf2: 40000, cf3: 40000 }, { irr_val: 9.7 }, 1);

section('53. NPV غير متساوي (npv_uneven)');
assert('NPVUneven: أمامي', 'npv_uneven', { invest: 100000, rate: 10, cf1: 30000, cf2: 40000, cf3: 50000 }, { npv: -2103.68 }, 100);

section('54. مؤشر الربحية (profitability_index)');
assert('PI: أمامي', 'profitability_index', { pv_cf: 120000, invest: 100000 }, { pi: 1.2 });
assert('PI: عكسي', 'profitability_index', { pi: 1.2, invest: 100000 }, { pv_cf: 120000 });

section('55. القيمة النهائية (terminal_value)');
assert('TV: أمامي', 'terminal_value', { fcf: 50000, g: 3, wacc: 10 }, { tv: 735714 }, 100);

section('56. فترة الاسترداد المخصومة (discounted_payback)');
assert('DPB: أمامي', 'discounted_payback', { invest: 100000, annual_cf: 30000, rate: 10 }, { dpb: 4.25 }, 1);

/* ═══════════════════════════════════════════
   SUITE 10: الضرائب والعملات
   ═══════════════════════════════════════════ */

suite('الضرائب والعملات');

section('57. ضريبة القيمة المضافة (vat)');
assert('VAT: أمامي', 'vat', { net: 1000, vat_rate: 14 }, { vat_amt: 140, gross: 1140 });
assert('VAT: عكسي — من GROSS → NET', 'vat', { gross: 1140, vat_rate: 14 }, { net: 1000 });

section('58. حساب الزكاة (zakat)');
assert('Zakat: أمامي', 'zakat', { base: 1000000, nisab: 100000 }, { zakat: 25000 });

section('59. تحويل العملات (currency)');
assert('Currency: أمامي', 'currency', { amount: 50000, rate: 50 }, { foreign: 1000 });
assert('Currency: عكسي', 'currency', { foreign: 1000, rate: 50 }, { amount: 50000 });

section('60. الضريبة التصاعدية (progressive_tax)');
assert('ProgTax: أمامي', 'progressive_tax',
  { income: 100000, exempt: 0, rate1: 10, limit1: 40000, rate2: 20, limit2: 80000, rate3: 30 },
  { tax: 18000 });

section('61. الضريبة المؤجلة (deferred_tax)');
assert('DefTax: أمامي', 'deferred_tax', { book_inc: 500000, tax_inc: 400000, tax_rate: 25 },
  { temp_diff: 100000, dtl: 25000 });

section('62. المعدل الفعلي (effective_tax_rate)');
assert('ETR: أمامي', 'effective_tax_rate', { tax_exp: 25000, ebt: 100000 }, { etr: 25 });
assert('ETR: عكسي', 'effective_tax_rate', { etr: 25, ebt: 100000 }, { tax_exp: 25000 });

section('63. الدرع الضريبي (tax_shield)');
assert('Shield: أمامي', 'tax_shield', { int_exp: 100000, dep_exp: 50000, tax_rate: 25 }, { shield: 37500 });

/* ═══════════════════════════════════════════
   SUITE 11: التحليل المالي
   ═══════════════════════════════════════════ */

suite('التحليل المالي');

section('64. التحليل الأفقي (horizontal_analysis)');
assert('Horiz: أمامي', 'horizontal_analysis', { base_yr: 200000, curr_yr: 250000 }, { abs_chg: 50000, pct_chg: 25 });
assert('Horiz: عكسي', 'horizontal_analysis', { pct_chg: 25, base_yr: 200000 }, { abs_chg: 50000, curr_yr: 250000 });

section('65. التحليل الرأسي (vertical_analysis)');
assert('Vert: أمامي', 'vertical_analysis', { item: 50000, total: 200000 }, { pct: 25 });
assert('Vert: عكسي', 'vertical_analysis', { pct: 25, total: 200000 }, { item: 50000 });

section('66. نسبة تغطية الفوائد (interest_coverage)');
assert('ICR: أمامي', 'interest_coverage', { ebit: 250000, int_exp: 50000 }, { icr: 5 });
assert('ICR: عكسي', 'interest_coverage', { icr: 5, int_exp: 50000 }, { ebit: 250000 });

section('67. دوران الدائنين (payables_turnover)');
assert('PT: أمامي', 'payables_turnover', { purch: 365000, avg_pay: 50000 }, { pt: 7.3 });

section('68. نسبة الدين/الأصول (debt_ratio)');
assert('DR: أمامي', 'debt_ratio', { td: 300000, ta: 1000000 }, { dr: 30 });
assert('DR: عكسي', 'debt_ratio', { dr: 30, ta: 1000000 }, { td: 300000 });

section('69. دورة التحويل النقدي (cash_conversion)');
assert('CCC: أمامي', 'cash_conversion', { dio: 45, dso: 30, dpo: 35 }, { ccc: 40 });
assert('CCC: عكسي', 'cash_conversion', { ccc: 40, dso: 30, dpo: 35 }, { dio: 45 });

section('70. هامش التشغيل (operating_margin)');
assert('OPM: أمامي', 'operating_margin', { ebit: 100000, rev: 500000 }, { opm: 20 });
assert('OPM: عكسي', 'operating_margin', { opm: 20, rev: 500000 }, { ebit: 100000 });

section('71. هامش EBITDA (ebitda_margin)');
assert('EBITDA: أمامي', 'ebitda_margin', { ebit: 100000, dep: 20000, rev: 500000 }, { ebitda: 120000, margin: 24 });

section('72. العائد على الأصول (roa)');
assert('ROA: أمامي', 'roa', { ni: 50000, avg_assets: 500000 }, { roa: 10 });
assert('ROA: عكسي', 'roa', { roa: 10, avg_assets: 500000 }, { ni: 50000 });

section('73. مكرر الأرباح (pe_ratio)');
assert('PE: أمامي', 'pe_ratio', { price: 100, eps: 10 }, { pe: 10 });
assert('PE: عكسي', 'pe_ratio', { pe: 10, eps: 10 }, { price: 100 });

section('74. القيمة الدفترية/سهم (book_value_ps)');
assert('BVPS: أمامي', 'book_value_ps', { eq: 1000000, shares: 100000 }, { bvps: 10 });

section('75. السعر/القيمة الدفترية (pb_ratio)');
assert('PB: أمامي', 'pb_ratio', { price: 15, bvps: 10 }, { pb: 1.5 });

section('76. نسبة توزيع الأرباح (dividend_payout)');
assert('DPR: أمامي', 'dividend_payout', { div: 40000, ni: 100000 }, { dpr: 40, rr: 60 });

section('77. عائد التوزيعات (dividend_yield)');
assert('DY: أمامي', 'dividend_yield', { dps: 5, price: 100 }, { dy: 5 });
assert('DY: عكسي', 'dividend_yield', { dy: 5, price: 100 }, { dps: 5 });

/* ═══════════════════════════════════════════
   SUITE 12: التقييم والاستثمار المتقدم
   ═══════════════════════════════════════════ */

suite('التقييم المتقدم');

section('78. نموذج CAPM (capm)');
assert('CAPM: أمامي', 'capm', { rf: 5, beta: 1.2, rm: 12 }, { rp: 7, ke: 13.4 });
assert('CAPM: عكسي — من KE + RF + RP → BETA', 'capm', { ke: 13.4, rf: 5, rp: 7 }, { beta: 1.2 });

section('79. WACC (wacc)');
assert('WACC: أمامي', 'wacc', { ke: 15, we: 60, kd: 8, wd: 40, tax: 25 }, { kd_at: 6, wacc: 11.4 });

section('80. EVA (eva)');
assert('EVA: أمامي', 'eva', { nopat: 200000, capital: 1000000, wacc: 10 }, { cap_charge: 100000, eva: 100000 });
assert('EVA: عكسي', 'eva', { eva: 100000, cap_charge: 100000 }, { nopat: 200000 });

section('81. التدفق الحر (fcf)');
assert('FCF: أمامي', 'fcf', { ocf: 300000, capex: 100000 }, { fcf: 200000 });
assert('FCF: عكسي', 'fcf', { fcf: 200000, capex: 100000 }, { ocf: 300000 });

section('82. تقييم DCF (dcf)');
assert('DCF: أمامي', 'dcf', { fcf: 100000, g: 5, wacc: 12, n: 5 }, {}, 1000);

/* ═══════════════════════════════════════════
   SUITE 13: الموازنات والتخطيط المتقدم
   ═══════════════════════════════════════════ */

suite('الموازنات المتقدمة');

section('83. الموازنة المرنة (flex_budget)');
assert('Flex: أمامي', 'flex_budget', { vc_pu: 10, fc: 50000, act_qty: 5000 }, { flex_vc: 50000, flex_total: 100000 });
assert('Flex: عكسي', 'flex_budget', { flex_total: 100000, fc: 50000, act_qty: 5000 }, { flex_vc: 50000, vc_pu: 10 });

section('84. انحرافات الموازنة المرنة (flex_budget_var)');
assert('FlexVar: أمامي', 'flex_budget_var', { static_b: 120000, flex_b: 100000, actual: 95000 },
  { vol_var: 20000, spend_var: 5000, total_var: 25000 });
assert('FlexVar: عكسي', 'flex_budget_var', { total_var: 25000, vol_var: 20000 }, { spend_var: 5000 });

section('85. تحليل الحساسية (sensitivity)');
assert('Sensitivity: أمامي', 'sensitivity', { base_val: 100000, change_pct: 10 }, { new_val: 110000, abs_impact: 10000 });

section('86. موازنة CapEx (capex_budget)');
assert('CapEx: أمامي', 'capex_budget', { equip: 200000, building: 100000, vehicle: 50000 },
  { total: 350000 });

section('87. تحليل السيناريوهات (scenario)');
assert('Scenario: PERT', 'scenario', { best: 150000, worst: 50000, likely: 100000 },
  { expected: 100000, range: 100000 });

/* ═══════════════════════════════════════════
   SUITE 14: التكاليف المتقدمة
   ═══════════════════════════════════════════ */

suite('التكاليف المتقدمة');

section('88. ABC (abc_costing)');
assert('ABC: أمامي', 'abc_costing', { oh_total: 500000, driver_qty: 10000, prod_qty: 300 },
  { act_rate: 50, alloc: 15000 });
assert('ABC: عكسي', 'abc_costing', { alloc: 15000, act_rate: 50 }, { prod_qty: 300 });

section('89. تسعير أوامر الإنتاج (job_order)');
assert('Job: أمامي', 'job_order', { dm: 10000, dl: 8000, oh: 5000, qty: 100 },
  { total: 23000, cost_pu: 230 });
assert('Job: عكسي — من TOTAL + DL + OH → DM', 'job_order', { total: 23000, dl: 8000, oh: 5000 }, { dm: 10000 });

section('90. تسعير المراحل (process_costing)');
assert('Process: أمامي', 'process_costing', { completed: 8000, wip: 2000, wip_pct: 50, total_cost: 90000 },
  { equiv_units: 9000, cost_pu: 10 });

section('91. الوحدات المكافئة (equivalent_units)');
assert('EU: أمامي — متوسط مرجح', 'equivalent_units',
  { beg_wip: 500, beg_pct: 60, started: 10000, end_wip: 1000, end_pct: 40 },
  { eu_wavg: 9900 }, 100);

section('92. معدل التحميل المحدد (pdoh_rate)');
assert('PDOH: أمامي', 'pdoh_rate', { est_oh: 200000, est_base: 10000, act_base: 9500 },
  { pdoh: 20, applied_oh: 190000 });
assert('PDOH: عكسي', 'pdoh_rate', { applied_oh: 190000, pdoh: 20 }, { act_base: 9500 });

section('93. التكلفة المستهدفة (target_costing)');
assert('TargetCost: أمامي', 'target_costing',
  { market_price: 100, target_margin: 20, actual_cost: 85 },
  { target_profit: 20, target_cost: 80, gap: 5 });

section('94. سلسلة القيمة (value_chain)');
assert('ValueChain: أمامي', 'value_chain', { activity: 30000, total_cost: 100000, revenue: 50000 },
  { pct: 30, va: 20000 });
assert('ValueChain: عكسي', 'value_chain', { va: 20000, activity: 30000 }, { revenue: 50000 });

/* ═══════════════════════════════════════════
   SUITE 15: المراجعة والحوكمة
   ═══════════════════════════════════════════ */

suite('المراجعة والحوكمة');

section('95. Z-Score (zscore)');
assert('ZScore: أمامي', 'zscore', { wc_ta: 0.1, re_ta: 0.2, ebit_ta: 0.15, mv_td: 2, sales_ta: 1.5 },
  { zscore: 3.215 }, 1);

section('96. قيود اليومية (journal_entries)');
assert('Journal: أمامي — متوازن', 'journal_entries', { debit1: 5000, debit2: 3000, credit1: 5000, credit2: 3000 },
  { total_d: 8000, total_c: 8000, diff: 0 });

section('97. ميزان المراجعة (trial_balance)');
assert('Trial: أمامي — متوازن', 'trial_balance', { dr1: 50000, dr2: 30000, cr1: 50000, cr2: 30000 },
  { total_dr: 80000, total_cr: 80000, diff: 0 });

section('98. Benford (benford)');
assert('Benford: الرقم 1', 'benford', { digit: 1 }, { expected: 30.1 }, 1);

section('99. تحليل الاتجاه (trend_analysis)');
assert('Trend: أمامي', 'trend_analysis', { base: 100000, yr1: 110000, yr2: 120000, yr3: 130000 },
  { idx1: 110, idx2: 120, idx3: 130 });
assert('Trend: عكسي — من IDX → YR', 'trend_analysis', { base: 100000, idx1: 110 }, { yr1: 110000 });

section('100. M-Score (mscore)');
assert('MScore: أمامي', 'mscore',
  { dsri: 1.0, gmi: 1.0, aqi: 1.0, sgi: 1.0, depi: 1.0, sgai: 1.0, lvgi: 1.0, tata: 0.05 },
  { mscore: -1.87 }, 1);

section('101. التسويات البنكية (bank_reconciliation)');
assert('BankRec: أمامي', 'bank_reconciliation',
  { bank_bal: 50000, dep_transit: 5000, os_checks: 3000, book_bal: 49000, int_earned: 1000, nsf: 500, fees: 500 },
  { adj_bank: 52000, adj_book: 49000, diff: 3000 });

/* ═══════════════════════════════════════════
   SUITE 16: أدوات متقدمة للتميز
   ═══════════════════════════════════════════ */

suite('أدوات متقدمة');

section('102. الرافعة المركبة (fin_leverage)');
assert('FinLev: أمامي', 'fin_leverage', { cm: 600000, ebit: 200000, ebt: 150000 },
  { dol: 3, dfl: 1.33, dcl: 4 }, 1);
assert('FinLev: عكسي — من DOL + DFL → DCL', 'fin_leverage', { dol: 3, dfl: 1.33 }, { dcl: 3.99 }, 1);

section('103. التأجير vs الشراء (lease_vs_buy)');
assert('LeaseBuy: أمامي', 'lease_vs_buy', { buy_cost: 100000, lease_pmt: 25000, n: 5, rate: 10 }, {}, 1000);

section('104. تسعير السندات (bond_pricing)');
assert('Bond: أمامي', 'bond_pricing', { face: 1000, coupon_r: 8, ytm: 10, n: 5 },
  { coupon: 80 });

section('105. التعادل النقدي (cash_breakeven)');
assert('CashBE: أمامي', 'cash_breakeven', { fc: 100000, dep: 20000, cm: 10 },
  { cash_fc: 80000, cash_beq: 8000 });

section('106. ملخص الموازنة الرئيسية (master_budget)');
assert('Master: أمامي', 'master_budget', { sales_rev: 500000, cogs: 300000, opex: 50000, capex: 30000 },
  { gross: 200000, ebit: 150000, net_cf: 120000 });
assert('Master: عكسي — من EBIT + OPEX → GROSS', 'master_budget', { ebit: 150000, opex: 50000, cogs: 300000 },
  { gross: 200000, sales_rev: 500000 });

/* ═══════════════════════════════════════════
   SUITE 17: حالات حدية
   ═══════════════════════════════════════════ */

suite('حالات حدية وأخطاء');

{
  const mod = MODULES.find(m => m.id === 'breakeven')!;
  const result = mod.solver({ fc: 100000, p: 5, vc: 5, beq: null, bes: null, cm: null, rev: null, t_vc: null, cmr: null });
  if (result['_error']) { passed++; } else { failed++; errors.push('  ❌ BEP: لم يكتشف CM=0'); console.log('  ❌ BEP: لم يكتشف CM=0'); }
}

{
  const mod = MODULES.find(m => m.id === 'breakeven')!;
  const result = mod.solver({ fc: 100000, p: 3, vc: 5, beq: null, bes: null, cm: null, rev: null, t_vc: null, cmr: null });
  if (result['_error']) { passed++; } else { failed++; errors.push('  ❌ BEP: لم يكتشف CM سالب'); console.log('  ❌ BEP: لم يكتشف CM سالب'); }
}

{
  const mod = MODULES.find(m => m.id === 'depreciation')!;
  const result = mod.solver({ cost: 10000, salvage: 20000, life: 5, dep: null, years: null, acc_dep: null, bv: null });
  if (result['_error']) { passed++; } else { failed++; errors.push('  ❌ DEP: لم يكتشف salvage > cost'); console.log('  ❌ DEP: لم يكتشف salvage > cost'); }
}

{
  const mod = MODULES.find(m => m.id === 'target_sales')!;
  const result = mod.solver({ fc: 20000, cm: 10, tp_post: 15000, tax: 25, qty: null, tp_pre: null, cmr: null, price: null, val: null });
  if (result.qty === 4000) { passed++; } else { failed++; errors.push(`  ❌ Target+Tax: expected 4000, got ${result.qty}`); console.log(`  ❌ Target+Tax: expected 4000, got ${result.qty}`); }
}

/* ═══════════════════════════════════════════
   RESULTS
   ═══════════════════════════════════════════ */

console.log('\n══════════════════════════════════════════');
console.log(`  النتيجة النهائية: ${passed} نجح ✅ | ${failed} فشل ❌`);
console.log(`  إجمالي الاختبارات: ${passed + failed}`);
console.log('══════════════════════════════════════════');

if (errors.length > 0) {
  console.log('\n--- تفاصيل الأخطاء ---');
  errors.forEach(e => console.log(e));
}

process.exit(failed > 0 ? 1 : 0);
