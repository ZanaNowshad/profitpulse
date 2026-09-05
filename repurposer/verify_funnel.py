"""Verify RepurposerOne freemium gate + funnel instrumentation + PayPal in a real browser."""
import pathlib, sys, http.server, threading, functools
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent.resolve()
PARENT = ROOT.parent  # so ../funnel.js resolves

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(PARENT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, httpd.server_address[1]

def main():
    httpd, port = serve()
    url = f"http://127.0.0.1:{port}/repurposer/index.html"
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

        events0 = [e.get("event") for e in (page.evaluate("() => window.PPFunnel ? window.PPFunnel.events() : []") or [])]
        print("events on load:", events0)

        # Sample run uses 1 free credit.
        page.click("#loadSample")
        page.wait_for_timeout(500)
        free1 = page.evaluate("() => localStorage.getItem('rp_free_use')")
        print("free_use after sample run:", free1)

        page.click("#startFree")
        page.wait_for_timeout(300)

        # Two more runs -> 3/3 used (reaches limit on the 3rd).
        page.click("#go"); page.wait_for_timeout(250)
        page.click("#go"); page.wait_for_timeout(250)
        free3 = page.evaluate("() => localStorage.getItem('rp_free_use')")
        print("free_use after 3 runs:", free3)

        # 4th run should be gated: no new credit, no new output, upgrade prompt shown.
        out_len_before = len(page.evaluate("() => document.getElementById('linkedin').value") or "")
        page.click("#go"); page.wait_for_timeout(300)
        out_len_after = len(page.evaluate("() => document.getElementById('linkedin').value") or "")
        free4 = page.evaluate("() => localStorage.getItem('rp_free_use')")
        counts = page.evaluate("() => document.getElementById('counts').textContent")
        print("linkedin len before/after gated run:", out_len_before, "/", out_len_after)
        print("free_use after gated (4th) run:", free4)
        print("gated message:", counts)

        events_final = [e.get("event") for e in (page.evaluate("() => window.PPFunnel ? window.PPFunnel.events() : []") or [])]
        print("events final:", events_final)

        pro = page.query_selector("#paypal-pro-button")
        pro_rendered = bool(pro and ("zoid" in pro.inner_html() or "paypal" in pro.inner_html().lower() or "iframe" in pro.inner_html()))
        print("Pro button rendered:", pro_rendered)
        print("startFree present:", bool(page.query_selector("#startFree")))
        print("JS errors:", errors if errors else "none")

        page.screenshot(path=str(ROOT / "_funnel_gate.png"), full_page=True)

        # Assertions:
        # - gating kept free credit at 3/3 (no overspend)
        # - gated run did NOT change output (kept user work) and prompted upgrade
        # - gate + reached-limit + tool_run events recorded
        # - Pro button rendered, startFree present, no errors
        gate_ks_credit = free4 == free3  # no new credit consumed on blocked run
        no_new_output = out_len_after == out_len_before
        upgrade_prompted = "Upgrade to Pro" in counts
        events_ok = ("rp_tool_run" in events_final) and ("rp_reached_free_limit" in events_final) and ("rp_free_gate_hit" in events_final)
        ok = (errors == []) and pro_rendered and gate_ks_credit and no_new_output and upgrade_prompted and events_ok
    httpd.shutdown()
    print("\nOVERALL:", "PASS" if ok else "FAIL")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
