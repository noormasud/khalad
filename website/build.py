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
# Paste the content="…" value from Google Search Console (HTML tag method) to verify the site:
GOOGLE_SITE_VERIFICATION = "drDQQPHSsom2NC0RlZbnCnPtpJaDUP-Nri2KGE_bIJM"
UPDATED = "26 October 2026"
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Noto+Naskh+Arabic:wght@700&display=swap">')
PLAY_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M4.2 2.6a1.2 1.2 0 0 0-.6 1.06v16.68c0 .44.23.83.6 1.05l9.3-9.39z"/>'
             '<path d="m16.6 15.1-2.4-2.4-9.2 9.3c.4.12.85.07 1.24-.15z" opacity=".75"/><path d="m20 10.6-2.95-1.7-2.85 2.89 2.85 2.88L20 13.4a1.6 1.6 0 0 0 0-2.8z" opacity=".9"/>'
             '<path d="M6.24 1.95A1.6 1.6 0 0 0 5 1.8l9.2 9.29 2.4-2.42z" opacity=".6"/></svg>')


FAQ = [
    ("Is there a good Islamic app without ads?",
     "Yes. Khalad is free on Android with no ads and no sign-up. It covers prayer times, daily Quran reading, adhkar, Qibla and a hadith of the day."),
    ("How can I see prayer times on my phone's lock screen?",
     "Khalad shows the next prayer as a quiet line on your Android lock screen, for example \u201cAsr 4:27 pm\u201d, and updates it at each prayer time. There are also small home-screen widgets for the next prayer."),
    ("Does Khalad play the adhan?",
     "No. Khalad is quiet by design: prayer times appear silently and reminders use a soft sound."),
    ("Can I read the Quran with Urdu or English translation?",
     "Yes. Khalad shows the Quran text from Quran.com with Urdu or English translation, lets you set a daily reading goal from one ayah to one juz, and remembers where you stopped."),
    ("Does Khalad remind me to read Surah Al-Mulk and Surah Al-Kahf?",
     "Yes. Khalad gently reminds you to read Surah Al-Mulk at night and Surah Al-Kahf on Fridays, and opens the surah for you. You can also turn on reminders for Monday and Thursday fasts and the white days."),
    ("Which prayer time calculation does Khalad use?",
     "Khalad picks the usual method for your region, such as the University of Islamic Sciences, Karachi in Pakistan, and lets you choose Hanafi or standard Asr. You can adjust any prayer by a few minutes."),
    ("Does Khalad show the Qibla direction?",
     "Yes. Khalad works out the Qibla from your location and shows it with your phone's compass."),
    ("Is Khalad available on iPhone?",
     "Not yet. Khalad is available on Android first."),
]


APP_FAQ = [
    ("What is the best Islamic app for daily use?",
     "The best Islamic app is the one you open every day. Look for accurate prayer times for your location and madhab, a trusted Quran text with translation in your language, hadith that show their references, and no ads pulling you away. Khalad was built around exactly those things."),
    ("Is there an Islamic app without ads?",
     "Yes. Khalad has no ads at all, and no sign-up. Everything you use today is free."),
    ("Which Islamic app has the Quran with Urdu translation?",
     "Khalad shows the Quran from Quran.com with Urdu or English translation, and remembers the exact ayah where you stopped."),
    ("Is there an Islamic app with home-screen widgets?",
     "Yes. Khalad has three Android widgets: the next prayer, a verified hadith of the day, and today's Quran reading. It also shows the next prayer on your lock screen."),
    ("Does Khalad work offline?",
     "Prayer times and the Qibla are calculated on your phone, so they work offline. Any surah you have opened once stays available offline too."),
    ("Is Khalad free?",
     "Yes. Khalad is free on Android. If we add an optional supporter plan later, the basics will stay free."),
]

COMPARE = [
    ("Ads", "None, ever", "Banner and full-screen ads are common"),
    ("Sign-up", "Not needed. Open it and begin", "Often asks you to create an account"),
    ("Adhan", "Silent prayer times, soft reminders you choose", "Adhan audio is often on by default"),
    ("Your location", "Used on your phone only, never sent to us", "Varies. Check each app's privacy policy"),
    ("Hadith", "Every hadith shows its reference, checked against published collections", "References are often missing"),
    ("Next prayer", "On your lock screen and in a widget", "Usually means opening the app"),
    ("Streaks", "Any good deed counts, with two freezes a month", "Often reset after one missed day"),
    ("Quran translation", "Urdu and English, from Quran.com", "Varies"),
]

