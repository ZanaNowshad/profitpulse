/* RepurposerOne — PayPal subscription button (client-side, static-host friendly).
 *
 * Renders a PayPal "Subscribe" button for the Pro recurring plan:
 *   Pro -> P-6C143761BX9578412NKL7D4Q  ($9.00/mo)
 *
 * MONEY PATH: the payer pays PayPal directly; funds settle to the business
 * account that owns the billing plan (RECEIVER_EMAIL). GitHub Pages is STATIC,
 * so we use the PayPal JS SDK (intent=subscription) which mints the sub from
 * the browser. The public client-id is required but NOT a secret.
 *
 * HONEST LIMITS (documented for the operator):
 *   - Bundled credentials are SANDBOX, so buttons open PayPal SANDBOX — no real
 *     money moves for these creds.
 *   - To accept real money: set RP__PAYPAL.MODE='live' and set CLIENT_ID_LIVE on
 *     the business account that owns this plan.
 *   - For fraud-safe provisioning on a static host you'd add a verification
 *     endpoint (PayPal webhook/IPN). Without it, Pro is unlocked client-side
 *     from the stored subscription id only.
 *
 * Single entry point; never exposes a secret.
 */
(function () {
  'use strict';

  function cfg() {
    var c = window.RP__PAYPAL || {};
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
  window.rpPayPal = { config: c, state: state };

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

  function note(message) {
    var msg = document.getElementById('rp-msg');
    if (msg) { msg.textContent = message; msg.style.display = 'block'; }
  }

  function renderProButton(containerId) {
    return loadSdk().then(function () {
      var el = document.getElementById(containerId);
      if (!el) throw new Error('No container: ' + containerId);
      var planId = c.plans.pro;
      if (!planId) throw new Error('No plan id for pro');

      var buttons = paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect', color: 'gold', label: 'subscribe' },
        createSubscription: function (data, actions) {
          var sub = {
            plan_id: planId,
            application_context: {
              brand_name: 'RepurposerOne',
              user_action: 'SUBSCRIBE_NOW',
              return_url: location.origin + location.pathname + '?paypal=success&tier=pro',
              cancel_url: location.origin + location.pathname + '?paypal=cancel&tier=pro',
              shipping_preference: 'NO_SHIPPING'
            }
          };
          return actions.subscription.create(sub);
        },
        onApprove: function (data, actions) {
          var subId = data.subscriptionID || data.orderID || '';
          try {
            localStorage.setItem('rp_active_tier', 'pro');
            localStorage.setItem('rp_active_subscription', subId);
            localStorage.setItem('rp_sub_' + Date.now(), JSON.stringify({
              tier: 'pro', planId: planId, subscriptionId: subId, ts: Date.now()
            }));
          } catch (e) {}
          note('✅ Pro subscription started (' + subId + '). Unlimited repurposes unlocked. PayPal has sent your confirmation.');
          if (window.rpOnApprove) window.rpOnApprove('pro', data);
        },
        onCancel: function (data) {
          note('Subscription canceled — you are still on the Free plan.');
        },
        onError: function (err) {
          note('Payment error. Please try again or contact ' + (c.receiver || 'support') + '.');
          if (window.rpOnError) window.rpOnError('pro', err);
        }
      });

      return buttons.render(el).then(function () {
        if (window.rpOnRendered) window.rpOnRendered('pro');
        return true;
      });
    });
  }

  window.rpSubscribe = {
    load: loadSdk,
    renderPro: renderProButton,
    config: c
  };
})();
