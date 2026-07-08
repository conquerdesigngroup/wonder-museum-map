# Wonder Museum of Science — Interactive 3D Map

An interactive, low-poly 3D campus map for a science museum. Visitors drive a little
explorer avatar around the grounds, walk into six exhibit halls, step inside them to
inspect artifacts, and toggle day/night and weather — all in a single web page with
**no build step and no bundler**.

Built with [Three.js](https://threejs.org/) (r128, loaded from CDN). Everything else —
the audio, the models, the particles — is generated procedurally in code, so there are
**zero binary assets** to host.

![status](https://img.shields.io/badge/status-prototype-blue)

## Features

- **Character controller** — WASD / arrow keys, run, hop (with squash-and-stretch), and a virtual joystick on touch
- **Point-and-go** — double-click / double-tap the ground, or tap the minimap, to auto-run there
- **Click a building** to run to it and open its info card
- **Six exhibit halls** with unique procedural models, ambient animations, and written content
- **Interior rooms** — walk through a doorway to step inside a hall and inspect 3 artifacts each
- **Exhibit detail pages** — gallery, hours, event schedule, highlights
- **Exhibit drawer** (☰) — accessible list of all halls with "Go" buttons
- **Living minimap**, breadcrumb footprints, and a follow camera with zoom (scroll / pinch)
- **Day / night cycle** with stars, a moon, and lights that switch on
- **Weather** — clear / rain / snow, with ground splashes and lingering snow prints
- **Reactive NPCs** — ducks that scatter, a robot greeter that tracks you
- **Avatar customizer** (🎨), confetti on completing the museum, promo blimp
- **Synthesized sound** (Web Audio) and **haptics** (`navigator.vibrate`) on mobile
- **Cinematic intro flyover** and an **idle attract mode** for kiosk use
- **Deep links** — `#dino` (or any hall id) opens that hall's detail page and runs you there; the URL hash stays shareable as you browse
- **`prefers-reduced-motion` support** — skips the flyover, attract mode, confetti, and UI animations

## Project structure

```
.
├── index.html          # markup + HUD, loads Three.js (CDN), styles.css, main.js
├── styles.css          # all UI styling
├── main.js             # the entire 3D app + game logic
├── package.json        # dev-server convenience scripts only (no runtime deps)
├── .github/workflows/
│   └── deploy.yml       # auto-deploy to GitHub Pages on push to main
├── LICENSE
└── README.md
```

## Run locally

No build step. Because `main.js` and `styles.css` are loaded as separate files, you need
to serve the folder over HTTP (opening `index.html` via `file://` will be blocked by the
browser's CORS rules). Any static server works:

```bash
# Node (uses the bundled script)
npm install
npm start          # -> http://localhost:8080

# ...or Python, if you'd rather
python3 -m http.server 8080

# ...or the VS Code "Live Server" extension
```

Then open <http://localhost:8080>.

## Deploy

### GitHub Pages (automatic)

This repo ships with `.github/workflows/deploy.yml`. Once pushed to GitHub:

1. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
2. Push to `main`. The workflow publishes the site automatically.
3. Your map goes live at `https://<user>.github.io/<repo>/`.

### Anywhere else

It's a static site — drag the folder into **Netlify**, **Vercel**, **Cloudflare Pages**,
or any static host. No build command; the output directory is the repo root.

## Customizing the content

Almost everything a non-developer would want to change lives in one array near the top of
`main.js`: **`EXHIBIT_DATA`**. Each entry controls one hall:

```js
{
  id:'space',                 // unique id (used in URLs/state)
  name:'Space Dome',          // shown on the sign, cards, drawer
  glyph:'🚀',                 // emoji used across the UI
  color:'#8C6BF2',            // theme color for that hall
  build:buildSpace,           // the function that builds its 3D model
  desc:'...',                 // short blurb in the quick card
  fact:'...',                 // the "Did you know?" line
  hours:'Open 9:30 – 17:00',  // shown on the detail page + drawer
  events:[ {time:'11:00', name:'Live star show'} ],   // "Today at this hall"
  highlights:[                // become the 3 artifacts inside the interior room
    { emoji:'🔭', name:'Meteorite Chunk', blurb:'...' },
  ],
}
```

Other quick edits:

- **Blimp banner text** — search `SUMMER OF SPACE` in `main.js`.
- **Museum name** — in `index.html` (the `.brand` block and `<title>`).
- **Palette** — the `C = { ... }` color table at the top of `main.js`, plus the CSS
  variables in `styles.css` (`:root`).

## Roadmap ideas

Passport/stamp book, photo mode, a sun-arc time slider, search bar, EN/ES language
toggle, and swapping the procedural buildings for GLTF models (the `build*` functions
are the drop-in points).

## Notes & credits

- Three.js is © its authors, MIT licensed, loaded from cdnjs.
- Fonts: Fredoka & Nunito via Google Fonts.
- All 3D models, sounds, and UI in this repo are original and generated in code.