CHECKLIST = [
    ("Prayer times that match your masjid", "Calculated for your exact location, with the usual method for your region and a choice of Hanafi or standard Asr. You should be able to adjust each prayer by a few minutes."),
    ("A Quran text you can trust", "The Arabic should come from a known source, such as Quran.com, with translations named so you know whose words you are reading."),
    ("Hadith with references", "Every hadith should show where it comes from, like Sahih al-Bukhari 6465, so you can check it yourself."),
    ("Nothing that distracts from worship", "No ads in the middle of adhkar, no popups, no noise you didn't ask for."),
    ("Respect for your privacy", "You shouldn't need an account to read the Quran, and your location shouldn't leave your phone."),
    ("Help with consistency", "Small daily goals, gentle reminders for Surah Al-Mulk and Al-Kahf, and a streak that forgives a missed day."),
]


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


GUIDE_LINKS = [("qibla", "Qibla direction"), ("prayer-times", "Prayer times"), ("islamic-date", "Islamic date today"),
               ("white-days-fasting", "White days fasting"), ("monday-thursday-fasting", "Monday & Thursday fasting"),
               ("surah-al-mulk", "Surah Al-Mulk"), ("surah-al-kahf", "Surah Al-Kahf on Friday"),
               ("morning-evening-adhkar", "Morning & evening adhkar"), ("daily-duas", "Daily duas"), ("tasbih", "Online tasbih")]


def footer(L):
    guides = "".join(f'<a href="{L["to"](p)}">{t}</a>' for p, t in GUIDE_LINKS)
    return f"""<footer class="foot"><div class="wrap">
  <nav class="guides" aria-label="Guides">{guides}</nav>
  <span>© 2026 Khalad LTD · <a class="email" href="mailto:{EMAIL}">{EMAIL}</a></span>
  <nav aria-label="Footer"><a href="{L['home']}">Home</a><a href="{L['app']}">Islamic apps</a><a href="{L['privacy']}">Privacy policy</a><a href="{L['terms']}">Terms of use</a><a href="{PLAY}" rel="noopener">Google Play</a></nav>
</div></footer>"""


def home(L):
    return f"""{header(L, 'home')}
<main>
<section class="hero"><div class="wrap">
  <div>
    <p class="eyebrow">Quran, prayer times &amp; adhkar app · Free on Android · No ads</p>
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

<section class="promise compare-band" id="why" aria-labelledby="why-h"><div class="wrap block">
  <div><h2 id="why-h">Why Khalad</h2>
  <p class="intro">A worship app should never sell your attention. Here is how Khalad compares with typical Islamic apps.</p></div>
  <div class="table-scroll">
    <table class="cmp">
      <thead><tr><th scope="col"></th><th scope="col">Khalad</th><th scope="col">Common in other apps</th></tr></thead>
      <tbody>{"".join(f'<tr><th scope="row">{a}</th><td data-label="Khalad">{k}</td><td data-label="Common in other apps">{o}</td></tr>' for a, k, o in COMPARE)}</tbody>
    </table>
  </div>
</div></section>

<section class="faq" aria-labelledby="faq-h"><div class="wrap">
  <h2 id="faq-h">Questions</h2>
  <div class="qs">
    {"".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in FAQ)}
  </div>
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


def islamic_app(L):
    rows = "".join(f'<tr><th scope="row">{a}</th><td data-label="Khalad">{k}</td><td data-label="Common in other apps">{o}</td></tr>' for a, k, o in COMPARE)
    checks = "".join(f'<div class="item"><h3>{t}</h3><p>{d}</p></div>' for t, d in CHECKLIST)
    faqs = "".join(f'<details><summary>{q}</summary><p>{a}</p></details>' for q, a in APP_FAQ)
    return f"""{header(L, 'islamic-apps')}
<main>
<section class="hero hero-sm"><div class="wrap one">
  <p class="eyebrow">Islamic app for Android · Free · No ads</p>
  <h1 class="h1-sm">An Islamic app that stays quiet.</h1>
  <p class="lede">Khalad brings together what you need every day as a Muslim: accurate prayer times, the Quran with Urdu and English translation, morning and evening adhkar, the Qibla and a verified hadith. No ads, no sign-up and no adhan noise.</p>
  <div class="actions">
    <a class="btn solid" href="{PLAY}" rel="noopener">{PLAY_ICON}Get Khalad on Google Play</a>
    <a class="btn line" href="{L['home']}">See the app</a>
  </div>
