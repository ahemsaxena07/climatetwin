import { ChevronRight } from 'lucide-react'
import { workflowSteps } from '../../data/mockClimateData'

export function WorkflowSteps() {
  return (
    <ol className="card flex flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2.5" aria-label="How it works">
      {workflowSteps.map((s, i) => (
        <li key={s.n} className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime text-[11px] font-bold text-forest">{s.n}</span>
          <span className="leading-tight">
            <span className="block text-[12.5px] font-semibold text-ink">{s.title}</span>
            <span className="block text-[11px] text-muted">{s.text}</span>
          </span>
          {i < workflowSteps.length - 1 && <ChevronRight size={14} className="ml-1 shrink-0 text-muted/60" aria-hidden />}
        </li>
      ))}
    </ol>
  )
}
