"""Verify RepurposerOne PayPal Pro button renders in a real browser."""
import pathlib, sys, http.server, threading, functools
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent.resolve()

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, httpd.server_address[1]

def main():
    httpd, port = serve()
    url = f"http://127.0.0.1:{port}/index.html"
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

        content = page.content().lower()
        has_rp_config = "paypal-config.js" in content
        has_rp_sub = "paypal-subscribe.js" in content
        has_sdk = "sdk/js?client-id" in content or "sdk/js" in content
        pro = page.query_selector("#paypal-pro-button")
        pro_rendered = bool(pro and ("zoid" in pro.inner_html() or "paypal" in pro.inner_html().lower() or "iframe" in pro.inner_html()))
        cfg = page.evaluate("() => window.RP__PAYPAL && window.RP__PAYPAL.MODE")
        print("paypal-config.js loaded:", has_rp_config)
        print("paypal-subscribe.js loaded:", has_rp_sub)
        print("PayPal SDK injected:", has_sdk)
        print("Pro button rendered:", pro_rendered)
        print("MODE:", cfg)
        print("JS errors:", errors if errors else "none")

        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(600)
        page.screenshot(path=str(ROOT / "_paypal.png"), full_page=True)
        print("screenshot saved")
        browser.close()

        ok = has_rp_config and has_rp_sub and (cfg == 'sandbox') and (errors == [])
    httpd.shutdown()
    print("\nOVERALL:", "PASS" if ok else "FAIL")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
