import { Droplets, Sun, Thermometer, Wind } from 'lucide-react'
import type { ClimateMetric } from '../../types/dashboard'
import { Badge } from '../common/Badge'

const icons = { sun: Sun, droplet: Droplets, wind: Wind, thermo: Thermometer }
const colors = { sun: '#FF725E', droplet: '#1685FF', wind: '#20B85A', thermo: '#FFB547' }

export function ClimateMetricCard({ m }: { m: ClimateMetric }) {
  const I = icons[m.icon]
  return (
    <div className="rounded-lg border border-line bg-ivory p-2.5">
      <I size={18} style={{ color: colors[m.icon] }} />
      <p className="mt-1.5 text-[11px] leading-tight text-muted">{m.label}</p>
      <p className="font-serif text-[22px] font-bold leading-tight text-ink">{m.value}</p>
      <p className={`mt-0.5 text-[11px] font-semibold ${m.tone === 'high' ? 'text-[#C2412C]' : m.tone === 'moderate' ? 'text-[#9A6400]' : 'text-leaf'}`}>{m.status}</p>
    </div>
  )
}

export function ClimateInsights({ metrics, source, loading = false, error, onHistory }: { metrics: ClimateMetric[]; source: string; loading?: boolean; error?: string | null; onHistory: () => void }) {
  return (
    <section aria-labelledby="ci-h">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="ci-h" className="flex flex-wrap items-center gap-2 font-serif text-[19px] font-semibold">Climate Insights <Badge tone={source === 'Sample data' || loading ? 'neutral' : 'green'}>{loading ? 'Loading live weather…' : source}</Badge></h2>
        <button onClick={onHistory} className="text-[12.5px] font-semibold text-leaf hover:underline">View Historical Data →</button>
      </div>
      {error && <p role="alert" className="mb-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-800">{error}</p>}
      {metrics.length
        ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">{metrics.map((m) => <ClimateMetricCard key={m.id} m={m} />)}</div>
        : loading && <p className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-muted">Waiting for live weather observations.</p>}
      {source.startsWith('Open-Meteo') && <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="mt-1 block text-right text-[10px] text-muted hover:text-leaf">Weather data by Open-Meteo</a>}
    </section>
  )
}
