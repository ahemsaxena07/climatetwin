import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import type { Observation, Recommendation, SavedState, SectionId, TabId } from './types/dashboard'
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
  const init = useMemo(loadSaved, [])
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

  const loc = locations.find((l) => l.id === locationId) ?? locations[0]
  const per = periods.find((p) => p.id === periodId) ?? periods[0]
  const profile = climateProfiles[loc.profileId]
  const monthly = useMemo(() => profile.monthly.map((m) => ({ ...m, maxTemp: +(m.maxTemp + per.shift).toFixed(1) })), [profile, per])

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
      'ClimateTwin AI - Thermal Twin Studio report (DEMO)', 'All values are fictional sample data. No real analysis was performed.', '',
      `Project: ${project.name}`, `Location: ${loc.name}`, `Historical period: ${per.label}`, '', 'Climate metrics (sample):',
      ...profile.metrics.map((m) => `- ${m.label}: ${m.value} (${m.status})`), '', 'Illustrative observations:',
      ...observations.map((o) => `${o.id}. [${o.severity}] ${o.finding} — ${o.explanation}`), '', 'Recommended actions:',
      ...recommendations.map((r) => `- [${r.priority}] ${r.title}: ${r.description} (${r.benefit}) — cost ${r.costRange}`),
    ]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    const a = document.createElement('a'); a.href = url; a.download = 'climatetwin-report.txt'; a.click(); URL.revokeObjectURL(url)
    notify('Report downloaded')
  }

  const pickObs = (o: Observation) => { setObsId(o.id); setRecId(null); setHighlight(o.roomId) }
  const pickRec = (r: Recommendation) => { setRecId(r.id); setObsId(null); setHighlight(r.roomId); setTab('proposed'); setPanel({ t: 'rec', r }) }

  const showDash = section === 'overview' || section in sectionTab
  const info = sectionInfo[section]

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar locationId={locationId} periodId={periodId} onLocation={(id) => { setLocationId(id); notify('Location updated — mock climate profile applied') }}
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
                <div className="min-h-[340px] flex-1 rounded-lg border border-line bg-white"><FloorPlanCanvas tab={tab} highlight={highlight} /></div>
                <FloorPlanLegend tab={tab} />
              </section>
              <div className="card flex flex-col gap-3 p-3.5">
                <ClimateInsights metrics={profile.metrics} onHistory={() => select('climate')} />
                <KeyObservations items={observations} activeId={obsId} onSelect={pickObs} onDetails={() => setPanel({ t: 'obs', o: observations.find((o) => o.id === (obsId ?? 1)) ?? observations[0] })} />
                <RecommendedActions items={recommendations} activeId={recId} onSelect={pickRec} onViewAll={() => setPanel({ t: 'all' })} />
              </div>
            </div>
          )}

          {section === 'climate' && (
            <section className="card p-4" aria-labelledby="sc-h">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="sc-h" className="font-serif text-[20px] font-semibold">Site &amp; Climate Data</h2>
                <button onClick={() => select('overview')} className="flex items-center gap-1 text-sm font-semibold text-leaf hover:underline"><ArrowLeft size={14} /> Back to Overview</button>
              </div>
              <HistoricalClimatePanel data={monthly} locationName={loc.name} period={per.label} />
            </section>
          )}

          {info && (
            <section className="card p-5" aria-labelledby="ph">
              <div className="mb-1 flex items-center justify-between">
                <h2 id="ph" className="font-serif text-[22px] font-semibold">{info.title} <Badge tone="neutral">{section === 'upload' ? 'Gemini' : 'Demo'}</Badge></h2>
                <button onClick={() => select('overview')} className="flex items-center gap-1 text-sm font-semibold text-leaf hover:underline"><ArrowLeft size={14} /> Back to Overview</button>
              </div>
              <p className="mb-4 max-w-2xl text-sm text-muted">{info.description}</p>
              {section === 'upload' ? (
                <FloorPlanUploader />
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
          <Badge tone="neutral">Illustrative AI observation — not real model output</Badge>
          <div className="mt-3 flex flex-col gap-3 text-sm">
            <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{panel.o.finding}</h3><Badge tone={severityTone(panel.o.severity)}>{panel.o.severity}</Badge></div>
            <p><b>Reasoning:</b> {panel.o.reasoning}</p><p><b>Assumptions:</b> {panel.o.assumptions}</p><p><b>Recommended next step:</b> {panel.o.nextStep}</p>
            <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
              {observations.map((o) => <button key={o.id} onClick={() => { setPanel({ t: 'obs', o }); pickObs(o) }} className={`rounded-md px-2.5 py-1 text-xs font-semibold ${o.id === panel.o.id ? 'bg-pine text-white' : 'bg-ivory'}`}>#{o.id}</button>)}
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
              <div className="rounded-lg bg-[#FFE3DE] p-2"><div className="text-[11px] text-muted">Before (mock)</div><div className="font-semibold">{panel.r.before} heat risk</div></div>
              <div className="rounded-lg bg-[#DDF5E3] p-2"><div className="text-[11px] text-muted">After (mock)</div><div className="font-semibold">{panel.r.after} heat risk</div></div>
            </div>
            <p className="text-xs text-muted">Demo only: the floor plan highlights the affected region. Costs and comparisons are illustrative, not calculated.</p>
          </div>
        </Modal>
      )}
      {panel?.t === 'all' && (
        <Modal title="All recommendations" onClose={close}>
          <ul className="flex flex-col gap-2 text-sm">
            {[...recommendations.map((r) => ({ id: r.id, title: r.title, description: r.description, priority: r.priority })), ...extraRecommendations].map((r) => (
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
