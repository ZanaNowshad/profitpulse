/* ProfitPulse — pure calculator functions (no DOM dependencies) so they are
   deterministic and independently testable. */
(function (global) {
  'use strict';

  // ---- Unit economics -------------------------------------------------
  function unitEconomics(price, variableCost, cac, monthlyFixed, customers, churnPct) {
    price = Number(price) || 0;
    variableCost = Number(variableCost) || 0;
    cac = Number(cac) || 0;
    monthlyFixed = Number(monthlyFixed) || 0;
    customers = Number(customers) || 0;
    churnPct = Number(churnPct) || 0;

    var grossMarginPerUnit = price - variableCost;
    var grossMarginRate = price > 0 ? grossMarginPerUnit / price : 0;   // 0..1
    var contributionPerUnit = grossMarginPerUnit - cac;                  // after CAC
    var monthlyGrossMargin = customers * grossMarginPerUnit;
    var monthlyContribution = monthlyGrossMargin - monthlyFixed;
    var breakevenCustomers = contributionPerUnit > 0 ? monthlyFixed / contributionPerUnit : Infinity;
    var avgLifetimeMonths = churnPct > 0 ? 100 / churnPct : Infinity;
    var ltv = grossMarginPerUnit * avgLifetimeMonths;
    var ltvCac = cac > 0 ? ltv / cac : Infinity;
    var annualMultiple = ltvCac;

    return {
      gross_margin_per_unit: round2(grossMarginPerUnit),
      gross_margin_rate_pct: round2(grossMarginRate * 100),
      contribution_per_unit: round2(contributionPerUnit),
      monthly_gross_margin: round2(monthlyGrossMargin),
      monthly_contribution: round2(monthlyContribution),
      breakeven_customers: finite(breakevenCustomers) ? round2(breakevenCustomers) : null,
      avg_lifetime_months: finite(avgLifetimeMonths) ? round2(avgLifetimeMonths) : null,
      ltv: round2(ltv),
      ltv_cac: finite(ltvCac) ? round2(ltvCac) : null,
      verdict: verdict(ltvCac, contributionPerUnit)
    };
  }

  // ---- Target-margin pricing ------------------------------------------
  function priceQuote(cost, marginPct, quantity, discountPct, taxPct) {
    cost = Number(cost) || 0;
    marginPct = Number(marginPct) || 0;
    quantity = Number(quantity) || 1;
    discountPct = Number(discountPct) || 0;
    taxPct = Number(taxPct) || 0;

    var margin = marginPct / 100;
    var unitPrice = cost / (1 - margin);
    var subtotal = unitPrice * quantity;
    var discountAmount = subtotal * (discountPct / 100);
    var discounted = subtotal - discountAmount;
    var tax = discounted * (taxPct / 100);
    var total = discounted + tax;
    var netUnitRevenue = unitPrice * (1 - discountPct / 100);
    var realizedMarginRate = netUnitRevenue > 0 ? (netUnitRevenue - cost) / netUnitRevenue : 0;

    return {
      unit_price: round2(unitPrice),
      subtotal: round2(subtotal),
      discount_amount: round2(discountAmount),
      discounted_total: round2(discounted),
      tax_amount: round2(tax),
      total: round2(total),
      realized_margin_pct: round2(realizedMarginRate * 100)
    };
  }

  function verdict(ltvCac, contributionPerUnit) {
    if (contributionPerUnit <= 0) {
      return '⚠ Unprofitable — price must cover variable cost + CAC.';
    }
    if (ltvCac >= 3) return '✅ Healthy — LTV:CAC ≥ 3 (scalable).';
    if (ltvCac >= 1.5) return '👍 Acceptable — LTV:CAC 1.5–3 (optimize).';
    return '🔻 Weak — LTV:CAC < 1.5 (raise price or cut CAC).';
  }

  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
  function finite(n) { return isFinite(n) && !isNaN(n); }

  var Calc = { unitEconomics: unitEconomics, priceQuote: priceQuote };
  global.Calc = Calc;
})(typeof window !== 'undefined' ? window : globalThis);
