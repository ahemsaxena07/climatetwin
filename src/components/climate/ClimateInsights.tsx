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

export function ClimateInsights({ metrics, onHistory }: { metrics: ClimateMetric[]; onHistory: () => void }) {
  return (
    <section aria-labelledby="ci-h">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 id="ci-h" className="flex items-center gap-2 font-serif text-[19px] font-semibold">Climate Insights <Badge tone="neutral">Sample data</Badge></h2>
        <button onClick={onHistory} className="text-[12.5px] font-semibold text-leaf hover:underline">View Historical Data →</button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{metrics.map((m) => <ClimateMetricCard key={m.id} m={m} />)}</div>
    </section>
  )
}
