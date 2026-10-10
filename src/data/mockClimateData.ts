/**
 * ClimateTwin AI — central MOCK data.
 * Every value in this file is fictional sample data for demonstrating the UI.
 * Nothing here is a live measurement, verified observation or simulation output.
 * Replace the exports with backend responses in a later phase.
 */
import type {
  AirPath, AirPoint, ClimateProfile, ExtraRecommendation, Fixture, Goal, LocationOption,
  MonthlyClimate, Observation, Opening, PeriodOption, Proposal, Recommendation, Room, SectionId,
} from '../types/dashboard'

export const MOCK_DATA_LABEL = 'Sample data — fictional values for demonstration'

export const project = {
  name: 'My Home Project',
  shortLocation: 'Greater Noida, UP',
  defaultLocationId: 'greater-noida',
  defaultPeriodId: '1',
  scaleLabel: 'Scale: 1:100',
}

export const locations: LocationOption[] = [
  { id: 'greater-noida', name: 'Greater Noida, Uttar Pradesh', short: 'Greater Noida, UP', profileId: 'composite', latitude: 28.4744, longitude: 77.504 },
  { id: 'jaipur', name: 'Jaipur, Rajasthan', short: 'Jaipur, RJ', profileId: 'hotdry', latitude: 26.9124, longitude: 75.7873 },
  { id: 'chennai', name: 'Chennai, Tamil Nadu', short: 'Chennai, TN', profileId: 'humid', latitude: 13.0827, longitude: 80.2707 },
  { id: 'pune', name: 'Pune, Maharashtra', short: 'Pune, MH', profileId: 'moderate', latitude: 18.5204, longitude: 73.8567 },
  { id: 'bengaluru', name: 'Bengaluru, Karnataka', short: 'Bengaluru, KA', profileId: 'mild', latitude: 12.9716, longitude: 77.5946 },
]

