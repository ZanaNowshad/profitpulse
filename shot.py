import sys, traceback, os
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass
from playwright.sync_api import sync_playwright
from pathlib import Path
root = Path(r'C:\Users\super\micro-tools')
url = (root / 'index.html').resolve().as_uri()
print('url:', url)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1280, 'height': 900})
        pg.goto(url)
        pg.wait_for_load_state('networkidle')
        full = str(root / 'screenshot_full.png')
        calc = str(root / 'screenshot_calc.png')
        pg.screenshot(path=full, full_page=True)
        pg.screenshot(path=calc)
        b.close()
    print('full exists:', os.path.exists(full), os.path.getsize(full))
    print('calc exists:', os.path.exists(calc), os.path.getsize(calc))
except Exception as e:
    traceback.print_exc()
    print('ERROR', e)
