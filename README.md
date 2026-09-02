# ProfitPulse — Unit Economics & Pricing Micro-Tool

A **freemium SaaS micro-tool** in the **Niche SaaS Micro-Tools** niche (the top-scoring
opportunity from the WinAgent Income Orchestrator, score 59).

It gives solopreneurs and SaaS builders the unit-economics and price-point math they
need to make a product viable: gross margin, contribution-after-CAC, breakeven, LTV,
LTV:CAC, and target-margin unit pricing.

- **100% client-side** — runs in the browser, deterministic, offline, no API keys, no data
  leaves the device.
- **Zero backend dependency** — deployable to any static host (Netlify, Vercel, GitHub Pages, S3).

## Files

| File | Purpose |
|------|---------|
| `index.html`  | Landing page + calculator UI + 3-tier pricing (Free / Pro $9 / Team $29). |
| `app.js`      | Pure calculator functions (deterministic, DOM-free — independently testable). |
| `dom.js`      | DOM glue: binds the forms, renders KPI cards. |
| `style.css`   | Dark SaaS theme. |
| `test.js`     | Node unit tests (23 assertions) for the pure math. |
| `verify_browser.py` | Playwright end-to-end check of the real page (12 checks, 0 JS errors). |
| `shot.py`     | Screenshot capture (visual render confirmation). |

## Verification results (all passing)

- **Node unit tests:** 23/23 pass — gross margin 39, margin rate 79.59%, contribution 9,
  monthly contribution 2700, breakeven 133.33, lifetime 20, LTV 780, LTV:CAC 26x; price
  quote unit 66.667, subtotal 133.333, discount 13.333, tax 9.6, total 129.6, realized margin 66.67%.
- **Playwright browser integration:** 12/12 pass across both forms + title/H1 + verdict; **0 JS console errors**.
- **Cross-tool verification:** matches the orchestrator `price_quote` economics tool
  (unit 66.667 / subtotal 133.333 / discount 13.333 / tax 9.6 / total 129.6 / realized margin 66.67%).
- **Visual render:** confirmed via full-page + calculator screenshots / OCR.

## Usage

Open `index.html` in any modern browser (or serve statically). Enter your numbers and press **Compute**.

```
node test.js            # unit math
python verify_browser.py # end-to-end browser check
```

## Monetization

- **Free** — acquisition, unlimited local use.
- **Pro $9/mo** — scenario comparison, CSV/PDF export, saved models & templates.
- **Team $29/mo** — unlimited seats, priority support.

Funnel: targeted SEO content for the micro-tools niche → tool → Pro upgrade.
Acquisition channels (per orchestrator): SEO, ProductHunt, X/Twitter, Email.

> Note: the Pro/Team tiers are demo wiring in this build; connect a payment provider
> (Stripe/Paddle) and hosting to go live.