export const periods: PeriodOption[] = [
  { id: '1', label: 'Past 12 months', shift: 0 },
  { id: '3', label: 'Past 3 years', shift: 0 },
  { id: '5', label: 'Past 5 years', shift: 0 },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const base = {
  maxTemp: [19, 23, 30, 37, 42, 40, 35, 33, 34, 33, 28, 22],
  humidity: [72, 68, 56, 46, 48, 66, 86, 90, 84, 70, 66, 72],
  warmNights: [0, 0, 0, 4, 18, 24, 26, 27, 22, 10, 0, 0],
  wetBulb: [12, 14, 17, 21, 24, 28, 29, 28, 27, 23, 17, 13],
  windSpeed: [8, 9, 11, 13, 14, 12, 10, 9, 8, 7, 7, 7],
  windDir: ['NW', 'NW', 'NW', 'W', 'NW', 'SE', 'SE', 'E', 'E', 'NW', 'N', 'NW'],
  solar: [4.0, 5.0, 6.0, 7.0, 7.4, 6.5, 5.0, 4.8, 5.5, 5.6, 4.6, 3.8],
}

function monthly(dT: number, dH: number, dW: number, dS: number): MonthlyClimate[] {
  return MONTHS.map((month, i) => ({
    month,
    maxTemp: base.maxTemp[i] + dT,
    humidity: Math.max(20, Math.min(98, base.humidity[i] + dH)),
    warmNights: Math.max(0, Math.min(30, base.warmNights[i] + (dT > 0 ? 3 : dT < 0 ? -4 : 0))),
    wetBulb: base.wetBulb[i] + dW,
    windSpeed: Math.max(2, base.windSpeed[i] + dS),
    windDir: base.windDir[i],
    solar: Math.max(2, +(base.solar[i] + (dT > 0 ? 0.2 : dT < 0 ? -0.2 : 0)).toFixed(1)),
  }))
}

export const climateProfiles: Record<string, ClimateProfile> = {
  composite: {
    id: 'composite',
    monthly: monthly(0, 0, 0, 0),
    metrics: [
      { id: 'peak', icon: 'sun', label: 'Peak Temp (May)', value: '42°C', status: 'High Heat Risk', tone: 'high' },
      { id: 'hum', icon: 'droplet', label: 'Avg. Humidity', value: '68%', status: 'Moderate', tone: 'moderate' },
      { id: 'wind', icon: 'wind', label: 'Prevailing Wind', value: '12 km/h', status: 'NW (Summer)', tone: 'neutral' },
      { id: 'wb', icon: 'thermo', label: 'Avg. Wet Bulb', value: '26°C', status: 'High Discomfort', tone: 'high' },
    ],
  },
  hotdry: {
    id: 'hotdry',
    monthly: monthly(1.5, -22, -3, 2),
    metrics: [
      { id: 'peak', icon: 'sun', label: 'Peak Temp (May)', value: '44°C', status: 'Very High Heat Risk', tone: 'high' },
      { id: 'hum', icon: 'droplet', label: 'Avg. Humidity', value: '46%', status: 'Low–Moderate', tone: 'moderate' },
      { id: 'wind', icon: 'wind', label: 'Prevailing Wind', value: '14 km/h', status: 'W (Summer)', tone: 'neutral' },
      { id: 'wb', icon: 'thermo', label: 'Avg. Wet Bulb', value: '22°C', status: 'Moderate Discomfort', tone: 'moderate' },
    ],
  },
  humid: {
    id: 'humid',
    monthly: monthly(-4, 8, 2, 3),
    metrics: [
      { id: 'peak', icon: 'sun', label: 'Peak Temp (May)', value: '38°C', status: 'Moderate Heat Risk', tone: 'moderate' },
      { id: 'hum', icon: 'droplet', label: 'Avg. Humidity', value: '76%', status: 'High', tone: 'high' },
      { id: 'wind', icon: 'wind', label: 'Prevailing Wind', value: '15 km/h', status: 'SE (Summer)', tone: 'neutral' },
      { id: 'wb', icon: 'thermo', label: 'Avg. Wet Bulb', value: '27°C', status: 'High Discomfort', tone: 'high' },
    ],
  },
  moderate: {
    id: 'moderate',
    monthly: monthly(-6, -8, -3, 1),
    metrics: [
      { id: 'peak', icon: 'sun', label: 'Peak Temp (May)', value: '36°C', status: 'Moderate Heat Risk', tone: 'moderate' },
      { id: 'hum', icon: 'droplet', label: 'Avg. Humidity', value: '58%', status: 'Moderate', tone: 'moderate' },
      { id: 'wind', icon: 'wind', label: 'Prevailing Wind', value: '13 km/h', status: 'W (Summer)', tone: 'neutral' },
      { id: 'wb', icon: 'thermo', label: 'Avg. Wet Bulb', value: '22°C', status: 'Moderate Discomfort', tone: 'moderate' },
    ],
  },
  mild: {
    id: 'mild',
    monthly: monthly(-9, -2, -5, 0),
    metrics: [
      { id: 'peak', icon: 'sun', label: 'Peak Temp (May)', value: '33°C', status: 'Low Heat Risk', tone: 'neutral' },
      { id: 'hum', icon: 'droplet', label: 'Avg. Humidity', value: '64%', status: 'Moderate', tone: 'moderate' },
      { id: 'wind', icon: 'wind', label: 'Prevailing Wind', value: '11 km/h', status: 'SW (Summer)', tone: 'neutral' },
      { id: 'wb', icon: 'thermo', label: 'Avg. Wet Bulb', value: '20°C', status: 'Low Discomfort', tone: 'neutral' },
    ],
  },
}

/* ------------------------------ Floor plan ------------------------------ */
export const PLAN_VIEWBOX = { w: 940, h: 560 }
export const BUILDING = { x: 60, y: 70, w: 780, h: 400 }

export const rooms: Room[] = [
  { id: 'bed1', label: 'Bedroom 1', x: 60, y: 70, w: 210, h: 220, lx: 165, ly: 278, heat: 'high', heatNote: 'West-facing window, low shading' },
  { id: 'toilet', label: 'Toilet', x: 270, y: 70, w: 70, h: 130, lx: 305, ly: 188, heat: 'low', heatNote: 'Interior-side room' },
  { id: 'bath', label: 'Bath', x: 340, y: 70, w: 90, h: 130, lx: 385, ly: 188, heat: 'low', heatNote: 'Interior-side room' },
  { id: 'passage', label: 'Passage', x: 270, y: 200, w: 160, h: 90, lx: 350, ly: 262, heat: 'low', heatNote: 'Circulation space', limitedAirflow: true },
  { id: 'living', label: 'Living Room', x: 430, y: 70, w: 210, h: 220, lx: 535, ly: 270, heat: 'moderate', heatNote: 'Single window wall on the north' },
  { id: 'bed2', label: 'Bedroom 2', x: 640, y: 70, w: 200, h: 220, lx: 740, ly: 278, heat: 'elevated', heatNote: 'East window, morning sun' },
  { id: 'kitchen', label: 'Kitchen', x: 60, y: 290, w: 200, h: 180, lx: 160, ly: 392, heat: 'high', heatNote: 'West exposure plus cooking heat', limitedAirflow: true },
  { id: 'dining', label: 'Dining', x: 260, y: 290, w: 220, h: 180, lx: 370, ly: 454, heat: 'moderate', heatNote: 'Shaded by verandah' },
  { id: 'verandah', label: 'Verandah', x: 480, y: 290, w: 360, h: 180, lx: 660, ly: 456, heat: 'elevated', heatNote: 'Open semi-outdoor space' },
]

export const openings: Opening[] = [
  // windows
  { id: 'w-bed1-w', kind: 'window', orient: 'v', x: 60, y: 115, len: 80, roomId: 'bed1', facing: 'W' },
  { id: 'w-bed1-n', kind: 'window', orient: 'h', x: 110, y: 70, len: 70, roomId: 'bed1', facing: 'N' },
  { id: 'w-bed2-n', kind: 'window', orient: 'h', x: 700, y: 70, len: 80, roomId: 'bed2', facing: 'N' },
  { id: 'w-bed2-e', kind: 'window', orient: 'v', x: 840, y: 130, len: 70, roomId: 'bed2', facing: 'E' },
  { id: 'w-liv-n', kind: 'window', orient: 'h', x: 490, y: 70, len: 90, roomId: 'living', facing: 'N' },
  { id: 'w-kit-w', kind: 'window', orient: 'v', x: 60, y: 340, len: 70, roomId: 'kitchen', facing: 'W' },
  { id: 'w-kit-s', kind: 'window', orient: 'h', x: 95, y: 470, len: 60, roomId: 'kitchen', facing: 'S' },
  { id: 'w-din-s', kind: 'window', orient: 'h', x: 330, y: 470, len: 80, roomId: 'dining', facing: 'S' },
  // ventilators
  { id: 'v-toilet', kind: 'ventilator', orient: 'h', x: 290, y: 70, len: 30, roomId: 'toilet', facing: 'N' },
  { id: 'v-bath', kind: 'ventilator', orient: 'h', x: 365, y: 70, len: 30, roomId: 'bath', facing: 'N' },
  { id: 'v-kit', kind: 'ventilator', orient: 'h', x: 205, y: 470, len: 30, roomId: 'kitchen', facing: 'S' },
  // doors
  { id: 'd-main', kind: 'door', orient: 'h', x: 520, y: 290, len: 50, swing: 'tl', roomId: 'living' },
  { id: 'd-din-ver', kind: 'door', orient: 'v', x: 480, y: 340, len: 45, swing: 'tl', roomId: 'dining' },
  { id: 'd-bed1', kind: 'door', orient: 'v', x: 270, y: 235, len: 40, swing: 'bl', roomId: 'bed1' },
  { id: 'd-bed2', kind: 'door', orient: 'v', x: 640, y: 215, len: 45, swing: 'tr', roomId: 'bed2' },
  { id: 'd-bath', kind: 'door', orient: 'h', x: 360, y: 200, len: 35, swing: 'tl', roomId: 'bath' },
  { id: 'd-toilet', kind: 'door', orient: 'h', x: 282, y: 200, len: 32, swing: 'tl', roomId: 'toilet' },
  { id: 'd-kit', kind: 'door', orient: 'v', x: 260, y: 395, len: 40, swing: 'bl', roomId: 'kitchen' },
  { id: 'd-pass-liv', kind: 'door', orient: 'v', x: 430, y: 222, len: 44, roomId: 'passage' },
  { id: 'd-pass-din', kind: 'door', orient: 'h', x: 320, y: 290, len: 50, roomId: 'passage' },
]

export const ceilingFans: Fixture[] = [
  { id: 'fan-bed1', x: 165, y: 195, roomId: 'bed1' },
  { id: 'fan-living', x: 535, y: 175, roomId: 'living' },
  { id: 'fan-bed2', x: 740, y: 190, roomId: 'bed2' },
  { id: 'fan-dining', x: 370, y: 380, roomId: 'dining' },
]

export const acUnits: Fixture[] = [
  { id: 'ac-bed1', x: 210, y: 78, roomId: 'bed1', label: 'AC — Bedroom 1' },
  { id: 'ac-living', x: 590, y: 78, roomId: 'living', label: 'AC — Living' },
  { id: 'ac-bed2', x: 805, y: 78, roomId: 'bed2', label: 'AC — Bedroom 2' },
]

export const exhaustFans: Fixture[] = [
  { id: 'ex-kit', x: 220, y: 456, roomId: 'kitchen', label: 'Kitchen exhaust' },
]

export const airPaths: AirPath[] = [
  { id: 'ap-1', kind: 'primary', d: 'M36 155 L130 170 L225 252 L270 255 L350 262 L430 244 L520 190 L630 150' },
  { id: 'ap-2', kind: 'primary', d: 'M535 52 L535 150 L545 270 L548 300 L560 360' },
  { id: 'ap-3', kind: 'secondary', d: 'M740 52 L760 130 L810 160 L862 168' },
  { id: 'ap-4', kind: 'secondary', d: 'M370 492 L372 430 L430 380 L480 362 L560 362' },
  { id: 'ap-5', kind: 'secondary', d: 'M145 52 L140 110 L190 160' },
  { id: 'ap-6', kind: 'secondary', d: 'M215 452 L216 490' },
]

export const airPoints: AirPoint[] = [
  { id: 'in-bed1-w', kind: 'inlet', x: 60, y: 155 },
  { id: 'in-bed1-n', kind: 'inlet', x: 145, y: 70 },
  { id: 'in-liv-n', kind: 'inlet', x: 535, y: 70 },
  { id: 'in-bed2-n', kind: 'inlet', x: 740, y: 70 },
  { id: 'in-din-s', kind: 'inlet', x: 370, y: 470 },
  { id: 'out-bed2-e', kind: 'outlet', x: 840, y: 165 },
  { id: 'out-kit', kind: 'outlet', x: 220, y: 470 },
  { id: 'out-ver', kind: 'outlet', x: 548, y: 290 },
]

export const proposals: Proposal[] = [
  { id: 'pr-shade', kind: 'shading', x: 30, y: 100, w: 26, h: 110, label: 'External shading (west)', verify: false },
  { id: 'pr-liv', kind: 'opening', x: 585, y: 62, w: 50, h: 16, label: 'Added opening (living)', verify: true },
  { id: 'pr-exh', kind: 'exhaust', x: 200, y: 440, w: 40, h: 30, label: 'Exhaust + replacement air', verify: false },
  { id: 'pr-roof', kind: 'roof', x: 48, y: 58, w: 804, h: 424, label: 'Reflective roof coating', verify: true },
  { id: 'pr-fan', kind: 'fan', x: 140, y: 395, w: 40, h: 40, label: 'Suggested kitchen fan', verify: true },
]

/* --------------------------- Observations & actions --------------------------- */
export const observations: Observation[] = [
  {
    id: 1, finding: 'Bedroom 1 receives high afternoon heat', explanation: 'West-facing window, low shading',
    severity: 'High', roomId: 'bed1',
    reasoning: 'The west wall carries the largest glazed opening in the house and no external shading is drawn on the plan. In the sample profile the afternoon sun angle reaches this wall during the hottest hours.',
    assumptions: 'Plan orientation: north up. No existing trees or neighbouring buildings shade the west side. Glazing type unknown.',
    nextStep: 'Review external shading options for the west window, then confirm dimensions with your architect.',
  },
  {
    id: 2, finding: 'Limited cross-ventilation in kitchen', explanation: 'Add exhaust fan and higher ventilator',
    severity: 'Medium', roomId: 'kitchen',
    reasoning: 'The kitchen has openings on the west and south walls only and no clear exit path for warm air or cooking fumes.',
    assumptions: 'Existing small ventilator is low on the wall. Outside wall is available for ducting.',
    nextStep: 'Consider an exhaust fan with outdoor ducting and a higher ventilator, with a replacement-air path from the dining area.',
  },
  {
    id: 3, finding: 'Living room can have better airflow', explanation: 'Consider larger window or second opening',
    severity: 'Medium', roomId: 'living',
    reasoning: 'The living room has one window on the north wall and a door opening to the verandah, which limits through-flow.',
    assumptions: 'Structural constraints on the north wall have not been checked.',
    nextStep: 'Evaluate a larger north window or an additional opening, subject to structural verification.',
  },
  {
    id: 4, finding: 'Good natural ventilation potential', explanation: 'North-South openings aligned',
    severity: 'Low', roomId: 'dining',
    reasoning: 'Openings on the north and south sides are broadly aligned, which gives cross-ventilation a natural route when doors are kept open.',
    assumptions: 'Internal doors stay open during the day. Furniture does not block the route.',
    nextStep: 'Keep the alignment when planning any new openings or partitions.',
  },
]

export const recommendations: Recommendation[] = [
  {
    id: 'rec-shade', title: 'Add external shading', description: 'For west-facing windows', benefit: 'Reduces heat gain',
    priority: 'High', icon: 'shade', roomId: 'bed1',
    why: 'Bedroom 1 has a large west window with no shading, which the sample analysis flags as the strongest heat-risk contributor.',
    assumptions: ['West window faces unobstructed sky', 'Wall can support a projecting or vertical shade', 'Orientation matches the compass on the plan'],
    costRange: '₹15,000 – ₹45,000 (illustrative)', before: 'High', after: 'Moderate',
  },
  {
    id: 'rec-exhaust', title: 'Install kitchen exhaust', description: 'With outdoor ducting', benefit: 'Improves air quality',
    priority: 'High', icon: 'exhaust', roomId: 'kitchen',
    why: 'Cooking heat and fumes have few exit paths in the current kitchen layout.',
    assumptions: ['An external wall is reachable for ducting', 'Replacement air can enter from the dining side', 'Electrical point available'],
    costRange: '₹8,000 – ₹25,000 (illustrative)', before: 'High', after: 'Moderate',
  },
  {
    id: 'rec-window', title: 'Optimize window placement', description: 'For cross-ventilation', benefit: 'Better airflow',
    priority: 'Medium', icon: 'window', roomId: 'living',
    why: 'An additional or larger opening in the living room would create a clearer flow path between north and south.',
    assumptions: ['North wall is non-structural at the chosen location', 'Privacy and rain protection are managed'],
    costRange: '₹30,000 – ₹90,000 (illustrative)', before: 'Moderate', after: 'Low',
  },
  {
    id: 'rec-roof', title: 'Use cool roof / reflective paint', description: 'Sponsored options', benefit: 'Lowers indoor temperature',
    priority: 'Medium', icon: 'roof', sponsored: true, roomId: 'all',
    why: 'A reflective roof finish can reduce roof heat absorption. Sponsored options are placeholders, not endorsements.',
    assumptions: ['Roof is flat or low-slope', 'Existing waterproofing is sound', 'No product claims are verified in this demo'],
    costRange: '₹20,000 – ₹60,000 (illustrative)', before: 'Elevated', after: 'Moderate',
  },
]

export const extraRecommendations: ExtraRecommendation[] = [
  { id: 'x1', title: 'Add ceiling fan in kitchen', description: 'Improves air movement near the cooking zone', priority: 'Medium' },
  { id: 'x2', title: 'Keep passage doors open by day', description: 'Supports the north-south airflow route', priority: 'Low' },
  { id: 'x3', title: 'Plant a shade tree on the west side', description: 'Long-term shading for Bedroom 1 and the kitchen', priority: 'Medium' },
  { id: 'x4', title: 'Add insulation to the west wall', description: 'Reduces conducted heat; verify wall build-up first', priority: 'Medium' },
  { id: 'x5', title: 'Use light-coloured external finish', description: 'Lowers heat absorption on exposed walls', priority: 'Low' },
]

export const goals: Goal[] = [
  { id: 'g1', title: 'Lower indoor temperature', description: 'Reduce heat gain and hot spots.', icon: 'leaf', color: '#176B45' },
  { id: 'g2', title: 'Better natural ventilation', description: 'Optimize doors, windows and ventilators.', icon: 'droplet', color: '#1685FF' },
  { id: 'g3', title: 'Lower electricity bills', description: 'Reduce cooling demand.', icon: 'zap', color: '#E0A100' },
  { id: 'g4', title: 'Healthier living spaces', description: 'Improved air quality and comfort.', icon: 'heart', color: '#873DF2' },
]

export const workflowSteps = [
  { n: '01', title: 'Upload Plan', text: "Add architect's floor plan" },
  { n: '02', title: 'Analyze', text: 'Heat, airflow & climate data' },
  { n: '03', title: 'Get Recommendations', text: 'Doors, windows, fans, AC, materials' },
  { n: '04', title: 'Build a Cooler Home', text: 'Lower bills, better living' },
]

export const sectionInfo: Partial<Record<SectionId, { title: string; description: string; stats: { label: string; value: string }[] }>> = {
  upload: {
    title: 'Upload Floor Plan',
    description: 'Upload a floor plan image for Gemini analysis, then explore room findings, live local climate, and generated design concepts.',
    stats: [],
  },
  materials: {
    title: 'Materials & Products',
    description: 'Review AI-generated material and shading recommendations. Verify all products and specifications with a qualified professional.',
    stats: [{ label: 'Roof finish', value: 'Review AI recommendations' }, { label: 'Glazing', value: 'Verify against site conditions' }, { label: 'Wall', value: 'Confirm existing construction' }],
  },
  cost: {
    title: 'Cost Estimate',
    description: 'Illustrative ranges for the recommended actions. These are not quotations.',
    stats: [{ label: 'Shading', value: '₹15,000 – ₹45,000' }, { label: 'Kitchen exhaust', value: '₹8,000 – ₹25,000' }, { label: 'Window change', value: '₹30,000 – ₹90,000' }],
  },
  report: {
    title: 'Report',
    description: 'Generate a summary of your selections and the mock findings. Use Download Report in the header to save it as a text file.',
    stats: [{ label: 'Format', value: 'Plain text (.txt)' }, { label: 'Contents', value: 'Location, climate, observations, actions' }, { label: 'Data', value: 'Sample only' }],
  },
  saved: {
    title: 'Saved Projects',
    description: 'Projects you save with Save Project are stored in this browser only (localStorage).',
    stats: [],
  },
  settings: {
    title: 'Settings',
    description: 'Configure the demo environment. Floor plan analysis uses Google Gemini, design concepts use Amazon Bedrock, and weather uses Open-Meteo.',
    stats: [{ label: 'Units', value: 'Metric (°C, km/h)' }, { label: 'Weather source', value: 'Open-Meteo public API' }, { label: 'AI analysis', value: 'Google Gemini' }],
  },
}
