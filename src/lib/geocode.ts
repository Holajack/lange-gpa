/**
 * City → approximate coordinates, for placing real people on the /world globe.
 *
 * PRIVACY: this resolves a CITY NAME to that city's centre only — never a
 * person's exact location, and it sends nothing but the public city string to
 * the geocoder (no IP, no account, no tracking). Results are cached in
 * localStorage so a given city is looked up once per browser.
 *
 * Uses Open-Meteo's free geocoding API (no key, CORS-enabled).
 */

export type Coord = { lat: number; lng: number };

const mem = new Map<string, Coord | null>();
const LS_KEY = "nuri.geocode.v1";

function loadCache(): Record<string, Coord> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, Coord>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(cache));
  } catch {
    /* private mode / quota — in-memory cache still applies */
  }
}

const keyFor = (city: string, country?: string) =>
  `${city.trim().toLowerCase()}|${(country ?? "").trim().toLowerCase()}`;

/** Resolve a city (optionally disambiguated by country) to its centre coords. */
export async function geocodeCity(city: string, country?: string): Promise<Coord | null> {
  const city0 = city?.trim();
  if (!city0) return null;
  const key = keyFor(city0, country);

  if (mem.has(key)) return mem.get(key) ?? null;
  const cache = loadCache();
  if (cache[key]) {
    mem.set(key, cache[key]);
    return cache[key];
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city0)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    const json = (await res.json()) as {
      results?: { latitude: number; longitude: number; country?: string; country_code?: string }[];
    };
    const results = json.results ?? [];
    let hit = results[0];
    if (country && results.length > 1) {
      const c = country.trim().toLowerCase();
      hit =
        results.find(
          (r) => (r.country ?? "").toLowerCase() === c || (r.country_code ?? "").toLowerCase() === c
        ) ?? results[0];
    }
    const coord: Coord | null = hit ? { lat: hit.latitude, lng: hit.longitude } : null;
    mem.set(key, coord);
    if (coord) {
      cache[key] = coord;
      saveCache(cache);
    }
    return coord;
  } catch {
    mem.set(key, null); // don't hammer a failing endpoint this session
    return null;
  }
}
