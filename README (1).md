# Tanveer Naidu — Photography

Personal photography portfolio. Built as a single-page HTML site with drag-to-explore galleries, a scene index with hover previews, a full-screen lightbox, and a Tweaks panel for live customisation.

---

## Live site

Deployed via [Vercel](https://vercel.com).

---

## Project structure

```
├── index.html          # Main page
├── styles.css          # All styles + design tokens
├── app.js              # Vanilla JS — nav, galleries, lightbox, cursor, preloader
├── image-slot.js       # Drag-and-drop image placeholder web component
├── tweaks-panel.jsx    # React Tweaks panel (Babel, loaded at runtime)
│
├── hero.png            # Hero section photo
│
├── work-*.jpg          # Frames & Moments gallery
├── ind-*.jpg           # India gallery
├── nat-*.jpg           # Nature gallery
├── sa-*.jpg            # South Africa gallery
└── str-*.jpg           # Street gallery
```

---

## Running locally

No build step needed. Open `index.html` directly in a browser, or use any static file server:

```bash
# Python
python3 -m http.server 8000

# Node (npx)
npx serve .
```

Then visit `http://localhost:8000`.

---

## Deploying to Vercel

### First time

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the GitHub repository.
4. Leave all settings at their defaults — Vercel auto-detects a static site.
5. Click **Deploy**.

Your site will be live at `https://<your-project>.vercel.app`.

### Updating the site

```bash
git add .
git commit -m "Update photos / content"
git push
```

Vercel auto-deploys on every push to `main`.

---

## Replacing photos

All photos are standard `<img>` tags inside the gallery frames. To swap one:

1. Add your new file to the project root.
2. Open `index.html` and find the frame — search for the current filename (e.g. `work-seagull.jpg`).
3. Replace the `src` value with your new filename.
4. Adjust `object-position` on the same `<img>` if the crop needs tweaking.

---

## Tweaks panel

Click the **Tweaks** button in the toolbar (top-right of the preview) to open the live controls:

| Tweak | Options |
|---|---|
| Base | Light / Dark |
| Accent colour | 4 palette swatches |
| Display font | Archivo / Anton / Space Grotesk |
| Film grain | On / Off |
| Marquee speed | 12s – 60s |
| Studio name | Free text |

Settings persist in `localStorage`.

---

## Sections

| Section | ID |
|---|---|
| Hero | `#hero` |
| Frames & Moments | `#work` |
| Scenes & Series index | `#index` |
| South Africa | `#south-africa` |
| India | `#india` |
| Nature | `#nature` |
| Street | `#street` |
| Stats | — |
| Feature quote | — |
| Contact | `#contact` |

---

## Tech

- Vanilla HTML / CSS / JS — no framework, no build step
- React 18 + Babel standalone — Tweaks panel only
- Google Fonts: Archivo, Anton, Space Mono, Space Grotesk
- Custom drag-and-drop `<image-slot>` web component
