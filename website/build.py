#!/usr/bin/env python3
"""Builds the Khalad website.

  python3 website/build.py

Writes the deployable site to website/public/ (index, /privacy, /terms) and a self-contained
preview copy to website/preview/. Edit the page content below and the styles in src/site.css.
"""
import base64
import os
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "src")
PLAY = "https://play.google.com/store/apps/details?id=com.islamicapp.khalad"
EMAIL = "khalad.global@gmail.com"
SITE = "https://khalad-global.vercel.app"  # change here if Vercel gives the project another address
UPDATED = "26 October 2026"
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@700&display=swap">')
PLAY_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M4.2 2.6a1.2 1.2 0 0 0-.6 1.06v16.68c0 .44.23.83.6 1.05l9.3-9.39z"/>'
             '<path d="m16.6 15.1-2.4-2.4-9.2 9.3c.4.12.85.07 1.24-.15z" opacity=".75"/><path d="m20 10.6-2.95-1.7-2.85 2.89 2.85 2.88L20 13.4a1.6 1.6 0 0 0 0-2.8z" opacity=".9"/>'
             '<path d="M6.24 1.95A1.6 1.6 0 0 0 5 1.8l9.2 9.29 2.4-2.42z" opacity=".6"/></svg>')


def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()


def header(L, current):
    def cur(k):
        return ' aria-current="page"' if current == k else ""
    return f"""<header class="top"><div class="wrap">
  <a class="brand" href="{L['home']}" aria-label="Khalad home"><img src="{L['mark']}" alt="" width="44" height="26"><span class="wordmark">Khalad<i>.</i></span></a>
  <nav class="nav" aria-label="Main">
    <a class="hide-sm" href="{L['privacy']}"{cur('privacy')}>Privacy</a>
    <a class="hide-sm" href="{L['terms']}"{cur('terms')}>Terms</a>
    <a class="pill" href="{PLAY}" rel="noopener">Get the app</a>
  </nav>
</div></header>"""


def footer(L):
    return f"""<footer class="foot"><div class="wrap">
  <span>© 2026 Khalad LTD · <a class="email" href="mailto:{EMAIL}">{EMAIL}</a></span>
  <nav aria-label="Footer"><a href="{L['home']}">Home</a><a href="{L['privacy']}">Privacy policy</a><a href="{L['terms']}">Terms of use</a><a href="{PLAY}" rel="noopener">Google Play</a></nav>
</div></footer>"""


