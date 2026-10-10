import {
  BarChart3, Calculator, ChevronDown, CloudSun, FileText, FolderOpen, HelpCircle, Home, LayoutDashboard,
  Package, Settings, Snowflake, Thermometer, Upload, Wind, X,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { SectionId } from '../../types/dashboard'
import { project } from '../../data/mockClimateData'

type Icon = ComponentType<{ size?: number; className?: string }>

const main: { id: SectionId; label: string; icon: Icon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Floor Plan', icon: Upload },
  { id: 'climate', label: 'Site & Climate Data', icon: CloudSun },
  { id: 'thermal', label: 'Thermal Analysis', icon: Thermometer },
  { id: 'ventilation', label: 'Ventilation Analysis', icon: Wind },
  { id: 'cooling', label: 'Cooling Layout', icon: Snowflake },
  { id: 'materials', label: 'Materials & Products', icon: Package },
  { id: 'cost', label: 'Cost Estimate', icon: Calculator },
  { id: 'report', label: 'Report', icon: FileText },
]
const secondary: { id: SectionId; label: string; icon: Icon }[] = [
  { id: 'saved', label: 'Saved Projects', icon: FolderOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface Props {
  active: SectionId
  locationShort: string
  onSelect: (id: SectionId) => void
  open: boolean
  onClose: () => void
}

function NavButton({ item, active, onSelect }: { item: { id: SectionId; label: string; icon: Icon }; active: boolean; onSelect: (id: SectionId) => void }) {
  const I = item.icon
  return (
    <li>
      <button onClick={() => onSelect(item.id)} aria-current={active ? 'page' : undefined}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${active ? 'bg-limepale font-semibold text-leaf' : 'text-ink/80 hover:bg-ivory'}`}>
        <I size={18} className={active ? 'text-leaf' : 'text-muted'} />
        {item.label}
      </button>
    </li>
  )
}

export function Sidebar({ active, locationShort, onSelect, open, onClose }: Props) {
  const content = (
    <nav aria-label="Project navigation" className="flex h-full w-[258px] flex-col gap-3 border-r border-line bg-white p-3.5">
      <div className="flex items-center justify-between lg:hidden">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Menu</span>
        <button onClick={onClose} aria-label="Close navigation menu" className="rounded-md p-1.5 hover:bg-ivory"><X size={18} /></button>
      </div>

      <button className="flex items-center gap-3 rounded-xl border border-line bg-ivory p-2.5 text-left hover:border-leaf/40"
        onClick={() => onSelect('saved')} aria-label="Project selector">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-limepale text-leaf"><Home size={22} /></span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13.5px] font-semibold text-ink">{project.name}</span>
          <span className="block truncate text-[11.5px] text-muted">{locationShort}</span>
        </span>
        <ChevronDown size={16} className="text-muted" />
      </button>

      <ul className="flex flex-col gap-0.5">
        {main.map((i) => <NavButton key={i.id} item={i} active={active === i.id} onSelect={onSelect} />)}
      </ul>
      <hr className="border-line" />
      <ul className="flex flex-col gap-0.5">
        {secondary.map((i) => <NavButton key={i.id} item={i} active={active === i.id} onSelect={onSelect} />)}
      </ul>

      <div className="mt-auto flex items-start gap-3 rounded-xl border border-line bg-ivory p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-limepale text-leaf"><HelpCircle size={18} /></span>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold text-ink">Need Help?</p>
          <p className="mt-0.5 text-[11.5px] text-muted">See guide or contact support.</p>
        </div>
      </div>
    </nav>
  )

  return (
    <>
      <aside className="sticky top-0 hidden h-[calc(100vh-70px)] shrink-0 self-start lg:block">{content}</aside>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
          <div className="bg-white shadow-xl">{content}</div>
          <div className="flex-1 bg-forest/40" />
        </div>
      )}
    </>
  )
}

export { BarChart3 }
