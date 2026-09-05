/*
 * RepurposerOne — pure, deterministic, DOM-free logic.
 * Repurpose a single article into platform-native posts.
 * 100% client-side. No API keys. No data leaves the device.
 * This module must remain DOM-free so it can be unit-tested under Node.
 */
'use strict';

/**
 * Split an article into sentence-ish units.
 * @param {string} text
 * @returns {string[]} non-empty sentences, trimmed.
 */
function splitSentences(text) {
  if (!text) return [];
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; });
}

/**
 * Extract the most important sentence(s) via a simple scoring heuristic:
 * - score boosts for keywords in the title/headline
 * - score boosts for sentences that contain "how", "how to", numbers, imperatives
 * - score boosts for early positions (lead + conclusion)
 * @param {string} article
 * @param {string} title
 * @param {number} n number of key sentences to return
 * @returns {string[]}
 */
function pickKeySentences(article, title, n) {
  var sentences = splitSentences(article);
  if (sentences.length === 0) return [];
  var titleWords = new Set(
    (title || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; })
  );
  function score(s, idx) {
    var sc = 0;
    var lower = s.toLowerCase();
    var words = lower.replace(/[^a-z0-9 ]/g, ' ').split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      if (titleWords.has(words[i])) sc += 2;
    }
    if (/(how to|how do|guide|steps|system|strategy|learn|mistake|tips|why|what if)/.test(lower)) sc += 3;
    if (/\d+/.test(lower)) sc += 2;
    if (words.length > 4 && words.length < 34) sc += 1; // sentence-like length
    if (idx === 0 || idx === sentences.length - 1) sc += 1; // lead / conclusion
    return sc;
  }
  var indexed = sentences.map(function (s, idx) { return { s: s, idx: idx, sc: score(s, idx) }; });
  indexed.sort(function (a, b) { return (b.sc - a.sc) || (a.idx - b.idx); });
  return indexed.slice(0, Math.max(1, n)).map(function (i) { return i.s; });
}

/**
 * Compress a sentence to a target max length for a hook.
 * @param {string} sentence
 * @param {number} maxLen
 * @returns {string}
 */
function clip(sentence, maxLen) {
  if (!sentence) return '';
  var s = sentence.trim();
  if (s.length <= maxLen) return s;
  var cut = s.slice(0, maxLen);
  // avoid cutting mid-word
  var lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 20) cut = cut.slice(0, lastSpace);
  return cut.trim().replace(/[,;:.\s]+$/, '') + '\u2026';
}

/**
 * Build platform variants from the input.
 * @param {Object} input { title, article, brand }
 * @returns {Object} { linkedin, x, newsletter, meta }
 */
function repurpose(input) {
  var title = (input && input.title) || '';
  var article = (input && input.article) || '';
  var brand = (input && input.brand) || '';

  var key = pickKeySentences(article, title, 3);
  var hook = key[0] || title;
  var body = key.slice(1);

  // LinkedIn post (1250-char soft cap)
  var linkedin = '';
  linkedin += clip(hook, 190) + '\n\n';
  if (body.length) linkedin += body.slice(0, 1).map(function (s) { return s; }).join(' ') + '\n\n';
  linkedin += 'Here\u2019s the thing:\n\n' + clip(body[1] || key[1] || '', 220) + '\n\n';
  linkedin += 'A single article became these platform-native posts. That\u2019s the 80/20 content system in action.';
  if (brand) linkedin += '\n-- ' + brand;

  // X thread (each post ~ up to 280, we generate up to 4 tweets)
  var xThread = [];
  xThread.push(clip(hook, 260));
  var bodyCopy = body.slice(0, 3);
  for (var i = 0; i < bodyCopy.length; i++) {
    xThread.push(clip(bodyCopy[i], 250));
  }
  if (xThread.length < 3) xThread.push(clip('Repurpose, don\u2019t rewrite. One article \u2192 a week of content.', 200));

  // Newsletter blurb
  var newsletter = '';
  newsletter += clip(hook, 200) + '\n\n';
  newsletter += key.slice(0, 2).join(' ') + '\n\n';
  newsletter += 'Read the full breakdown in the tool below \u2014 paste any article and get LinkedIn, X and newsletter copy instantly.';
  if (brand) newsletter += '\n\u2014 ' + brand;

  var meta = {
    sentences: splitSentences(article).length,
    title: title,
    brand: brand,
    key_count: key.length,
    hooks: key
  };

  return {
    linkedin: linkedin.trim(),
    xThread: xThread,
    newsletter: newsletter.trim(),
    meta: meta
  };
}

// CommonJS export for Node unit tests (works in browser too via guard).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { splitSentences: splitSentences, pickKeySentences: pickKeySentences, clip: clip, repurpose: repurpose };
}
// Browser global export (guarded so Node test.js still works).
if (typeof window !== 'undefined') {
  window.Repurposer = { splitSentences: splitSentences, pickKeySentences: pickKeySentences, clip: clip, repurpose: repurpose };
}
// CommonJS export for Node unit tests (works in browser too via guard).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { splitSentences: splitSentences, pickKeySentences: pickKeySentences, clip: clip, repurpose: repurpose };
}
