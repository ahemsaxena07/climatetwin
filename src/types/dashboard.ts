export type TabId = 'original' | 'thermal' | 'ventilation' | 'cooling' | 'proposed'
export type Severity = 'High' | 'Medium' | 'Low'
export type HeatLevel = 'low' | 'moderate' | 'elevated' | 'high'
export type SectionId =
  | 'overview' | 'upload' | 'climate' | 'thermal' | 'ventilation' | 'cooling'
  | 'materials' | 'cost' | 'report' | 'saved' | 'settings'

export interface Room {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  /** label anchor */
  lx: number
  ly: number
  heat: HeatLevel
  heatNote: string
  limitedAirflow?: boolean
}

export interface Opening {
  id: string
  kind: 'window' | 'door' | 'ventilator'
  /** wall orientation: h = horizontal wall segment, v = vertical */
  orient: 'h' | 'v'
  x: number
  y: number
  len: number
  /** door swing direction for arcs */
  swing?: 'tl' | 'tr' | 'bl' | 'br'
  roomId: string
  facing?: 'N' | 'S' | 'E' | 'W'
}

export interface Fixture { id: string; x: number; y: number; roomId: string; label?: string }

export interface AirPath {
  id: string
  d: string
  kind: 'primary' | 'secondary'
}
export interface AirPoint { id: string; x: number; y: number; kind: 'inlet' | 'outlet' }

export interface Proposal {
  id: string
  kind: 'shading' | 'opening' | 'exhaust' | 'roof' | 'ac' | 'fan'
  x: number
  y: number
  w: number
  h: number
  label: string
  verify: boolean
}

export interface ClimateMetric {
  id: string
  label: string
  value: string
  status: string
  tone: 'high' | 'moderate' | 'neutral'
  icon: 'sun' | 'droplet' | 'wind' | 'thermo'
}

export interface MonthlyClimate {
  month: string
  maxTemp: number
  humidity: number
  warmNights: number
  wetBulb: number
  windSpeed: number
  windDir: string
  solar: number
}

export interface LiveClimate {
  metrics: ClimateMetric[]
  monthly: MonthlyClimate[]
  source: string
  fetchedAt: string
}

export interface FloorPlanAnalysis {
  summary: string
  orientation: string
  rooms: { id: string; name: string; type: string; heatRisk: HeatLevel; ventilation: string; features: string[] }[]
  observations: Observation[]
  recommendations: Recommendation[]
  openings: { doors: number; windows: number; vents: number }
  limitations: string[]
}

export interface ClimateProfile {
  id: string
  metrics: ClimateMetric[]
  monthly: MonthlyClimate[]
}

export interface LocationOption { id: string; name: string; short: string; profileId: string; latitude: number; longitude: number }
export interface PeriodOption { id: string; label: string; shift: number }

export interface Observation {
  id: number
  finding: string
  explanation: string
  severity: Severity
  roomId: string
  reasoning: string
  assumptions: string
  nextStep: string
}

export interface Recommendation {
  id: string
  title: string
  description: string
  benefit: string
  priority: 'High' | 'Medium'
  icon: 'shade' | 'exhaust' | 'window' | 'roof'
  sponsored?: boolean
  roomId: string
  why: string
  assumptions: string[]
  costRange: string
  before: string
  after: string
}

export interface ExtraRecommendation {
  id: string
  title: string
  description: string
  priority: 'High' | 'Medium' | 'Low'
}

export interface Goal { id: string; title: string; description: string; icon: 'leaf' | 'droplet' | 'zap' | 'heart'; color: string }

export interface SavedState {
  location: string
  period: string
  tab: TabId
  section: SectionId
  savedAt: string
}
