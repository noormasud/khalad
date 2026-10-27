# Khalad website (khalad-global.vercel.app)

Plain HTML/CSS/JS, no framework. Run `python3 website/build.py` after any change.

- `build.py`: home, privacy, terms, /islamic-apps, page template, sitemap
- `guides.py`: Qibla + prayer times (one page per city in `src/data/cities.ts`), Islamic date,
  white days, Monday & Thursday fasting, Surah Al-Mulk, Surah Al-Kahf, adhkar, duas, tasbih.
  Every hadith was checked on sunnah.com; don't add one without checking it the same way.
- `src/site.css`, `src/js/*.js` (adhan.min.js is adhan-js 4.4.3, MIT, bundled from source)

Output: `website/public/` (deployed by Vercel, Root Directory `website/public`).
`website/preview/` is a self-contained copy for previewing only.
