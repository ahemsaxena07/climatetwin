import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react'
import type { FloorPlanAnalysis, LiveClimate, Observation, Recommendation, SavedState, SectionId, TabId } from './types/dashboard'
import {
  climateProfiles, extraRecommendations, locations, observations, periods, project, recommendations, sectionInfo,
} from './data/mockClimateData'
import { TopBar } from './components/layout/TopBar'
import { Sidebar } from './components/layout/Sidebar'
import { WorkflowSteps } from './components/layout/WorkflowSteps'
import { AnalysisTabs } from './components/floorplan/AnalysisTabs'
import { FloorPlanCanvas } from './components/floorplan/FloorPlanCanvas'
import { FloorPlanLegend } from './components/floorplan/FloorPlanLegend'
import { ClimateInsights } from './components/climate/ClimateInsights'
import { HistoricalClimatePanel } from './components/climate/HistoricalClimatePanel'
import { KeyObservations } from './components/analysis/KeyObservations'
import { RecommendedActions } from './components/analysis/RecommendedActions'
import { ProjectGoals } from './components/goals/ProjectGoals'
import { Modal } from './components/common/Modal'
import { Badge, severityTone } from './components/common/Badge'
import { Toast } from './components/common/Toast'
import { FloorPlanUploader } from './components/upload/FloorPlanUploader'

const KEY = 'climatetwin.project'
const sectionTab: Partial<Record<SectionId, TabId>> = { thermal: 'thermal', ventilation: 'ventilation', cooling: 'cooling' }

function loadSaved(): SavedState | null {
  try { const s = localStorage.getItem(KEY); return s ? (JSON.parse(s) as SavedState) : null } catch { return null }
}

type Panel = null | { t: 'obs'; o: Observation } | { t: 'rec'; r: Recommendation } | { t: 'all' } | { t: 'history' }

