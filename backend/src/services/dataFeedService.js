export const STATION_COORDS = {
  Makurdi: { lat: 7.73, lon: 8.52, state: 'Benue' },
  Lokoja: { lat: 7.8, lon: 6.74, state: 'Kogi' },
  Onitsha: { lat: 6.17, lon: 6.78, state: 'Anambra' },
};

async function fetchOpenMeteo(lat, lon, days = 7) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,rain');
  url.searchParams.set('daily', 'precipitation_sum,temperature_2m_max,temperature_2m_min,rain_sum');
  url.searchParams.set('timezone', 'Africa/Lagos');
  url.searchParams.set('forecast_days', String(days));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  return res.json();
}

export async function getStationLiveFeatures(stationName) {
  const coords = STATION_COORDS[stationName];
  if (!coords) throw new Error(`Unknown station: ${stationName}`);

  const data = await fetchOpenMeteo(coords.lat, coords.lon);
  const current = data.current || {};
  const daily = data.daily || {};
  const precip = Number(current.precipitation ?? current.rain ?? 0);
  const temp = Number(current.temperature_2m ?? 28);
  const humidity = Number(current.relative_humidity_2m ?? 70);
  const rains = (daily.precipitation_sum || [0, 0, 0, 0, 0, 0, 0]).map(Number);
  const ante3 = rains.slice(0, 3).reduce((a, b) => a + b, 0) || precip * 2.5;
  const ante7 = rains.slice(0, 7).reduce((a, b) => a + b, 0) || precip * 5;
  const base = { Makurdi: 4.2, Lokoja: 5.5, Onitsha: 4.8 }[stationName] || 4.5;
  const riverLevel = Math.round((base + ante3 * 0.04 + precip * 0.02) * 100) / 100;

  return {
    source: 'Open-Meteo (public feed – NiMet-compatible variables)',
    station: stationName,
    state: coords.state,
    latitude: coords.lat,
    longitude: coords.lon,
    fetched_at: new Date().toISOString(),
    daily_rainfall_mm: Math.round(precip * 100) / 100,
    temp_max_c: Math.round(temp * 10) / 10,
    relative_humidity_pct: Math.round(humidity * 10) / 10,
    antecedent_3day_rain_mm: Math.round(ante3 * 100) / 100,
    antecedent_7day_rain_mm: Math.round(ante7 * 100) / 100,
    river_level_m: riverLevel,
    river_level_change_m: Math.round(precip * 0.015 * 1000) / 1000,
    month: new Date().getMonth() + 1,
    forecast_daily_rain_mm: rains.slice(0, 7).map((x) => Math.round(x * 100) / 100),
    note: 'River level is a rainfall-based proxy for demo.',
  };
}

export async function getAllStationsLive() {
  const results = [];
  for (const name of Object.keys(STATION_COORDS)) {
    try {
      results.push(await getStationLiveFeatures(name));
    } catch (e) {
      results.push({ station: name, error: String(e.message || e) });
    }
  }
  return results;
}

export function getNimetInfo() {
  return {
    nimet_base_url: 'https://api.nimet.gov.ng/api',
    status: 'API key required – register at nimet.gov.ng',
    current_demo_source: 'Open-Meteo (ERA5 + NWP) – free, no key',
    thesis_alignment: 'NiMet station records + CHIRPS + NIHSA gauges (Chapter 3.5)',
  };
}
