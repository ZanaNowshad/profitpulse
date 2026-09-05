/*
 * RepurposerOne — DOM glue. Binds the calculator UI / landing form to app.js.
 */
'use strict';
(function () {
  var R = (typeof window !== 'undefined' && window.Repurposer) ? window.Repurposer : (typeof require !== 'undefined' ? require('./app.js') : null);
  if (!R && typeof window !== 'undefined' && window.Repurposer) R = window.Repurposer;

  function text(id) { var el = document.getElementById(id); return el ? el.value || '' : ''; }
  function set(id, v) { var el = document.getElementById(id); if (el) el.value = v || ''; }

  function run() {
    var title = text('title');
    var article = text('article');
    var brand = text('brand');
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
      counts.textContent = 'Input sentences: ' + out.meta.sentences +
        ' | Key points: ' + out.meta.key_count +
        ' | X posts: ' + out.xThread.length;
    }
  }

  function copy(id, btn) {
    var el = document.getElementById(id);
    if (!el) return;
    el.select();
    document.execCommand('copy');
    if (btn) {
      var old = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = old; }, 1200);
    }
  }

  function init() {
    var go = document.getElementById('go');
    if (go) go.addEventListener('click', run);

    var loadSample = document.getElementById('loadSample');
    if (loadSample) {
      loadSample.addEventListener('click', function (e) {
        e.preventDefault();
        set('title', 'The 80/20 System for Content Repurposing');
        set('article', 'Content repurposing is the highest-leverage habit for busy marketers. Instead of writing ten original posts, you write one strong article and turn it into a week of platform-native content. The 80/20 rule applies: twenty percent of the work produces eighty percent of the reach. Use a repurposing tool to generate a LinkedIn post, an X thread, and a newsletter blurb from that one article. The key is to adapt the voice and length to each platform, not to copy-paste the same text everywhere. Stop publishing original content on every channel and start repurposing the best of it.');
        set('brand', 'RepurposerOne');
        run();
      });
    }

    var c = document.getElementById('copyLinkedin'); if (c) c.addEventListener('click', function () { copy('linkedin', c); });
    var cx = document.getElementById('copyX'); if (cx) cx.addEventListener('click', function () { copy('xThread', cx); });
    var cn = document.getElementById('copyNewsletter'); if (cn) cn.addEventListener('click', function () { copy('newsletter', cn); });

    if (document.getElementById('go') && text('article')) run();
  }

  if (typeof window !== 'undefined') { window.RepurposerOneInit = init; }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
