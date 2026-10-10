import { createServer } from 'node:http'
import { generateDesignImage, publicError } from './bedrock.mjs'
import { analyzeFloorPlanWithGemini, generateFloorPlanLayer } from './gemini.mjs'

const PORT = Number(process.env.API_PORT || 3001)
const MAX_REQUEST_BYTES = 5 * 1024 * 1024
const MAX_AI_REQUESTS_PER_MINUTE = 12
const aiRequests = new Map()

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(body))
}

async function readJson(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_REQUEST_BYTES) throw Object.assign(new Error('Request is too large.'), { status: 413 })
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })
  }
}

async function getClimate(url) {
  const latitude = Number(url.searchParams.get('latitude'))
  const longitude = Number(url.searchParams.get('longitude'))
  const years = Number(url.searchParams.get('years') || 1)
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw Object.assign(new Error('Valid latitude and longitude are required.'), { status: 400 })
  }
  if (!Number.isInteger(years) || years < 1 || years > 5) {
    throw Object.assign(new Error('Historical weather range must be between 1 and 5 years.'), { status: 400 })
  }

  const currentUrl = new URL('https://api.open-meteo.com/v1/forecast')
  currentUrl.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,shortwave_radiation',
    timezone: 'auto',
  }).toString()

  const archiveEnd = new Date()
  archiveEnd.setUTCDate(archiveEnd.getUTCDate() - 6)
  archiveEnd.setUTCDate(0)
  const archiveStart = new Date(Date.UTC(archiveEnd.getUTCFullYear() - years, archiveEnd.getUTCMonth() + 1, 1))
  const toDate = (date) => date.toISOString().slice(0, 10)
  const archiveUrl = new URL('https://archive-api.open-meteo.com/v1/archive')
  archiveUrl.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: toDate(archiveStart),
    end_date: toDate(archiveEnd),
    hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,shortwave_radiation',
    timezone: 'auto',
  }).toString()

  const signal = AbortSignal.timeout(30_000)
  const [currentResponse, archiveResponse] = await Promise.all([fetch(currentUrl, { signal }), fetch(archiveUrl, { signal })])
  if (!currentResponse.ok || !archiveResponse.ok) {
    throw new Error(`Open-Meteo weather service returned HTTP ${!currentResponse.ok ? currentResponse.status : archiveResponse.status}.`)
  }
  const [currentData, archiveData] = await Promise.all([currentResponse.json(), archiveResponse.json()])
  const current = currentData.current
  if (!current || !archiveData.hourly?.time?.length) throw new Error('Open-Meteo did not return weather data for this location.')

  const groups = new Map()
  const days = new Map()
  const hourly = archiveData.hourly
  for (let index = 0; index < hourly.time.length; index += 1) {
    const timestamp = hourly.time[index]
    const date = timestamp.slice(0, 10)
    const month = new Date(`${date}T00:00:00Z`).toLocaleString('en', { month: 'short', timeZone: 'UTC' })
    if (!groups.has(month)) groups.set(month, new Set())
    if (!days.has(date)) {
      const day = { date, temperature: [], maxTemp: [], minTemp: [], humidity: [], wind: [], direction: [], solar: [] }
      days.set(date, day)
      groups.get(month).add(day)
    }
    const day = days.get(date)
    if (Number.isFinite(hourly.temperature_2m?.[index])) {
      day.temperature.push(hourly.temperature_2m[index])
      day.maxTemp.push(hourly.temperature_2m[index])
      day.minTemp.push(hourly.temperature_2m[index])
    }
    if (Number.isFinite(hourly.relative_humidity_2m?.[index])) day.humidity.push(hourly.relative_humidity_2m[index])
    if (Number.isFinite(hourly.wind_speed_10m?.[index])) day.wind.push(hourly.wind_speed_10m[index])
    if (Number.isFinite(hourly.wind_direction_10m?.[index])) day.direction.push(hourly.wind_direction_10m[index])
    if (Number.isFinite(hourly.shortwave_radiation?.[index])) day.solar.push(hourly.shortwave_radiation[index] / 1000)
  }

  const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const monthly = [...groups].map(([month, dates]) => {
    const monthlyDays = [...dates]
    const humidity = mean(monthlyDays.filter((day) => day.humidity.length).map((day) => mean(day.humidity)))
    const temperature = mean(monthlyDays.filter((day) => day.maxTemp.length).map((day) => Math.max(...day.maxTemp)))
    const meanTemperature = mean(monthlyDays.filter((day) => day.temperature.length).map((day) => mean(day.temperature)))
    const years = new Set(monthlyDays.map((day) => day.date.slice(0, 4))).size
    const degrees = monthlyDays.filter((day) => day.direction.length).map((day) => mean(day.direction))
    const radians = degrees.map((degree) => degree * Math.PI / 180)
    const windDegrees = radians.length
      ? (Math.atan2(mean(radians.map(Math.sin)), mean(radians.map(Math.cos))) * 180 / Math.PI + 360) % 360
      : 0
    const direction = directions[Math.round(windDegrees / 45) % 8]
    return {
      month,
      maxTemp: temperature,
      humidity,
      warmNights: monthlyDays.filter((day) => day.minTemp.length && Math.min(...day.minTemp) > 20).length / Math.max(years, 1),
      wetBulb: meanTemperature * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) + Math.atan(meanTemperature + humidity) - Math.atan(humidity - 1.676331) + 0.00391838 * humidity ** 1.5 * Math.atan(0.023101 * humidity) - 4.686035,
      windSpeed: mean(monthlyDays.filter((day) => day.wind.length).map((day) => mean(day.wind))),
      windDir: direction,
      solar: mean(monthlyDays.map((day) => day.solar.reduce((sum, value) => sum + value, 0))),
    }
  })
  const metric = (id, label, value, status, tone, icon) => ({ id, label, value, status, tone, icon })
  const currentTemperature = current.temperature_2m
  const humidity = current.relative_humidity_2m
  const windSpeed = current.wind_speed_10m
  const wetBulb = current.apparent_temperature
  const metrics = [
    metric('temperature', 'Current Temperature', `${currentTemperature}°C`, 'Model estimate', currentTemperature >= 35 ? 'high' : currentTemperature >= 28 ? 'moderate' : 'neutral', 'sun'),
    metric('humidity', 'Relative Humidity', `${humidity}%`, 'Model estimate', humidity >= 75 ? 'high' : humidity >= 55 ? 'moderate' : 'neutral', 'droplet'),
    metric('wind', 'Wind Speed', `${windSpeed} km/h`, `${current.wind_direction_10m}° direction`, 'neutral', 'wind'),
    metric('feels-like', 'Feels Like', `${wetBulb}°C`, 'Apparent temperature', wetBulb >= 35 ? 'high' : wetBulb >= 28 ? 'moderate' : 'neutral', 'thermo'),
    metric('solar', 'Solar Radiation', `${current.shortwave_radiation} W/m²`, 'Model estimate', current.shortwave_radiation >= 600 ? 'high' : 'moderate', 'sun'),
  ]
  return { metrics, monthly, source: 'Open-Meteo forecast and historical archive', fetchedAt: current.time }
}

