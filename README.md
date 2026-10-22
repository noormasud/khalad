# Khalad

A calm Islamic daily companion: Quran reading with streaks, quiet prayer times, Sunnah reminders and private deeds. No ads, no tracking SDKs.

Built with Expo (React Native) for Android first; the same code runs on iOS.

## What's inside

| Area | Where |
| --- | --- |
| Onboarding (welcome, location, Asr method, reading goal, lock-screen line) | `app/onboarding/` |
| Today, Quran, Deeds, More tabs | `app/(tabs)/` |
| Quran reader (Quran.com text, Urdu/English translation, fonts, Taraweeh mode) | `app/surah/[id].tsx` |
| Adhkar / duas reader (tap to count, swipe) | `app/adhkar/[key].tsx` |
| Duas, Tasbih, Qibla, Streak, Secret sadaqah, Supporter, About | `app/*.tsx` |
| Prayer times (Adhan library, on-device) | `src/lib/prayer.ts` |
| Quiet notifications (next-prayer line, Sunnah reminders) | `src/lib/schedule.ts`, `src/lib/notifications.ts` |
| Content from Supabase with offline copy | `src/lib/content.ts`, `src/data/bundled-content.json` |
| Database schema + Row Level Security | `supabase/migrations/0001_init.sql` |
| Content seed (from the old app's spreadsheets) | `supabase/seed.sql`, `scripts/build_content.py` |

## 1. Run it on your phone (Mac Terminal)

You need Node 20+ (you have it) and the Expo Go app is NOT enough for notifications, so use a development build or a preview APK.

```bash
git clone https://github.com/noormasud/khalad.git
cd khalad
npm install
npx expo install --fix      # aligns every package with the Expo SDK version
npm run check               # TypeScript + unit tests + expo-doctor
npx expo start              # opens the dev server
```

For a real Android test install (APK you can send to your phone):

```bash
npm install -g eas-cli
eas login                   # free Expo account
eas init                    # links the project, fills in extra.eas.projectId
eas build -p android --profile preview
```

## 2. Set up Supabase (once)

1. Supabase dashboard → SQL editor → paste and run `supabase/migrations/0001_init.sql`.
2. Run `supabase/seed.sql` the same way (loads adhkar, duas, Sunnah reminders, Dhul Hijjah challenges, and the old hadith/Sunnah lists).
3. Authentication → Sign In / Providers → turn on **Allow anonymous sign-ins** (used only for the Ummah-goal counter's daily cap).
4. Hadith and Sunnah rows are imported with `verified = false` and **do not appear in the app** until someone qualified checks the wording and reference and ticks `verified` in the `daily_items` table.

Adding content later needs no app update: add rows in the Table Editor.

- New Ummah goal → `ummah_goals` (title, target, start and end dates, optional surah).
- New reminder → `sunnah_reminders` (rule `daily` / `weekly` / `hijri_monthly`, anchor prayer, minutes after).
- New dua set → `adhkar_sets` + `adhkar_items`. For Quran items set `type = quran` with surah and verse range; the text always comes from Quran.com.
- Seasonal challenge → `seasonal_challenges` (Hijri month and days).

The app only ever holds the publishable key. Never put the `service_role` / secret key in the app or in this repo.

## 3. Release to Google Play (same listing, as an update)

```bash
eas build -p android --profile production     # makes the .aab
```

- Package name is `com.islamicapp.khalad` (your existing listing).
- `android.versionCode` in `app.json` is 100; it must be higher than the live version's code (check Play Console → App bundle explorer).
- Signing: Play Console → Test and release → App integrity. If Play App Signing is on, upload with your upload key. In `eas credentials` choose to use your existing upload keystore; if it's lost, request an upload key reset there first.
- Upload the .aab to the Internal testing track first, install it over the current version on a phone, check nothing is lost, then promote to Production with a staged rollout (10% → 50% → 100%).
- Update the store listing (screenshots, description) and the Data safety form: location used on device only (not collected), optional anonymous app activity, no ads.

## Content authenticity

- Quran Arabic text and translations come only from the Quran.com API (Quran Foundation), unchanged. Every downloaded surah is checked for the right number of verses and order before it is shown or saved.
- The Bismillah header is taken from 1:1 as supplied, never typed by hand.
- Hadith/Sunnah only show once marked verified.
- Before launch, have a scholar review: the adhkar wording and counts in `adhkar_items`, and the after-salah set (100× items).

## Tests

`npm test` runs the logic tests in `__tests__/` (streaks, Hijri dates, Quran text checks, notification timing, content integrity).

## Rebuild content from the spreadsheets

```bash
npm run content     # regenerates src/data/bundled-content.json and supabase/seed.sql
```
