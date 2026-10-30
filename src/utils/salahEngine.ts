/**
 * Pure TypeScript Prayer Times Calculation Engine
 * Supports ISNA, MWL, Umm Al-Qura, Egyptian, Karachi, Tehran, Jafari calculation methods
 * Asr Juristic methods: Standard (Shafi/Hanbali/Maliki - shadow length 1) and Hanafi (shadow length 2)
 * High latitude adjustments and Qibla direction relative to Kaaba in Makkah
 */

export type CalculationMethod = 'ISNA' | 'MWL' | 'UmmAlQura' | 'Egyptian' | 'Karachi' | 'Tehran' | 'Jafari';
export type AsrMethod = 'Standard' | 'Hanafi';

export interface LocationConfig {
  latitude: number;
  longitude: number;
  cityName: string;
  timezoneOffset?: number; // hours offset from UTC
}

export interface CalculationParams {
  fajrAngle: number;
  ishaAngle?: number;
  ishaIntervalMinutes?: number; // e.g. 90 mins after Maghrib for Umm Al-Qura
  maghribAngle?: number;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  tahajjud: string;
  fajrDate: Date;
  sunriseDate: Date;
  dhuhrDate: Date;
  asrDate: Date;
  maghribDate: Date;
  ishaDate: Date;
  tahajjudDate: Date;
}

export const CALCULATION_METHODS: Record<CalculationMethod, { name: string; params: CalculationParams }> = {
  ISNA: {
    name: 'Islamic Society of North America (ISNA)',
    params: { fajrAngle: 15, ishaAngle: 15 },
  },
  MWL: {
    name: 'Muslim World League (MWL)',
    params: { fajrAngle: 18, ishaAngle: 17 },
  },
  UmmAlQura: {
    name: 'Umm Al-Qura University, Makkah',
    params: { fajrAngle: 18.5, ishaIntervalMinutes: 90 },
  },
  Egyptian: {
    name: 'Egyptian General Authority of Survey',
    params: { fajrAngle: 19.5, ishaAngle: 17.5 },
  },
  Karachi: {
    name: 'University of Islamic Sciences, Karachi',
    params: { fajrAngle: 18, ishaAngle: 18 },
  },
  Tehran: {
    name: 'Institute of Geophysics, University of Tehran',
    params: { fajrAngle: 17.7, maghribAngle: 4.5, ishaAngle: 14 },
  },
  Jafari: {
    name: 'Shia Ithna-Ashari, Leva Institute, Qum',
    params: { fajrAngle: 16, maghribAngle: 4, ishaAngle: 14 },
  },
};

// Kaaba location: 21.4225° N, 39.8262° E
const MAKKAH_LAT = 21.4225;
const MAKKAH_LNG = 39.8262;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

function normalizeAngle(angle: number): number {
  return angle - 360 * Math.floor(angle / 360);
}

function normalizeHours(hours: number): number {
  return hours - 24 * Math.floor(hours / 24);
}

/**
 * Calculate Solar declination & Equation of Time for a given Julian Date
 */
function sunPosition(julianDate: number) {
  const D = julianDate - 2451545.0;
  const g = normalizeAngle(357.529 + 0.98560028 * D);
  const q = normalizeAngle(280.459 + 0.98564736 * D);
  const L = normalizeAngle(q + 1.915 * Math.sin(toRad(g)) + 0.02 * Math.sin(toRad(2 * g)));

  const e = 23.439 - 0.00000036 * D; // Obliquity of the ecliptic
  const RA = toDeg(Math.atan2(Math.cos(toRad(e)) * Math.sin(toRad(L)), Math.cos(toRad(L)))) / 15;
  const declination = toDeg(Math.asin(Math.sin(toRad(e)) * Math.sin(toRad(L))));

  const eqTime = q / 15 - normalizeHours(RA);
  return { declination, eqTime: eqTime > 12 ? eqTime - 24 : eqTime < -12 ? eqTime + 24 : eqTime };
}

