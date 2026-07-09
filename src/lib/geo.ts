// Haversine distance between two lat/lng points, in metres.
export function haversineMeters(
  aLat: number, aLng: number, bLat: number, bLng: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Parse a lat/lng out of pasted text: plain "12.97, 77.59", or a Google Maps
// URL (q=, query=, ll=, or @lat,lng, or /maps/place/.../@lat,lng). Returns null
// if nothing parseable (e.g. a maps.app.goo.gl short link that needs resolving).
export function parseLatLng(input: string): { lat: number; lng: number } | null {
  if (!input) return null;
  const s = input.trim();

  const valid = (lat: number, lng: number) =>
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;

  // Google Maps URL params: q= / query= / ll=
  const param = s.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+)[,%C]+\s*(-?\d+\.\d+)/i)
    || s.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (param) { const r = valid(parseFloat(param[1]), parseFloat(param[2])); if (r) return r; }

  // @lat,lng in a /maps/... path
  const at = s.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (at) { const r = valid(parseFloat(at[1]), parseFloat(at[2])); if (r) return r; }

  // Bare "lat, lng"
  const bare = s.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (bare) { const r = valid(parseFloat(bare[1]), parseFloat(bare[2])); if (r) return r; }

  // First two decimals anywhere (last resort)
  const nums = s.match(/-?\d+\.\d+/g);
  if (nums && nums.length >= 2) return valid(parseFloat(nums[0]), parseFloat(nums[1]));

  return null;
}

export const DEFAULT_GEOFENCE_M = 150;
