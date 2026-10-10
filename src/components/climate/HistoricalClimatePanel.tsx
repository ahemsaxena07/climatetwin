import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MonthlyClimate } from '../../types/dashboard'
import { Badge } from '../common/Badge'

type Key = 'maxTemp' | 'humidity' | 'warmNights' | 'wetBulb' | 'windSpeed' | 'solar'
const charts: { key: Key; title: string; unit: string; color: string; bar?: boolean }[] = [
  { key: 'maxTemp', title: 'Monthly maximum temperature', unit: '°C', color: '#FF725E' },
  { key: 'humidity', title: 'Monthly relative humidity', unit: '%', color: '#1685FF' },
  { key: 'warmNights', title: 'Warm-night frequency', unit: 'nights/month', color: '#873DF2', bar: true },
  { key: 'wetBulb', title: 'Wet-bulb temperature', unit: '°C', color: '#FFB547' },
  { key: 'windSpeed', title: 'Wind speed', unit: 'km/h', color: '#20B85A' },
  { key: 'solar', title: 'Solar exposure', unit: 'kWh/m²/day', color: '#E0A100', bar: true },
]

export function HistoricalClimatePanel({ data, locationName, period }: { data: MonthlyClimate[]; locationName: string; period: string }) {
  return (
    <div>
      <p className="mb-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        {locationName} · {period} <Badge tone="neutral">Sample data — not observed measurements</Badge>
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {charts.map((c) => (
          <div key={c.key} className="rounded-lg border border-line p-3">
            <h3 className="mb-1 text-[13px] font-semibold">{c.title} <span className="font-normal text-muted">({c.unit})</span></h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                {c.bar ? (
                  <BarChart data={data}><CartesianGrid stroke="#E4E8E0" vertical={false} /><XAxis dataKey="month" fontSize={10} /><YAxis fontSize={10} width={28} /><Tooltip /><Bar dataKey={c.key} fill={c.color} radius={[3, 3, 0, 0]} /></BarChart>
                ) : (
                  <LineChart data={data}><CartesianGrid stroke="#E4E8E0" vertical={false} /><XAxis dataKey="month" fontSize={10} /><YAxis fontSize={10} width={28} domain={['auto', 'auto']} /><Tooltip /><Line dataKey={c.key} stroke={c.color} strokeWidth={2.5} dot={{ r: 2 }} /></LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-line p-3">
        <h3 className="mb-2 text-[13px] font-semibold">Prevailing wind direction by month</h3>
        <div className="grid grid-cols-6 gap-1.5 text-center text-xs sm:grid-cols-12">
          {data.map((d) => <div key={d.month} className="rounded bg-ivory py-1.5"><div className="text-muted">{d.month}</div><div className="font-semibold">{d.windDir}</div></div>)}
        </div>
      </div>
    </div>
  )
}
