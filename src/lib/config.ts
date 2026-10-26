// Public configuration. The Supabase "publishable" key is designed to ship inside apps:
// it can only do what Row Level Security allows (see supabase/migrations/0001_init.sql).
// NEVER put the service_role / secret key in this app.
export const SUPABASE_URL = 'https://jdcnyhudkgeuqqhqnghz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_RGt0La7_l8xvo2XNUm3p3Q_V7qUYj8z';

export const QURAN_API = 'https://api.quran.com/api/v4';

export const SUPPORT_EMAIL = 'khalad.global@gmail.com';
// Our website (Vercel). khalad.app is no longer ours: never link to it.
export const WEBSITE_URL = 'https://khalad-global.vercel.app';
export const PRIVACY_URL = `${WEBSITE_URL}/privacy`;
export const TERMS_URL = `${WEBSITE_URL}/terms`;
