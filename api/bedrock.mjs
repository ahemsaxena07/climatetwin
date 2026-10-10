import {
  BedrockRuntimeClient,
  ConverseCommand,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

// --- Constants ---
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024
const IMAGE_SIGNATURES = {
  'image/jpeg': (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/png': (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  'image/webp': (bytes) => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP',
}

// --- Client Initialization ---
// This setup now supports BOTH Bearer Tokens (your specific use case) 
// and standard IAM roles/env vars (AWS_ACCESS_KEY_ID, etc.)
const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  ...(process.env.AWS_BEARER_TOKEN_BEDROCK
    ? {
        token: { token: process.env.AWS_BEARER_TOKEN_BEDROCK },
        authSchemePreference: ['httpBearerAuth'],
      }
    : {}),
})

// --- Helper Functions ---

function requireBedrockConfig() {
  // Check for either the token or standard AWS credentials
  if (!process.env.AWS_BEARER_TOKEN_BEDROCK && !process.env.AWS_ACCESS_KEY_ID) {
    throw Object.assign(new Error('Amazon Bedrock is not configured. Set AWS_BEARER_TOKEN_BEDROCK or AWS_ACCESS_KEY_ID in .env.'), { status: 503 })
  }
}

function parseModelJson(text) {
  // Improved regex to handle various markdown code block styles
  const candidate = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('The model returned an invalid structured analysis.')
  return JSON.parse(candidate.slice(start, end + 1))
}

const text = (value, fallback = '') => typeof value === 'string' ? value.trim().slice(0, 1000) : fallback
const list = (value, limit = 20) => Array.isArray(value) ? value.slice(0, limit) : []

export function normalizeAnalysis(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('The image model returned an invalid floor plan analysis.')
  }

  const rooms = list(data.rooms, 30).map((room, index) => {
    const name = text(room?.name, `Room ${index + 1}`)
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `room-${index + 1}`
    return {
      id,
      name,
      type: text(room?.type, 'Unclassified'),
      heatRisk: ['low', 'moderate', 'elevated', 'high'].includes(room?.heatRisk) ? room.heatRisk : 'moderate',
      ventilation: text(room?.ventilation, 'Not clearly visible in the supplied image.'),
      features: list(room?.features, 12).filter((item) => typeof item === 'string').map(text).filter(Boolean),
    }
  })

  if (!rooms.length) throw new Error('The image model could not identify rooms in this image.')

  const roomIdFor = (value) => {
    const raw = text(value).toLowerCase()
    const match = rooms.find((room) => room.id === raw || room.name.toLowerCase() === raw || room.name.toLowerCase().includes(raw))
    return match?.id ?? rooms[0].id
  }

  const observations = list(data.observations, 12).map((item, index) => ({
    id: index + 1,
    finding: text(item?.finding, `Finding ${index + 1}`),
    explanation: text(item?.explanation, 'Please verify this observation.'),
    severity: ['High', 'Medium', 'Low'].includes(item?.severity) ? item.severity : 'Medium',
    roomId: roomIdFor(item?.room),
    reasoning: text(item?.reasoning, item?.explanation),
    assumptions: text(item?.assumptions, 'Based on legible details.'),
    nextStep: text(item?.nextStep, 'Verify with a qualified professional.'),
  }))

  const recommendations = list(data.recommendations, 12).map((item, index) => {
    const category = text(item?.category).toLowerCase()
    const icon = category.includes('window') || category.includes('vent') ? 'window' : 
                 category.includes('exhaust') || category.includes('fan') ? 'exhaust' : 
                 category.includes('roof') ? 'roof' : 'shade'

    return {
      id: `bedrock-${index + 1}`,
      title: text(item?.title, `Design recommendation ${index + 1}`),
      description: text(item?.description, 'Review with a professional.'),
      benefit: text(item?.benefit, 'Potential comfort improvement'),
      priority: ['High', 'Medium'].includes(item?.priority) ? item.priority : 'Medium',
      icon,
      roomId: roomIdFor(item?.room),
      why: text(item?.why, item?.description),
      assumptions: list(item?.assumptions, 8).filter((v) => typeof v === 'string').map(text).filter(Boolean) || ['Confirm dimensions before construction.'],
      costRange: 'Not estimated',
      before: 'Unassessed',
      after: 'Unassessed',
    }
  })

  return {
    summary: text(data.summary, 'Room layout analyzed from floor plan.'),
    orientation: text(data.orientation, 'Not identifiable.'),
    rooms,
    observations,
    recommendations,
    openings: {
      doors: Math.max(0, Number.isInteger(data.openings?.doors) ? data.openings.doors : 0),
      windows: Math.max(0, Number.isInteger(data.openings?.windows) ? data.openings.windows : 0),
      vents: Math.max(0, Number.isInteger(data.openings?.vents) ? data.openings.vents : 0),
    },
    limitations: list(data.limitations, 8).filter((v) => typeof v === 'string').map(text).filter(Boolean),
  }
}

