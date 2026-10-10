import { Info } from 'lucide-react'
import type { Observation } from '../../types/dashboard'
import { Badge, severityTone } from '../common/Badge'

const dotColor = { High: '#FF725E', Medium: '#FFB547', Low: '#20B85A' } as const
const num = ['#FF725E', '#FFB547', '#F2D544', '#20B85A']

export function ObservationRow({ o, active, onClick }: { o: Observation; active: boolean; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} aria-pressed={active}
        className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ivory ${active ? 'bg-limepale' : ''}`}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: num[o.id - 1] ?? dotColor[o.severity] }}>{o.id}</span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[13px] font-semibold text-ink">{o.finding}</span>
          <span className="block text-[11.5px] text-muted">{o.explanation}</span>
        </span>
        <Badge tone={severityTone(o.severity)}>{o.severity}</Badge>
      </button>
    </li>
  )
}

export function KeyObservations({ items, activeId, onSelect, onDetails }: { items: Observation[]; activeId: number | null; onSelect: (o: Observation) => void; onDetails: () => void }) {
  return (
    <section aria-labelledby="ko-h" className="border-t border-line pt-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h2 id="ko-h" className="flex items-center gap-1.5 font-serif text-[17px] font-semibold">Key Observations (AI Analysis) <span title="Illustrative observations, not real AI model output"><Info size={15} className="text-muted" aria-label="Illustrative observations, not real AI model output" /></span></h2>
        <button onClick={onDetails} className="text-[12.5px] font-semibold text-leaf hover:underline">View Details →</button>
      </div>
      <ul className="flex flex-col">{items.map((o) => <ObservationRow key={o.id} o={o} active={activeId === o.id} onClick={() => onSelect(o)} />)}</ul>
    </section>
  )
}
