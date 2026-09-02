"""Final comprehensive verification of the PayPal-only ProfitPulse site."""
import pathlib, sys, http.server, threading, functools
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent.resolve()
SHOT = ROOT / "_final_paypal.png"

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, httpd.server_address[1]

def main():
    httpd, port = serve()
    url = f"http://127.0.0.1:{port}/index.html"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
        page.on("console", lambda m: errors.append("console: " + m.text) if m.type == "error" else None)
        page.goto(url)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(6000)

        pro = page.query_selector("#paypal-pro-button")
        team = page.query_selector("#paypal-team-button")
        pro_ok = pro and "zoid-paypal-buttons" in pro.inner_html()
        team_ok = team and "zoid-paypal-buttons" in team.inner_html()
        content = page.content().lower()
        has_pp_script = "paypal-subscribe.js" in content
        has_pp_config = "paypal-config.js" in content
        has_stripe = "stripe" in content
        has_paddle = "paddle" in content
        has_mailto = "mailto" in content
        # config sanity
        cfg = page.evaluate("() => window.ppPayPal && window.ppPayPal.config")
        print("Pro button rendered:", pro_ok)
        print("Team button rendered:", team_ok)
        print("paypal-subscribe.js loaded:", has_pp_script)
        print("paypal-config.js loaded:", has_pp_config)
        print("Contains 'stripe':", has_stripe, "| 'paddle':", has_paddle, "| 'mailto':", has_mailto)
        print("Config:", cfg)
        print("JS errors:", errors if errors else "none")

        # screenshot pricing section
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(800)
        page.screenshot(path=str(SHOT), full_page=True)
        print("Screenshot saved:", SHOT)

        browser.close()

    httpd.shutdown()
    ok = pro_ok and team_ok and has_pp_script and has_pp_config and not has_stripe and not has_paddle and not has_mailto and (errors == [])
    print("\nOVERALL:", "PASS" if ok else "FAIL")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