export function validatePlanImage(base64, mimeType) {
  if (typeof base64 !== 'string' || !base64) {
    throw Object.assign(new Error('A valid floor plan image is required.'), { status: 400 })
  }
  if (!Object.hasOwn(IMAGE_SIGNATURES, mimeType)) {
    throw Object.assign(new Error('Only PNG, JPG, and WEBP images are supported.'), { status: 400 })
  }
  const bytes = Buffer.from(base64, 'base64')
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw Object.assign(new Error('Image must be 3.5 MB or smaller.'), { status: 413 })
  }
  if (bytes.length === 0 || !IMAGE_SIGNATURES[mimeType](bytes)) {
    throw Object.assign(new Error('The file is not a valid image of the stated type.'), { status: 400 })
  }
  return bytes
}

// --- Main Exported Functions ---

export async function analyzeFloorPlan(base64, mimeType) {
  requireBedrockConfig()
  const imageBytes = validatePlanImage(base64, mimeType)
  const format = mimeType.replace('image/', '') // e.g., 'jpeg', 'png'

  const response = await bedrock.send(new ConverseCommand({
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0', 
    inferenceConfig: { maxTokens: 4000, temperature: 0.2 },
    system: [{
      text: `You are a careful architectural floor-plan analyst. Only state facts visible in the image. Return only a valid JSON object with this shape: {"summary":"string","orientation":"string","rooms":[{"name":"string","type":"string","heatRisk":"low|moderate|elevated|high","ventilation":"string","features":["string"]}],"openings":{"doors":0,"windows":0,"vents":0},"observations":[{"finding":"string","explanation":"string","severity":"High|Medium|Low","room":"room name","reasoning":"string","assumptions":"string","nextStep":"string"}],"recommendations":[{"title":"string","description":"string","benefit":"string","priority":"High|Medium","category":"shade|window|vent|exhaust|roof|fan","room":"room name","why":"string","assumptions":["string"]}],"limitations":["string"]}.`
    }],
    messages: [{
      role: 'user',
      content: [
        { text: 'Analyze this uploaded floor plan image and return the requested structured JSON.' },
        { image: { format, source: { bytes: imageBytes } } },
      ],
    }],
  }))

  const responseText = response.output?.message?.content?.[0]?.text
  if (!responseText) throw new Error('Bedrock returned an empty analysis.')
  
  return { analysis: normalizeAnalysis(parseModelJson(responseText)) }
}

export async function generateDesignImage(prompt, imageBase64, mimeType) {
  requireBedrockConfig()
  if (typeof prompt !== 'string' || prompt.trim().length < 10 || prompt.trim().length > 512) {
    throw Object.assign(new Error('The image prompt must be between 10 and 512 characters.'), { status: 400 })
  }

  const imageBytes = validatePlanImage(imageBase64, mimeType)
  
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: process.env.BEDROCK_IMAGE_MODEL_ID || 'amazon.titan-image-generator-v2:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      taskType: 'TEXT_IMAGE',
      textToImageParams: {
        text: prompt.trim(),
        negativeText: 'text, labels, watermark, unsafe construction',
        conditionImage: imageBytes.toString('base64'),
        controlMode: 'CANNY_EDGE',
        controlStrength: 0.55,
      },
      imageGenerationConfig: { numberOfImages: 1, height: 768, width: 1024, quality: 'standard', cfgScale: 7 },
    }),
  }))

  const result = JSON.parse(new TextDecoder().decode(response.body))
  if (!result.images?.[0]) throw new Error('Bedrock image generation failed.')
  
  return result.images[0]
}

export function publicError(error) {
  const status = Number.isInteger(error?.status) ? error.status : 502
  const code = error?.name || ''
  
  if (status === 503 && error.message.includes('not configured')) {
    return { status, message: error.message }
  }
  if (['AccessDeniedException', 'UnrecognizedClientException', 'UnauthorizedOperationException'].some(e => code.includes(e))) {
    return { status: 502, message: 'AWS Credentials invalid or model access not enabled in this region.' }
  }
  if (['ThrottlingException', 'TooManyRequestsException'].some(e => code.includes(e)) || status === 429) {
    return { status: 429, message: 'The AI service is throttling requests. Please try again later.' }
  }
  if (code.includes('ValidationException')) {
    return { status: 400, message: error.message }
  }
  return { status, message: status < 500 ? error.message : 'AI service error. Please check the API server logs.' }
}