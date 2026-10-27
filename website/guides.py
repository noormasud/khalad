"""Guide and tool pages for the Khalad website (SEO).

Rule for every page: answer the question fully, then offer Khalad for doing it every day.
Every hadith here was checked word for word on sunnah.com (October 2026). Don't add one without doing the same.
"""
import html
import json
import math
import os
import re

KAABA = (21.4225241, 39.8261818)  # same point the adhan library uses for the Qibla

METHOD_NAMES = {
    "Karachi": "University of Islamic Sciences, Karachi",
    "NorthAmerica": "ISNA (Islamic Society of North America)",
    "MoonsightingCommittee": "Moonsighting Committee Worldwide",
    "UmmAlQura": "Umm al-Qura University, Makkah",
    "Dubai": "Dubai (UAE)",
    "Qatar": "Qatar",
    "Kuwait": "Kuwait",
    "Egyptian": "Egyptian General Authority of Survey",
    "Turkey": "Diyanet (Turkey)",
    "Singapore": "MUIS (Singapore)",
    "Tehran": "University of Tehran",
    "MuslimWorldLeague": "Muslim World League",
}


def method_for_tz(z):
    """Same rules as the app (src/lib/prayer.ts)."""
    if re.match(r"^Asia/(Karachi|Kolkata|Calcutta|Dhaka|Kabul|Kathmandu|Colombo|Thimphu)$", z): return "Karachi"
    if re.match(r"^(America|Canada|US)/", z): return "NorthAmerica"
    if re.match(r"^Europe/(London|Dublin|Belfast)$", z): return "MoonsightingCommittee"
    if z == "Asia/Riyadh": return "UmmAlQura"
    if z in ("Asia/Dubai", "Asia/Muscat"): return "Dubai"
    if z in ("Asia/Qatar", "Asia/Bahrain"): return "Qatar"
    if z == "Asia/Kuwait": return "Kuwait"
    if z == "Africa/Cairo": return "Egyptian"
    if z in ("Europe/Istanbul", "Asia/Istanbul"): return "Turkey"
    if re.match(r"^Asia/(Singapore|Kuala_Lumpur|Kuching|Jakarta|Makassar|Jayapura|Pontianak|Brunei)$", z): return "Singapore"
    if z == "Asia/Tehran": return "Tehran"
    return "MuslimWorldLeague"


def hanafi_for_tz(z):
    return bool(re.match(r"^Asia/(Karachi|Kolkata|Calcutta|Dhaka|Kabul|Kathmandu|Colombo|Thimphu)$", z)) or z.endswith("Istanbul")


def load_cities(src_dir):
    ts = open(os.path.join(src_dir, "..", "..", "src", "data", "cities.ts"), encoding="utf-8").read()
    rx = re.compile(r"\{ name: '([^']+)', country: '([^']+)', lat: (-?[\d.]+), lng: (-?[\d.]+), tz: '([^']+)' \}")
    out = []
    for name, country, lat, lng, tz in rx.findall(ts):
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        out.append({"name": name, "country": country, "lat": float(lat), "lng": float(lng), "tz": tz, "slug": slug})
    return out


def qibla(lat, lng):
    p1, p2 = math.radians(lat), math.radians(KAABA[0])
    dl = math.radians(KAABA[1] - lng)
    y = math.sin(dl) * math.cos(p2)
    x = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    bearing = (math.degrees(math.atan2(y, x)) + 360) % 360
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    km = 6371 * 2 * math.asin(math.sqrt(a))
    return bearing, km