</div></section>

<section class="section tight"><div class="wrap">
  <h2>What to look for in an Islamic app</h2>
  <p class="intro">Whichever app you choose, these are the things that matter most for daily worship.</p>
  <div class="grid">{checks}</div>
</div></section>

<section class="promise compare-band" aria-labelledby="cmp-h"><div class="wrap block">
  <h2 id="cmp-h">How Khalad compares with typical Islamic apps</h2>
  <div class="table-scroll">
    <table class="cmp">
      <thead><tr><th scope="col"></th><th scope="col">Khalad</th><th scope="col">Common in other apps</th></tr></thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
</div></section>

<section class="section tight"><div class="wrap">
  <h2>Everything in one calm place</h2>
  <div class="grid">
    <div class="item"><h3>Prayer times &amp; Qibla</h3><p>For your exact location, on your lock screen and in a widget. Adjust any prayer by a few minutes.</p></div>
    <div class="item"><h3>Quran reading</h3><p>A daily goal from one ayah to one juz, Urdu and English translation, pinch to resize, and your place remembered.</p></div>
    <div class="item"><h3>Adhkar &amp; duas</h3><p>Morning, evening, night and after salah, plus everyday duas. Tap to count, meaning one tap away.</p></div>
    <div class="item"><h3>Sunnah reminders</h3><p>Surah Al-Mulk at night, Al-Kahf on Friday, and Monday, Thursday and white days fasts the evening before.</p></div>
    <div class="item"><h3>Hadith of the day</h3><p>One verified hadith or sunnah each day, always with its reference.</p></div>
    <div class="item"><h3>Streaks &amp; sadaqah</h3><p>A streak that counts any good deed, and a private sadaqah tracker only you can see.</p></div>
  </div>
</div></section>

<section class="faq" aria-labelledby="faq-h2"><div class="wrap">
  <h2 id="faq-h2">Common questions</h2>
  <div class="qs">{faqs}</div>
</div></section>

<section class="cta"><div class="wrap">
  <span class="ar" lang="ar" dir="rtl">خلد</span>
  <h2>Try Khalad today. It's free.</h2>
  <a class="btn solid" href="{PLAY}" rel="noopener">{PLAY_ICON}Get it on Google Play</a>
</div></section>
</main>
{footer(L)}"""


PAGES = {
    "home": ("Khalad: Quran, Prayer Times, Adhkar & Qibla App (No Ads)",
             "Free Islamic app: prayer times on your lock screen, daily Quran with Urdu & English translation, adhkar, Qibla and a verified hadith. No ads.", home),
    "privacy": ("Privacy policy · Khalad", "How Khalad handles your data: no ads, no sign-up, location stays on your phone.", privacy),
    "terms": ("Terms of use · Khalad", "The terms for using the Khalad app and website.", terms),
    "islamic-apps": ("Islamic App with Quran, Prayer Times & Adhkar, No Ads · Khalad",
                    "A free Islamic app for Android: prayer times, Quran with Urdu translation, adhkar, Qibla and verified hadith. See how Khalad compares.", islamic_app),
}


def jsonld(key, canonical):  # noqa: E302
    """Structured data so Google understands this is an app (and what it does)."""
    import json
    org = {"@type": "Organization", "name": "Khalad LTD", "url": SITE, "email": EMAIL, "logo": SITE + "/icon.png"}
    faq_list = FAQ if key == "home" else APP_FAQ if key == "islamic-apps" else PAGE_FAQ.get(key)
    if faq_list is None:
        return ""
    app = {
        "@context": "https://schema.org", "@type": "MobileApplication", "name": "Khalad",
        "operatingSystem": "Android", "applicationCategory": "LifestyleApplication",
        "description": PAGES["home"][1], "url": canonical, "installUrl": PLAY, "downloadUrl": PLAY,
        "image": SITE + "/og.png", "inLanguage": ["en", "ur"],
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "publisher": org,
        "featureList": ["Prayer times for your location", "Next prayer on the lock screen", "Daily Quran reading goal",
                        "Urdu and English Quran translation", "Morning, evening and night adhkar", "Qibla direction",
                        "Verified hadith of the day", "Surah Mulk and Surah Kahf reminders", "Home-screen widgets"],
    }
    faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq_list]}
    out = '<script type="application/ld+json">' + json.dumps(faq, ensure_ascii=False) + '</script>'
    if key in ("home", "islamic-apps"):
        out = '<script type="application/ld+json">' + json.dumps(app, ensure_ascii=False) + '</script>\n' + out
    return out


PAGE_FAQ = {}


def doc(title, desc, body, css_tag, icon_href, canonical, key=""):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
{f'<link rel="canonical" href="{canonical}">' if canonical else ''}
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0c0c0c">
{f'<meta name="google-site-verification" content="{GOOGLE_SITE_VERIFICATION}">' if GOOGLE_SITE_VERIFICATION and key == "home" else ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Khalad">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
{f'<meta property="og:url" content="{canonical}">' if canonical else ''}
<meta property="og:image" content="{SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="apple-touch-icon" href="/icon.png">
{jsonld(key, canonical) if canonical else ''}
<link rel="icon" href="{icon_href}">
{FONTS}
{css_tag}
</head>
<body>
{body}
</body>
</html>
"""


