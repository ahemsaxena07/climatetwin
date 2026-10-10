import { Fragment } from 'react'
import type { Opening, TabId, HeatLevel } from '../../types/dashboard'
import {
  BUILDING, PLAN_VIEWBOX, acUnits, airPaths, airPoints, ceilingFans, exhaustFans, openings, project, proposals, rooms,
} from '../../data/mockClimateData'

const C = { wall: '#1f2d28', win: '#1685FF', door: '#20B85A', vent: '#FFB547', ac: '#873DF2', furn: '#9aa59f', furnFill: '#F3F4EE' }
const HEAT: Record<HeatLevel, string> = { low: '#9CC8FF', moderate: '#FFE27A', elevated: '#FFB547', high: '#FF725E' }

function doorArc(o: Opening) {
  if (!o.swing) return null
  const [v, h] = [o.swing[0], o.swing[1]]
  let H: [number, number], E: [number, number], T: [number, number]
  if (o.orient === 'h') {
    const left = h === 'l'
    H = [left ? o.x : o.x + o.len, o.y]; E = [left ? o.x + o.len : o.x, o.y]
    T = [H[0], o.y + (v === 't' ? -o.len : o.len)]
  } else {
    const top = v === 't'
    H = [o.x, top ? o.y : o.y + o.len]; E = [o.x, top ? o.y + o.len : o.y]
    T = [o.x + (h === 'l' ? -o.len : o.len), H[1]]
  }
  const a = [E[0] - H[0], E[1] - H[1]], b = [T[0] - H[0], T[1] - H[1]]
  const sweep = a[0] * b[1] - a[1] * b[0] > 0 ? 1 : 0
  return { H, T, d: `M${E[0]} ${E[1]} A${o.len} ${o.len} 0 0 ${sweep} ${T[0]} ${T[1]}` }
}

function OpeningShape({ o, dim }: { o: Opening; dim?: boolean }) {
  const h = o.orient === 'h'
  const gap = h ? <rect x={o.x} y={o.y - 4.5} width={o.len} height={9} fill="#fff" /> : <rect x={o.x - 4.5} y={o.y} width={9} height={o.len} fill="#fff" />
  const x2 = h ? o.x + o.len : o.x, y2 = h ? o.y : o.y + o.len
  const op = dim ? 0.55 : 1
  if (o.kind === 'window')
    return <g opacity={op}>{gap}
      <line x1={o.x} y1={o.y} x2={x2} y2={y2} stroke={C.win} strokeWidth={6} />
      <line x1={o.x} y1={o.y} x2={x2} y2={y2} stroke="#fff" strokeWidth={2} /></g>
  if (o.kind === 'ventilator')
    return <g opacity={op}>{gap}<line x1={o.x} y1={o.y} x2={x2} y2={y2} stroke={C.vent} strokeWidth={6} strokeDasharray="4 2" /></g>
  const arc = doorArc(o)
  return <g opacity={op}>{gap}
    <line x1={o.x} y1={o.y} x2={x2} y2={y2} stroke={C.door} strokeWidth={3} strokeDasharray={arc ? undefined : '3 3'} />
    {arc && <><path d={arc.d} fill="none" stroke={C.door} strokeWidth={1.3} strokeDasharray="3 2" />
      <line x1={arc.H[0]} y1={arc.H[1]} x2={arc.T[0]} y2={arc.T[1]} stroke={C.door} strokeWidth={2.5} /></>}
  </g>
}

