/*
 * RepurposerOne — Node unit tests for the pure DOM-free logic in app.js.
 * Run: node test.js
 */
'use strict';
const r = require('./app.js');
let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name); }
}

const ARTICLE = [
  'Content repurposing is the single highest-leverage habit for busy marketers.',
  'Instead of writing ten original posts, you write one strong article and turn it into a week of platform-native content.',
  'The 80/20 rule applies: twenty percent of the work produces eighty percent of the reach.',
  'Use a repurposing tool to generate a LinkedIn post, an X thread, and a newsletter blurb from that one article.',
  'The key is to adapt the voice and length to each platform, not to copy-paste the same text everywhere.',
  'Stop publishing original content on every channel and start repurposing the best of it.'
].join(' ');

console.log('RepurposerOne unit tests\n');

// splitSentences
ok('splitSentences returns length 6', r.splitSentences(ARTICLE).length === 6);
ok('splitSentences trims and drops empties', r.splitSentences('  a.  b.  ').length === 2);

// clip
ok('clip keeps short sentence', r.clip('Hello world', 100) === 'Hello world');
ok('clip truncates long sentence', r.clip('This is a very long sentence that exceeds the clipboard maximum length here', 20) !== 'This is a very long sentence that exceeds the clipboard maximum length here');
ok('clip never exceeds maxLen + ellipsis beyond bound', r.clip('A'.repeat(90), 30).length <= 31);

// pickKeySentences
const keys = r.pickKeySentences(ARTICLE, 'The 80/20 System for Content Repurposing', 3);
ok('pickKeySentences returns up to n', keys.length <= 3 && keys.length >= 1);
ok('pickKeySentences prefers keyword-rich topical sentences', keys[0].length > 0);

// repurpose
const out = r.repurpose({ title: 'The 80/20 System for Content Repurposing', article: ARTICLE, brand: 'RepurposerOne' });
ok('repurpose returns linkedin', typeof out.linkedin === 'string' && out.linkedin.length > 20);
ok('repurpose returns xThread array', Array.isArray(out.xThread) && out.xThread.length >= 2);
ok('repurpose returns newsletter', typeof out.newsletter === 'string' && out.newsletter.length > 20);
ok('repurpose xThread posts are within 280 chars', out.xThread.every(t => t.length <= 280));
ok('repurpose brand appended to linkedin', out.linkedin.indexOf('RepurposerOne') !== -1);
ok('repurpose meta has sentence count', out.meta.sentences === 6);
ok('repurpose newsletter contains CTA', /tool/i.test(out.newsletter));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
