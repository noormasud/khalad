"""Build Khalad's content from the old app's spreadsheets (converted to JSON).

Outputs
  src/data/bundled-content.json  offline copy shipped inside the app
  supabase/seed.sql              the same content for your Supabase project

Run:  python3 scripts/build_content.py
Hadith and Sunnah rows are imported with verified = false. They only appear
in the app after someone qualified checks the wording and reference and
ticks `verified` in Supabase.
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "content", "source")


def load(name, sheet):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return json.load(f)[sheet]


def num(v):
    if v in (None, ""):
        return None
    return int(float(v))


def clean(v):
    if v is None:
        return None
    v = str(v).replace(" ", " ").strip()
    return v or None


def item(row, sort, *, title_key="Title", type_key="actiontype", surah="Surah",
         vf="startingVerse", vt="endingVerse", ar="arabic"):
    t = (clean(row.get(type_key)) or "dhikr").lower()
    typ = "quran" if t == "quran" else "dua"
    out = {
        "sort": sort,
        "type": typ,
        "title": clean(row.get(title_key)),
        "arabic": clean(row.get(ar) or row.get(ar.capitalize())),
        "translation": clean(row.get("Translation")),
        "transliteration": clean(row.get("Transliteration")),
        "reference": None,
        "repeat": num(row.get("Count")) or 1,
        "surah": num(row.get(surah)),
        "verse_from": num(row.get(vf)),
        "verse_to": num(row.get(vt)),
    }
    if typ == "quran":
        # Quran text always comes from the Quran.com API, never from a spreadsheet.
        out["arabic"] = None
        out["translation"] = None
        out["transliteration"] = None
    return out


sets = []
items = {}

# Daily adhkar ----------------------------------------------------------------
daily = load("daily_challanges.json", "Daily challenges")
SET_MAP = {
    "Morning Recitations": ("morning", "Morning adhkar", "After Fajr", "morning"),
    "Evening Recitations": ("evening", "Evening adhkar", "After Asr", "evening"),
    "Nightly Recitations": ("night", "Night adhkar", "Before sleeping", "night"),
}
for i, (src, (key, title, sub, tod)) in enumerate(SET_MAP.items()):
    sets.append({"key": key, "title": title, "subtitle": sub, "category": "daily",
                 "time_of_day": tod, "weekdays": None, "sort": i})
    rows = [r for r in daily if r.get("Challenge") == src]
    lst = []
    for r in rows:
        # Al-Mulk and As-Sajdah are separate Sunnah reminders, not part of the set.
        if src == "Nightly Recitations" and num(r.get("Surah")) in (67, 32):
            continue
        lst.append(item(r, len(lst)))
    items[key] = lst

sets.append({"key": "friday", "title": "Friday salawat", "subtitle": "Send blessings on the Prophet ﷺ",
             "category": "daily", "time_of_day": "any", "weekdays": [5], "sort": 3})
items["friday"] = [item(r, 0) for r in daily
                   if r.get("Challenge") == "Friday Recitations" and r.get("actiontype") == "dhikr"]

# After salah (identical for all five prayers in the source) -------------------
namaz = load("duas_for_namaz.json", "Namaz Dua")
sets.append({"key": "after_salah", "title": "After salah", "subtitle": "Adhkar after the fard prayer",
             "category": "after_salah", "time_of_day": "any", "weekdays": None, "sort": 10})
items["after_salah"] = [item(r, i, ar="Arabic") for i, r in enumerate(r for r in namaz if r.get("Namaz") == "Fajr")]

# Everyday duas: one set per dua ------------------------------------------------
for i, r in enumerate(load("duas.json", "Duas")):
    slug = re.sub(r"[^a-z0-9]+", "_", r["MainHeading"].lower()).strip("_")
    key = "dua_" + re.sub(r"^dua_", "", slug)[:30]
    sets.append({"key": key, "title": clean(r["MainHeading"]), "subtitle": clean(r.get("SubHeading")),
                 "category": "duas", "time_of_day": "any", "weekdays": None, "sort": 20 + i})
    items[key] = [item(r, 0, title_key="MainHeading")]

# Dhul Hijjah challenges -------------------------------------------------------
zil = load("dynamic_challange.json", "Zilhaj Challenge")
challenges = []
seen = {}
for r in zil:
    title = clean(r["Challenge"])
    days = sorted({int(float(d)) for d in str(r.get("todays_date", "")).split(",") if d.strip()})
    if title not in seen:
        set_key = None
        if r.get("actionType") or r.get("Arabic"):
            set_key = "zilhaj_" + re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")[:28]
            sets.append({"key": set_key, "title": title, "subtitle": clean(r.get("subTitle")),
                         "category": "seasonal", "time_of_day": "any", "weekdays": None, "sort": 40 + len(seen)})
            items[set_key] = []
        seen[title] = set_key
        challenges.append({"title": title, "subtitle": clean(r.get("subTitle")), "hijri_month": 12,
                           "hijri_days": days, "set_key": set_key, "sort": len(challenges)})
    sk = seen[title]
    if sk:
        items[sk].append(item(r, len(items[sk]), type_key="actionType", surah="surah",
                              vf="startingverse", vt="endingverse", ar="Arabic"))

# Sunnah reminders (rules) -----------------------------------------------------
reminders = [
    {"key": "kahf", "title": "Surah Al-Kahf", "subtitle": "Fridays", "rule": "weekly", "weekdays": [5],
     "hijri_days": None, "anchor": "sunrise", "offset_min": 60, "surah": 18, "set_key": None, "on_by_default": True, "sort": 0},
    {"key": "mulk", "title": "Surah Al-Mulk", "subtitle": "Every night", "rule": "daily", "weekdays": None,
     "hijri_days": None, "anchor": "isha", "offset_min": 45, "surah": 67, "set_key": None, "on_by_default": True, "sort": 1},
    {"key": "sajdah", "title": "Surah As-Sajdah", "subtitle": "At night, before sleeping", "rule": "daily", "weekdays": None,
     "hijri_days": None, "anchor": "isha", "offset_min": 45, "surah": 32, "set_key": None, "on_by_default": False, "sort": 2},
    {"key": "fast_mon_thu", "title": "Monday & Thursday fasts", "subtitle": "Reminder the evening before", "rule": "weekly",
     "weekdays": [0, 3], "hijri_days": None, "anchor": "maghrib", "offset_min": 30, "surah": None, "set_key": None, "on_by_default": False, "sort": 3},
    {"key": "white_days", "title": "White days fasts", "subtitle": "13th–15th of each Hijri month", "rule": "hijri_monthly",
     "weekdays": None, "hijri_days": [12, 13, 14], "anchor": "maghrib", "offset_min": 30, "surah": None, "set_key": None, "on_by_default": False, "sort": 4},
    {"key": "friday_salawat", "title": "Friday salawat", "subtitle": "Send blessings on the Prophet ﷺ", "rule": "weekly",
     "weekdays": [5], "hijri_days": None, "anchor": "dhuhr", "offset_min": 0, "surah": None, "set_key": "friday", "on_by_default": False, "sort": 5},
]

# Hadith / Sunnah (unverified until checked) -----------------------------------
REF = re.compile(r"\(Ref:\s*([^)]+)\)\s*$")


def split_ref(t):
    t = clean(t)
    m = REF.search(t)
    ref = m.group(1).strip() if m else None
    body = REF.sub("", t).strip() if m else t
    return body, ref


daily_items = []
for r in load("Hadith_Of_Day.json", "Hadith"):
    body, ref = split_ref(r["Hadith"])
    daily_items.append({"kind": "hadith", "text": body, "reference": ref})
for r in load("Sunnah.json", "Sunnah List"):
    body, ref = split_ref(r["Sunnah"])
    daily_items.append({"kind": "sunnah", "text": body, "reference": ref})

# Bundled copy (no hadith: those must be verified first) ------------------------
bundle = {
    "version": 1,
    "adhkar_sets": sets,
    "adhkar_items": [dict(it, set_key=k) for k, lst in items.items() for it in lst],
    "sunnah_reminders": reminders,
    "seasonal_challenges": challenges,
    "daily_items": [],
    "ummah_goals": [],
}
os.makedirs(os.path.join(ROOT, "src", "data"), exist_ok=True)
with open(os.path.join(ROOT, "src", "data", "bundled-content.json"), "w", encoding="utf-8") as f:
    json.dump(bundle, f, ensure_ascii=False, indent=1)


# SQL seed ---------------------------------------------------------------------
def q(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, int):
        return str(v)
    if isinstance(v, list):
        return "array[" + ",".join(str(int(x)) for x in v) + "]::smallint[]"
    return "'" + str(v).replace("'", "''") + "'"


lines = ["-- Generated by scripts/build_content.py. Safe to re-run: clears and reloads content.",
         "begin;",
         "delete from public.seasonal_challenges;",
         "delete from public.sunnah_reminders;",
         "delete from public.adhkar_items;",
         "delete from public.adhkar_sets;",
         "delete from public.daily_items where verified = false;"]
for s in sets:
    lines.append("insert into public.adhkar_sets (key,title,subtitle,category,time_of_day,weekdays,sort) values (%s);"
                 % ",".join(q(s[k]) for k in ("key", "title", "subtitle", "category", "time_of_day", "weekdays", "sort")))
for it in bundle["adhkar_items"]:
    cols = ("set_key", "sort", "type", "title", "arabic", "translation", "transliteration", "reference",
            "repeat", "surah", "verse_from", "verse_to")
    lines.append("insert into public.adhkar_items (%s) values (%s);" % (",".join(cols), ",".join(q(it[c]) for c in cols)))
for r in reminders:
    cols = ("key", "title", "subtitle", "rule", "weekdays", "hijri_days", "anchor", "offset_min", "surah", "set_key",
            "on_by_default", "sort")
    lines.append("insert into public.sunnah_reminders (%s) values (%s);" % (",".join(cols), ",".join(q(r[c]) for c in cols)))
for c in challenges:
    cols = ("title", "subtitle", "hijri_month", "hijri_days", "set_key", "sort")
    lines.append("insert into public.seasonal_challenges (%s) values (%s);" % (",".join(cols), ",".join(q(c[k]) for k in cols)))
for i, d in enumerate(daily_items):
    lines.append("insert into public.daily_items (kind,text,reference,verified,sort) values (%s,%s,%s,false,%d);"
                 % (q(d["kind"]), q(d["text"]), q(d["reference"]), i))
lines.append("commit;")
with open(os.path.join(ROOT, "supabase", "seed.sql"), "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"sets={len(sets)} items={len(bundle['adhkar_items'])} reminders={len(reminders)} "
      f"challenges={len(challenges)} daily_items={len(daily_items)}")