export function FanSymbol({ x, y, color = C.win, r = 13 }: { x: number; y: number; color?: string; r?: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill="#fff" fillOpacity={0.8} stroke={color} strokeWidth={1.5} />
    {[0, 120, 240].map((a) => <ellipse key={a} cx={0} cy={-r * 0.5} rx={r * 0.2} ry={r * 0.45} fill={color} transform={`rotate(${a})`} />)}
    <circle r={2.3} fill={color} />
  </g>
}
function AcSymbol({ x, y }: { x: number; y: number }) {
  return <g><rect x={x} y={y} width={36} height={12} rx={3} fill="#fff" stroke={C.ac} strokeWidth={2} />
    {[8, 14, 20, 26].map((k) => <line key={k} x1={x + k} y1={y + 8} x2={x + k + 2} y2={y + 8} stroke={C.ac} strokeWidth={1.3} />)}</g>
}

function Furniture() {
  const s = { fill: C.furnFill, stroke: C.furn, strokeWidth: 1.2 }
  return <g>
    {/* bedroom 1 */}
    <rect x={120} y={135} width={92} height={108} rx={3} {...s} /><rect x={126} y={140} width={34} height={20} rx={5} {...s} /><rect x={172} y={140} width={34} height={20} rx={5} {...s} />
    <rect x={120} y={165} width={92} height={78} rx={2} fill="none" stroke={C.furn} /><rect x={98} y={138} width={18} height={18} {...s} /><rect x={216} y={138} width={18} height={18} {...s} />
    <rect x={236} y={80} width={30} height={110} {...s} /><line x1={236} y1={80} x2={266} y2={190} stroke={C.furn} /><line x1={266} y1={80} x2={236} y2={190} stroke={C.furn} />
    {/* bath & toilet */}
    <rect x={348} y={78} width={36} height={36} {...s} /><circle cx={366} cy={96} r={3} fill={C.furn} /><rect x={392} y={80} width={30} height={20} rx={5} {...s} /><circle cx={407} cy={90} r={5} fill="none" stroke={C.furn} />
    <rect x={296} y={80} width={22} height={12} rx={2} {...s} /><ellipse cx={307} cy={108} rx={10} ry={13} {...s} /><rect x={324} y={150} width={14} height={18} rx={4} {...s} />
    {/* living */}
    <rect x={440} y={96} width={34} height={96} rx={4} {...s} /><rect x={440} y={96} width={12} height={96} rx={4} fill={C.furn} fillOpacity={0.25} />
    <rect x={494} y={125} width={52} height={40} rx={3} {...s} /><rect x={440} y={200} width={36} height={36} rx={4} {...s} />
    <rect x={624} y={118} width={12} height={74} {...s} />
    {/* bedroom 2 */}
    <rect x={692} y={130} width={96} height={108} rx={3} {...s} /><rect x={698} y={135} width={36} height={20} rx={5} {...s} /><rect x={746} y={135} width={36} height={20} rx={5} {...s} />
    <rect x={660} y={258} width={100} height={26} {...s} /><rect x={656} y={134} width={16} height={16} {...s} /><rect x={808} y={140} width={26} height={90} {...s} />
    {/* kitchen */}
    <rect x={66} y={296} width={160} height={22} {...s} />{[[100, 307], [124, 307], [100, 307]].slice(0, 2).map(([cx, cy], i) => <circle key={i} cx={cx + 10} cy={cy} r={5} fill="none" stroke={C.furn} />)}
    <rect x={150} y={299} width={34} height={16} rx={2} {...s} /><rect x={226} y={296} width={30} height={38} {...s} /><text x={241} y={319} fontSize={7} textAnchor="middle" fill={C.furn}>FRIDGE</text>
    <rect x={66} y={440} width={136} height={24} {...s} /><rect x={104} y={444} width={30} height={16} rx={3} fill="none" stroke={C.furn} /><rect x={66} y={334} width={22} height={70} {...s} />
    {/* dining */}
    <rect x={325} y={350} width={92} height={52} rx={5} {...s} />
    {[335, 365, 395].map((x) => <Fragment key={x}><rect x={x} y={336} width={20} height={12} rx={3} {...s} /><rect x={x} y={404} width={20} height={12} rx={3} {...s} /></Fragment>)}
    <rect x={308} y={367} width={12} height={20} rx={3} {...s} /><rect x={422} y={367} width={12} height={20} rx={3} {...s} />
    {/* verandah */}
    <circle cx={510} cy={445} r={11} fill="#DDF5E3" stroke="#20B85A" /><circle cx={820} cy={445} r={11} fill="#DDF5E3" stroke="#20B85A" />
    <circle cx={680} cy={375} r={20} {...s} /><circle cx={640} cy={375} r={12} {...s} /><circle cx={720} cy={375} r={12} {...s} /><circle cx={680} cy={415} r={12} {...s} /><circle cx={680} cy={335} r={12} {...s} />
  </g>
}

interface Props { tab: TabId; highlight: string | null }

export function FloorPlanCanvas({ tab, highlight }: Props) {
  const hl = highlight && highlight !== 'all' ? rooms.find((r) => r.id === highlight) : null
  const tag = (x: number, y: number, t: string, c: string, w = 150) => (
    <g><rect x={x} y={y} width={w} height={17} rx={8} fill="#fff" stroke={c} /><text x={x + w / 2} y={y + 12} fontSize={10} fontWeight={600} textAnchor="middle" fill={c}>{t}</text></g>)

  return (
    <svg viewBox={`0 0 ${PLAN_VIEWBOX.w} ${PLAN_VIEWBOX.h}`} className="h-full w-full" role="img"
      aria-label={`Floor plan, ${tab} view`} preserveAspectRatio="xMidYMid meet" fontFamily="Inter, sans-serif">
      <defs>
        <pattern id="hatch" width={8} height={8} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1={0} y1={0} x2={0} y2={8} stroke="#1685FF" strokeOpacity={0.35} strokeWidth={2} /></pattern>
        <marker id="arr" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#1685FF" /></marker>
        <marker id="arr2" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#1685FF" fillOpacity={0.7} /></marker>
      </defs>

      {/* rooms */}
      {rooms.map((r) => <rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.id === 'verandah' ? '#F1F4EA' : '#FFFFFF'} stroke={C.wall} strokeWidth={3} />)}

      {/* thermal overlay */}
      {tab === 'thermal' && rooms.map((r) => <rect key={'t' + r.id} x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill={HEAT[r.heat]} fillOpacity={0.45} />)}
      {tab === 'thermal' && <g>
        <rect x={64} y={100} width={44} height={120} fill="#FF725E" fillOpacity={0.25} />
        <text x={72} y={236} fontSize={9} fill="#C2412C" fontWeight={600}>West sun ▶</text></g>}
      {tab === 'ventilation' && rooms.filter((r) => r.limitedAirflow).map((r) => <rect key={'l' + r.id} x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h - 4} fill="url(#hatch)" />)}

      {/* wall perimeter */}
      <path d={`M480 470 H60 V70 H840 V290 H480 Z`} fill="none" stroke={C.wall} strokeWidth={8} strokeLinejoin="miter" />
      <path d="M480 470 H840 V290" fill="none" stroke={C.wall} strokeWidth={2} strokeDasharray="6 3" />
      {[[480, 470], [660, 470], [840, 470], [840, 380], [840, 290]].map(([x, y]) => <rect key={`${x}${y}`} x={x - 5} y={y - 5} width={10} height={10} fill={C.wall} />)}

      <Furniture />

      {/* openings */}
      {openings.map((o) => <OpeningShape key={o.id} o={o} dim={tab !== 'original' && tab !== 'proposed'} />)}

      {/* fixtures on original */}
      {tab === 'original' && ceilingFans.map((f) => <FanSymbol key={f.id} x={f.x} y={f.y} />)}
      {tab === 'original' && acUnits.map((a) => <AcSymbol key={a.id} x={a.x} y={a.y} />)}

      {/* labels */}
      {rooms.map((r) => <text key={'lb' + r.id} x={r.lx} y={r.ly} textAnchor="middle" fontSize={r.w < 100 ? 10 : 13} fontWeight={600} fill="#10221D" stroke="#fff" strokeWidth={3} paintOrder="stroke">{r.label}</text>)}

      {/* heat risk tags */}
      {tab === 'thermal' && <>
        {tag(88, 150, 'High heat risk', '#C2412C', 100)}
        {tag(110, 346, 'High heat risk', '#C2412C', 100)}
        <text x={BUILDING.x} y={525} fontSize={10} fill="#64716B">Illustrative thermal-risk estimates based on mock data.</text></>}

      {/* ventilation */}
      {tab === 'ventilation' && <>
        {airPaths.map((p) => <path key={p.id} d={p.d} fill="none" stroke="#1685FF" strokeLinejoin="round" strokeLinecap="round"
          strokeWidth={p.kind === 'primary' ? 3 : 2} strokeDasharray={p.kind === 'primary' ? undefined : '2 6'} opacity={p.kind === 'primary' ? 0.9 : 0.8} markerEnd={p.kind === 'primary' ? 'url(#arr)' : 'url(#arr2)'} />)}
        {airPoints.map((p) => <circle key={p.id} cx={p.x} cy={p.y} r={6} fill={p.kind === 'inlet' ? '#20B85A' : '#FF725E'} stroke="#fff" strokeWidth={2} />)}
        {tag(88, 322, 'Limited ventilation', '#0B63C7', 120)}
        {tag(290, 242, 'Limited', '#0B63C7', 56)}
        <text x={BUILDING.x} y={525} fontSize={10} fill="#64716B">Actual airflow depends on wind, opening size, obstructions and operating conditions.</text></>}

      {/* cooling */}
      {tab === 'cooling' && <>
        {ceilingFans.map((f) => <FanSymbol key={f.id} x={f.x} y={f.y} r={14} />)}
        {acUnits.map((a) => <AcSymbol key={a.id} x={a.x} y={a.y} />)}
        {exhaustFans.map((e) => <g key={e.id}><circle cx={e.x} cy={e.y} r={11} fill="#fff" stroke={C.vent} strokeWidth={2.5} /><path d={`M${e.x - 6} ${e.y} H${e.x + 6} M${e.x} ${e.y - 6} V${e.y + 6}`} stroke={C.vent} strokeWidth={2} /></g>)}
        {tag(88, 215, 'Suggested fan + AC', '#873DF2', 120)}
        {tag(500, 36, 'AC on north wall', '#873DF2', 110)}
        {tag(150, 482, 'Kitchen exhaust', '#B87400', 100)}
        {tag(320, 482, 'Fan placement', '#0B63C7', 90)}
        <text x={BUILDING.x} y={525} fontSize={10} fill="#64716B">Sizing requires room dimensions and building details.</text></>}

      {/* proposed */}
      {tab === 'proposed' && <>
        {proposals.map((p) => {
          const c = p.verify ? '#D98A00' : '#20B85A'
          if (p.kind === 'roof') return <rect key={p.id} x={p.x} y={p.y} width={p.w} height={p.h} rx={6} fill="none" stroke={c} strokeWidth={2} strokeDasharray="10 5" />
          if (p.kind === 'fan') return <g key={p.id}><FanSymbol x={p.x + 20} y={p.y + 20} color={c} r={15} /><circle cx={p.x + 20} cy={p.y + 20} r={20} fill="none" stroke={c} strokeDasharray="4 3" /></g>
          return <rect key={p.id} x={p.x} y={p.y} width={p.w} height={p.h} rx={3} fill={c} fillOpacity={0.18} stroke={c} strokeWidth={2.5} strokeDasharray="6 3" />
        })}
        {tag(36, 214, 'Shading (proposed)', '#12733A', 120)}
        {tag(560, 36, 'New opening — verify', '#9A6400', 130)}
        {tag(120, 482, 'Exhaust + air path', '#12733A', 110)}
        {tag(700, 36, 'Cool roof — verify', '#9A6400', 120)}
        <path d="M262 420 L232 440" stroke="#20B85A" strokeWidth={2.5} strokeDasharray="3 4" markerEnd="url(#arr)" />
        <text x={BUILDING.x} y={525} fontSize={10} fill="#64716B">Proposals are illustrative and not approved architectural changes.</text></>}

      {/* highlight */}
      {hl && <rect x={hl.x + 3} y={hl.y + 3} width={hl.w - 6} height={hl.h - 6} fill="#B8F36B" fillOpacity={0.25} stroke="#176B45" strokeWidth={4} className="pulse-hl" />}
      {highlight === 'all' && <rect x={52} y={62} width={796} height={416} fill="none" stroke="#176B45" strokeWidth={4} className="pulse-hl" />}

      {/* compass */}
      <g transform="translate(893 80)"><circle r={22} fill="#fff" stroke="#10221D" /><path d="M0 -17 L6 4 L0 0 L-6 4 z" fill="#10221D" /><text y={-26} textAnchor="middle" fontSize={11} fontWeight={700}>N</text></g>
      {/* scale */}
      <g transform="translate(60 505)"><rect width={50} height={5} fill="#10221D" /><rect x={50} width={50} height={5} fill="#fff" stroke="#10221D" /><text y={20} fontSize={10} fill="#64716B">{project.scaleLabel}</text></g>
    </svg>
  )
}
