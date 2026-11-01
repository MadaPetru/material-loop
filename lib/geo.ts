const EARTH_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Privacy jitter so public pins are approximate, not exact addresses. */
export function approximateCoords(lat: number, lng: number, seed = Math.random()) {
  const angle = seed * Math.PI * 2;
  const distanceKm = 0.3 + seed * 0.5; // 300–800 m
  const dLat = (distanceKm / EARTH_KM) * (180 / Math.PI);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  return {
    lat: lat + dLat * Math.cos(angle),
    lng: lng + dLng * Math.sin(angle),
  };
}

export function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
