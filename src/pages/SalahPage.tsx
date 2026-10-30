import { useState, useEffect, useMemo } from 'react';
import {
  Clock, Compass, Laptop, Smartphone, Tv,
  Settings, Play, Pause, Bell
} from 'lucide-react';
import {
  calculatePrayerTimes,
  calculateQiblaDirection,
  getNextPrayer,
  CALCULATION_METHODS,
  type CalculationMethod,
  type AsrMethod,
  type LocationConfig,
  type PrayerTimes
} from '../utils/salahEngine';

type DisplayMode = 'laptop' | 'phone' | 'tv';

const DEFAULT_LOCATIONS: LocationConfig[] = [
  { cityName: 'Makkah', latitude: 21.4225, longitude: 39.8262, timezoneOffset: 3 },
  { cityName: 'Madinah', latitude: 24.5247, longitude: 39.5692, timezoneOffset: 3 },
  { cityName: 'Jerusalem', latitude: 31.7683, longitude: 35.2137, timezoneOffset: 2 },
  { cityName: 'London', latitude: 51.5074, longitude: -0.1278, timezoneOffset: 0 },
  { cityName: 'New York', latitude: 40.7128, longitude: -74.0060, timezoneOffset: -5 },
  { cityName: 'Istanbul', latitude: 41.0082, longitude: 28.9784, timezoneOffset: 3 },
  { cityName: 'Cairo', latitude: 30.0444, longitude: 31.2357, timezoneOffset: 2 },
  { cityName: 'Kuala Lumpur', latitude: 3.1390, longitude: 101.6869, timezoneOffset: 8 },
  { cityName: 'Jakarta', latitude: -6.2088, longitude: 106.8456, timezoneOffset: 7 },
  { cityName: 'Dubai', latitude: 25.2048, longitude: 55.2708, timezoneOffset: 4 },
];

