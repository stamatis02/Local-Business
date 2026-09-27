# Stamatis Psaros — Portfolio

Plain HTML, CSS and JavaScript. No build step, no npm. Libraries load from CDNs:
GSAP 3.12.5 + ScrollTrigger (cdnjs), Lenis 1.1.13 (jsDelivr), Archivo variable font (Google Fonts).

```
index.html      all content (text, projects, process steps, contact details)
css/style.css   design tokens at the top, then one numbered section per part of the page
js/main.js      CONFIG at the top, then one numbered section per feature
```

## Go live in two minutes (Netlify)

1. Open https://app.netlify.com/drop and drag this whole folder onto the page.
2. Done. The contact form works automatically on Netlify (submissions appear under
   Site → Forms; turn on email notifications there).

Any other static host (GitHub Pages, Vercel, cPanel) also works. On hosts without
form handling, the form falls back to opening the visitor's email app with the
message pre-filled, addressed to the email in `CONFIG` in `js/main.js`.

## What to edit (search index.html for these markers)

- `PROJECT:` — one block per project. Replace `href="#"` with the live URL.
  The AURA Lounge description is placeholder copy.
  To use a real screenshot instead of the coded mockup, replace the contents of
  `.project__inner` with `<img src="assets/your-shot.jpg" alt="...">` (1600×1000 works well).
- `STEP:` — the four process steps (title, text, chips, timeline).
- `CONTACT DETAILS` — email, phone, social links (the social links are `#` for now).
- `og:image` in the `<head>` — add a 1200×630 screenshot for link previews.

## Switches (top of js/main.js)

```js
const CONFIG = {
  email: 'stamatispsoras@gmail.com',
  timeZone: 'Europe/Athens',
  showLoader: true,     // intro counter
  smoothScroll: true,   // Lenis
  customCursor: true,   // desktop only
};
```

Colours and spacing live in section 1 of `css/style.css` (`--bg`, `--ink`, `--accent`, …).

Visitors who set "reduce motion" on their device, or if the CDN libraries fail to
load, get the same site with every animation switched off — nothing breaks.

Pattern: the "xysta" bands are drawn from the sgraffito facades of Pyrgi, Chios.
