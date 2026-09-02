/* ProfitPulse — PayPal-only subscription buttons (client-side, static-host friendly).
 *
 * Renders PayPal "Subscribe" buttons for the Pro and Team recurring plans we
 * created in the PayPal billing catalog:
 *    product  PROD-6MF76397UF342805W  (ProfitPulse Pro Subscription)
 *    Pro  -> P-6C143761BX9578412NKL7D4Q  ($9.00/mo)
 *    Team -> P-5HE234419H928930TNKL7D4Y  ($29.00/mo)
 *
 * MONEY PATH: the payer pays PayPal directly and funds settle to the PayPal
 * business account that owns these plans (RECEIVER_EMAIL). There is NO Stripe,
 * NO Paddle — PayPal is the only processor. On approval we store the
 * subscription id so Pro/Team features can be unlocked.
 *
 * PLATFORM: GitHub Pages is STATIC with no server, so we use the PayPal JS SDK
 * (intent=subscription) which mints the subscription entirely from the browser.
 * The public client-id is required but is NOT a secret.
 *
 * HONEST LIMITATIONS (documented for the operator):
 *   - The bundled credentials are SANDBOX, so buttons open the PayPal SANDBOX
 *     checkout and do NOT move real money; live returns 401 for these creds.
 *   - To accept real money set PP_PAYPAL.MODE='live' and replace
 *     PP_PAYPAL.CLIENT_ID_LIVE with a LIVE client id tied to the business
 *     account that owns these plans.
 *   - For compliance + fraud-safe provisioning on a static host, you'd add a tiny
 *     verification endpoint to check PayPal webhooks/IPN and auto-unlock
 *     subscriptions. Without it, the client unlocks Pro/Team from the stored
 *     subscription id (client-side gating only).
 *
 * This file is the ONLY PayPal entry point and never exposes a secret.
 */
(function () {
  'use strict';

  function cfg() {
    var c = window.PP_PAYPAL || {};
    var mode = c.MODE || 'sandbox';
    return {
      mode: mode,
      clientId: mode === 'live'
        ? (c.CLIENT_ID_LIVE || c.CLIENT_ID_SANDBOX)
        : (c.CLIENT_ID_SANDBOX || c.CLIENT_ID_LIVE),
      currency: c.CURRENCY || 'USD',
      plans: c.PLANS || {},
      planPrice: c.PLAN_PRICE || {},
      receiver: c.RECEIVER_EMAIL || ''
    };
  }

  var c = cfg();
  var state = { loaded: false, sdkError: null };
  window.ppPayPal = { config: c, state: state };

  var sdkSrc = (c.mode === 'live' ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com') +
               '/sdk/js?client-id=' + encodeURIComponent(c.clientId) +
               '&currency=' + encodeURIComponent(c.currency) +
               '&intent=subscription&vault=true';

  function loadSdk() {
    if (state.loaded) return Promise.resolve(true);
    if (state.sdkError) return Promise.reject(state.sdkError);
    return new Promise(function (resolve, reject) {
      if (document.getElementById('paypal-sdk')) { resolve(true); return; }
      var s = document.createElement('script');
      s.id = 'paypal-sdk';
      s.src = sdkSrc;
      s.onload = function () { state.loaded = true; resolve(true); };
      s.onerror = function () {
        var err = new Error('PayPal SDK failed to load');
        state.sdkError = err;
        reject(err);
      };
      document.head.appendChild(s);
    });
  }

  function readEmail() {
    var el = document.getElementById('lead-email');
    return el ? (el.value || '').trim() : '';
  }

  function validEmail(e) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  }

  function note(message) {
    var msg = document.getElementById('lead-msg');
    if (msg) { msg.textContent = message; msg.style.display = 'block'; }
  }

  // Render one PayPal "Subscribe" button for a tier. Uses the documented
  // createSubscription callback (SDK v5) which requires no secret.
  function renderButton(tier, containerId) {
    return loadSdk().then(function () {
      var el = document.getElementById(containerId);
      if (!el) throw new Error('No container: ' + containerId);
      var planId = c.plans[tier];
      if (!planId) throw new Error('No plan id for tier ' + tier);

      var buttons = paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect', color: 'gold', label: 'subscribe' },
        createSubscription: function (data, actions) {
          var email = readEmail();
          if (email && !validEmail(email)) {
            note('Please enter a valid email for your subscription.');
            return Promise.reject('invalid-email');
          }
          var sub = {
            plan_id: planId,
            application_context: {
              brand_name: 'ProfitPulse',
              user_action: 'SUBSCRIBE_NOW',
              return_url: location.origin + location.pathname + '?paypal=success&tier=' + tier,
              cancel_url: location.origin + location.pathname + '?paypal=cancel&tier=' + tier,
              shipping_preference: 'NO_SHIPPING'
            }
          };
          if (email) sub.subscriber = { email_address: email };
          // actions.subscription.create is the SDK v5 subscription API.
          return actions.subscription.create(sub);
        },
        onApprove: function (data, actions) {
          var subId = data.subscriptionID || data.orderID || '';
          try {
            localStorage.setItem('pp_sub_' + Date.now(), JSON.stringify({
              tier: tier, planId: planId, subscriptionId: subId,
              email: readEmail(), ts: Date.now()
            }));
            localStorage.setItem('pp_active_tier', tier);
            localStorage.setItem('pp_active_subscription', subId);
          } catch (e) {}
          note('✅ ' + tier.toUpperCase() + ' subscription started (' + subId + '). Your Pro/Team features are unlocked. PayPal has sent your confirmation.');
          if (window.ppOnApprove) window.ppOnApprove(tier, data);
        },
        onCancel: function (data) {
          note('Subscription canceled — you are still on the Free plan.');
        },
        onError: function (err) {
          note('Payment error. Please try again or contact ' + (c.receiver || 'support') + '.');
          if (window.ppOnError) window.ppOnError(tier, err);
        }
      });

      return buttons.render(el).then(function () {
        if (window.ppOnRendered) window.ppOnRendered(tier);
        return true;
      });
    });
  }

  // Render multiple buttons SEQUENTIALLY. The SDK renders one button happily;
  // concurrent renders on siblings can hang, so we queue them.
  function renderAll(tiers) {
    var list = tiers.slice();
    function next() {
      if (!list.length) return Promise.resolve();
      var tier = list.shift();
      var id = 'paypal-' + tier + '-button';
      return renderButton(tier, id).catch(function (e) {
        if (window.console) console.error('PayPal button failed for ' + tier + ':', e);
        return true; // non-fatal
      }).then(next);
    }
    return loadSdk().then(next);
  }

  window.ppSubscribe = {
    load: loadSdk,
    render: renderButton,
    renderAll: renderAll,
    config: c
  };
})();
