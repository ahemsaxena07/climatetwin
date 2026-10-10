import { normalizeAnalysis, validatePlanImage } from './bedrock.mjs'

const GEMINI_MODEL = process.env.GEMINI_MODEL_ID || 'gemini-3.8-flash'
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL_ID || 'gemini-nano-banana-2.1'

const LAYER_GUIDANCE = {
  thermal: {
    label: 'Thermal Map',
    guidance: 'Create a clean top-down 2D thermal-risk overlay on the supplied floor plan. Tint each identified room according to its stated qualitative heat risk: low = cool blue, moderate = pale yellow, elevated = orange, high = red. Keep each tint inside the correct room, preserve all walls and openings, and show a compact color key. Do not imply that these are measured temperatures.',
  },
  ventilation: {
    label: 'Ventilation Map',
    guidance: 'Create a top-down 2D ventilation diagram on the supplied floor plan. Show plausible airflow arrows only between visible openings and rooms, with blue directional arrows, clear inlet/outlet markers, and a small symbol key. Give extra attention to rooms whose analysis describes limited ventilation. Never invent openings or claim simulated airflow.',
  },
  cooling: {
    label: 'Cooling Layout',
    guidance: 'Create a top-down 2D cooling layout on the supplied floor plan. Place clearly recognizable ceiling-fan, exhaust-fan, shading, or cooling-equipment symbols only where the room types and recommendations support them. Show air movement with light blue arrows and shading with a restrained green hatch. Preserve the room geometry and include a small symbol key.',
  },
  proposed: {
    label: 'Proposed Plan',
    guidance: 'Create a top-down 2D proposed climate-responsive floor plan using the supplied plan as the exact base. Visually mark the recommended interventions with green dashed outlines for proposals and amber markers for items that need professional verification. Preserve existing walls and openings; do not make structural changes or invent dimensions. Include a compact legend.',
  },
}

function buildLayerBrief(layer, analysis, climate) {
  const roomNotes = analysis.rooms.map((room) =>
    `${room.name} (${room.type}): estimated heat risk ${room.heatRisk}; ventilation: ${room.ventilation}; visible features: ${room.features.join(', ') || 'none recorded'}.`,
  )
  const recommendations = analysis.recommendations.map((item) =>
    `${item.priority} priority, ${item.roomId ? analysis.rooms.find((room) => room.id === item.roomId)?.name || 'room not specified' : 'room not specified'}: ${item.title}. ${item.description} Benefit: ${item.benefit}. Verification/assumptions: ${item.assumptions.join('; ') || 'none recorded'}`,
  )
  const observations = analysis.observations.map((item) =>
    `${item.severity} observation in ${analysis.rooms.find((room) => room.id === item.roomId)?.name || 'room not specified'}: ${item.finding}. ${item.explanation}`,
  )
  const metrics = Array.isArray(climate?.metrics)
    ? climate.metrics.slice(0, 8).map((metric) => `${String(metric.label).slice(0, 80)}: ${String(metric.value).slice(0, 40)} (${String(metric.status).slice(0, 80)})`)
    : []
  const guidance = LAYER_GUIDANCE[layer]
  return {
    label: guidance.label,
    brief: [
      `Visualize this actual floor plan as a ${guidance.label}.`,
      `Plan summary: ${analysis.summary}`,
      `Orientation: ${analysis.orientation}. Visible openings counted: ${analysis.openings.doors} doors, ${analysis.openings.windows} windows, ${analysis.openings.vents} vents.`,
      'Room-by-room findings:',
      ...roomNotes,
      'Recommendations:',
      ...(recommendations.length ? recommendations : ['No specific interventions were recommended.']),
      'Observations:',
      ...(observations.length ? observations : ['No additional observations.']),
      metrics.length ? `Available site climate context: ${metrics.join('; ')}.` : '',
      `Visualization rules: ${guidance.guidance}`,
      `Use readable room labels based on the supplied plan. If the source does not show a feature or its location clearly, do not invent it. Add a small note: "AI-generated qualitative concept — verify on site."`,
      'Return one high-resolution image only. Keep it architectural, legible, and strictly top-down; no perspective view, photorealistic furniture scene, extra rooms, or changed building footprint.',
    ].filter(Boolean).join('\n'),
  }
}