async function handle(request, response) {
  const url = new URL(request.url || '/', 'http://localhost')
  try {
    if (request.method === 'POST' && url.pathname === '/api/analyze-floorplan') {
      enforceAiRateLimit(request)
      const body = await readJson(request)
      sendJson(response, 200, await analyzeFloorPlanWithGemini(body.imageBase64, body.mimeType))
      return
    }
    if (request.method === 'POST' && url.pathname === '/api/generate-floorplan-layer') {
      enforceAiRateLimit(request)
      const body = await readJson(request)
      sendJson(response, 200, await generateFloorPlanLayer(body))
      return
    }
    if (request.method === 'POST' && url.pathname === '/api/generate-design-image') {
      enforceAiRateLimit(request)
      const body = await readJson(request)
      const imageBase64 = await generateDesignImage(body.prompt, body.imageBase64, body.mimeType)
      sendJson(response, 200, { imageBase64 })
      return
    }
    if (request.method === 'GET' && url.pathname === '/api/climate') {
      sendJson(response, 200, await getClimate(url))
      return
    }
    sendJson(response, 404, { error: 'Not found.' })
  } catch (error) {
    const { status, message } = publicError(error)
    if (status >= 500) console.error('API request failed:', error)
    sendJson(response, status, { error: message })
  }
}

function enforceAiRateLimit(request) {
  const now = Date.now()
  const key = request.socket.remoteAddress || 'unknown'
  const recent = (aiRequests.get(key) || []).filter((timestamp) => now - timestamp < 60_000)
  if (recent.length >= MAX_AI_REQUESTS_PER_MINUTE) {
    throw Object.assign(new Error('Too many AI requests. Please wait a minute and try again.'), { status: 429 })
  }
  recent.push(now)
  aiRequests.set(key, recent)
  if (aiRequests.size > 1000) {
    for (const [address, timestamps] of aiRequests) {
      if (!timestamps.some((timestamp) => now - timestamp < 60_000)) aiRequests.delete(address)
    }
  }
}

createServer((request, response) => { void handle(request, response) })
  .listen(PORT, '127.0.0.1', () => console.log(`ClimateTwin API listening on http://127.0.0.1:${PORT}`))