export function SalahPage() {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('laptop');
  const [selectedLocation, setSelectedLocation] = useState<LocationConfig>(DEFAULT_LOCATIONS[0]);
  const [calcMethod, setCalcMethod] = useState<CalculationMethod>('UmmAlQura');
  const [asrMethod, setAsrMethod] = useState<AsrMethod>('Standard');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [isPlayingAdhan, setIsPlayingAdhan] = useState<boolean>(false);
  const [activeTabPhone, setActiveTabPhone] = useState<'today' | 'qibla' | 'settings'>('today');

  // TV D-Pad Focus state
  const [tvFocusedIndex, setTvFocusedIndex] = useState<number>(0);
  const tvFocusableCount = 6; // Number of focusable items on TV screen

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle TV D-Pad remote keyboard navigation
  useEffect(() => {
    if (displayMode !== 'tv') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        setTvFocusedIndex(prev => (prev + 1) % tvFocusableCount);
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setTvFocusedIndex(prev => (prev - 1 + tvFocusableCount) % tvFocusableCount);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // Trigger action based on focused item
        if (tvFocusedIndex === 0) {
          setIsPlayingAdhan(prev => !prev);
        } else if (tvFocusedIndex === 1) {
          setAudioMuted(prev => !prev);
        } else if (tvFocusedIndex >= 2 && tvFocusedIndex < 2 + DEFAULT_LOCATIONS.length) {
          setSelectedLocation(DEFAULT_LOCATIONS[(tvFocusedIndex - 2) % DEFAULT_LOCATIONS.length]);
        }
      } else if (e.key === 'Escape') {
        setDisplayMode('laptop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayMode, tvFocusedIndex]);

  const prayerTimes: PrayerTimes = useMemo(() => {
    return calculatePrayerTimes(currentTime, selectedLocation, calcMethod, asrMethod);
  }, [currentTime, selectedLocation, calcMethod, asrMethod]);

  const nextPrayer = useMemo(() => {
    return getNextPrayer(prayerTimes, currentTime);
  }, [prayerTimes, currentTime]);

  const qiblaAngle = useMemo(() => {
    return calculateQiblaDirection(selectedLocation.latitude, selectedLocation.longitude);
  }, [selectedLocation]);

  const formatCountdown = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const prayersList = [
    { key: 'fajr', label: 'Fajr', time: prayerTimes.fajr, icon: '🌅' },
    { key: 'sunrise', label: 'Sunrise', time: prayerTimes.sunrise, icon: '☀️' },
    { key: 'dhuhr', label: 'Dhuhr', time: prayerTimes.dhuhr, icon: '🌤️' },
    { key: 'asr', label: 'Asr', time: prayerTimes.asr, icon: '⛅' },
    { key: 'maghrib', label: 'Maghrib', time: prayerTimes.maghrib, icon: '🌇' },
    { key: 'isha', label: 'Isha', time: prayerTimes.isha, icon: '🌙' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Salah Companion</h1>
            <span className="text-xs bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-full">
              Multi-Device
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculated for <span className="text-slate-200 font-semibold">{selectedLocation.cityName}</span> using{' '}
            <span className="text-slate-200 font-semibold">{CALCULATION_METHODS[calcMethod].name}</span>
          </p>
        </div>

        {/* Device Switcher Toggle Buttons */}
        <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setDisplayMode('laptop')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              displayMode === 'laptop' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Laptop</span>
          </button>
          <button
            onClick={() => setDisplayMode('phone')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              displayMode === 'phone' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone</span>
          </button>
          <button
            onClick={() => setDisplayMode('tv')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              displayMode === 'tv' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>TV (10ft Mode)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODE 1: LAPTOP / DESKTOP VIEW
         ========================================================================= */}
      {displayMode === 'laptop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dashboard Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Countdown Banner */}
            <div className="bg-gradient-to-br from-emerald-900/60 via-slate-900 to-slate-950 border border-emerald-800/50 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-emerald-400">
                <Clock className="w-48 h-48" />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
                    Next Prayer
                  </span>
                  <h2 className="text-3xl font-extrabold text-white mt-1">{nextPrayer.name}</h2>
                  <p className="text-sm text-slate-300 mt-1">Scheduled at {nextPrayer.time}</p>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-xs text-slate-400">Time Remaining</div>
                  <div className="text-3xl font-mono font-bold text-emerald-400 tracking-wider">
                    {formatCountdown(nextPrayer.timeRemainingSeconds)}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Schedule Grid */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center space-x-2">
                <span>Today's Prayer Schedule</span>
                <span className="text-xs text-slate-500 font-normal">
                  ({currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })})
                </span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {prayersList.map(p => {
                  const isNext = p.label.toLowerCase() === nextPrayer.name.toLowerCase();
                  return (
                    <div
                      key={p.key}
                      className={`p-4 rounded-xl border transition-all ${
                        isNext
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                          : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                        <span className="flex items-center space-x-1.5">
                          <span>{p.icon}</span>
                          <span className={isNext ? 'text-emerald-300 font-semibold' : ''}>{p.label}</span>
                        </span>
                        {isNext && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <div className={`text-xl font-bold font-mono ${isNext ? 'text-emerald-400' : 'text-white'}`}>
                        {p.time}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tahajjud Highlight */}
              <div className="mt-4 p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl flex items-center justify-between text-xs text-indigo-300">
                <span className="flex items-center space-x-2">
                  <span>✨</span>
                  <span>Recommended Tahajjud (Last 1/3 Night)</span>
                </span>
                <span className="font-mono font-bold">{prayerTimes.tahajjud}</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar Controls & Qibla */}
          <div className="space-y-6">
            {/* Qibla Direction Compass */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-center">
              <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center justify-center space-x-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Qibla Direction</span>
              </h3>

              <div className="relative w-36 h-36 mx-auto my-4 flex items-center justify-center border-2 border-slate-700 rounded-full bg-slate-950/60">
                {/* Compass Rose markings */}
                <span className="absolute top-1 text-[10px] text-slate-500 font-bold">N</span>
                <span className="absolute bottom-1 text-[10px] text-slate-500 font-bold">S</span>
                <span className="absolute left-1.5 text-[10px] text-slate-500 font-bold">W</span>
                <span className="absolute right-1.5 text-[10px] text-slate-500 font-bold">E</span>

                {/* Qibla Needle */}
                <div
                  className="w-1 h-28 bg-transparent transition-transform duration-700 flex flex-col justify-between items-center"
                  style={{ transform: `rotate(${qiblaAngle}deg)` }}
                >
                  <div className="w-3 h-3 bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/50" />
                  <div className="w-2 h-2 bg-slate-600 rounded-full" />
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Facing <span className="text-emerald-400 font-bold">{Math.round(qiblaAngle)}°</span> from North ({selectedLocation.cityName})
              </div>
            </div>

            {/* Location & Calculation Settings */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                <span>Preferences</span>
              </h3>

              {/* Location Select */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                <select
                  value={selectedLocation.cityName}
                  onChange={e => {
                    const loc = DEFAULT_LOCATIONS.find(l => l.cityName === e.target.value);
                    if (loc) setSelectedLocation(loc);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {DEFAULT_LOCATIONS.map(loc => (
                    <option key={loc.cityName} value={loc.cityName}>
                      {loc.cityName} ({loc.latitude}°, {loc.longitude}°)
                    </option>
                  ))}
                </select>
              </div>

              {/* Calculation Convention Select */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Calculation Method</label>
                <select
                  value={calcMethod}
                  onChange={e => setCalcMethod(e.target.value as CalculationMethod)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.entries(CALCULATION_METHODS).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Asr Juristic Method */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Asr School</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAsrMethod('Standard')}
                    className={`py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      asrMethod === 'Standard'
                        ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Standard (Shafi/Hanbali/Maliki)
                  </button>
                  <button
                    onClick={() => setAsrMethod('Hanafi')}
                    className={`py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      asrMethod === 'Hanafi'
                        ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Hanafi
                  </button>
                </div>
              </div>

              {/* Audio Adhan Player */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center space-x-1">
                  <Bell className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Adhan Audio Test</span>
                </span>
                <button
                  onClick={() => setIsPlayingAdhan(!isPlayingAdhan)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium flex items-center space-x-1"
                >
                  {isPlayingAdhan ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlayingAdhan ? 'Stop' : 'Play Adhan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: PHONE / MOBILE VIEW
         ========================================================================= */}
      {displayMode === 'phone' && (
        <div className="max-w-xs mx-auto bg-slate-950 border-4 border-slate-800 rounded-[36px] overflow-hidden shadow-2xl relative min-h-[580px] flex flex-col text-white">
          {/* Top Speaker notch */}
          <div className="w-28 h-4 bg-slate-800 mx-auto rounded-b-xl flex items-center justify-center">
            <div className="w-8 h-1 bg-slate-700 rounded-full" />
          </div>

          {/* Mobile Main Content */}
          <div className="p-4 flex-1 flex flex-col justify-between">
            {activeTabPhone === 'today' && (
              <div className="space-y-4">
                {/* Header card */}
                <div className="bg-gradient-to-br from-emerald-900/80 to-slate-900 p-4 rounded-2xl text-center border border-emerald-700/50">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
                    {selectedLocation.cityName}
                  </span>
                  <h3 className="text-2xl font-bold mt-1">{nextPrayer.name}</h3>
                  <div className="text-xl font-mono font-extrabold text-emerald-400 my-1">
                    {formatCountdown(nextPrayer.timeRemainingSeconds)}
                  </div>
                  <span className="text-[10px] text-slate-300">Next prayer at {nextPrayer.time}</span>
                </div>

                {/* Compact List */}
                <div className="space-y-1.5">
                  {prayersList.map(p => {
                    const isNext = p.label.toLowerCase() === nextPrayer.name.toLowerCase();
                    return (
                      <div
                        key={p.key}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                          isNext
                            ? 'bg-emerald-900/40 border border-emerald-500/60 text-emerald-200 font-bold'
                            : 'bg-slate-900 border border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <span>{p.icon}</span>
                          <span>{p.label}</span>
                        </span>
                        <span className="font-mono">{p.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTabPhone === 'qibla' && (
              <div className="text-center space-y-4 my-auto">
                <h3 className="text-sm font-bold">Qibla Direction</h3>
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center border-2 border-emerald-500/50 rounded-full bg-slate-900">
                  <div
                    className="w-1 h-24 bg-emerald-400 rounded-full transition-transform duration-500"
                    style={{ transform: `rotate(${qiblaAngle}deg)` }}
                  />
                  <div className="absolute w-3 h-3 bg-emerald-300 rounded-full shadow" />
                </div>
                <p className="text-xs text-slate-400">
                  Turn device to <span className="text-emerald-400 font-bold">{Math.round(qiblaAngle)}°</span> North
                </p>
              </div>
            )}

            {activeTabPhone === 'settings' && (
              <div className="space-y-3 text-xs">
                <h3 className="font-bold text-center text-slate-200 mb-2">Location & Method</h3>
                <div>
                  <label className="text-[10px] text-slate-400">City</label>
                  <select
                    value={selectedLocation.cityName}
                    onChange={e => {
                      const loc = DEFAULT_LOCATIONS.find(l => l.cityName === e.target.value);
                      if (loc) setSelectedLocation(loc);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  >
                    {DEFAULT_LOCATIONS.map(l => (
                      <option key={l.cityName} value={l.cityName}>{l.cityName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Calculation Method</label>
                  <select
                    value={calcMethod}
                    onChange={e => setCalcMethod(e.target.value as CalculationMethod)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                  >
                    {Object.entries(CALCULATION_METHODS).map(([k, v]) => (
                      <option key={k} value={k}>{v.name.slice(0, 25)}...</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Bar Navigation */}
          <div className="bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-around text-[10px] text-slate-400">
            <button
              onClick={() => setActiveTabPhone('today')}
              className={`flex flex-col items-center space-y-0.5 ${activeTabPhone === 'today' ? 'text-emerald-400 font-bold' : ''}`}
            >
              <Clock className="w-4 h-4" />
              <span>Times</span>
            </button>
            <button
              onClick={() => setActiveTabPhone('qibla')}
              className={`flex flex-col items-center space-y-0.5 ${activeTabPhone === 'qibla' ? 'text-emerald-400 font-bold' : ''}`}
            >
              <Compass className="w-4 h-4" />
              <span>Qibla</span>
            </button>
            <button
              onClick={() => setActiveTabPhone('settings')}
              className={`flex flex-col items-center space-y-0.5 ${activeTabPhone === 'settings' ? 'text-emerald-400 font-bold' : ''}`}
            >
              <Settings className="w-4 h-4" />
              <span>Setup</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 3: TV / SMART TV AMBIENT 10FT VIEW
         ========================================================================= */}
      {displayMode === 'tv' && (
        <div className="bg-slate-950 border-4 border-emerald-900/60 rounded-3xl p-8 min-h-[500px] flex flex-col justify-between shadow-2xl relative">
          {/* TV Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🕌</span>
              <div>
                <h2 className="text-2xl font-black text-white tracking-wide">{selectedLocation.cityName}</h2>
                <p className="text-xs text-slate-400 font-medium">TV Ambient Prayer Display • Use Remote D-Pad</p>
              </div>
            </div>

            {/* TV Clock */}
            <div className="text-right">
              <div className="text-3xl font-mono font-bold text-white tracking-widest">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-xs text-emerald-400 font-medium">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Center Next Prayer Focus */}
          <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-8 rounded-3xl border border-emerald-500/40 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                    Next Prayer Highlight
                  </span>
                  <h1 className="text-5xl font-black text-white mt-2">{nextPrayer.name}</h1>
                  <p className="text-lg text-slate-300 mt-1">Starts at {nextPrayer.time}</p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Countdown</div>
                  <div className="text-5xl font-mono font-black text-emerald-400 tracking-wider mt-1">
                    {formatCountdown(nextPrayer.timeRemainingSeconds)}
                  </div>
                </div>
              </div>
            </div>

            {/* D-Pad Controls Box */}
            <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 text-center space-y-4">
              <div className="text-xs text-slate-400 uppercase font-semibold">TV Remote Nav</div>
              <div className={`p-3 rounded-2xl border transition-all ${tvFocusedIndex === 0 ? 'bg-emerald-600 text-white border-emerald-400 ring-4 ring-emerald-500/40' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                <button onClick={() => setIsPlayingAdhan(!isPlayingAdhan)} className="w-full font-bold text-sm">
                  {isPlayingAdhan ? '⏸️ Stop Audio' : '▶️ Play Adhan Alert'}
                </button>
              </div>
              <div className={`p-3 rounded-2xl border transition-all ${tvFocusedIndex === 1 ? 'bg-emerald-600 text-white border-emerald-400 ring-4 ring-emerald-500/40' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                <button onClick={() => setAudioMuted(!audioMuted)} className="w-full font-bold text-sm">
                  {audioMuted ? '🔊 Unmute TV Sound' : '🔇 Mute TV Sound'}
                </button>
              </div>
            </div>
          </div>

          {/* Full Day Large Text Schedule */}
          <div className="grid grid-cols-6 gap-3">
            {prayersList.map(p => {
              const isNext = p.label.toLowerCase() === nextPrayer.name.toLowerCase();
              return (
                <div
                  key={p.key}
                  className={`p-4 rounded-2xl text-center border transition-all ${
                    isNext
                      ? 'bg-emerald-900/60 border-emerald-400 text-white scale-105 shadow-xl'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-lg">{p.icon}</div>
                  <div className={`text-sm font-bold mt-1 ${isNext ? 'text-emerald-300' : 'text-slate-300'}`}>{p.label}</div>
                  <div className={`text-xl font-mono font-black mt-1 ${isNext ? 'text-white' : 'text-slate-200'}`}>{p.time}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
