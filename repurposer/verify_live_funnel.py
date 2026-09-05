"""LIVE RepurposerOne full funnel-gate interaction test against GitHub Pages deploy."""
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
    ctx = browser.new_context()
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    page.goto(url)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(6000)

    # Run sample (uses 1 credit), then 2 more via #go to reach 3/3.
    page.click("#loadSample")
    page.wait_for_timeout(600)
    for _ in range(2):
        page.click("#go")
        page.wait_for_timeout(600)
    free3 = page.evaluate("() => localStorage.getItem('rp_free_use')")
    counts3 = page.evaluate("() => document.getElementById('counts').textContent")
    print("After 3 runs: free_use=", free3, "| counts=", repr(counts3))

    # 4th run should be gated: no new credit, output preserved, upgrade prompt shown.
    before = page.evaluate("() => document.getElementById('linkedin').value")
    page.click("#go"); page.wait_for_timeout(600)
    after = page.evaluate("() => document.getElementById('linkedin').value")
    free4 = page.evaluate("() => localStorage.getItem('rp_free_use')")
    counts4 = page.evaluate("() => document.getElementById('counts').textContent")
    events = [e.get("event") for e in (page.evaluate("() => window.PPFunnel ? window.PPFunnel.events() : []") or [])]
    print("4th run: output preserved =", before == after, "| free_use=", free4, "| counts=", repr(counts4))
    print("events:", events)
    print("JS errors:", errors if errors else "none")

    gate_hit = "rp_free_gate_hit" in events
    reached = "rp_reached_free_limit" in events
    ok = (errors == []) and (before == after) and (free4 == free3) and ("Upgrade to Pro" in counts4) and gate_hit and reached
    browser.close()
print("OVERALL:", "PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
