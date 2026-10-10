import type { TabId } from '../../types/dashboard'
import { project } from '../../data/mockClimateData'
import { FanSymbol } from './FloorPlanCanvas'

const sw = (c: string, dash = false) => <span className="inline-block h-1.5 w-5 rounded-sm" style={{ background: dash ? `repeating-linear-gradient(90deg,${c} 0 4px,transparent 4px 6px)` : c }} />
const dot = (c: string) => <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />

export function FloorPlanLegend({ tab }: { tab: TabId }) {
  let items: [React.ReactNode, string][] = [
    [sw('#1685FF'), 'Window'], [sw('#20B85A'), 'Door'], [sw('#FFB547', true), 'Ventilator / Exhaust'],
    [<svg key="f" width="18" height="18" viewBox="-16 -16 32 32"><FanSymbol x={0} y={0} /></svg>, 'Ceiling Fan'], [sw('#873DF2'), 'AC (Indoor Unit)'],
  ]
  if (tab === 'thermal') items = [[dot('#9CC8FF'), 'Low'], [dot('#FFE27A'), 'Moderate'], [dot('#FFB547'), 'Elevated'], [dot('#FF725E'), 'High']]
  if (tab === 'ventilation') items = [[sw('#1685FF', true), 'Potential airflow path'], [dot('#20B85A'), 'Air inlet'], [dot('#FF725E'), 'Air outlet'], [dot('#BBD6FA'), 'Limited ventilation']]
  if (tab === 'cooling') items = [[<svg key="f" width="18" height="18" viewBox="-16 -16 32 32"><FanSymbol x={0} y={0} /></svg>, 'Ceiling fan'], [sw('#873DF2'), 'AC indoor unit'], [sw('#FFB547', true), 'Kitchen exhaust / ventilator']]
  if (tab === 'proposed') items = [[sw('#1f2d28'), 'Existing feature'], [sw('#20B85A', true), 'Proposed improvement'], [sw('#D98A00', true), 'Requires verification']]
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3 text-[11.5px] text-ink/80">
      {tab === 'thermal' && <span className="font-semibold">Estimated Room Heat Risk:</span>}
      {items.map(([i, l]) => <span key={l} className="flex items-center gap-1.5">{i}{l}</span>)}
      <span className="ml-auto text-muted">{project.scaleLabel}</span>
    </div>
  )
}
