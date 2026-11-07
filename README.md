# AstrologyPro — Final Static Build

AstrologyPro is a responsive static HTML/CSS/JavaScript astrology dashboard with an animated celestial display, live simulation clock, saved birth profiles, natal calculations, major aspects, concise interpretations, and HTML report export.

## What is included

- Responsive desktop/tablet/mobile UI
- Dark/light theme
- Heliocentric/geocentric/top-down celestial modes
- Canvas-based animated Solar System
- Planet selection, labels, zoom, pan, reset
- Shared simulation timeline and playback
- Astronomy Engine 2.1.19 browser ephemeris
- Real heliocentric/geocentric planetary positions
- Direct/retrograde estimates
- Tropical zodiac longitudes
- Birth profile storage via localStorage
- Birth-time conversion using IANA timezones
- Ascendant and Midheaven calculation
- Whole Sign houses
- Equal houses
- Planet-to-house assignment
- Major aspects with applying/separating estimate
- Dominant element and modality
- Natal/current-transit separation
- Concise interpretations for Sun, Moon, Ascendant, Mercury, Venus, Mars, Jupiter, Saturn
- Career, relationship, strengths, growth-area summaries
- Printable/exported HTML report
- Input validation and state migration
- Regression-test fixtures

## Accuracy boundaries

Planetary astronomy uses **Astronomy Engine 2.1.19**.

The celestial view uses optimized non-linear orbital scaling so screen distances are visually useful and are not a literal scale model.

Whole Sign and Equal houses are implemented. **Placidus is not implemented in this release.** If selected, the application explicitly reports that cusps are unavailable rather than inventing results.

Ascendant and Midheaven are calculated from observer coordinates, sidereal time, obliquity, and ecliptic/horizon geometry. Before using this software for professional chart work, compare representative charts against a trusted reference ephemeris and astrology package.

Astrological interpretation is provided for reflection and entertainment and should not be presented as scientific fact or deterministic prediction.

## Run locally

Because the app uses ES modules, serve it over HTTP rather than opening `index.html` directly:

```bash
cd AstrologyPro
python -m http.server 8080
```

Then visit:

```text
http://localhost:8080/
```

## Dependency

The production HTML currently loads:

```text
astronomy-engine@2.1.19
```

from jsDelivr.

For offline or tightly controlled production deployment, vendor `astronomy.browser.min.js` into your own `assets/vendor/` directory and change the script tag in `index.html`.

## GitHub Pages

1. Push the contents of the `AstrologyPro` folder to a repository.
2. Open **Settings → Pages**.
3. Select **Deploy from a branch**.
4. Choose the branch and `/ (root)`.
5. Save.

The app uses relative asset paths and does not require a server backend.

## Netlify

Either drag the `AstrologyPro` folder into Netlify Drop or connect the repository.

No build command is required.

Publish directory:

```text
.
```

A `netlify.toml` file is included.

## Vercel

Import the repository as a new project.

Framework preset:

```text
Other
```

Build command:

```text
None
```

Output directory:

```text
.
```

A minimal `vercel.json` file is included.

## Production checklist

- Confirm the Astronomy Engine CDN is reachable or vendor it locally.
- Test at least one Northern Hemisphere and one Southern Hemisphere chart.
- Test daylight-saving and non-DST timezones.
- Compare selected planetary longitudes and Ascendant/MC against a trusted external reference.
- Test Whole Sign and Equal houses.
- Confirm Placidus shows an unsupported warning.
- Test timeline play/pause at several speeds.
- Test profile persistence after reload.
- Test HTML export.
- Test mobile layout at 320–430 px widths.
- Test keyboard navigation and reduced-motion mode.
- Confirm astrology disclaimers remain visible.

## Folder structure

```text
AstrologyPro/
├── index.html
├── 404.html
├── css/
├── js/
│   ├── astronomy/
│   ├── astrology/
│   └── celestial/
├── data/
├── assets/
├── tests/
├── netlify.toml
├── vercel.json
└── README.md
```
