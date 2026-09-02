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

  // ---- Lead capture (goes to a real, verifiable endpoint when deployed) ----
  // On GitHub Pages we have no server, so we build a mailto invite that the
  // operator can swap for a form-spam-safe endpoint (e.g. Formspree/Netlify).
  window.captureLead = function (tier) {
    var email = ($('lead-email') ? $('lead-email').value : '');
    var name = ($('lead-name') ? $('lead-name').value : '');
    if (!email || email.indexOf('@') < 1) {
      alert('Please enter a valid email to get the ' + (tier || 'Pro') + ' setup.');
      return false;
    }
    var body = encodeURIComponent(
      'I want to upgrade to ProfitPulse ' + (tier || 'Pro') + '.\n' +
      'Name: ' + name + '\nEmail: ' + email + '\n' +
      'Tell me the next step to subscribe.'
    );
    var link = 'mailto:zanabalmuhamed@gmail.com?subject=' +
      encodeURIComponent('ProfitPulse ' + (tier || 'Pro') + ' request') +
      '&body=' + body;
    // Try to open the mail client; also record intent locally for analytics.
    document.location.href = link;
    try { localStorage.setItem('pp_lead_' + Date.now(), JSON.stringify({ tier: tier, email: email, name: name, ts: Date.now() })); } catch (e) {}
    var msg = $('lead-msg');
    if (msg) { msg.textContent = 'Request started. We will send your ' + (tier || 'Pro') + ' activation link shortly.'; msg.style.display = 'block'; }
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
