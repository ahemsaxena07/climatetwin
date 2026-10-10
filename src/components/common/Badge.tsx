import type { ReactNode } from 'react'

const tones = {
  high: 'bg-[#FFE3DE] text-[#C2412C]',
  medium: 'bg-[#FFF0D2] text-[#9A6400]',
  low: 'bg-[#DDF5E3] text-[#12733A]',
  neutral: 'bg-ivory text-muted border border-line',
  green: 'bg-limepale text-leaf',
  blue: 'bg-[#E3F0FF] text-[#0B63C7]',
} as const

export type BadgeTone = keyof typeof tones

export function Badge({ tone = 'neutral', children, className = '' }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}

export const severityTone = (s: string): BadgeTone => (s === 'High' ? 'high' : s === 'Medium' ? 'medium' : 'low')