def direction_words(b):
    """263.4 -> ('W', '7° south of due west')."""
    names = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    short = names[int((b + 11.25) // 22.5) % 16]
    cards = {0: "north", 90: "east", 180: "south", 270: "west"}
    near = int(round(b / 90.0) * 90) % 360
    diff = ((b - near + 540) % 360) - 180
    if abs(diff) < 0.5:
        return short, f"due {cards[near]}"
    side = {0: ("east", "west"), 90: ("south", "north"), 180: ("west", "east"), 270: ("north", "south")}[near]
    return short, f"{abs(diff):.0f}° {side[0] if diff > 0 else side[1]} of due {cards[near]}"


def esc(t):
    return html.escape(t, quote=False)


# ---------------------------------------------------------------------------------------------
# Verified narrations (sunnah.com, checked October 2026)
# ---------------------------------------------------------------------------------------------
H = {
    "nasai2424": ("If you want to fast at any time during the month, then fast on the thirteenth, fourteenth and fifteenth.",
                  "Sunan an-Nasa'i 2424 (Abu Dharr), graded hasan"),
    "muslim1160": ("She said: He was not particular about the days of the month on which to observe fast.",
                   "Sahih Muslim 1160 ('A'isha, asked whether the Prophet ﷺ fasted three days each month)"),
    "tirmidhi747": ("Deeds of people are presented (to Allah) on Mondays and Thursdays. So I like that my actions be presented while I am fasting.",
                    "Jami' at-Tirmidhi 747 (Abu Hurairah), graded hasan by at-Tirmidhi"),
    "muslim1162": ("That is the day on which I was born and the day on which I received Revelation.",
                   "Sahih Muslim 1162 (Abu Qatadah: the Prophet ﷺ was asked about fasting on Mondays)"),
    "tirmidhi2891": ("Indeed there is a Surah in the Qur'an of thirty Ayat, which intercedes for a man until he is forgiven. It is [Surah] Tabarak Alladhi Biyadihil-Mulk.",
                     "Jami' at-Tirmidhi 2891 (Abu Hurairah), graded hasan"),
    "tirmidhi2892": ("The Messenger of Allah ﷺ would not sleep until he had recited Surah as-Sajdah and Surah al-Mulk.",
                     "Jami' at-Tirmidhi 2892 (Jabir ibn Abdullah), meaning"),
    "mishkat2175": ("If anyone recites sura al-Kahf on Friday, light will shine brightly for him till the next Friday.",
                    "Al-Bayhaqi, in Mishkat al-Masabih 2175 (Abu Sa'id al-Khudri), graded hasan by al-Albani"),
    "muslim809": ("If anyone learns by heart the first ten verses of the Surah al-Kahf, he will be protected from the Dajjal.",
                  "Sahih Muslim 809a (Abu ad-Darda')"),
}


PARAPHRASED = {"tirmidhi2892"}  # summarised meaning, so shown without quotation marks


def quote(key):
    t, ref = H[key]
    text = esc(t) if key in PARAPHRASED else f"“{esc(t)}”"
    return f'<figure class="hq"><blockquote>{text}</blockquote><figcaption>{esc(ref)}</figcaption></figure>'


ADHKAR = [
    {
        "name": "Sayyid al-Istighfar, the best way to ask forgiveness",
        "when": "Once in the morning and once in the evening",
        "translit": "Allahumma anta Rabbi, la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bi ni'matika 'alayya, wa abu'u bi dhanbi, faghfir li, fa innahu la yaghfirudh-dhunuba illa anta.",
        "meaning": "O Allah, You are my Lord, there is none worthy of worship except You. You have created me, and I am Your servant, and I am faithful to Your covenant and promise as much as I can. I seek refuge in You from the evil of what I have done. I acknowledge Your blessings upon me, and I admit my sins. So forgive me, for none forgives sins except You.",
        "virtue": "Whoever says it during the day with firm faith and dies before the evening, or says it at night and dies before the morning, will be from the people of Paradise.",
        "ref": "Sahih al-Bukhari 6306 (Shaddad ibn Aws)",
    },
    {
        "name": "Protection: “In the name of Allah…”",
        "when": "Three times in the morning and three times in the evening",
        "translit": "Bismillahil-ladhi la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama'i, wa huwas-Sami'ul-'Alim.",
        "meaning": "In the name of Allah, when Whose name is mentioned nothing on Earth or in Heaven can cause harm, and He is the Hearer, the Knower.",
        "virtue": "Whoever says it three times in the morning will not suffer sudden affliction until the evening, and in the evening, until the morning.",
        "ref": "Sunan Abi Dawud 5088 ('Uthman ibn 'Affan), graded sahih by al-Albani",
    },
    {
        "name": "Surah Al-Ikhlas, Al-Falaq and An-Nas",
        "when": "Three times each, morning and evening",
        "translit": "Qul huwa Allahu ahad…, Qul a'udhu bi Rabbil-falaq…, Qul a'udhu bi Rabbin-nas…",
        "meaning": "The last three surahs of the Quran (112, 113 and 114).",
        "virtue": "The Prophet ﷺ said they will suffice you against everything.",
        "ref": "Sunan Abi Dawud 5082 ('Abdullah ibn Khubayb), graded hasan by al-Albani",
    },
    {
        "name": "SubhanAllahi wa bihamdihi",
        "when": "One hundred times in the morning and in the evening",
        "translit": "SubhanAllahi wa bihamdihi.",
        "meaning": "Glory be to Allah, and praise be to Him.",
        "virtue": "No one will come on the Day of Resurrection with better deeds, except one who said the same.",
        "ref": "Sahih Muslim 2692 (Abu Hurairah), in Riyad as-Salihin 1451",
    },
]

DUAS = [
    {"name": "Before sleeping", "translit": "Bismika Allahumma amutu wa ahya.",
     "meaning": "With Your name, O Allah, I die and I live.", "ref": "Sahih al-Bukhari 6324 (Hudhaifah)"},
    {"name": "When waking up", "translit": "Al-hamdu lillahil-ladhi ahyana ba'da ma amatana wa ilaihin-nushur.",
     "meaning": "All praise is for Allah, Who made us alive after He made us die (sleep), and unto Him is the Resurrection.",
     "ref": "Sahih al-Bukhari 6324 (Hudhaifah)"},
    {"name": "When leaving the house", "translit": "Bismillah, tawakkaltu 'alallah, la hawla wa la quwwata illa billah.",
     "meaning": "In the name of Allah, I trust in Allah; there is no might and no power but in Allah.",
     "note": "Whoever says it is told: “You are guided, defended and protected.”",
     "ref": "Sunan Abi Dawud 5095 (Anas ibn Malik), graded sahih by al-Albani"},
    {"name": "Before entering the toilet", "translit": "Allahumma inni a'udhu bika minal-khubuthi wal-khaba'ith.",
     "meaning": "O Allah, I seek refuge with You from all offensive and wicked things.", "ref": "Sahih al-Bukhari 142 (Anas ibn Malik)"},
    {"name": "After leaving the toilet", "translit": "Ghufranaka.",
     "meaning": "(I ask) Your forgiveness.", "ref": "Sunan Abi Dawud 30 ('A'isha), graded sahih by al-Albani"},
]


# ---------------------------------------------------------------------------------------------
def pages(header, footer, PLAY, PLAY_ICON, SRC):
    cities = load_cities(SRC)
    P, FAQS = {}, {}

    def cta(L, title, text, label="Get Khalad on Google Play"):
        return f"""<section class="app-cta"><div class="wrap">
  <div><h2>{title}</h2><p>{text}</p></div>
  <a class="btn invert" href="{PLAY}" rel="noopener">{PLAY_ICON}{label}</a>
</div></section>"""

    def appbar():
        return f"""<div class="appbar" role="complementary" aria-label="Khalad app"><span><b>Khalad</b> · free, no ads</span><a href="{PLAY}" rel="noopener">Get the app</a></div>"""

    def page(L, key, eyebrow, h1, lede, body, cta_html):
        return f"""{header(L, key)}
<main class="guide">
<section class="g-hero"><div class="wrap">
  <p class="eyebrow">{eyebrow}</p>
  <h1>{h1}</h1>
  <p class="lede">{lede}</p>
</div></section>
{body}
{cta_html}
</main>
{footer(L)}
{appbar()}"""

    def faq_html(items, hid="faq"):
        rows = "".join(f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in items)
        return f'<section class="faq"><div class="wrap"><h2 id="{hid}">Questions</h2><div class="qs">{rows}</div></div></section>'

    def city_list(L, base, fmt):
        groups = {}
        for c in cities:
            groups.setdefault(c["country"], []).append(c)
        out = []
        for country, cs in groups.items():
            items = "".join(f'<li><a href="{L["to"](base + "/" + c["slug"])}">{esc(c["name"])}</a>{fmt(c)}</li>' for c in cs)
            out.append(f'<div class="cgroup"><h3>{esc(country)}</h3><ul>{items}</ul></div>')
        return '<div class="cities">' + "".join(out) + "</div>"

    # ---------------- Qibla ----------------
    qfaq = [
        ("What is the Qibla?", "The Qibla is the direction of the Kaaba in Makkah, which Muslims face in salah."),
        ("Is the Qibla direction measured from true north or magnetic north?",
         "The angles on this page are from true north. A phone compass is usually corrected to true north automatically. A handheld magnetic compass can be off by a few degrees depending on where you are."),
        ("Why does the Qibla from the UK or America point north-east?",
         "Because the shortest path on a globe follows a great circle, not a straight line on a flat map. From London or New York, that path to Makkah heads east and slightly north or south."),
    ]
    FAQS["qibla"] = qfaq

    def qibla_index(L):
        def fmt(c):
            b, _ = qibla(c["lat"], c["lng"])
            return f'<span>{b:.0f}°</span>'
        body = f"""<section class="g-body"><div class="wrap prose">
  <h2>How to find the Qibla</h2>
  <ol>
    <li>Find your city below to see its Qibla angle, measured clockwise from north.</li>
    <li>Open your phone's compass and turn until it shows that angle.</li>
    <li>Face that way. Keep away from metal and magnets, which can pull a compass off.</li>
  </ol>
  <p>The angle is the direction of the Kaaba in Makkah ({KAABA[0]:.4f}° N, {KAABA[1]:.4f}° E) along the shortest path over the Earth.</p>
  <h2>Qibla direction by city</h2>
  {city_list(L, "qibla", fmt)}
</div></section>
{faq_html(qfaq)}"""
        return page(L, "qibla", "Qibla", "Qibla direction", "Find the Qibla from your city: the exact angle from north and how to face it.", body,
                    cta(L, "Qibla anywhere, with a live compass", "Khalad works out the Qibla from wherever you are and points you to it with your phone's compass. No ads, no sign-up."))
    P["qibla"] = ("Qibla Direction: Find the Qibla from Your City · Khalad",
                  "Qibla direction from your city: the exact angle from north, how to face it, and a live Qibla compass in the free Khalad app.", qibla_index)

    for c in cities:
        b, km = qibla(c["lat"], c["lng"])
        short, words = direction_words(b)
        key = "qibla/" + c["slug"]

        def qcity(L, c=c, b=b, km=km, short=short, words=words):
            others = " ".join(f'<a href="{L["to"]("qibla/" + o["slug"])}">{esc(o["name"])}</a>' for o in cities if o["country"] == c["country"] and o is not c)
            body = f"""<section class="g-body"><div class="wrap qgrid">
  <figure class="dial" aria-label="Compass showing the Qibla at {b:.0f} degrees from north">
    <svg viewBox="0 0 200 200" role="img">
      <circle cx="100" cy="100" r="92" class="ring"/>
      <text x="100" y="22" class="cardinal">N</text><text x="182" y="105" class="cardinal">E</text>
      <text x="100" y="190" class="cardinal">S</text><text x="18" y="105" class="cardinal">W</text>
      <g transform="rotate({b:.1f} 100 100)"><line x1="100" y1="100" x2="100" y2="30" class="needle"/><circle cx="100" cy="30" r="7" class="tip"/></g>
      <circle cx="100" cy="100" r="5" class="hub"/>
    </svg>
    <figcaption>{b:.1f}° from north</figcaption>
  </figure>
  <div class="prose">
    <p class="big">Face <b>{b:.0f}°</b> from north ({short}), which is {words}.</p>
    <dl class="facts">
      <div><dt>Qibla angle</dt><dd>{b:.1f}° clockwise from true north</dd></div>
      <div><dt>Direction</dt><dd>{short}, {words}</dd></div>
      <div><dt>Distance to the Kaaba</dt><dd>{km:,.0f} km ({km * 0.621371:,.0f} miles)</dd></div>
    </dl>
    <h2>How to face the Qibla in {esc(c["name"])}</h2>
    <ol>
      <li>Open your phone's compass app and hold the phone flat.</li>
      <li>Turn slowly until the compass shows {b:.0f}°.</li>
      <li>The top of your phone now points to the Qibla.</li>
    </ol>
    <p>This is calculated for the centre of {esc(c["name"])}. Anywhere in the city the difference is a fraction of a degree.</p>
    {f'<p class="muted">Qibla in other cities in {esc(c["country"])}: {others}</p>' if others else ''}
    <p class="muted"><a href="{L["to"]("qibla")}">All cities</a> · <a href="{L["to"]("prayer-times/" + c["slug"])}">Prayer times in {esc(c["name"])}</a></p>
  </div>
</div></section>"""
            return page(L, "qibla", f"Qibla · {esc(c['country'])}", f"Qibla direction in {esc(c['name'])}",
                        f"The Qibla from {esc(c['name'])} is {b:.0f}° from north ({short}). Here is how to face it.", body,
                        cta(L, "Find the Qibla wherever you go", "Khalad shows a live Qibla compass from your exact location, plus prayer times on your lock screen. Free, no ads."))
        P[key] = (f"Qibla Direction in {c['name']}: {b:.0f}° from North · Khalad",
                  f"The Qibla direction in {c['name']}, {c['country']} is {b:.1f}° from true north ({short}). How to face it, distance to the Kaaba, and a live Qibla compass.", qcity)

    # ---------------- Prayer times ----------------
    pfaq = [
        ("Why are prayer times different between apps and masjids?",
         "Fajr and Isha depend on how far below the horizon the sun is, and organisations use different angles. Asr depends on the madhab. Small differences of a few minutes are normal; follow your local masjid when in doubt."),
        ("What is the difference between Hanafi and standard Asr?",
         "Standard (Shafi'i, Maliki and Hanbali) Asr begins when an object's shadow equals its length plus its noon shadow. Hanafi Asr begins when the shadow is twice the length, so it is later."),
        ("Which calculation method should I use?",
         "Use the method your local masjid follows. As a default, Khalad uses the usual method for your region, such as the University of Islamic Sciences, Karachi in Pakistan, ISNA in North America and the Moonsighting Committee in the UK."),
    ]
    FAQS["prayer-times"] = pfaq

    def pt_index(L):
        def fmt(c):
            return f'<span>{"Hanafi" if hanafi_for_tz(c["tz"]) else "Standard"} Asr</span>'
        body = f"""<section class="g-body"><div class="wrap prose">
  <p>Choose your city to see today's five prayer times and the week ahead, worked out for that city with the usual calculation method for the region. You can switch between Hanafi and standard Asr.</p>
  <h2>Prayer times by city</h2>
  {city_list(L, "prayer-times", fmt)}
  <h2>How prayer times are calculated</h2>
  <p>Each time follows the sun. <b>Fajr</b> begins at true dawn and <b>Isha</b> when the evening twilight has gone, both measured by the sun's angle below the horizon. <b>Dhuhr</b> is just after midday, <b>Asr</b> depends on the length of shadows, and <b>Maghrib</b> is at sunset.</p>
</div></section>
{faq_html(pfaq)}"""
        return page(L, "prayer-times", "Prayer times", "Prayer times today", "Accurate times for Fajr, Dhuhr, Asr, Maghrib and Isha in your city.", body,
                    cta(L, "The next prayer, right on your lock screen", "Khalad calculates prayer times from your exact location and shows the next one quietly on your lock screen. No adhan noise, no ads."))
    P["prayer-times"] = ("Prayer Times Today: Fajr, Dhuhr, Asr, Maghrib, Isha · Khalad",
                         "Today's prayer times for your city, with Hanafi or standard Asr and the usual calculation method for your region. Next prayer on your lock screen with Khalad.", pt_index)

    for c in cities:
        method = method_for_tz(c["tz"])
        hanafi = hanafi_for_tz(c["tz"])
        key = "prayer-times/" + c["slug"]
        cfg = json.dumps({"lat": c["lat"], "lng": c["lng"], "tz": c["tz"], "method": method, "hanafi": hanafi})

        def pcity(L, c=c, method=method, hanafi=hanafi, cfg=cfg):
            others = " ".join(f'<a href="{L["to"]("prayer-times/" + o["slug"])}">{esc(o["name"])}</a>' for o in cities if o["country"] == c["country"] and o is not c)
            body = f"""<section class="g-body"><div class="wrap">
  <div class="pt" id="pt" data-cfg='{cfg}'>
    <div class="pt-head">
      <p id="pt-date" class="muted">Today in {esc(c["name"])}</p>
      <div class="seg" role="group" aria-label="Asr method">
        <button type="button" data-asr="standard" aria-pressed="{str(not hanafi).lower()}">Standard Asr</button>
        <button type="button" data-asr="hanafi" aria-pressed="{str(hanafi).lower()}">Hanafi Asr</button>
      </div>
    </div>
    <ol class="pt-today" id="pt-today" aria-live="polite">
      <li><span>Fajr</span><b>…</b></li><li><span>Sunrise</span><b>…</b></li><li><span>Dhuhr</span><b>…</b></li>
      <li><span>Asr</span><b>…</b></li><li><span>Maghrib</span><b>…</b></li><li><span>Isha</span><b>…</b></li>
    </ol>
    <noscript><p>Turn on JavaScript to see today's prayer times.</p></noscript>
    <h2>The next 7 days</h2>
    <div class="table-scroll"><table class="pt-week" id="pt-week"><thead><tr><th>Date</th><th>Fajr</th><th>Sunrise</th><th>Dhuhr</th><th>Asr</th><th>Maghrib</th><th>Isha</th></tr></thead><tbody></tbody></table></div>
    <p class="muted">Times are for {esc(c["name"])} ({esc(c["tz"].replace("_", " "))}), using the {METHOD_NAMES[method]} method. Your local masjid may differ by a few minutes; follow it when in doubt.</p>
  </div>
  <div class="prose">
    {f'<p class="muted">Prayer times in other cities in {esc(c["country"])}: {others}</p>' if others else ''}
    <p class="muted"><a href="{L["to"]("prayer-times")}">All cities</a> · <a href="{L["to"]("qibla/" + c["slug"])}">Qibla direction in {esc(c["name"])}</a></p>
  </div>
</div></section>
{L["script"]("adhan.min.js")}
{L["script"]("prayer-times.js")}"""
            return page(L, "prayer-times", f"Prayer times · {esc(c['country'])}", f"Prayer times in {esc(c['name'])} today",
                        f"Fajr, Dhuhr, Asr, Maghrib and Isha in {esc(c['name'])}, using the {METHOD_NAMES[method]} method with {'Hanafi' if hanafi else 'standard'} Asr.", body,
                        cta(L, f"Never miss a prayer in {esc(c['name'])}", "Khalad keeps the next prayer on your lock screen and in a home-screen widget, and updates as you travel. Quiet, free, no ads."))
        P[key] = (f"Prayer Times in {c['name']} Today: Fajr, Asr, Maghrib, Isha · Khalad",
                  f"Today's prayer times in {c['name']}: Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha, with {'Hanafi' if hanafi else 'standard'} Asr and the next 7 days.", pcity)

    # ---------------- Islamic date ----------------
    def hijri_page(L):
        body = f"""<section class="g-body"><div class="wrap prose">
  <div class="today-card" id="hijri" aria-live="polite"><span class="muted" id="hijri-greg">Today</span><b id="hijri-date">…</b><span class="ar" lang="ar" dir="rtl" id="hijri-ar"></span></div>
  <noscript><p>Turn on JavaScript to see today's Islamic date.</p></noscript>
  <p>This is the calculated (tabular) Islamic date. The real start of each month depends on sighting the new moon, so your local date can be one day earlier or later. Follow your local masjid or moon-sighting committee for Ramadan and Eid.</p>
  <h2>The Islamic months</h2>
  <ol class="months">
    <li>Muharram</li><li>Safar</li><li>Rabi' al-Awwal</li><li>Rabi' al-Thani</li><li>Jumada al-Ula</li><li>Jumada al-Akhirah</li>
    <li>Rajab</li><li>Sha'ban</li><li>Ramadan</li><li>Shawwal</li><li>Dhul Qa'dah</li><li>Dhul Hijjah</li>
  </ol>
  <p class="muted">See also: <a href="{L["to"]("white-days-fasting")}">this month's white days</a>.</p>
</div></section>
{L["script"]("hijri.js")}"""
        return page(L, "islamic-date", "Hijri calendar", "Islamic date today", "Today's date in the Hijri calendar, with the twelve Islamic months.", body,
                    cta(L, "The Hijri date, every day", "Khalad shows today's Islamic date on your home screen and lets you adjust it by a day to match your local moon sighting."))
    P["islamic-date"] = ("Islamic Date Today (Hijri Date) · Khalad",
                         "What is the Islamic date today? Today's Hijri date, the twelve Islamic months, and a note on moon sighting.", hijri_page)

    # ---------------- White days ----------------
    wfaq = [
        ("What are the white days?", "The 13th, 14th and 15th of each Islamic (Hijri) month. They are called white because the moon is full and the nights are bright."),
        ("Is fasting the white days compulsory?", "No. It is a voluntary Sunnah fast. The Prophet ﷺ fasted three days each month, and advised the 13th, 14th and 15th when choosing three days."),
        ("Can I fast the white days in Dhul Hijjah?", "Not on the 13th of Dhul Hijjah, which is one of the days of Tashriq when fasting is not allowed. Many people fast other days that month instead."),
    ]
    FAQS["white-days-fasting"] = wfaq

    def white_days(L):
        body = f"""<section class="g-body"><div class="wrap prose">
  <h2>The next white days</h2>
  <div id="wd" class="wd" aria-live="polite"><p class="muted">Working out the dates…</p></div>
  <noscript><p>Turn on JavaScript to see the next dates.</p></noscript>
  <p class="muted">Dates use the calculated Hijri calendar and can move by a day with your local moon sighting. A fast starts at Fajr, so make your intention the night before.</p>
  <h2>What the hadith say</h2>
  {quote("nasai2424")}
  <p>The same advice is also narrated in Jami' at-Tirmidhi 761, which at-Tirmidhi graded hasan.</p>
  {quote("muslim1160")}
  <p>So any three days a month follow the Sunnah, and the 13th, 14th and 15th are the recommended ones.</p>
  <h2>When not to fast</h2>
  <ul><li>The 13th of Dhul Hijjah, one of the days of Tashriq.</li><li>The days of Eid.</li></ul>
  <p class="muted">See also: <a href="{L["to"]("monday-thursday-fasting")}">Monday and Thursday fasting</a> · <a href="{L["to"]("islamic-date")}">Islamic date today</a></p>
</div></section>
{faq_html(wfaq)}
{L["script"]("hijri.js")}"""
        return page(L, "white-days-fasting", "Sunnah fasts", "White days fasting (Ayyam al-Bid)",
                    "Fasting the 13th, 14th and 15th of each Islamic month: the next dates, the hadith, and when not to fast.", body,
                    cta(L, "Get reminded the evening before", "Khalad reminds you after Maghrib the night before each white day, skips Eid and Tashriq, and tells you when Suhoor ends."))
    P["white-days-fasting"] = ("White Days Fasting Dates (Ayyam al-Bid): 13th, 14th, 15th · Khalad",
                               "The next white days (Ayyam al-Bid) fasting dates, the authentic hadith about fasting the 13th, 14th and 15th, and when not to fast.", white_days)

    # ---------------- Monday & Thursday ----------------
    def mon_thu(L):
        body = f"""<section class="g-body"><div class="wrap prose">
  <p>Fasting on Mondays and Thursdays is a voluntary Sunnah fast that many Muslims keep through the year.</p>
  <h2>Why Monday and Thursday</h2>
  {quote("tirmidhi747")}
  {quote("muslim1162")}
  <h2>How to keep it</h2>
  <ul>
    <li>Make your intention the night before, and eat Suhoor before Fajr.</li>
    <li>Break your fast at Maghrib.</li>
    <li>Skip it on the days of Eid and the days of Tashriq. In Ramadan you are already fasting.</li>
  </ul>
  <p class="muted">See also: <a href="{L["to"]("white-days-fasting")}">White days fasting</a></p>
</div></section>"""
        return page(L, "monday-thursday-fasting", "Sunnah fasts", "Fasting on Mondays and Thursdays",
                    "Why the Prophet ﷺ fasted on Mondays and Thursdays, with the authentic hadith and how to keep the fast.", body,
                    cta(L, "Reminded every Sunday and Wednesday night", "Khalad reminds you after Maghrib the evening before each Monday and Thursday, with the time Suhoor ends. Free, no ads."))
    P["monday-thursday-fasting"] = ("Monday and Thursday Fasting: Hadith and How to Fast · Khalad",
                                    "The Sunnah of fasting on Mondays and Thursdays: the authentic hadith, why these days, and how to keep the fast, with reminders in Khalad.", mon_thu)

    # ---------------- Surah Al-Mulk ----------------
    mfaq = [
        ("When should I read Surah Al-Mulk?", "Many Muslims read it every night before sleeping, following the Sunnah of the Prophet ﷺ."),
        ("How long is Surah Al-Mulk?", "Surah Al-Mulk is the 67th surah of the Quran, with 30 ayat. It takes most people about 5 to 10 minutes to read."),
    ]
    FAQS["surah-al-mulk"] = mfaq

    def mulk(L):
        body = f"""<section class="g-body"><div class="wrap prose">
  <dl class="facts">
    <div><dt>Surah</dt><dd>67, Al-Mulk (The Dominion), also called Tabarak</dd></div>
    <div><dt>Ayat</dt><dd>30</dd></div>
    <div><dt>When</dt><dd>At night, before sleeping</dd></div>
  </dl>
  <h2>The virtue of Surah Al-Mulk</h2>
  {quote("tirmidhi2891")}
  <h2>The Sunnah of reading it at night</h2>
  {quote("tirmidhi2892")}
  <p>So the Sunnah is to read it every night, along with Surah As-Sajdah (32) if you can.</p>
  <p><a href="https://quran.com/67" rel="noopener">Read Surah Al-Mulk on Quran.com</a></p>
  <p class="muted">See also: <a href="{L["to"]("surah-al-kahf")}">Surah Al-Kahf on Friday</a> · <a href="{L["to"]("morning-evening-adhkar")}">Morning and evening adhkar</a></p>
</div></section>
{faq_html(mfaq)}"""
        return page(L, "surah-al-mulk", "Sunnah surahs", "Surah Al-Mulk at night",
                    "The virtue of Surah Al-Mulk and the Sunnah of reading it every night before sleeping, with authentic references.", body,
                    cta(L, "Never miss Surah Al-Mulk at night", "Khalad reminds you after Isha, opens the surah with Urdu or English translation, and marks it read. No ads."))
    P["surah-al-mulk"] = ("Surah Al-Mulk Before Sleeping: Virtue and Sunnah · Khalad",
                          "Why Muslims read Surah Al-Mulk every night before sleeping: the authentic hadith about its virtue, with a nightly reminder in Khalad.", mulk)

    # ---------------- Surah Al-Kahf ----------------
    kfaq = [
        ("When should I read Surah Al-Kahf?", "On Friday. Many Muslims read it in the morning or before Jummah."),
        ("How long is Surah Al-Kahf?", "Surah Al-Kahf is the 18th surah, with 110 ayat. Most people read it in about 30 to 45 minutes, and some split it across the day."),
    ]
    FAQS["surah-al-kahf"] = kfaq

    def kahf(L):
        body = f"""<section class="g-body"><div class="wrap prose">
  <dl class="facts">
    <div><dt>Surah</dt><dd>18, Al-Kahf (The Cave)</dd></div>
    <div><dt>Ayat</dt><dd>110</dd></div>
    <div><dt>When</dt><dd>Every Friday</dd></div>
  </dl>
  <h2>Light from one Friday to the next</h2>
  {quote("mishkat2175")}
  <h2>Protection from the Dajjal</h2>
  {quote("muslim809")}
  <p><a href="https://quran.com/18" rel="noopener">Read Surah Al-Kahf on Quran.com</a></p>
  <p class="muted">See also: <a href="{L["to"]("surah-al-mulk")}">Surah Al-Mulk at night</a></p>
</div></section>
{faq_html(kfaq)}"""
        return page(L, "surah-al-kahf", "Sunnah surahs", "Surah Al-Kahf on Friday",
                    "The virtue of reading Surah Al-Kahf every Friday, with authentic references.", body,
                    cta(L, "Your Friday Kahf reminder", "Khalad reminds you every Friday morning, opens Al-Kahf with translation and remembers where you stopped."))
    P["surah-al-kahf"] = ("Surah Al-Kahf on Friday: Virtue and Hadith · Khalad",
                          "Why Muslims read Surah Al-Kahf every Friday: the authentic hadith about light between two Fridays and protection from the Dajjal.", kahf)

    # ---------------- Morning & evening adhkar ----------------
    def adhkar(L):
        items = "".join(f"""<article class="dhikr">
  <h3>{esc(a["name"])}</h3>
  <p class="when">{esc(a["when"])}</p>
  <p class="translit">{esc(a["translit"])}</p>
  <p>{esc(a["meaning"])}</p>
  <p class="muted">{esc(a["virtue"])}</p>
  <p class="ref">{esc(a["ref"])}</p>
</article>""" for a in ADHKAR)
        body = f"""<section class="g-body"><div class="wrap prose">
  <p>The morning adhkar are said after Fajr until sunrise or later in the morning, and the evening adhkar after Asr until Maghrib or into the night. Here are four of the best-known, each with its reference.</p>
  <div class="dhikrs">{items}</div>
  <p class="muted">Transliterations help with pronunciation; read the Arabic where you can. See also: <a href="{L["to"]("daily-duas")}">Daily duas</a> · <a href="{L["to"]("tasbih")}">Online tasbih</a></p>
</div></section>"""
        return page(L, "morning-evening-adhkar", "Adhkar", "Morning and evening adhkar",
                    "Authentic morning and evening remembrance from the Sunnah, with meaning, how many times, and references.", body,
                    cta(L, "Your adhkar, counted for you", "Khalad has the full morning, evening and night adhkar in Arabic, counts each one with a tap and reminds you at the right time."))
    P["morning-evening-adhkar"] = ("Morning and Evening Adhkar with References · Khalad",
                                   "Authentic morning and evening adhkar: Sayyid al-Istighfar, the three Quls and more, with meaning, how many times and hadith references.", adhkar)

    # ---------------- Daily duas ----------------
    def duas(L):
        items = "".join(f"""<article class="dhikr">
  <h3>{esc(d["name"])}</h3>
  <p class="translit">{esc(d["translit"])}</p>
  <p>{esc(d["meaning"])}</p>
  {f'<p class="muted">{esc(d["note"])}</p>' if d.get("note") else ''}
  <p class="ref">{esc(d["ref"])}</p>
</article>""" for d in DUAS)
        body = f"""<section class="g-body"><div class="wrap prose">
  <p>Short supplications from the Sunnah for the everyday moments of your day, each with its reference.</p>
  <div class="dhikrs">{items}</div>
  <p class="muted">See also: <a href="{L["to"]("morning-evening-adhkar")}">Morning and evening adhkar</a></p>
</div></section>"""
        return page(L, "daily-duas", "Duas", "Daily duas from the Sunnah",
                    "Duas for sleeping, waking up, leaving the house and using the toilet, with meaning and references.", body,
                    cta(L, "Every dua, in Arabic, in your pocket", "Khalad has everyday duas in Arabic with transliteration and meaning, ready when you need them. Free, no ads."))
    P["daily-duas"] = ("Daily Duas: Sleeping, Waking, Leaving Home · Khalad",
                       "Authentic daily duas from the Sunnah: before sleeping, after waking, leaving the house and using the toilet, with meaning and references.", duas)

    # ---------------- Tasbih ----------------
    def tasbih(L):
        body = f"""<section class="g-body"><div class="wrap">
  <div class="tb" id="tb">
    <div class="seg" role="group" aria-label="Dhikr">
      <button type="button" data-i="0" aria-pressed="true">SubhanAllah</button>
      <button type="button" data-i="1" aria-pressed="false">Alhamdulillah</button>
      <button type="button" data-i="2" aria-pressed="false">Allahu Akbar</button>
    </div>
    <button type="button" class="tb-tap" id="tb-tap" aria-label="Count one">
      <span class="tb-count" id="tb-count">0</span><span class="tb-of" id="tb-of">of 33</span>
    </button>
    <p class="muted tb-hint">Tap the circle, or press the space bar. <button type="button" class="linkish" id="tb-reset">Reset</button></p>
    <p class="muted" id="tb-total" aria-live="polite"></p>
  </div>
  <div class="prose">
    <h2>The tasbih after salah</h2>
    <p>After each fard prayer, many Muslims say SubhanAllah 33 times, Alhamdulillah 33 times and Allahu Akbar 34 times. This counter moves to the next phrase automatically.</p>
  </div>
</div></section>
{L["script"]("tasbih.js")}"""
        return page(L, "tasbih", "Online tasbih", "Online tasbih counter", "A simple digital tasbih: tap to count SubhanAllah, Alhamdulillah and Allahu Akbar.", body,
                    cta(L, "A tasbih that remembers", "Khalad's tasbih works offline with gentle vibration, and every completed round keeps your streak going."))
    P["tasbih"] = ("Online Tasbih Counter (Digital Tasbeeh) · Khalad",
                   "A free online tasbih counter: tap to count SubhanAllah 33, Alhamdulillah 33 and Allahu Akbar 34. Works on your phone.", tasbih)

    return P, FAQS
