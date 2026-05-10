export function calculateDistanceKm(
  userLat: number,
  userLng: number,
  eventLat: number,
  eventLng: number
): number {
  const R = 6371;
  const dLat = toRad(eventLat - userLat);
  const dLng = toRad(eventLng - userLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userLat)) * Math.cos(toRad(eventLat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
