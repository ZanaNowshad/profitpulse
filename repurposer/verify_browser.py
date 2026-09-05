"""
RepurposerOne — Playwright end-to-end verification of the real page.
Run: python verify_browser.py
Loads the local index.html, loads the sample, clicks Generate, and checks outputs.
"""
import sys, pathlib
from playwright.sync_api import sync_playwright

p = pathlib.Path(__file__).parent / 'index.html'
url = p.as_uri()
checks = []
def ok(name, cond):
    checks.append((name, bool(cond)))
    print(('  PASS  ' if cond else '  FAIL  ') + name)

with sync_playwright() as pw:
    browser = pw.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url)
    page.wait_for_timeout(500)

    # Page title and meta
    ok('title contains content repurposing', 'content repurposing' in page.title().lower())
    ok('H1 present', page.locator('h1').count() == 1)

    # Load sample -> generate
    page.locator('#loadSample').click()
    page.wait_for_timeout(300)
    page.locator('#go').click()
    page.wait_for_timeout(300)

    li = page.locator('#linkedin').input_value()
    xt = page.locator('#xThread').input_value()
    nl = page.locator('#newsletter').input_value()
    cnt = page.locator('#counts').inner_text()

    ok('LinkedIn output non-empty', len(li.strip()) > 20)
    ok('X thread output non-empty', len(xt.strip()) > 20)
    ok('Newsletter output non-empty', len(nl.strip()) > 20)
    ok('counts shows sentence count', 'Input sentences:' in cnt)
    ok('linkedin mentions RepurposerOne', 'RepurposerOne' in li)

    # Direct repurpose via page object (window.Repurposer loaded from app.js)
    result = page.evaluate("() => { const o = window.Repurposer.repurpose({title:'T', article:'A. B. C. D.', brand:'X'}); return o.xThread.length; }")
    ok('app.js accessible in browser (xThread length)', isinstance(result, int) and result >= 2)

    # Screenshot
    page.screenshot(path=str(p.parent / 'repurposer_live.png'), full_page=True)
    ok('screenshot saved', (p.parent / 'repurposer_live.png').exists())

    ok('0 JS errors', len(errors) == 0)
    if errors:
        print('  Console errors:', errors)
    browser.close()

passed = sum(1 for _, c in checks if c)
failed = len(checks) - passed
print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
