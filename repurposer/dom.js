/*
 * RepurposerOne — DOM glue. Binds the calculator UI / landing form to app.js.
 *
 * Freemium gate: the Free plan allows a limited number of repurposes per
 * month; past that the tool asks the visitor to upgrade to Pro. This creates
 * the measured freemium->paid conversion trigger the business depends on.
 * The gate state is client-side only (static host); it is honest — it uses
 * the same plan facts the PayPal button advertises (Free 3/mo, Pro unlimited).
 *
 * Funnel instrumentation: every real user action is logged via
 * window.PPFunnel (see ../funnel.js) into a durable localStorage event log.
 * Nothing is fabricated: an event is only written when the user acts.
 */
'use strict';
(function () {
  var R = (typeof window !== 'undefined' && window.Repurposer) ? window.Repurposer : (typeof require !== 'undefined' ? require('./app.js') : null);
  if (!R && typeof window !== 'undefined' && window.Repurposer) R = window.Repurposer;

  var FREE_LIMIT = 3;                 // Free plan: 3 repurposes / month
  var FREE_KEY = 'rp_free_use';       // { yyyy-mm: count }
  var PRO_KEY = 'rp_active_tier';     // 'pro' when a subscription is active

  function text(id) { var el = document.getElementById(id); return el ? el.value || '' : ''; }
  function set(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; }

  // ---- Funnel helpers (real events only) ----
  function track(event, data) {
    try { if (window.PPFunnel) window.PPFunnel.track(event, data || {}); } catch (e) {}
  }

  function monthKey() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
  }

  function readUse() {
    try {
      var o = JSON.parse(localStorage.getItem(FREE_KEY) || '{}');
      return o && typeof o === 'object' ? o : {};
    } catch (e) { return {}; }
  }
  function freeUsesThisMonth() {
    var o = readUse();
    return parseInt(o[monthKey()] || 0, 10) || 0;
  }
  function addFreeUse() {
    var o = readUse();
    o[monthKey()] = (freeUsesThisMonth() + 1);
    try { localStorage.setItem(FREE_KEY, JSON.stringify(o)); } catch (e) {}
    return o[monthKey()];
  }
  function isPro() {
    try { return localStorage.getItem(PRO_KEY) === 'pro'; } catch (e) { return false; }
  }
  function remainingFree() {
    var used = freeUsesThisMonth();
    return Math.max(0, FREE_LIMIT - used);
  }

  function gateMessage() {
    var after = FREE_LIMIT - freeUsesThisMonth();
    if (after > 0) {
      return 'Free plan left this month: ' + after + ' of ' + FREE_LIMIT + ' repurposes. Upgrade for unlimited.';
    }
    return 'You\u2019ve used all ' + FREE_LIMIT + ' free repurposes this month. Upgrade to Pro for unlimited.';
  }

  function note(message, color) {
    var counts = document.getElementById('counts');
    if (counts) {
      counts.textContent = message;
      if (color) counts.style.color = color;
    }
  }

  function run(force) {
    var title = text('title');
    var article = text('article');
    var brand = text('brand');

    if (!isPro() && !force) {
      if (freeUsesThisMonth() >= FREE_LIMIT) {
        track('rp_free_gate_hit', { limit: FREE_LIMIT, used: freeUsesThisMonth() });
        note('You\u2019ve reached the free limit. Upgrade to Pro to keep repurposing.', '#f0883e');
        revealUpgrade();
        return;
      }
    }

    var out = R.repurpose({ title: title, article: article, brand: brand });

    set('linkedin', out.linkedin);
    set('newsletter', out.newsletter);

    // Render the X thread as numbered tweets (1/n, 2/n...) for clarity.
    var xBox = document.getElementById('xThread');
    if (xBox) {
      var n = out.xThread.length;
      xBox.value = out.xThread.map(function (t, i) { return (i + 1) + '/' + n + ' ' + t; }).join('\n\n');
    }

    var counts = document.getElementById('counts');
    if (counts) {
      counts.style.color = '';
      counts.textContent = 'Generated ' + out.meta.key_count + ' key points \u2192 ' + out.xThread.length + ' X posts. ' + gateMessage();
    }

    if (!isPro()) {
      addFreeUse();
      track('rp_tool_run', { used_after: freeUsesThisMonth(), limit: FREE_LIMIT, key_points: out.meta.key_count, x_posts: out.xThread.length });
      if (freeUsesThisMonth() >= FREE_LIMIT) {
        // Just crossed the gate: prompt upgrade now (real conversion moment).
        track('rp_reached_free_limit', { limit: FREE_LIMIT });
        revealUpgrade();
      }
    } else {
      track('rp_tool_run', { tier: 'pro', key_points: out.meta.key_count, x_posts: out.xThread.length });
    }
  }

  function copy(id, btn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.select();
    document.execCommand('copy');
    track('rp_copy', { field: id });
    if (btn) {
      var old = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = old; }, 1200);
    }
  }

  function revealUpgrade() {
    var featured = document.querySelector('.plan.featured');
    if (featured) {
      featured.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    note('Upgrade to Pro \u2192 use the gold \u201cSubscribe\u201d button.', '#f0883e');
  }

  function init() {
    var go = document.getElementById('go');
    if (go) go.addEventListener('click', function () { run(false); });

    // Start free button: focus the input (free tier needs no signup).
    var startFree = document.getElementById('startFree');
    if (startFree) {
      startFree.addEventListener('click', function (e) {
        e.preventDefault();
        track('rp_start_free_click');
        var titleEl = document.getElementById('title');
        if (titleEl) { titleEl.focus(); titleEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      });
    }

    var loadSample = document.getElementById('loadSample');
    if (loadSample) {
      loadSample.addEventListener('click', function (e) {
        e.preventDefault();
        set('title', 'The 80/20 System for Content Repurposing');
        set('article', 'Content repurposing is the highest-leverage habit for busy marketers. Instead of writing ten original posts, you write one strong article and turn it into a week of platform-native content. The 80/20 rule applies: twenty percent of the work produces eighty percent of the reach. Use a repurposing tool to generate a LinkedIn post, an X thread, and a newsletter blurb from that one article. The key is to adapt the voice and length to each platform, not to copy-paste the same text everywhere. Stop publishing original content on every channel and start repurposing the best of it.');
        set('brand', 'RepurposerOne');
        run(false);
      });
    }

    var c = document.getElementById('copyLinkedin'); if (c) c.addEventListener('click', function () { copy('linkedin', c); });
    var cx = document.getElementById('copyX'); if (cx) cx.addEventListener('click', function () { copy('xThread', cx); });
    var cn = document.getElementById('copyNewsletter'); if (cn) cn.addEventListener('click', function () { copy('newsletter', cn); });

    track('rp_page_view', { ref: document.referrer || '' });

    // Report remaining free use on load (no event, just UI state).
    var counts = document.getElementById('counts');
    if (counts) counts.textContent = gateMessage();

    if (document.getElementById('go') && text('article')) run(false);
  }

  // Subscribe lifecycle hooks (called from paypal-subscribe.js).
  window.rpOnRendered = function (tier) { track('rp_paypal_rendered', { tier: tier }); };
  window.rpOnApprove = function (tier, data) {
    var sub = '';
    try { sub = (data && (data.subscriptionID || data.orderID)) || ''; } catch (e) {}
    track('rp_subscription_started', { tier: tier, subscription_id: sub ? String(sub).slice(0, 12) : '' });
  };
  window.rpOnError = function (tier, err) {
    track('rp_paypal_error', { tier: tier, err: err && err.message ? String(err.message).slice(0, 120) : 'unknown' });
  };

  if (typeof window !== 'undefined') { window.RepurposerOneInit = init; }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
