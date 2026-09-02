// ProfitPulse unit test — loads the pure Calc functions and asserts ground-truth math.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('app.js', 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code, ctx);
const Calc = ctx.Calc;

let pass = 0, fail = 0;
function check(name, actual, expected, tol) {
  tol = tol || 0.01;
  const ok = Math.abs(actual - expected) <= tol;
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS' : 'FAIL') + '  ' + name + '  got=' + actual + ' expected=' + expected);
}

// ---- Unit economics ground truth (price 49, var 10, cac 30, fixed 1200, 100 cust, 5% churn)
const ue = Calc.unitEconomics(49, 10, 30, 1200, 100, 5);
// margin/unit = 49-10 = 39
check('gross margin per unit', ue.gross_margin_per_unit, 39);
check('gross margin rate %', ue.gross_margin_rate_pct, 100 * 39 / 49);      // 79.59
check('contribution per unit', ue.contribution_per_unit, 39 - 30);           // 9
check('monthly gross margin', ue.monthly_gross_margin, 39 * 100);            // 3900
check('monthly contribution', ue.monthly_contribution, 3900 - 1200);         // 2700
check('breakeven customers', ue.breakeven_customers, 1200 / 9);              // 133.33
check('avg lifetime months', ue.avg_lifetime_months, 100 / 5);               // 20
check('LTV', ue.ltv, 39 * 20);                                              // 780
check('LTV:CAC', ue.ltv_cac, 780 / 30);                                      // 26

// ---- Price quote ground truth (cost 20, margin 70%, qty 1, disc 0, tax 0)
const pq = Calc.priceQuote(20, 70, 1, 0, 0);
// unit price = 20 / (1-0.7) = 66.6667
check('target unit price', pq.unit_price, 66.6666667, 0.01);
check('subtotal', pq.subtotal, 66.6666667, 0.01);
check('discount amount', pq.discount_amount, 0);
check('discounted total', pq.discounted_total, 66.6666667, 0.01);
check('tax amount', pq.tax_amount, 0);
check('total', pq.total, 66.6666667, 0.01);
check('realized margin %', pq.realized_margin_pct, 70, 0.01);

// ---- With discount 10% and tax 8%, qty 2
const pq2 = Calc.priceQuote(20, 70, 2, 10, 8);
const unit = 20 / (1 - 0.7);           // 66.6667
const sub = unit * 2;                  // 133.333
const disc = sub * 0.10;               // 13.333
const discTotal = sub - disc;          // 120
const tax = discTotal * 0.08;          // 9.6
check('pq2 subtotal', pq2.subtotal, sub, 0.01);
check('pq2 discount', pq2.discount_amount, disc, 0.01);
check('pq2 discounted total', pq2.discounted_total, discTotal, 0.01);
check('pq2 tax', pq2.tax_amount, tax, 0.01);
check('pq2 total', pq2.total, discTotal + tax, 0.01);

// ---- Edge: churn 0 => infinite lifetime (null)
const ue0 = Calc.unitEconomics(49, 10, 30, 1200, 100, 0);
assert.strictEqual(ue0.avg_lifetime_months, null);
assert.strictEqual(ue0.ltv_cac, null);
pass++; console.log('PASS  churn=0 -> lifetime/LTV:CAC null');

// ---- Edge: negative contribution verdict
const unprof = Calc.unitEconomics(10, 20, 5, 100, 10, 5);
assert.ok(unprof.verdict.indexOf('Unprofitable') >= 0);
pass++; console.log('PASS  unprofitable verdict');

console.log('\nRESULT: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