export default function App() {
  const [init] = useState(loadSaved)
  const [section, setSection] = useState<SectionId>('overview')
  const [tab, setTab] = useState<TabId>(init?.tab ?? 'original')
  const [locationId, setLocationId] = useState(init?.location ?? project.defaultLocationId)
  const [periodId, setPeriodId] = useState(init?.period ?? project.defaultPeriodId)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [obsId, setObsId] = useState<number | null>(null)
  const [recId, setRecId] = useState<string | null>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)
  const [saved, setSaved] = useState<SavedState | null>(init)
  const [floorPlanAnalysis, setFloorPlanAnalysis] = useState<FloorPlanAnalysis | null>(null)
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null)
  const [climateResult, setClimateResult] = useState<{ key: string; data: LiveClimate } | null>(null)
  const [climateRequestError, setClimateRequestError] = useState<{ key: string; error: string } | null>(null)
  const [designImage, setDesignImage] = useState<string | null>(null)
  const [designImageError, setDesignImageError] = useState<string | null>(null)
  const [generatingDesign, setGeneratingDesign] = useState(false)

  const loc = locations.find((l) => l.id === locationId) ?? locations[0]
  const per = periods.find((p) => p.id === periodId) ?? periods[0]
  const climateKey = `${loc.latitude}:${loc.longitude}:${per.id}`
  const liveClimate = climateResult?.key === climateKey ? climateResult.data : null
  const climateError = climateRequestError?.key === climateKey ? climateRequestError.error : null
  const climateLoading = Boolean(floorPlanAnalysis && !liveClimate && !climateError)
  const profile = climateProfiles[loc.profileId]
  const sampleMonthly = profile.monthly
  const monthly = floorPlanAnalysis ? liveClimate?.monthly ?? [] : sampleMonthly
  const metrics = floorPlanAnalysis ? liveClimate?.metrics ?? [] : profile.metrics
  const currentObservations = floorPlanAnalysis?.observations ?? observations
  const currentRecommendations = floorPlanAnalysis?.recommendations ?? recommendations
  const analysisSource = floorPlanAnalysis ? 'Amazon Bedrock' : 'Sample data'

  useEffect(() => {
    if (!floorPlanAnalysis) return
    const controller = new AbortController()
    const query = new URLSearchParams({ latitude: String(loc.latitude), longitude: String(loc.longitude), years: per.id })
    fetch(`/api/climate?${query}`, { signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as LiveClimate & { error?: string }
        if (!response.ok) throw new Error(result.error || 'Could not load public weather data.')
        setClimateResult({ key: climateKey, data: result })
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setClimateRequestError({ key: climateKey, error: cause instanceof Error ? cause.message : 'Could not load public weather data.' })
      })
    return () => controller.abort()
  }, [floorPlanAnalysis, climateKey, loc.latitude, loc.longitude, per.id])

  const notify = useCallback((m: string) => { setToast(m); window.setTimeout(() => setToast(null), 2600) }, [])
  const close = useCallback(() => setPanel(null), [])

  const select = (id: SectionId) => {
    setSection(id); setMenu(false)
    const t = sectionTab[id]; if (t) setTab(t)
    if (id === 'overview') { setHighlight(null); setObsId(null); setRecId(null) }
  }
  const reset = () => { setSection('overview'); setTab('original'); setHighlight(null); setObsId(null); setRecId(null); setPanel(null); notify('View reset to Overview') }

  const save = () => {
    const s: SavedState = { location: locationId, period: periodId, tab, section, savedAt: new Date().toISOString() }
    try { localStorage.setItem(KEY, JSON.stringify(s)); setSaved(s); notify('Project saved locally (demo)') } catch { notify('Could not save in this browser') }
  }

  const download = () => {
    const lines = [
      'ClimateTwin AI - Floor Plan and Climate Report', '',
      `Project: ${project.name}`, `Location: ${loc.name}`, `Historical period: ${per.label}`,
      floorPlanAnalysis ? `Analysis source: Amazon Bedrock` : 'Analysis source: built-in illustrative sample',
      liveClimate ? `Climate source: ${liveClimate.source}` : 'Climate source: built-in illustrative sample', '',
      ...(floorPlanAnalysis ? [
        'Floor plan summary:', floorPlanAnalysis.summary, `Orientation: ${floorPlanAnalysis.orientation}`,
        `Rooms identified: ${floorPlanAnalysis.rooms.map((room) => room.name).join(', ')}`,
        `Visible openings: ${floorPlanAnalysis.openings.doors} doors, ${floorPlanAnalysis.openings.windows} windows, ${floorPlanAnalysis.openings.vents} vents`,
        '', 'Analysis limitations:', ...floorPlanAnalysis.limitations.map((limitation) => `- ${limitation}`),
      ] : []),
      '', 'Climate metrics:',
      ...metrics.map((m) => `- ${m.label}: ${m.value} (${m.status})`), '', 'Observations:',
      ...currentObservations.map((o) => `${o.id}. [${o.severity}] ${o.finding} — ${o.explanation}`), '', 'Recommended actions:',
      ...currentRecommendations.map((r) => `- [${r.priority}] ${r.title}: ${r.description} (${r.benefit})`),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    const a = document.createElement('a'); a.href = url; a.download = 'climatetwin-report.txt'; a.click(); URL.revokeObjectURL(url)
    notify('Report downloaded')
  }

  const pickObs = (o: Observation) => { setObsId(o.id); setRecId(null); setHighlight(o.roomId) }
  const pickRec = (r: Recommendation) => { setRecId(r.id); setObsId(null); setHighlight(r.roomId); setTab('proposed'); setPanel({ t: 'rec', r }) }
  const handleAnalyzed = (result: FloorPlanAnalysis, imageUrl: string) => {
    setFloorPlanAnalysis(result)
    setFloorPlanImage(imageUrl)
    setDesignImage(null)
    setDesignImageError(null)
    setObsId(null)
    setRecId(null)
    setSection('overview')
    setTab('original')
    setHighlight(null)
    notify('Floor plan analyzed — loading live climate data')
  }
  const createConditioningImage = (source: string) => new Promise<string>((resolve, reject) => {
    const image = new Image()
    image.onerror = () => reject(new Error('Could not prepare the floor plan image for design generation.'))
    image.onload = () => {
      const scale = Math.min(1, 1408 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Could not prepare the floor plan image for design generation.'))
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    image.src = source
  })
  const generateDesign = async () => {
    if (!floorPlanAnalysis || !floorPlanImage) return
    setGeneratingDesign(true)
    setDesignImageError(null)
    try {
      const roomsText = floorPlanAnalysis.rooms.map((room) => `${room.name} (${room.type})`).join(', ')
      const actionText = floorPlanAnalysis.recommendations.slice(0, 3).map((item) => item.title).join('; ')
      const prompt = `Photorealistic climate-responsive home interior design concept inspired by a floor plan with ${roomsText}. Design ideas: ${actionText || 'use daylight, shade and natural ventilation'}. Warm, practical materials, passive cooling, realistic residential architecture. Illustrative inspiration only, not an exact floor plan rendering. No text, labels, blueprints or watermark.`
      const conditioningDataUrl = await createConditioningImage(floorPlanImage)
      const response = await fetch('/api/generate-design-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.slice(0, 512),
          imageBase64: conditioningDataUrl.slice(conditioningDataUrl.indexOf(',') + 1),
          mimeType: 'image/jpeg',
        }),
      })
      const result = (await response.json()) as { imageBase64?: string; error?: string }
      if (!response.ok) throw new Error(result.error || 'Amazon Bedrock could not generate the design image.')
      if (!result.imageBase64) throw new Error('Bedrock returned no design image.')
      setDesignImage(`data:image/png;base64,${result.imageBase64}`)
    } catch (cause) {
      setDesignImageError(cause instanceof Error ? cause.message : 'Could not generate the design image.')
    } finally {
      setGeneratingDesign(false)
    }
  }

  const showDash = section === 'overview' || section in sectionTab
  const info = sectionInfo[section]

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar locationId={locationId} periodId={periodId} onLocation={(id) => { setLocationId(id); notify('Location updated — weather will refresh') }}
        onPeriod={setPeriodId} onSave={save} onDownload={download} onMenu={() => setMenu(true)} />
      <div className="flex flex-1">
        <Sidebar active={section} locationShort={loc.short} onSelect={select} open={menu} onClose={() => setMenu(false)} />
        <main className="min-w-0 flex-1 p-3.5">
          <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h1 className="font-serif text-[30px] font-bold leading-tight text-ink">Thermal Twin Studio</h1>
              <p className="text-[14px] text-muted">Turn your floor plan into a climate-ready home.</p>
            </div>
            <WorkflowSteps />
          </div>

          {showDash && (
            <div className="grid gap-3 lg:grid-cols-[57fr_43fr]">
              <section aria-labelledby="fp-h" className="card flex min-h-[520px] flex-col gap-3 p-3.5">
                <div className="flex items-center justify-between">
                  <h2 id="fp-h" className="font-serif text-[19px] font-semibold">Floor Plan Analysis</h2>
                  <button onClick={reset} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted hover:bg-ivory hover:text-ink"><RotateCcw size={13} /> Reset view</button>
                </div>
                <AnalysisTabs tab={tab} onChange={setTab} />
                <div className="min-h-[340px] flex-1 rounded-lg border border-line bg-white"><FloorPlanCanvas tab={tab} highlight={highlight} imageUrl={floorPlanImage} /></div>
                {floorPlanAnalysis && (
                  <div className="rounded-lg border border-line bg-ivory p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Bedrock plan analysis <Badge tone="green">{floorPlanAnalysis.rooms.length} rooms</Badge></h3>
                      <span className="text-xs text-muted">{floorPlanAnalysis.openings.doors} doors · {floorPlanAnalysis.openings.windows} windows · {floorPlanAnalysis.openings.vents} vents</span>
                    </div>
                    <p className="mb-2 text-xs leading-relaxed text-muted">{floorPlanAnalysis.summary}</p>
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {floorPlanAnalysis.rooms.map((room) => (
                        <div key={room.id} className={`rounded-md border bg-white px-2 py-1.5 ${highlight === room.id ? 'border-leaf' : 'border-line'}`}>
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate text-xs font-semibold">{room.name}</span>
                            <Badge tone={room.heatRisk === 'high' ? 'high' : room.heatRisk === 'elevated' ? 'medium' : 'neutral'}>{room.heatRisk} hypothesis</Badge>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted">{room.type} · {room.ventilation}</p>
                        </div>
                      ))}
                    </div>
                    {floorPlanAnalysis.limitations.length > 0 && <p className="mt-2 text-[11px] text-muted">Limitations: {floorPlanAnalysis.limitations.join(' ')}</p>}
                  </div>
                )}
                <FloorPlanLegend tab={tab} />
              </section>
              <div className="card flex flex-col gap-3 p-3.5">
                <ClimateInsights metrics={metrics} source={liveClimate?.source ?? (floorPlanAnalysis ? 'Awaiting live data' : 'Sample data')} loading={climateLoading} error={climateError} onHistory={() => select('climate')} />
                <KeyObservations items={currentObservations} activeId={obsId} onSelect={pickObs} source={analysisSource} onDetails={() => currentObservations.length && setPanel({ t: 'obs', o: currentObservations.find((o) => o.id === (obsId ?? 1)) ?? currentObservations[0] })} />
                <RecommendedActions items={currentRecommendations} activeId={recId} onSelect={pickRec} onViewAll={() => setPanel({ t: 'all' })} source={analysisSource} />
                {floorPlanAnalysis && (
                  <section className="border-t border-line pt-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h2 className="font-serif text-[17px] font-semibold">Climate design concept</h2>
                      <button onClick={generateDesign} disabled={generatingDesign} className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest disabled:opacity-60">
                        {generatingDesign ? <LoaderCircle size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {generatingDesign ? 'Generating…' : 'Generate image'}
                      </button>
                    </div>
                    {designImage && <img src={designImage} alt="AI-generated climate-responsive interior design concept" className="max-h-64 w-full rounded-lg border border-line bg-white object-contain" />}
                    {designImageError && <p role="alert" className="mb-2 text-xs text-red-700">{designImageError}</p>}
                    <p className="text-[11px] text-muted">Generated by Amazon Titan Image Generator, using the uploaded plan to guide layout. For visual inspiration only; not dimensionally accurate or a construction drawing.</p>
                  </section>
                )}
              </div>
            </div>
          )}

          {section === 'climate' && (
            <section className="card p-4" aria-labelledby="sc-h">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="sc-h" className="font-serif text-[20px] font-semibold">Site &amp; Climate Data</h2>
                <button onClick={() => select('overview')} className="flex items-center gap-1 text-sm font-semibold text-leaf hover:underline"><ArrowLeft size={14} /> Back to Overview</button>
              </div>
              {climateLoading ? <p className="rounded-lg border border-line bg-ivory p-6 text-center text-sm text-muted">Loading live weather and historical observations…</p> : null}
              {climateError && <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{climateError}</p>}
              {!climateLoading && monthly.length > 0 && <HistoricalClimatePanel data={monthly} locationName={loc.name} period={per.label} source={liveClimate?.source ?? 'Sample data — not observed measurements'} />}
              {!climateLoading && !monthly.length && !climateError && <p className="rounded-lg border border-line bg-ivory p-6 text-center text-sm text-muted">Historical climate observations are not available yet. Upload and analyze a floor plan to load live local weather data.</p>}
            </section>
          )}

          {info && (
            <section className="card p-5" aria-labelledby="ph">
              <div className="mb-1 flex items-center justify-between">
                <h2 id="ph" className="font-serif text-[22px] font-semibold">{info.title} <Badge tone="neutral">{section === 'upload' ? 'Amazon Bedrock' : 'Demo'}</Badge></h2>
                <button onClick={() => select('overview')} className="flex items-center gap-1 text-sm font-semibold text-leaf hover:underline"><ArrowLeft size={14} /> Back to Overview</button>
              </div>
              <p className="mb-4 max-w-2xl text-sm text-muted">{info.description}</p>
              {section === 'upload' ? (
                <FloorPlanUploader onAnalyzed={handleAnalyzed} />
              ) : section === 'saved' ? (
                saved ? (
                  <div className="rounded-lg border border-line bg-ivory p-3 text-sm">
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-muted">{locations.find((l) => l.id === saved.location)?.name} · {saved.period} · saved {new Date(saved.savedAt).toLocaleString()}</p>
                  </div>
                ) : <p className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">No saved projects yet. Use “Save Project” in the header.</p>
              ) : (
                <dl className="grid gap-3 sm:grid-cols-3">
                  {info.stats.map((s) => <div key={s.label} className="rounded-lg border border-line bg-ivory p-3"><dt className="text-xs text-muted">{s.label}</dt><dd className="mt-0.5 text-sm font-semibold">{s.value}</dd></div>)}
                </dl>
              )}
              {section === 'report' && <button onClick={download} className="mt-4 rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-forest">Download Report</button>}
            </section>
          )}

          <div className="mt-3"><ProjectGoals /></div>
        </main>
      </div>

      {panel?.t === 'obs' && (
        <Modal title="Observation details" onClose={close}>
          <Badge tone={floorPlanAnalysis ? 'green' : 'neutral'}>{floorPlanAnalysis ? 'Amazon Bedrock floor plan analysis' : 'Illustrative sample observation'}</Badge>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{panel.o.finding}</h3><Badge tone={severityTone(panel.o.severity)}>{panel.o.severity}</Badge></div>
            <p><b>Reasoning:</b> {panel.o.reasoning}</p><p><b>Assumptions:</b> {panel.o.assumptions}</p><p><b>Recommended next step:</b> {panel.o.nextStep}</p>
            <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
              {currentObservations.map((o) => <button key={o.id} onClick={() => { setPanel({ t: 'obs', o }); pickObs(o) }} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${o.id === panel.o.id ? 'bg-pine text-white' : 'bg-ivory'}`}>#{o.id}</button>)}
            </div>
          </div>
        </Modal>
      )}
      {panel?.t === 'rec' && (
        <Modal title={panel.r.title} onClose={close} variant="drawer">
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex gap-1.5"><Badge tone="blue">{panel.r.benefit}</Badge><Badge tone={panel.r.priority === 'High' ? 'high' : 'medium'}>{panel.r.priority}</Badge></div>
            <p><b>Why it matters:</b> {panel.r.why}</p>
            <div><b>Assumptions:</b><ul className="mt-1 list-disc pl-5 text-muted">{panel.r.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></div>
            <p><b>Cost range:</b> {panel.r.costRange}</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-[#FFE3DE] p-2"><div className="text-[11px] text-muted">Before assessment</div><div className="font-semibold">{panel.r.before}</div></div>
              <div className="rounded-lg bg-[#DDF5E3] p-2"><div className="text-[11px] text-muted">After proposal</div><div className="font-semibold">{panel.r.after}</div></div>
            </div>
            <p className="text-xs text-muted">AI suggestions are based on visible plan details only. Costs and performance changes are not estimated; verify dimensions and site conditions with a qualified professional.</p>
          </div>
        </Modal>
      )}
      {panel?.t === 'all' && (
        <Modal title="All recommendations" onClose={close}>
          <ul className="flex flex-col gap-2 text-sm">
            {[...currentRecommendations.map((r) => ({ id: r.id, title: r.title, description: r.description, priority: r.priority })), ...(floorPlanAnalysis ? [] : extraRecommendations)].map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 rounded-lg border border-line p-2.5">
                <div><p className="font-semibold">{r.title}</p><p className="text-xs text-muted">{r.description}</p></div>
                <Badge tone={r.priority === 'High' ? 'high' : r.priority === 'Medium' ? 'medium' : 'low'}>{r.priority}</Badge>
              </li>))}
          </ul>
        </Modal>
      )}
      <Toast message={toast} />
    </div>
  )
}
