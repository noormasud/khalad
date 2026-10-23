-- Remote update switch read by the app at launch (Android).
--   min_version_code    : versions BELOW this are blocked with an "Update" screen (force update)
--   latest_version_code : versions below this see a gentle "new version" card on Today
--   message             : optional text shown with it (max 200 chars)
-- Version codes: 2.0.0 = 100. Each new Play upload must use a higher versionCode (app.json).
--
-- To FORCE everyone below 101 to update, after 101 is live on Play:
--   update public.app_config set value = jsonb_set(value, '{min_version_code}', '101') where key = 'android_update';
insert into public.app_config (key, value)
values ('android_update', '{"min_version_code": 1, "latest_version_code": 100, "message": ""}'::jsonb)
on conflict (key) do nothing;
