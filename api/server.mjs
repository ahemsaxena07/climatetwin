import { createServer } from 'node:http'

const PORT = Number(process.env.API_PORT || 3001)
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_REQUEST_BYTES = Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 1024
const MIME_SIGNATURES = {
  'image/jpeg': (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  'image/png': (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/webp': (buffer) => buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  response.end(JSON.stringify(body))
}

async function readJson(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > MAX_REQUEST_BYTES) throw Object.assign(new Error('Image must be 10 MB or smaller.'), { status: 413 })
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })
  }
}

async function analyzeFloorPlan(request, response) {
  if (!process.env.GEMINI_API_KEY) {
    sendJson(response, 503, { error: 'Gemini is not configured. Set GEMINI_API_KEY in your environment and restart the app.' })
    return
  }

  try {
    const body = await readJson(request)
    const { imageBase64, mimeType } = body
    if (typeof imageBase64 !== 'string' || !imageBase64 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(imageBase64)) {
      sendJson(response, 400, { error: 'A valid floor plan image is required.' })
      return
    }
    if (!Object.hasOwn(MIME_SIGNATURES, mimeType)) {
      sendJson(response, 400, { error: 'Only PNG, JPG, and WEBP images are supported.' })
      return
    }

    const image = Buffer.from(imageBase64, 'base64')
    if (image.length > MAX_IMAGE_BYTES) {
      sendJson(response, 413, { error: 'Image must be 10 MB or smaller.' })
      return
    }
    if (image.length === 0 || !MIME_SIGNATURES[mimeType](image)) {
      sendJson(response, 400, { error: 'The selected file is not a valid image of the stated type.' })
      return
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: 'Analyze this architectural floor plan. Describe the visible rooms and layout, identify visible doors, windows, and ventilation openings, and note any limitations or unclear areas. Do not invent measurements or facts that cannot be read from the image. Format the response with concise headings and bullet points.' },
              { inline_data: { mime_type: mimeType, data: image.toString('base64') } },
            ],
          }],
        }),
      },
    )

    const result = await geminiResponse.json()
    if (!geminiResponse.ok) {
      const message = result?.error?.message
      console.error(`Gemini API request failed (${geminiResponse.status}): ${message || 'unknown error'}`)
      sendJson(response, 502, { error: message || 'Gemini could not analyze the image. Please try again.' })
      return
    }

    const analysis = result?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text) => typeof text === 'string')
      .join('\n')
      .trim()
    if (!analysis) {
      sendJson(response, 502, { error: 'Gemini did not return an analysis. Please try a clearer floor plan image.' })
      return
    }
    sendJson(response, 200, { analysis })
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Could not reach the Gemini API:', error.message)
      sendJson(response, 502, { error: 'Could not reach Gemini. Check your network connection and try again.' })
      return
    }
    const status = Number.isInteger(error?.status) ? error.status : 500
    if (status === 500) console.error('Floor plan analysis failed:', error)
    sendJson(response, status, { error: status === 500 ? 'Floor plan analysis failed unexpectedly.' : error.message })
  }
}

createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/api/analyze-floorplan') {
    void analyzeFloorPlan(request, response)
    return
  }
  sendJson(response, 404, { error: 'Not found.' })
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Gemini API server listening on http://127.0.0.1:${PORT}`)
})
