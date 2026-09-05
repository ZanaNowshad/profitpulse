"""Verify LIVE RepurposerOne page: gating message present, Pro button renders, PPFunnel active, no JS errors."""
import pathlib, sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent.resolve()
url = "https://zananowshad.github.io/profitpulse/repurposer/"
ok = False
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
    page.goto(url)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(6000)

    start_free = bool(page.query_selector("#startFree"))
    pro = page.query_selector("#paypal-pro-button")
    pro_inner = pro.inner_html() if pro else ""
    pro_rendered = bool(pro and ("zoid" in pro_inner or "paypal" in pro_inner.lower() or "iframe" in pro_inner))
    events = [e.get("event") for e in (page.evaluate("() => window.PPFunnel ? window.PPFunnel.events() : []") or [])]
    counts = (page.evaluate("() => document.getElementById('counts') ? document.getElementById('counts').textContent : ''") or "")
    print("LIVE counts text:", repr(counts))
    print("Pro button rendered:", pro_rendered)
    print("startFree present:", start_free)
    print("funnel events on load:", events)
    print("JS errors:", errors if errors else "none")

    low = counts.lower()
    ok = (errors == []) and start_free and pro_rendered and ("this month" in low) and ("repurposes" in low) and ("rp_page_view" in events)
    browser.close()
print("OVERALL:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
