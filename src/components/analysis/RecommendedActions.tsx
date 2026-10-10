import { AirVent, Fan, PanelTop, Sun } from 'lucide-react'
import type { Recommendation } from '../../types/dashboard'
import { Badge } from '../common/Badge'

const icons = { shade: PanelTop, exhaust: Fan, window: AirVent, roof: Sun }
const colors = { shade: '#FF725E', exhaust: '#FFB547', window: '#1685FF', roof: '#176B45' }

export function RecommendationCard({ r, active, onClick }: { r: Recommendation; active: boolean; onClick: () => void }) {
  const I = icons[r.icon]
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`flex gap-2.5 rounded-lg border p-2.5 text-left transition-colors hover:border-leaf/50 ${active ? 'border-leaf bg-limepale' : 'border-line bg-white'}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ivory"><I size={18} style={{ color: colors[r.icon] }} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight text-ink">{r.title}</span>
        <span className="block text-[11.5px] text-muted">{r.description}{r.sponsored && <span className="ml-1 rounded bg-ivory px-1 text-[9.5px] font-semibold uppercase text-muted">Sponsored options</span>}</span>
        <span className="mt-1.5 flex flex-wrap gap-1">
          <Badge tone="blue">{r.benefit}</Badge>
          <Badge tone={r.priority === 'High' ? 'high' : 'medium'}>{r.priority}</Badge>
        </span>
      </span>
    </button>
  )
}

export function RecommendedActions({ items, activeId, onSelect, onViewAll, source = 'Sample recommendations' }: { items: Recommendation[]; activeId: string | null; onSelect: (r: Recommendation) => void; onViewAll: () => void; source?: string }) {
  return (
    <section aria-labelledby="ra-h" className="border-t border-line pt-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="ra-h" className="flex items-center gap-2 font-serif text-[17px] font-semibold">Recommended Actions <span className="rounded-full bg-limepale px-2 py-0.5 text-[10px] font-semibold text-leaf">{source}</span></h2>
        <button onClick={onViewAll} className="text-[12.5px] font-semibold text-leaf hover:underline">View All →</button>
      </div>
      {items.length ? <div className="grid gap-2 sm:grid-cols-2">{items.map((r) => <RecommendationCard key={r.id} r={r} active={activeId === r.id} onClick={() => onSelect(r)} />)}</div> : <p className="py-2 text-xs text-muted">No recommendations were returned for this floor plan.</p>}
    </section>
  )
}
