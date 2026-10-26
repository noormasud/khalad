# khalad.app website

Plain HTML/CSS, no framework. Edit page text in `build.py` and styles in `src/site.css`, then:

    python3 website/build.py

This writes the deployable site to `website/public/` (home, `/privacy`, `/terms`, robots.txt, sitemap.xml).
`website/preview/` is a self-contained copy used only for previewing.

Deploy: Vercel project with Root Directory `website/public`, Framework "Other", no build command.
