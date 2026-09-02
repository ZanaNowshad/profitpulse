/* ProfitPulse DOM glue: wires the calculator forms to the pure Calc functions. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function $(v) { return document.getElementById(v); }

  function renderUE(r) {
    function row(label, val) {
      return '<div class="kpi"><span class="k">' + label + '</span><span class="v">' + val + '</span></div>';
    }
    var html =
      row('Gross margin / unit', '$' + r.gross_margin_per_unit) +
      row('Gross margin rate', r.gross_margin_rate_pct + '%') +
      row('Contribution / unit (after CAC)', '$' + r.contribution_per_unit) +
      row('Monthly gross margin', '$' + r.monthly_gross_margin) +
      row('Monthly contribution', '$' + r.monthly_contribution) +
      row('Breakeven customers', r.breakeven_customers == null ? '∞' : r.breakeven_customers) +
      row('Avg. lifetime (months)', r.avg_lifetime_months == null ? '∞' : r.avg_lifetime_months) +
      row('LTV (lifetime value)', '$' + r.ltv) +
      row('LTV : CAC', r.ltv_cac == null ? '∞' : (r.ltv_cac + 'x')) +
      '<div class="verdict">' + r.verdict + '</div>';
    $('ue-out').innerHTML = html;
  }

  function renderPQ(r) {
    function row(label, val) {
      return '<div class="kpi"><span class="k">' + label + '</span><span class="v">' + val + '</span></div>';
    }
    var html =
      row('Target unit price', '$' + r.unit_price) +
      row('Subtotal', '$' + r.subtotal) +
      row('Discount amount', '-$' + r.discount_amount) +
      row('Discounted total', '$' + r.discounted_total) +
      row('Tax amount', '$' + r.tax_amount) +
      row('Total', '$' + r.total) +
      row('Realized margin', r.realized_margin_pct + '%');
    $('pq-out').innerHTML = html;
  }

  function bind(formId, outFn) {
    var f = $(formId);
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      outFn();
    });
  }

  function ueSubmit() {
    var r = window.Calc.unitEconomics(
      $('price').value, $('varcost').value, $('cac').value,
      $('fixed').value, $('customers').value, $('churn').value
    );
    renderUE(r);
  }

  function pqSubmit() {
    var r = window.Calc.priceQuote(
      $('pcost').value, $('pmargin').value, $('pqty').value,
      $('pdiscount').value, $('ptax').value
    );
    renderPQ(r);
  }

  // ---- Free plan CTA (no email needed; the calculator is free) ----
  window.captureLead = function (tier) {
    if (tier === 'Free') {
      var calc = $('calc') || $('ue-form');
      if (calc && calc.scrollIntoView) calc.scrollIntoView({ behavior: 'smooth' });
      var msg = $('lead-msg');
      if (msg) { msg.textContent = 'Free plan is live — the calculator is fully unlocked. No sign-up needed.'; msg.style.display = 'block'; }
      return true;
    }
    // Pro/Team are subscribed through the PayPal buttons rendered in the cards.
    var el = $('pricing');
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth' });
    return true;
  };

  window.proNotice = function (tier) {
    alert('ProfitPulse ' + tier + ' pricing: use the Pro/Team upgrade box below to start your subscription request.');
    var el = $('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  bind('ue-form', ueSubmit);
  bind('pq-form', pqSubmit);
  // render initial values on load
  ueSubmit();
  pqSubmit();
})();
