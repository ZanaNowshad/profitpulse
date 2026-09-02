"""ProfitPulse browser-integration verification via Playwright.

Loads the real page, fills both forms, submits, and reads back the rendered
KPI output to prove the DOM glue (index.html + app.js + dom.js) works end to end.
"""
import pathlib
import sys
# Windows console may default to cp1252; force UTF-8 for emoji in output.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).parent.resolve()
URL = (ROOT / "index.html").as_uri()

def num(text):
    # "$1,234.56" / "123.33x" / "∞" -> float or None
    t = text.strip()
    if t in ("∞", ""):
        return None
    return float(t.replace("$", "").replace(",", "").replace("x", "").replace("%", ""))

def main():
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(URL)
        page.wait_for_load_state("networkidle")

        # ---- Unit economics: price 49, var 10, cac 30, fixed 1200, 100 cust, 5% churn
        page.fill("#price", "49")
        page.fill("#varcost", "10")
        page.fill("#cac", "30")
        page.fill("#fixed", "1200")
        page.fill("#customers", "100")
        page.fill("#churn", "5")
        page.click("#ue-form button")
        ue_text = page.inner_text("#ue-out")
        ue_map = {}
        for line in ue_text.splitlines():
            if "\n" not in line:  # each kpi is one line in DOM text
                pass
        # instead parse via DOM elements
        ue_kpis = page.query_selector_all("#ue-out .kpi")
        ue_map = {}
        for k in ue_kpis:
            key = k.query_selector(".k").inner_text()
            val = k.query_selector(".v").inner_text()
            ue_map[key] = val
        verdict = page.inner_text("#ue-out .verdict")
        results.append(("UE gross margin rate", ue_map.get("Gross margin rate", ""), "79.59%"))
        results.append(("UE contribution/unit", ue_map.get("Contribution / unit (after CAC)", ""), "$9"))
        results.append(("UE monthly contribution", ue_map.get("Monthly contribution", ""), "$2700"))
        results.append(("UE breakeven customers", ue_map.get("Breakeven customers", ""), "133.33"))
        results.append(("UE LTV", ue_map.get("LTV (lifetime value)", ""), "$780"))
        results.append(("UE LTV:CAC", ue_map.get("LTV : CAC", ""), "26x"))
        results.append(("UE verdict contains Healthy", verdict, "Healthy"))

        # ---- Price quote: cost 20, margin 70%, qty 2, disc 10, tax 8
        page.fill("#pcost", "20")
        page.fill("#pmargin", "70")
        page.fill("#pqty", "2")
        page.fill("#pdiscount", "10")
        page.fill("#ptax", "8")
        page.click("#pq-form button")
        pg_kpis = page.query_selector_all("#pq-out .kpi")
        pg_map = {}
        for k in pg_kpis:
            pg_map[k.query_selector(".k").inner_text()] = k.query_selector(".v").inner_text()
        results.append(("PQ total", pg_map.get("Total", ""), "$129.6"))
        results.append(("PQ unit price", pg_map.get("Target unit price", ""), "$66.67"))
        results.append(("PQ realized margin", pg_map.get("Realized margin", ""), "66.67%"))

        # Title + heading sanity
        title = page.title()
        h1 = page.query_selector("h1").inner_text()
        results.append(("Page <title>", title, "ProfitPulse — Unit Economics & Pricing Micro-Tool"))
        results.append(("Hero H1", h1, "Know your numbers before you launch."))

        browser.close()

    print("=== BROWSER INTEGRATION CHECK ===")
    allok = True
    for name, got, want in results:
        ok = want in got
        allok = allok and ok
        print(f"{'PASS' if ok else 'FAIL'}  {name}  got='{got}' want~'{want}'")
    print("\nJS errors on page:", errors if errors else "none")
    if errors:
        allok = False
    print("\nOVERALL:", "ALL PASS" if allok else "SOME FAILED")
    return 0 if allok else 1

if __name__ == "__main__":
    import sys
    sys.exit(main())
