// Clima real vía open-meteo (gratis, sin API key). La tormenta da +25 % de XP
// — lo verifica el servidor por su cuenta; esto solo pinta el mundo.
// ⚠️ STORM_CODES debe coincidir con supabase/functions/collect/index.ts
const STORM_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99,
])

export async function fetchWeather(pos) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat.toFixed(3)}&longitude=${pos.lng.toFixed(3)}&current=weather_code`,
      { signal: AbortSignal.timeout(5000) },
    )
    const data = await res.json()
    return STORM_CODES.has(data?.current?.weather_code) ? 'storm' : 'clear'
  } catch {
    return 'clear'
  }
}