def home(L):
    return f"""{header(L, 'home')}
<main>
<section class="hero"><div class="wrap">
  <div>
    <p class="eyebrow">Free on Android · No ads</p>
    <h1><span>Small deeds.</span><span>Every day.</span><span class="last">Forever<i>.</i></span></h1>
    <p class="lede">Khalad is a quiet Islamic app for the small acts that last: your daily Quran, prayer times, morning and evening adhkar, Surah Mulk at night and Al-Kahf on Fridays.</p>
    <div class="actions">
      <a class="btn solid" href="{PLAY}" rel="noopener">{PLAY_ICON}Get it on Google Play</a>
      <a class="btn line" href="{L['privacy']}">Our privacy promise</a>
    </div>
    <p class="fine">No sign-up. No adhan noise. Your location stays on your phone.</p>
  </div>
  <div class="phone" role="img" aria-label="Khalad on an Android lock screen: next prayer Asr at 4:27 pm, with home-screen widgets for the hadith of the day and today's Quran reading.">
    <div class="screen">
      <span class="date">Monday 26 October</span>
      <span class="clock">3:52</span>
      <div class="note"><span class="ar" lang="ar" dir="rtl">خلد</span><div><b>Asr 4:27 pm</b><small>Next prayer</small></div><span class="now">now</span></div>
      <div class="widgets">
        <div class="w light"><span class="k">Hadith of the day</span><p>“The best among you are those who learn the Qur'an and teach it.”</p></div>
        <div class="w dark"><span class="k">Today’s reading</span><p><b>Continue Al-Kahf</b><br>1 of 2 pages</p><div class="bar"><span></span></div></div>
      </div>
    </div>
  </div>
</div></section>

<section class="band" aria-label="Hadith"><div class="wrap">
  <blockquote>The Prophet <span class="saw">ﷺ</span> was asked which deeds are loved most by Allah. He said, “The most regular constant deeds, even though they may be few.”</blockquote>
  <cite>Sahih al-Bukhari 6465</cite>
</div></section>

<section class="section"><div class="wrap">
  <h2>Everything for your day. Nothing that shouts.</h2>
  <p class="intro">Built for Muslims in Pakistan and around the world, in English and Urdu.</p>
  <div class="grid">
    <div class="item"><h3>Prayer times, quietly</h3><p>Accurate times for where you are, Hanafi or standard Asr. The next prayer sits on your lock screen. No adhan going off at the wrong moment.</p></div>
    <div class="item"><h3>A daily Quran goal</h3><p>From one ayah to one juz a day, with Urdu and English translation. Pick up exactly where you left off.</p></div>
    <div class="item"><h3>Adhkar that open and count</h3><p>Morning, evening, night and after salah. Tap to count, pinch to resize, meaning one tap away.</p></div>
    <div class="item"><h3>Mulk at night, Kahf on Friday</h3><p>Gentle reminders for the Sunnah surahs, plus Monday and Thursday and the white days fasts, the evening before.</p></div>
    <div class="item"><h3>Streaks that forgive</h3><p>Any good deed keeps your streak alive, with two freezes a month and a private pause when you need it.</p></div>
    <div class="item"><h3>Widgets for your home screen</h3><p>Next prayer, a verified hadith of the day and today's reading. Calm, and in black and white.</p></div>
  </div>
</div></section>

<section class="promise"><div class="wrap">
  <div><h2>Quiet by design.</h2>
  <p class="intro">A worship app should never sell your attention. Khalad keeps what's yours on your phone.</p></div>
  <ul class="nos">
    <li>No ads<span>Not now, not later</span></li>
    <li>No sign-up<span>Open it and begin</span></li>
    <li>Location stays on your phone<span>Used only to work out prayer times</span></li>
    <li>No adhan noise<span>Silent prayer times, soft reminders</span></li>
    <li>Verified sources<span>Quran text from Quran.com, hadith checked</span></li>
  </ul>
</div></section>

<section class="cta"><div class="wrap">
  <span class="ar" lang="ar" dir="rtl">خلد</span>
  <h2>Begin with one ayah today.</h2>
  <a class="btn solid" href="{PLAY}" rel="noopener">{PLAY_ICON}Get Khalad on Google Play</a>
</div></section>
</main>
{footer(L)}"""


