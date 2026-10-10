import { CheckCircle2 } from 'lucide-react'

export function Toast({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
      {message && (
        <div className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 size={16} className="text-lime" />
          {message}
        </div>
      )}
    </div>
  )
}
