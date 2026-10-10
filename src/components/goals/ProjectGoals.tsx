import { Droplets, Heart, Leaf, Target, Zap } from 'lucide-react'
import { goals } from '../../data/mockClimateData'

const icons = { leaf: Leaf, droplet: Droplets, zap: Zap, heart: Heart }

export function ProjectGoals() {
  return (
    <section aria-labelledby="pg-h" className="card flex flex-col gap-3 p-3.5 lg:flex-row lg:items-center">
      <div className="flex items-center gap-3 lg:w-[290px] lg:shrink-0">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-limepale text-leaf"><Target size={22} /></span>
        <div>
          <h2 id="pg-h" className="font-serif text-[18px] font-semibold">Project Goals</h2>
          <p className="text-[12px] leading-snug text-muted">Design a cooler, healthier and more energy-efficient home using climate data.</p>
        </div>
      </div>
      <ul className="grid flex-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {goals.map((g) => { const I = icons[g.icon]; return (
          <li key={g.id} className="flex items-start gap-2.5 rounded-lg border border-line bg-ivory p-2.5">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white"><I size={17} style={{ color: g.color }} /></span>
            <div className="leading-tight"><p className="text-[13px] font-semibold">{g.title}</p><p className="mt-0.5 text-[11.5px] text-muted">{g.description}</p></div>
          </li>) })}
      </ul>
    </section>
  )
}