def links_public():
    return {"home": "/", "privacy": "/privacy", "terms": "/terms", "app": "/islamic-apps", "mark": "/khalad-mark.png",
            "to": lambda p: "/" + p.strip("/"),
            "script": lambda name: f'<script src="/js/{name}" defer></script>'}


def links_preview(depth, mark):
    pre = "../" * depth
    return {"home": pre if depth else "#", "privacy": pre + "privacy/index.html", "terms": pre + "terms/index.html",
            "app": pre + "islamic-apps/index.html", "mark": mark,
            "to": lambda p: pre + p.strip("/") + "/index.html",
            "script": lambda name: "<script>" + read("js/" + name) + "</script>"}


def build_public():
    out = os.path.join(HERE, "public")
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    for f in ("site.css", "khalad-mark.png", "icon.png", "og.png"):
        shutil.copy(os.path.join(SRC, f), os.path.join(out, f))
    os.makedirs(os.path.join(out, "js"), exist_ok=True)
    for f in os.listdir(os.path.join(SRC, "js")):
        shutil.copy(os.path.join(SRC, "js", f), os.path.join(out, "js", f))
    L = links_public()
    for key, (title, desc, fn) in PAGES.items():
        folder = out if key == "home" else os.path.join(out, key)
        os.makedirs(folder, exist_ok=True)
        canonical = SITE + "/" + ("" if key == "home" else key)
        with open(os.path.join(folder, "index.html"), "w", encoding="utf-8") as f:
            f.write(doc(title, desc, fn(L), '<link rel="stylesheet" href="/site.css">', "/icon.png", canonical, key))
    with open(os.path.join(out, "vercel.json"), "w") as f:
        f.write('{ "cleanUrls": true, "trailingSlash": false, "redirects": [{ "source": "/islamic-app", "destination": "/islamic-apps", "permanent": true }] }\n')
    with open(os.path.join(out, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE}/sitemap.xml\n")
    with open(os.path.join(out, "sitemap.xml"), "w") as f:
        urls = "".join(f"<url><loc>{SITE}/{'' if p == 'home' else p}</loc></url>" for p in PAGES)
        f.write(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>\n')
    return out


def build_preview():
    """Self-contained copy for previewing (inline CSS and logo). Home page is a body fragment."""
    out = os.path.join(HERE, "preview")
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    css = "<style>" + read("site.css") + "</style>"
    with open(os.path.join(SRC, "khalad-mark.png"), "rb") as f:
        mark = "data:image/png;base64," + base64.b64encode(f.read()).decode()
    title, desc, fn = PAGES["home"]
    with open(os.path.join(out, "index.html"), "w", encoding="utf-8") as f:
        f.write(f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n{FONTS}\n{css}\n{fn(links_preview(0, mark))}\n')
    for key, (title, desc, fn) in PAGES.items():
        if key == "home":
            continue
        os.makedirs(os.path.join(out, key), exist_ok=True)
        with open(os.path.join(out, key, "index.html"), "w", encoding="utf-8") as f:
            f.write(doc(title, desc, fn(links_preview(key.count("/") + 1, mark)), css, "data:,", ""))
    return out


import guides  # noqa: E402  (pages for Qibla, prayer times, fasting, surahs, adhkar, duas, tasbih)
_g_pages, _g_faq = guides.pages(header=header, footer=footer, PLAY=PLAY, PLAY_ICON=PLAY_ICON, SRC=SRC)
PAGES.update(_g_pages)
PAGE_FAQ.update(_g_faq)

if __name__ == "__main__":
    print("site:", build_public())
    print("preview:", build_preview())