function findGeneratedImage(value) {
  if (!value || typeof value !== 'object') return null
  if (value.type === 'image' && typeof value.data === 'string') return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findGeneratedImage(item)
      if (found) return found
    }
    return null
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'data' || key === 'input' || key === 'user_input') continue
    const found = findGeneratedImage(child)
    if (found) return found
  }
  return null
}

export async function analyzeFloorPlanWithGemini(base64, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured. Add it to .env and restart the API server.'), { status: 503 })
  }

  const imageBytes = validatePlanImage(base64, mimeType)
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{
          text: 'You are a careful architectural floor-plan analyst. Only state facts visible in the image; do not invent dimensions or hidden features. Return a JSON object with this shape: {"summary":"string","orientation":"string","rooms":[{"name":"string","type":"string","heatRisk":"low|moderate|elevated|high","ventilation":"string","features":["string"]}],"openings":{"doors":0,"windows":0,"vents":0},"observations":[{"finding":"string","explanation":"string","severity":"High|Medium|Low","room":"room name","reasoning":"string","assumptions":"string","nextStep":"string"}],"recommendations":[{"title":"string","description":"string","benefit":"string","priority":"High|Medium","category":"shade|window|vent|exhaust|roof|fan","room":"room name","why":"string","assumptions":["string"]}],"limitations":["string"]}.',
        }],
      },
      contents: [{
        role: 'user',
        parts: [
          { text: 'Analyze this uploaded floor plan image and return the requested structured JSON.' },
          { inlineData: { mimeType, data: imageBytes.toString('base64') } },
        ],
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    }),
  })

  const responseBody = await response.text()
  let result
  try {
    result = JSON.parse(responseBody)
  } catch {
    throw new Error(`Gemini returned an invalid response (HTTP ${response.status}).`)
  }
  if (!response.ok) {
    const message = result.error?.message || `Gemini request failed (HTTP ${response.status}).`
    const status = response.status === 429 ? 429 : response.status === 400 ? 400 : 502
    throw Object.assign(new Error(message), { status })
  }

  const responseText = result.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
  if (!responseText) throw new Error('Gemini returned an empty analysis.')

  let analysis
  try {
    analysis = JSON.parse(responseText)
  } catch {
    throw new Error('Gemini returned analysis that was not valid JSON.')
  }
  return { analysis: normalizeAnalysis(analysis) }
}

export async function generateFloorPlanLayer({ imageBase64, mimeType, layer, analysis, climate }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY is not configured. Add it to .env and restart the API server.'), { status: 503 })
  }
  if (!Object.hasOwn(LAYER_GUIDANCE, layer)) {
    throw Object.assign(new Error('Choose a supported floor-plan visualization layer.'), { status: 400 })
  }

  const imageBytes = validatePlanImage(imageBase64, mimeType)
  const normalizedAnalysis = normalizeAnalysis(analysis)
  const { label, brief } = buildLayerBrief(layer, normalizedAnalysis, climate)
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      model: GEMINI_IMAGE_MODEL,
      store: false,
      input: [
        { type: 'text', text: brief },
        { type: 'image', mime_type: mimeType, data: imageBytes.toString('base64') },
      ],
    }),
    signal: AbortSignal.timeout(120_000),
  })

  const responseBody = await response.text()
  let result
  try {
    result = JSON.parse(responseBody)
  } catch {
    throw new Error(`Gemini image generation returned an invalid response (HTTP ${response.status}).`)
  }
  if (!response.ok) {
    const message = result.error?.message || `Gemini image generation failed (HTTP ${response.status}).`
    const status = response.status === 429 ? 429 : response.status === 400 ? 400 : 502
    throw Object.assign(new Error(message), { status })
  }

  const outputImage = result.output_image || findGeneratedImage(result.outputs || result.output || result.steps)
  if (typeof outputImage?.data !== 'string' || !outputImage.data) {
    throw new Error('Gemini completed the request but returned no generated image.')
  }
  const outputMimeType = ['image/png', 'image/jpeg', 'image/webp'].includes(outputImage.mime_type)
    ? outputImage.mime_type
    : 'image/png'
  return {
    imageBase64: outputImage.data,
    mimeType: outputMimeType,
    summary: `${label} generated from the room-by-room Gemini analysis and the uploaded plan.`,
  }
}
