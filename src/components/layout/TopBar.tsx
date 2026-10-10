import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, Crosshair, Download, Leaf, Menu, MapPin, Save } from 'lucide-react'
import { locations, periods } from '../../data/mockClimateData'

interface Props {
  locationId: string
  periodId: string
  onLocation: (id: string) => void
  onPeriod: (id: string) => void
  onSave: () => void
  onDownload: () => void
  onMenu: () => void
}

function useOutside(close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [close])
  return ref
}

export function TopBar({ locationId, periodId, onLocation, onPeriod, onSave, onDownload, onMenu }: Props) {
  const [locOpen, setLocOpen] = useState(false)
  const [perOpen, setPerOpen] = useState(false)
  const locRef = useOutside(() => setLocOpen(false))
  const perRef = useOutside(() => setPerOpen(false))
  const loc = locations.find((l) => l.id === locationId) ?? locations[0]
  const per = periods.find((p) => p.id === periodId) ?? periods[0]

  const field = 'flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white hover:bg-white/15'

  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 bg-forest px-4 text-white">
      <button onClick={onMenu} aria-label="Open navigation menu" className="rounded-md p-2 hover:bg-white/10 lg:hidden">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2.5 lg:w-[226px]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-forest">
          <Leaf size={22} strokeWidth={2.2} />
        </span>
        <span className="hidden leading-tight sm:block">
          <span className="block font-serif text-[19px] font-bold">ClimateTwin AI</span>
          <span className="block text-[11px] text-white/70">Climate-Ready Homes</span>
        </span>
      </div>

      <div className="relative min-w-0 flex-1 md:max-w-[340px]" ref={locRef}>
        <button onClick={() => setLocOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={locOpen}
          aria-label="Choose location" className={`${field} w-full`}>
          <MapPin size={16} className="shrink-0 text-lime" />
          <span className="min-w-0 flex-1 truncate text-left">{loc.name}</span>
          <Crosshair size={16} className="shrink-0 text-white/70" aria-hidden />
        </button>
        {locOpen && (
          <ul role="listbox" aria-label="Locations" className="absolute left-0 top-12 z-40 w-full min-w-[280px] overflow-hidden rounded-lg border border-line bg-white py-1 text-ink shadow-lg">
            {locations.map((l) => (
              <li key={l.id} role="option" aria-selected={l.id === locationId}>
                <button onClick={() => { onLocation(l.id); setLocOpen(false) }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-limepale ${l.id === locationId ? 'bg-limepale font-semibold' : ''}`}>
                  <MapPin size={14} className="text-leaf" /> {l.name}
                </button>
              </li>
            ))}
            <li className="border-t border-line px-3 py-1.5 text-[11px] text-muted">Climate data location</li>
          </ul>
        )}
      </div>

      <div className="relative hidden md:block" ref={perRef}>
        <button onClick={() => setPerOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={perOpen}
          aria-label="Choose historical data period" className={field}>
          <Calendar size={16} className="text-lime" />
          <span className="hidden xl:inline">Historical Data ({per.label})</span>
          <span className="xl:hidden">{per.label}</span>
          <ChevronDown size={16} className="text-white/70" />
        </button>
        {perOpen && (
          <ul role="listbox" aria-label="Historical periods" className="absolute left-0 top-12 z-40 w-52 overflow-hidden rounded-lg border border-line bg-white py-1 text-ink shadow-lg">
            {periods.map((p) => (
              <li key={p.id} role="option" aria-selected={p.id === periodId}>
                <button onClick={() => { onPeriod(p.id); setPerOpen(false) }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-limepale ${p.id === periodId ? 'bg-limepale font-semibold' : ''}`}>
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button onClick={onSave} className="flex h-10 items-center gap-2 rounded-lg bg-lime px-3.5 text-sm font-semibold text-forest hover:brightness-95">
          <Save size={16} /> <span className="hidden sm:inline">Save Project</span>
          <span className="sr-only sm:hidden">Save Project</span>
        </button>
        <button onClick={onDownload} className="flex h-10 items-center gap-2 rounded-lg border border-white/25 px-3.5 text-sm font-semibold hover:bg-white/10">
          <Download size={16} /> <span className="hidden lg:inline">Download Report</span>
          <span className="sr-only lg:hidden">Download Report</span>
        </button>
        <span aria-label="User A" className="flex h-10 w-10 items-center justify-center rounded-full bg-pine text-sm font-semibold ring-1 ring-white/25">A</span>
      </div>
    </header>
  )
}
