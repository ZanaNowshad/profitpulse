/* ProfitPulse — client-side funnel + lead-capture instrumentation.
 *
 * The static host cannot write to a server DB, so we keep a durable,
 * exportable event log in localStorage under the key PP_FUNNEL. This lets
 * the operator recover real visitor/lead events and replay them into the
 * autonomy_os funnel_events table. We deliberately do NOT fabricate events:
 * only real user actions create entries.
 */
(function (global) {
  'use strict';
  var KEY = 'PP_FUNNEL';
  var SESSION = 'PP_SID';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return []; }
  }
  function write(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function sid() {
    var id = localStorage.getItem(SESSION);
    if (!id) {
      id = 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(SESSION, id);
    }
    return id;
  }

  function track(event, data) {
    var rec = {
      sid: sid(),
      event: event,
      page: location.pathname,
      referrer: document.referrer || '',
      ts: new Date().toISOString(),
      data: data || {}
    };
    var arr = read();
    arr.push(rec);
    write(arr);
    // Beacon to console so the operator can see it live in devtools.
    try { console.log('[ProfitPulse funnel]', event, JSON.stringify(rec)); } catch (e) {}
    return rec;
  }

  function events() { return read(); }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }

  function download() {
    var arr = read();
    var blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'profitpulse_funnel_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  global.PPFunnel = { track: track, events: events, clear: clear, download: download, sid: sid };
})(typeof window !== 'undefined' ? window : globalThis);