function julianDay(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/**
 * Compute time for given sun altitude angle
 */
function sunAngleTime(angle: number, lat: number, declination: number, direction: 'ccw' | 'cw'): number {
  const num = -Math.sin(toRad(angle)) - Math.sin(toRad(lat)) * Math.sin(toRad(declination));
  const den = Math.cos(toRad(lat)) * Math.cos(toRad(declination));
  const cosH = num / den;

  if (cosH > 1) return 0; // Sun never reaches angle
  if (cosH < -1) return 12; // Sun always above angle

  const H = toDeg(Math.acos(cosH)) / 15;
  return direction === 'ccw' ? -H : H;
}

/**
 * Compute Asr time based on shadow factor (1 for Standard, 2 for Hanafi)
 */
function asrTime(shadowFactor: number, lat: number, declination: number): number {
  const phi = Math.abs(lat - declination);
  const angle = -toDeg(Math.atan(1 / (shadowFactor + Math.tan(toRad(phi)))));
  return sunAngleTime(angle, lat, declination, 'cw');
}

function formatDecimalHours(hours: number): string {
  const norm = normalizeHours(hours);
  const totalMinutes = Math.round(norm * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return `${pad(h)}:${pad(m)}`;
}

function hoursToTimestamp(baseDate: Date, localHours: number, tzOffsetHours: number): Date {
  const year = baseDate.getUTCFullYear();
  const month = baseDate.getUTCMonth();
  const day = baseDate.getUTCDate();

  // localHours is in local time of the location.
  // Convert local hours to UTC hours by subtracting tzOffsetHours
  const utcHours = localHours - tzOffsetHours;
  const utcMs = Date.UTC(year, month, day, 0, 0, 0) + utcHours * 3600 * 1000;
  return new Date(utcMs);
}

export function calculatePrayerTimes(
  date: Date = new Date(),
  location: LocationConfig = { latitude: 21.4225, longitude: 39.8262, cityName: 'Makkah' },
  method: CalculationMethod = 'ISNA',
  asrMethod: AsrMethod = 'Standard'
): PrayerTimes {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd = julianDay(year, month, day);
  const { declination, eqTime } = sunPosition(jd);

  // Timezone offset in hours
  const tzOffset = location.timezoneOffset !== undefined ? location.timezoneOffset : -date.getTimezoneOffset() / 60;

  // Local Solar transit / Dhuhr in local decimal hours
  const dhuhrLocalHours = 12 + (tzOffset - location.longitude / 15) - eqTime;

  const params = CALCULATION_METHODS[method]?.params || CALCULATION_METHODS.ISNA.params;

  // Offsets from Dhuhr in hours
  const sunriseOffset = sunAngleTime(0.833, location.latitude, declination, 'ccw');
  const sunsetOffset = sunAngleTime(0.833, location.latitude, declination, 'cw');
  const fajrOffset = sunAngleTime(params.fajrAngle, location.latitude, declination, 'ccw');

  const shadowFactor = asrMethod === 'Hanafi' ? 2 : 1;
  const asrOffset = asrTime(shadowFactor, location.latitude, declination);

  const maghribOffset = params.maghribAngle
    ? sunAngleTime(params.maghribAngle, location.latitude, declination, 'cw')
    : sunsetOffset;

  let ishaOffset: number;
  if (params.ishaIntervalMinutes !== undefined) {
    ishaOffset = maghribOffset + params.ishaIntervalMinutes / 60;
  } else if (params.ishaAngle !== undefined) {
    ishaOffset = sunAngleTime(params.ishaAngle, location.latitude, declination, 'cw');
  } else {
    ishaOffset = sunsetOffset + 1.5;
  }

  const fajrLocal = dhuhrLocalHours + fajrOffset;
  const sunriseLocal = dhuhrLocalHours + sunriseOffset;
  const dhuhrLocal = dhuhrLocalHours;
  const asrLocal = dhuhrLocalHours + asrOffset;
  const maghribLocal = dhuhrLocalHours + maghribOffset;
  const ishaLocal = dhuhrLocalHours + ishaOffset;

  const fajrDate = hoursToTimestamp(date, fajrLocal, tzOffset);
  const sunriseDate = hoursToTimestamp(date, sunriseLocal, tzOffset);
  const dhuhrDate = hoursToTimestamp(date, dhuhrLocal, tzOffset);
  const asrDate = hoursToTimestamp(date, asrLocal, tzOffset);
  const maghribDate = hoursToTimestamp(date, maghribLocal, tzOffset);
  const ishaDate = hoursToTimestamp(date, ishaLocal, tzOffset);

  // Tahajjud is last third of night
  const ishaMs = ishaDate.getTime();
  const fajrNextMs = fajrDate.getTime() + 24 * 3600 * 1000;
  const nightDurationMs = fajrNextMs - ishaMs;
  const tahajjudDate = new Date(ishaMs + (nightDurationMs * 2) / 3);

  // Tahajjud local hours calculation for formatting
  const tahajjudLocal = ishaLocal + ((fajrLocal + 24 - ishaLocal) * 2) / 3;

  return {
    fajr: formatDecimalHours(fajrLocal),
    sunrise: formatDecimalHours(sunriseLocal),
    dhuhr: formatDecimalHours(dhuhrLocal),
    asr: formatDecimalHours(asrLocal),
    maghrib: formatDecimalHours(maghribLocal),
    isha: formatDecimalHours(ishaLocal),
    tahajjud: formatDecimalHours(tahajjudLocal),
    fajrDate,
    sunriseDate,
    dhuhrDate,
    asrDate,
    maghribDate,
    ishaDate,
    tahajjudDate,
  };
}

/**
 * Calculates Qibla direction in degrees relative to true North
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
  const phi1 = toRad(latitude);
  const phi2 = toRad(MAKKAH_LAT);
  const deltaLambda = toRad(MAKKAH_LNG - longitude);

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  let qibla = toDeg(Math.atan2(y, x));
  return normalizeAngle(qibla);
}

/**
 * Returns next prayer info relative to current time
 */
export function getNextPrayer(prayerTimes: PrayerTimes, now: Date = new Date()): {
  name: string;
  time: string;
  date: Date;
  timeRemainingSeconds: number;
} {
  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr, date: prayerTimes.fajrDate },
    { name: 'Sunrise', time: prayerTimes.sunrise, date: prayerTimes.sunriseDate },
    { name: 'Dhuhr', time: prayerTimes.dhuhr, date: prayerTimes.dhuhrDate },
    { name: 'Asr', time: prayerTimes.asr, date: prayerTimes.asrDate },
    { name: 'Maghrib', time: prayerTimes.maghrib, date: prayerTimes.maghribDate },
    { name: 'Isha', time: prayerTimes.isha, date: prayerTimes.ishaDate },
  ];

  const nowMs = now.getTime();

  for (const prayer of prayers) {
    if (prayer.date.getTime() > nowMs) {
      const remaining = Math.round((prayer.date.getTime() - nowMs) / 1000);
      return { ...prayer, timeRemainingSeconds: remaining };
    }
  }

  // If all prayers today passed, next is Fajr tomorrow
  const tomorrowFajr = new Date(prayerTimes.fajrDate.getTime() + 24 * 3600 * 1000);
  const remaining = Math.round((tomorrowFajr.getTime() - nowMs) / 1000);
  return {
    name: 'Fajr',
    time: prayerTimes.fajr,
    date: tomorrowFajr,
    timeRemainingSeconds: Math.max(0, remaining),
  };
}
