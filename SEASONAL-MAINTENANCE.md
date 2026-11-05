# Seasonal maintenance

Market dates, hours and location live in one file: **`season-config.js`**. All nine
pages read it when they load, so a change there appears site-wide. Only edit the
`SETTINGS` block at the top. To check your work, run `node tests/season-config.test.js`.

The file is plain JavaScript. A missing comma breaks it, and the site then shows its
neutral fallback (see "If something goes wrong"), so preview locally before deploying.

## How the site decides what to show

Every page uses today's date in Cobourg (`America/Toronto`), not the visitor's time zone.

| When | What visitors see |
|---|---|
| Before an approved season starts | Upcoming: full details, "Winter Market opens Saturday, November 7" |
| During an approved season | Full details, with "Open this Saturday", "Market day", or "Final Winter Market" as appropriate |
| After the last market day, with nothing else approved | Off-season: "Between seasons", no dates, hours or location beyond "Downtown Cobourg, ON" |

**After a season ends** the site moves to off-season by itself on the next day. It does
not go back to old summer details or show 2027 information. Newsletter signup, vendors
and general market information stay in place. The off-season wording is in
`SETTINGS.offSeason`.

## Change dates, hours or location

Edit the season's entry in `SETTINGS.seasons`:

- `startDate` / `endDate`: use `YYYY-MM-DD`.
- `hours`: `opens` and `closes` feed the This Week schedule; `range` is the short form.
- `location`: `name` and `detail` (cards and footers), `description` (the full wording used
  everywhere else) and the map fields.

Date ranges such as "November 7 – December 19, 2026" are generated from `startDate` and
`endDate`, so they never need separate editing.

Extending a season means changing its `endDate`. Nothing else can extend one.

## Approve a future season

The `outdoor-2027` entry is deliberately empty and has `approved: false`. To publish it:

1. Fill in `startDate`, `endDate`, `hours`, `location`, `offerings` and `presentation`.
   Copy the shape of `winter-2026`.
2. Set `approved: true`.

A season stays unpublished unless it is approved **and** complete. Once approved, the
site announces it straight away as upcoming, then runs it automatically.

Before approving a summer season, also review:

- `presentation.showProgramming`: set to `true` to bring back the Regular Programming
  section on `events.html` and the four cards on the homepage. That text is written into
  those pages and still describes summer 2026, including yoga by the Oval and live music.
  Update it before turning it on.
- `notice`: replace or remove "We've moved for winter!".
- `location.mapUrl`: this link opens the market's Google listing, and the listing's pin
  decides where visitors go. It was in the winter lot on 2026-11-05. Before reusing the
  link, open it and check where the pin is now. Moving the listing also affects the link.
- The earlier Spring, Summer and Fall "In Season" lists were removed from the pages. They
  are in git history at commit `b31bd5e` if you want them for `offerings`.

## Manual override

For exceptional circumstances, such as a cancelled market day. In `SETTINGS.override`:

```js
override: { enabled: true, mode: 'closed', startDate: '2026-11-29', endDate: '2026-12-05',
            message: 'No market on Saturday, December 5.' }
```

- `mode: 'notice'` shows the message and keeps the normal schedule.
- `mode: 'closed'` also replaces the open status and hides the forecast.
- `startDate` and `endDate` are required. The override stops by itself after `endDate`.
- An override can never open, reopen or extend a season.

Set `enabled: false` when it is no longer needed.

## Weekly newsletter link

```js
weeklyNewsletter: { url: 'https://…', marketDate: '2026-11-14' }
```

Use a verified `https://` address for that week's newsletter. `marketDate` must be the
Saturday it covers. The This Week page then shows "See the vendor lineup for Saturday,
November 14". From the following day, or if either field is missing or wrong, the page
goes back to the newsletter signup prompt. Leave `url` empty until there is a real link.
This is a manual weekly edit plus a deploy. There is no MailerLite integration.

## Events

Upcoming events are listed in the `all` array in the logic script inside `events.html`.
Each needs a `date` in `YYYY-MM-DD` form. Events remove themselves once their date has
passed, and the "More than a market" panel appears when none are left. Its body text is
`eventsMessage` in `season-config.js`.

## What still needs manual updates

`season-config.js` does not control:

- the event list, and the programming text mentioned above
- the static marketing copy on the Home, Become a Vendor, Sponsors, About and Why Local
  pages. "30+" figures are worded as outdoor-season claims, and Saturday claims say
  "during market season". Check both if the market's pattern changes
- vendor profiles
- the copyright year in the footers

## Limitations of the static site

- Each page stores its visible content as an escaped JSON string inside the `.html`
  file, so page text can't be changed with a simple edit. Decode the
  `__bundler/template` block, edit it, and re-encode it exactly: JSON with non-ASCII
  characters left as they are and every `/` written as `\/`.
- Season switching happens in the visitor's browser. Page titles and meta descriptions
  are static, so they are written to be true in any season.
- Config changes reach visitors within about 10 minutes of deploying. The host sends no
  `Cache-Control` header, so each page requests `season-config.js?v=<time>`, and the value
  changes every 10 minutes. Nothing needs updating when the config changes. HTML pages
  need a `Cache-Control: no-cache` header from the server to get the same protection. That
  header lives in Coolify's Custom Nginx Configuration, not in this repository. Check it
  with `curl -I https://www.cobourgfarmersmarket.org/`. Without it, browsers may reuse a
  cached page for days, and edits inside the pages can appear late.
- The site has no structured data (JSON-LD), so there is nothing to update there.
- The old Contact page map image is still stored inside `contact.html` but is no longer
  shown, because its pin marks the summer location.

## Public files

The host serves the whole repository root, so this file, `README.md` and `tests/` are
public unless excluded from the deployment. Never put private information in them.

## If something goes wrong

Each page defines a neutral fallback before loading `season-config.js`. If the file is
missing or broken, pages still load, hide all seasonal details, and point visitors to
Facebook and Instagram. Fix the file and redeploy.

## Testing other dates

`node tests/season-config.test.js` covers the date logic. It passes dates in directly, so
there is no test mode or URL switch on the live site. To preview a date in a real
browser, use your browser automation tool to replace `Date` before the page loads. Never
add a date override to the site itself.

## Deployment note

Deploying these changes makes the existing disaster-recovery ZIP out of date. Create an
updated recovery backup after the production deployment.
