import type { TabId } from '../../types/dashboard'

export const TABS: { id: TabId; label: string }[] = [
  { id: 'original', label: 'Original Plan' }, { id: 'thermal', label: 'Thermal Map' },
  { id: 'ventilation', label: 'Ventilation Map' }, { id: 'cooling', label: 'Cooling Layout' }, { id: 'proposed', label: 'Proposed Plan' },
]

export function AnalysisTabs({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowRight') onChange(TABS[(i + 1) % TABS.length].id)
    if (e.key === 'ArrowLeft') onChange(TABS[(i + TABS.length - 1) % TABS.length].id)
  }
  return (
    <div role="tablist" aria-label="Analysis layers" className="no-scrollbar flex gap-1.5 overflow-x-auto">
      {TABS.map((t, i) => (
        <button key={t.id} role="tab" aria-selected={tab === t.id} tabIndex={tab === t.id ? 0 : -1}
          onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}
          className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${tab === t.id ? 'bg-pine text-white' : 'bg-ivory text-ink/70 hover:bg-limepale'}`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