def privacy(L):
    return f"""{header(L, 'privacy')}
<main class="legal"><div class="wrap">
<h1>Privacy policy</h1>
<p class="updated">Last updated {UPDATED}</p>

<div class="summary"><h2>The short version</h2><ul>
  <li>No ads, no advertising ID, and we never sell data.</li>
  <li>No account or sign-up. We don't ask for your name, email or phone number.</li>
  <li>Your location, reading progress and sadaqah stay on your phone.</li>
  <li>Anonymous usage statistics help us improve the app. They're on by default and you can turn them off any time.</li>
</ul></div>

<section><h2>Who we are</h2>
<p>Khalad is published by Khalad LTD (“we”, “us”). If you have any question about your privacy, email <span class="email">{EMAIL}</span>.</p></section>

<section><h2>What stays on your phone</h2>
<p>Most of what Khalad knows about you never leaves your device:</p>
<ul>
  <li><b>Location.</b> If you allow it, Khalad uses your approximate location, rounded to about 1 km, to calculate prayer times and the Qibla direction. It is used on your phone only and is never sent to us. You can choose a city instead.</li>
  <li><b>Your progress.</b> Reading goal, pages and ayahs read, streak, adhkar and surahs completed, tasbih counts.</li>
  <li><b>Sadaqah.</b> Your monthly goal and the amounts you log. These are never sent anywhere.</li>
  <li><b>Settings.</b> Calculation method, madhab, reminders, language, text size and theme.</li>
</ul>
<p>We don't back this up to our servers. Uninstalling Khalad, or clearing its storage, deletes it.</p></section>

<section><h2>What is sent to our servers</h2>
<h3>Anonymous usage statistics</h3>
<p>To learn which features are used and what to improve, Khalad sends small usage events. This is on by default. Turn it off any time in <b>More → Share anonymous usage</b>, or during setup.</p>
<p>Each event contains: a random ID created on your phone (not linked to your name, email, phone number or Google account), the event name (for example “screen opened”, “adhkar completed”, “setting changed”), a few simple values (for example the reading goal you picked, the text size, which reminder you turned on, or counts rounded into ranges), the app version and the time.</p>
<p>Events never contain your location, your name or contact details, your sadaqah amounts or anything you type.</p>
<p>We keep individual events for 90 days. After that we keep only daily totals, which contain no ID at all.</p>
<h3>Ummah goals</h3>
<p>When you add your recitation to a shared Ummah goal, the app creates an anonymous account (no email or name) so the count can be added safely and abuse can be limited. We store the count and that anonymous account ID.</p>
<h3>Downloading content</h3>
<p>The app downloads hadith, adhkar, reminders and app settings from our database. As with any internet request, the servers that answer see your device's IP address in standard logs.</p></section>

<section><h2>Services we use</h2>
<ul>
  <li><b>Supabase</b> hosts our database: content, anonymous usage events and Ummah goal counts.</li>
  <li><b>Quran Foundation (Quran.com)</b>. The Quran text and translations are downloaded from their service, which sees your IP address when you download a surah.</li>
  <li><b>Google Play</b> delivers the app and its updates under Google's own privacy policy. If we offer an optional supporter subscription in future, payment will be handled by Google Play; we never see your card details.</li>
</ul>
<p>Khalad contains no advertising or tracking SDKs, and it does not use the Android advertising ID. Reminders and prayer times are scheduled on your phone; we don't run push-notification servers.</p></section>

<section><h2>Children</h2>
<p>Khalad is suitable for all ages. We don't knowingly collect personal information from anyone, children included: the app asks for no name, email or contact details.</p></section>

<section><h2>Your choices and rights</h2>
<ul>
  <li>Turn off usage statistics in More → Share anonymous usage.</li>
  <li>Refuse location access and choose your city instead.</li>
  <li>Turn off notifications in the app or in your phone's settings.</li>
  <li>Delete everything on your phone by uninstalling Khalad or clearing its storage.</li>
</ul>
<p>Because usage events use a random ID that isn't linked to you, we can't normally tell which events are yours. Depending on where you live, you may have rights to access, correct or delete personal data. Email <span class="email">{EMAIL}</span> and we'll help however we can.</p></section>

<section><h2>Security</h2>
<p>All connections use HTTPS. Our database only allows the app to read published content and to add anonymous events; the app cannot read anyone's usage data.</p></section>

<section><h2>Changes to this policy</h2>
<p>If we change this policy, we'll update the date at the top. If a change affects what is collected, we'll tell you in the app before it applies.</p></section>
</div></main>
{footer(L)}"""


def terms(L):
    return f"""{header(L, 'terms')}
<main class="legal"><div class="wrap">
<h1>Terms of use</h1>
<p class="updated">Last updated {UPDATED}</p>

<div class="summary"><h2>The short version</h2><ul>
  <li>Khalad is free to use. Please use it kindly and don't misuse it.</li>
  <li>Prayer times, the Qibla and Hijri dates are calculated. Check with your local masjid when it matters.</li>
  <li>For religious rulings, please ask a qualified scholar.</li>
</ul></div>

<section><h2>Using Khalad</h2>
<p>These terms apply to the Khalad app and this website, published by Khalad LTD. By using Khalad you agree to them. If you don't agree, please don't use the app.</p>
<p>Khalad is free. We may add, change or remove features over time.</p></section>

<section><h2>Prayer times, Qibla and dates</h2>
<ul>
  <li>Prayer times are calculated from your location using established methods (for example University of Islamic Sciences Karachi, ISNA or Muslim World League) and your chosen Asr method. They can differ by a few minutes from your local masjid's timetable, especially for Fajr, Isha and at high latitudes. You can adjust each prayer in settings.</li>
  <li>For fasting, Suhoor and Iftar, follow your local masjid or trusted authority.</li>
  <li>The Qibla direction is calculated and depends on your phone's compass, which can be affected by magnets and metal. Please confirm it where possible.</li>
  <li>Hijri dates are calculated and can differ by a day from local moon sighting. You can adjust them in settings.</li>
</ul></section>

<section><h2>Religious content</h2>
<p>The Quran text and its translations come from the Quran Foundation (Quran.com). Translations convey meaning and are not the Quran itself. Hadith and Sunnah in the app are checked against published collections, and each shows its reference. Khalad is a tool for daily practice, not a source of religious rulings. For questions of fiqh, please ask a qualified scholar.</p></section>

<section><h2>Fair use</h2>
<p>Please don't misuse Khalad. For example, don't send false or automated contributions to Ummah goals, try to get into our systems or other people's data, or interfere with the service.</p></section>

<section><h2>Supporter subscription</h2>
<p>We may offer an optional supporter subscription in future. The basics will stay free. If we do, payments, renewals, cancellations and refunds will be handled by Google Play under its terms, and you'll be able to cancel at any time from your Google Play account.</p></section>

<section><h2>Ownership</h2>
<p>The Khalad name, logo and design belong to Khalad LTD. The Quran text, translations and hadith translations belong to their respective sources and are credited in the app.</p></section>

<section><h2>No warranty</h2>
<p>We work hard to keep Khalad accurate and available, but it is provided “as is”, without warranties of any kind. To the extent the law allows, Khalad LTD is not liable for any loss arising from your use of the app, including from calculated times or directions.</p></section>

<section><h2>Changes</h2>
<p>We may update these terms. We'll change the date at the top, and tell you in the app about important changes.</p></section>

<section><h2>Contact</h2>
<p>Questions about these terms: <span class="email">{EMAIL}</span>.</p></section>
</div></main>
{footer(L)}"""


