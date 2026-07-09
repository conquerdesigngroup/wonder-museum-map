# Discovery Gateway — Interactive 3D Map

An interactive, low-poly 3D campus map for the **Discovery Gateway Children's Museum**
(Salt Lake City). Visitors drive a little explorer avatar around the grounds, walk into
the museum's nine permanent exhibits, step inside them to inspect the stations, and
toggle day/night and weather — all in a single web page with **no build step and no
bundler**.

Built with [Three.js](https://threejs.org/) (r128, loaded from CDN). Everything else —
the audio, the models, the particles — is generated procedurally in code, so there are
**zero binary assets** to host.

![status](https://img.shields.io/badge/status-prototype-blue)

## Features

- **Character controller** — WASD / arrow keys, run, hop (with squash-and-stretch), and a virtual joystick on touch
- **Point-and-go** — double-click / double-tap the ground, or tap the minimap, to auto-run there
- **Click a building** to run to it and open its info card
- **Nine exhibit dioramas** — one per Discovery Gateway permanent exhibit (Kids Eye View, I Dig Dinos, Stillson River Railroad, The Bee Garden, Sensory Room & Story Factory, Saving Lives, Utah Jazz Court, Art Lab, STEAM Lab), from the low-poly tile set in `exhibits.js`
- **Interior rooms** — walk through a doorway to step inside an exhibit and inspect its 3 signature stations
- **Exhibit detail pages** — gallery, hours, event schedule, highlights
- **Exhibit drawer** (☰) — accessible list of all halls with "Go" buttons
- **Explorer passport** (🎟️) — a stamp book that inks a dated stamp for every hall you enter, tracks the artifacts you inspect, awards a "Junior Explorer" seal for completing all nine, and persists across visits (`localStorage`)
- **Living minimap**, breadcrumb footprints, and a follow camera with zoom (scroll / pinch)
- **Sun-arc time slider** — drag the sun along a 24-hour arc for continuous time of day; dawn/dusk golden hour, stars, a moon that rides the opposite arc, and lights that switch on at night (N still toggles day/night)
- **Weather** — clear / rain / snow, with ground splashes and lingering snow prints
- **Reactive NPCs** — ducks that scatter, a robot greeter that tracks you
- **Avatar customizer** (🎨), confetti on completing the museum, promo blimp
- **Jetpack mode** (🚀 or J) — trade walking for hovering: faster cruise, Space for an altitude boost, flickering thruster flames, downdraft dust, and a lean-into-it flight tilt
- **Bird's-eye view** (🗺️ or B) — an alternate navigation style: a fixed-orientation top-down diorama (think Animal Crossing) where the map never rotates, WASD/joystick pan in screen directions, and the camera glides after you; the choice persists across visits
- **Synthesized sound** (Web Audio) and **haptics** (`navigator.vibrate`) on mobile
- **Cinematic intro flyover** and an **idle attract mode** for kiosk use
- **Deep links** — `#i-dig-dinos` (or any exhibit id) opens that hall's detail page and runs you there; the URL hash stays shareable as you browse
- **`prefers-reduced-motion` support** — skips the flyover, attract mode, confetti, and UI animations

## Project structure

```
.
├── index.html          # markup + HUD, loads Three.js (CDN), styles.css, exhibits.js, main.js
├── styles.css          # all UI styling
├── exhibits.js         # the nine Discovery Gateway diorama tile factories (window.DG)
├── main.js             # the 3D campus, game logic, and UI
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
`main.js`: **`EXHIBIT_DATA`**. Each entry controls one exhibit:

```js
{
  id:'the-bee-garden',        // unique id (used in URLs/state, matches exhibits.js)
  name:'The Bee Garden',      // shown on the sign, cards, drawer
  glyph:'🐝',                 // emoji used across the UI
  color:'#FFC145',            // theme color for that exhibit
  build: g => adoptTile(g, 'the-bee-garden'),   // places the diorama from exhibits.js
  desc:'...',                 // short blurb in the quick card
  fact:'...',                 // the "Did you know?" line
  hours:'Open 10:00 – 18:00', // shown on the detail page + drawer
  events:[ {time:'11:30', name:'Find the queen: live hive watch'} ],   // "Today here"
  highlights:[                // become the 3 stations inside the interior room
    { emoji:'🍯', name:'Honey Climber', blurb:'...' },
  ],
}
```

The 3D buildings themselves live in `exhibits.js` — nine self-contained 12×12
diorama tiles (one factory per exhibit) exposed as `window.DG`. `main.js` adopts a
tile with `adoptTile(group, id)`, which strips the tile's point light and registers
its emissive window materials with the sun-arc so they glow after dark.

Other quick edits:

- **Blimp banner text** — search `DISCOVERY GATEWAY ✦` in `main.js`.
- **Museum name** — in `index.html` (the `.brand` block and `<title>`).
- **Palette** — the `C = { ... }` color table at the top of `main.js`, plus the CSS
  variables in `styles.css` (`:root`); the tile palettes are `THEMES` in `exhibits.js`.

## Roadmap ideas

Photo mode, search bar, EN/ES language toggle, and swapping
the procedural buildings for GLTF models (the tile factories in `exhibits.js` are
the drop-in points).

## Notes & credits

- Three.js is © its authors, MIT licensed, loaded from cdnjs.
- Fonts: Fredoka & Nunito via Google Fonts.
- All 3D models, sounds, and UI in this repo are original and generated in code.
