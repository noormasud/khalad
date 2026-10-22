// Cities for manual selection and for naming the user's location offline
// (we never send coordinates to a geocoding service).
export type City = { name: string; country: string; lat: number; lng: number; tz: string };

export const CITIES: City[] = [
  { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011, tz: 'Asia/Karachi' },
  { name: 'Lahore', country: 'Pakistan', lat: 31.5204, lng: 74.3587, tz: 'Asia/Karachi' },
  { name: 'Islamabad', country: 'Pakistan', lat: 33.6844, lng: 73.0479, tz: 'Asia/Karachi' },
  { name: 'Rawalpindi', country: 'Pakistan', lat: 33.5651, lng: 73.0169, tz: 'Asia/Karachi' },
  { name: 'Faisalabad', country: 'Pakistan', lat: 31.4504, lng: 73.135, tz: 'Asia/Karachi' },
  { name: 'Multan', country: 'Pakistan', lat: 30.1575, lng: 71.5249, tz: 'Asia/Karachi' },
  { name: 'Peshawar', country: 'Pakistan', lat: 34.0151, lng: 71.5249, tz: 'Asia/Karachi' },
  { name: 'Quetta', country: 'Pakistan', lat: 30.1798, lng: 66.975, tz: 'Asia/Karachi' },
  { name: 'Hyderabad', country: 'Pakistan', lat: 25.396, lng: 68.3578, tz: 'Asia/Karachi' },
  { name: 'Sialkot', country: 'Pakistan', lat: 32.4945, lng: 74.5229, tz: 'Asia/Karachi' },
  { name: 'Gujranwala', country: 'Pakistan', lat: 32.1877, lng: 74.1945, tz: 'Asia/Karachi' },
  { name: 'London', country: 'United Kingdom', lat: 51.5072, lng: -0.1276, tz: 'Europe/London' },
  { name: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904, tz: 'Europe/London' },
  { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426, tz: 'Europe/London' },
  { name: 'Bradford', country: 'United Kingdom', lat: 53.796, lng: -1.7594, tz: 'Europe/London' },
  { name: 'Leeds', country: 'United Kingdom', lat: 53.8008, lng: -1.5491, tz: 'Europe/London' },
  { name: 'Glasgow', country: 'United Kingdom', lat: 55.8642, lng: -4.2518, tz: 'Europe/London' },
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.006, tz: 'America/New_York' },
  { name: 'Houston', country: 'United States', lat: 29.7604, lng: -95.3698, tz: 'America/Chicago' },
  { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298, tz: 'America/Chicago' },
  { name: 'Dallas', country: 'United States', lat: 32.7767, lng: -96.797, tz: 'America/Chicago' },
  { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437, tz: 'America/Los_Angeles' },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832, tz: 'America/Toronto' },
  { name: 'Mississauga', country: 'Canada', lat: 43.589, lng: -79.6441, tz: 'America/Toronto' },
  { name: 'Calgary', country: 'Canada', lat: 51.0447, lng: -114.0719, tz: 'America/Edmonton' },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
  { name: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lng: 54.3773, tz: 'Asia/Dubai' },
  { name: 'Sharjah', country: 'UAE', lat: 25.3463, lng: 55.4209, tz: 'Asia/Dubai' },
  { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753, tz: 'Asia/Riyadh' },
  { name: 'Jeddah', country: 'Saudi Arabia', lat: 21.4858, lng: 39.1925, tz: 'Asia/Riyadh' },
  { name: 'Makkah', country: 'Saudi Arabia', lat: 21.4225, lng: 39.8262, tz: 'Asia/Riyadh' },
  { name: 'Madinah', country: 'Saudi Arabia', lat: 24.4672, lng: 39.6111, tz: 'Asia/Riyadh' },
  { name: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.531, tz: 'Asia/Qatar' },
  { name: 'Kuwait City', country: 'Kuwait', lat: 29.3759, lng: 47.9774, tz: 'Asia/Kuwait' },
  { name: 'Muscat', country: 'Oman', lat: 23.588, lng: 58.3829, tz: 'Asia/Muscat' },
  { name: 'Manama', country: 'Bahrain', lat: 26.2285, lng: 50.586, tz: 'Asia/Bahrain' },
];

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(bLat - aLat);
  const dLng = r(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** A friendly place name for coordinates, without any network lookup. */
export function placeLabel(lat: number, lng: number): string {
  let best: City | null = null;
  let bestD = Infinity;
  for (const c of CITIES) {
    const d = distanceKm(lat, lng, c.lat, c.lng);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  if (!best) return 'Your location';
  if (bestD <= 40) return best.name;
  if (bestD <= 150) return `Near ${best.name}`;
  return 'Your location';
}
