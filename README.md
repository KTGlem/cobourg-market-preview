# Cobourg Farmers' Market — Static Website Export

A self-contained static website. Every page is a single `.html` file with **all CSS,
JavaScript, fonts, and images inlined** — no build step, no external dependencies, no
internet connection required to render.

## Pages

| File                     | Page                          |
|--------------------------|-------------------------------|
| `index.html`             | Home                          |
| `this-week.html`         | This Week at the Market       |
| `vendors.html`           | Meet Our Vendors (directory)  |
| `why-local-matters.html` | Why Local Matters             |
| `events.html`            | Events                        |
| `become-a-vendor.html`   | Become a Vendor               |
| `about.html`             | About the Market              |
| `sponsors.html`          | Sponsors & Partners           |
| `contact.html`           | Contact                       |

`index.html` is the homepage. All navigation between pages uses relative links
(e.g. `vendors.html`), so the folder works as-is when served from any directory.

## Deploying

This is a plain static site. Upload the contents of this folder to any static host:

- **Netlify** — drag the folder onto https://app.netlify.com/drop
- **Vercel** — `vercel deploy` in this folder, or import via the dashboard
- **Cloudflare Pages / GitHub Pages** — push the folder to a repo and point the host at it
- **Any web server / S3 bucket** — copy the files to the web root

To preview locally, just open `index.html` in a browser, or run a simple server:

```
python3 -m http.server
```

## What's included / inlined

- Fonts (Young Serif + Hanken Grotesk) — embedded, so the site does not call Google Fonts
- All photography, logos, and the location map — embedded as data URIs
- All styles and scripts — embedded

Because everything is inlined, image-heavy pages (`vendors.html`, `index.html`) are a
few MB each. That is expected and is the tradeoff for true single-file portability.

## Interactive features (run client-side, no backend)

- Vendor directory search + category filters (`vendors.html`)
- "What's in season" season switcher (`this-week.html`)
- Events category filter (`events.html`)
- Vendor FAQ accordion (`become-a-vendor.html`)
- Newsletter and contact forms — these show a success state but **do not send data**.
  Wire them to a form handler (Netlify Forms, Formspree, an email endpoint, etc.) before
  going live.
- The Contact / This Week map links out to the market's Google Maps location.

## Assumptions & things to finalize before launch

- **Placeholder figures:** impact statistics (3×, 50 km, etc.), event dates, the history
  timeline, and vendor stall fees are illustrative placeholders — confirm real numbers.
- **Vendor details:** vendor towns and short descriptions were inferred from the supplied
  photos; give them an accuracy pass.
- **"In season" lists** are set for the current Ontario season and should be refreshed as
  the season changes.
- **Forms** need a backend/handler (see above).
- Hours, locations, and contact email reflect the information provided:
  Summer (May 2–Oct 31, Sat 8 AM–1 PM, Rotary Harbourfront Park) and
  Winter (Nov 7–Dec 19, Sat 9 AM–Noon, Market Square), cobourgfarmersmarket@gmail.com.
