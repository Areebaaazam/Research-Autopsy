import { describe, it, expect } from 'vitest';
import {
  calculatePrayerTimes,
  calculateQiblaDirection,
  getNextPrayer,
  CALCULATION_METHODS
} from '../salahEngine';

describe('salahEngine', () => {
  const sampleDate = new Date('2025-05-15T12:00:00Z');
  const makkahLoc = { latitude: 21.4225, longitude: 39.8262, cityName: 'Makkah', timezoneOffset: 3 };
  const nyLoc = { latitude: 40.7128, longitude: -74.0060, cityName: 'New York', timezoneOffset: -4 };

  it('calculates prayer times for Makkah', () => {
    const times = calculatePrayerTimes(sampleDate, makkahLoc, 'UmmAlQura');
    expect(times).toHaveProperty('fajr');
    expect(times).toHaveProperty('sunrise');
    expect(times).toHaveProperty('dhuhr');
    expect(times).toHaveProperty('asr');
    expect(times).toHaveProperty('maghrib');
    expect(times).toHaveProperty('isha');
    expect(times).toHaveProperty('tahajjud');

    expect(times.fajr).toMatch(/^\d{2}:\d{2}$/);
    expect(times.dhuhr).toMatch(/^\d{2}:\d{2}$/);
  });

  it('calculates Qibla direction correctly', () => {
    // Qibla from Makkah to Makkah is ~0/360
    const qiblaMakkah = calculateQiblaDirection(21.4225, 39.8262);
    expect(Math.round(qiblaMakkah) % 360).toBe(0);

    // Qibla from NY is ~58 degrees
    const qiblaNY = calculateQiblaDirection(40.7128, -74.0060);
    expect(Math.round(qiblaNY)).toBeGreaterThan(50);
    expect(Math.round(qiblaNY)).toBeLessThan(70);
  });

  it('handles Hanafi vs Standard Asr calculation', () => {
    const standardTimes = calculatePrayerTimes(sampleDate, nyLoc, 'ISNA', 'Standard');
    const hanafiTimes = calculatePrayerTimes(sampleDate, nyLoc, 'ISNA', 'Hanafi');

    expect(standardTimes.asr).not.toEqual(hanafiTimes.asr);
    expect(hanafiTimes.asrDate.getTime()).toBeGreaterThan(standardTimes.asrDate.getTime());
  });

  it('determines the next prayer accurately', () => {
    const times = calculatePrayerTimes(sampleDate, makkahLoc, 'ISNA');
    // Set current time to 8am
    const morning = new Date(times.dhuhrDate.getTime() - 2 * 3600 * 1000);
    const next = getNextPrayer(times, morning);

    expect(next.name).toBe('Dhuhr');
    expect(next.timeRemainingSeconds).toBeGreaterThan(0);
  });

  it('supports all calculation methods defined', () => {
    Object.keys(CALCULATION_METHODS).forEach(method => {
      const times = calculatePrayerTimes(sampleDate, nyLoc, method as any);
      expect(times.fajr).toBeDefined();
      expect(times.isha).toBeDefined();
    });
  });
});