PAGES = {
    "home": ("Khalad", "Khalad: a quiet Islamic app for prayer times, daily Quran and adhkar. No ads, no sign-up.", home),
    "privacy": ("Privacy policy · Khalad", "How Khalad handles your data: no ads, no sign-up, location stays on your phone.", privacy),
    "terms": ("Terms of use · Khalad", "The terms for using the Khalad app and website.", terms),
}


def doc(title, desc, body, css_tag, icon_href, canonical):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
{f'<link rel="canonical" href="{canonical}">' if canonical else ''}
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<link rel="icon" href="{icon_href}">
{FONTS}
{css_tag}
</head>
<body>
{body}
</body>
</html>
"""


def build_public():
    out = os.path.join(HERE, "public")
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    for f in ("site.css", "khalad-mark.png", "icon.png"):
        shutil.copy(os.path.join(SRC, f), os.path.join(out, f))
    L = {"home": "/", "privacy": "/privacy", "terms": "/terms", "mark": "/khalad-mark.png"}
    for key, (title, desc, fn) in PAGES.items():
        folder = out if key == "home" else os.path.join(out, key)
        os.makedirs(folder, exist_ok=True)
        canonical = SITE + "/" + ("" if key == "home" else key)
        with open(os.path.join(folder, "index.html"), "w", encoding="utf-8") as f:
            f.write(doc(title, desc, fn(L), '<link rel="stylesheet" href="/site.css">', "/icon.png", canonical))
    with open(os.path.join(out, "vercel.json"), "w") as f:
        f.write('{ "cleanUrls": true, "trailingSlash": false }\n')
    with open(os.path.join(out, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    with open(os.path.join(out, "sitemap.xml"), "w") as f:
        urls = "".join(f"<url><loc>{SITE}/{p}</loc></url>" for p in ("", "privacy", "terms"))
        f.write(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    return out


def build_preview():
    """Self-contained copy for previewing (inline CSS and logo). Home page is a body fragment."""
    out = os.path.join(HERE, "preview")
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(os.path.join(out, "privacy"))
    os.makedirs(os.path.join(out, "terms"))
    css = "<style>" + read("site.css") + "</style>"
    with open(os.path.join(SRC, "khalad-mark.png"), "rb") as f:
        mark = "data:image/png;base64," + base64.b64encode(f.read()).decode()
    title, desc, fn = PAGES["home"]
    L = {"home": "#", "privacy": "privacy/index.html", "terms": "terms/index.html", "mark": mark}
    with open(os.path.join(out, "index.html"), "w", encoding="utf-8") as f:
        f.write(f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n{FONTS}\n{css}\n{fn(L)}\n')
    L2 = {"home": "../", "privacy": "../privacy/index.html", "terms": "../terms/index.html", "mark": mark}
    for key in ("privacy", "terms"):
        title, desc, fn = PAGES[key]
        with open(os.path.join(out, key, "index.html"), "w", encoding="utf-8") as f:
            f.write(doc(title, desc, fn(L2), css, "data:,", ""))
    return out


if __name__ == "__main__":
    print("site:", build_public())
    print("preview:", build_preview())
