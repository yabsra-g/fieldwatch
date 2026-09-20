import { GeoLocation } from '../types';

const EARTH_RADIUS_KM = 6371.0;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180.0;
}

function toDegrees(radians: number): number {
  return (radians * 180.0) / Math.PI;
}

/**
 * Calculates great-circle distance between two geographic coordinates using Haversine formula.
 */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function distanceBetween(loc1: GeoLocation, loc2: GeoLocation): number {
  return distanceKm(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude);
}

/**
 * Computes geographic centroid of a collection of locations.
 */
export function calculateCentroid(locations: GeoLocation[]): GeoLocation {
  if (locations.length === 0) {
    return { latitude: 0, longitude: 0, district: '', village: '' };
  }

  let totalX = 0;
  let totalY = 0;
  let totalZ = 0;

  for (const loc of locations) {
    const latRad = toRadians(loc.latitude);
    const lonRad = toRadians(loc.longitude);
    totalX += Math.cos(latRad) * Math.cos(lonRad);
    totalY += Math.cos(latRad) * Math.sin(lonRad);
    totalZ += Math.sin(latRad);
  }

  const total = locations.length;
  const avgX = totalX / total;
  const avgY = totalY / total;
  const avgZ = totalZ / total;

  const lon = toDegrees(Math.atan2(avgY, avgX));
  const hyp = Math.sqrt(avgX * avgX + avgY * avgY);
  const lat = toDegrees(Math.atan2(avgZ, hyp));

  const sample = locations[0];
  return {
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lon.toFixed(6)),
    accuracyMeters: 5.0,
    district: sample.district,
    village: `Cluster Center (${locations.length} reports)`,
  };
}
