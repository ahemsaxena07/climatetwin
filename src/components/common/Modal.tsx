import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  variant?: 'center' | 'drawer'
  wide?: boolean
}

export function Modal({ title, onClose, children, variant = 'center', wide }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); prev?.focus() }
  }, [onClose])

  const pos = variant === 'drawer' ? 'items-stretch justify-end' : 'items-center justify-center p-4'
  const box = variant === 'drawer'
    ? 'h-full w-full max-w-[400px] rounded-none border-l'
    : `max-h-[90vh] w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} rounded-xl border`

  return (
    <div className={`fixed inset-0 z-50 flex ${pos} ${variant === 'drawer' ? 'bg-forest/10' : 'bg-forest/40'}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className={`flex flex-col overflow-hidden border-line bg-white shadow-xl outline-none ${box}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close panel" className="rounded-md p-1.5 text-muted hover:bg-ivory hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
