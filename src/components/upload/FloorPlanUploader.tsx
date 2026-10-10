import { useEffect, useRef, useState } from 'react'
import { FileImage, LoaderCircle, Sparkles, Upload, X } from 'lucide-react'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function FloorPlanUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState('')
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const chooseFile = (nextFile: File | undefined) => {
    setAnalysis('')
    setError('')
    if (!nextFile) return
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setFile(null)
      setError('Choose a PNG, JPG, or WEBP image.')
      return
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null)
      setError('The image must be 10 MB or smaller.')
      return
    }
    setFile(nextFile)
  }

  const analyze = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError('')
    setAnalysis('')
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Could not read this image. Please try another file.'))
        reader.onload = () => {
          const result = reader.result
          if (typeof result !== 'string') {
            reject(new Error('Could not read this image. Please try another file.'))
            return
          }
          resolve(result.slice(result.indexOf(',') + 1))
        }
        reader.readAsDataURL(file)
      })
      const response = await fetch('/api/analyze-floorplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: file.type }),
      })
      const result = (await response.json()) as { analysis?: string; error?: string }
      if (!response.ok) throw new Error(result.error || 'Gemini could not analyze this image.')
      if (!result.analysis) throw new Error('Gemini returned an empty analysis. Please try again.')
      setAnalysis(result.analysis)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not analyze the floor plan.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <label htmlFor="floor-plan-image" className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-ivory px-5 py-8 text-center transition-colors hover:border-leaf/50 hover:bg-limepale/30">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-limepale text-leaf"><Upload size={22} /></span>
        <span className="text-sm font-semibold text-ink">Choose a floor plan image</span>
        <span className="mt-1 text-xs text-muted">PNG, JPG, or WEBP · up to 10 MB</span>
        <input
          id="floor-plan-image"
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            chooseFile(event.target.files?.[0])
            event.currentTarget.value = ''
          }}
        />
      </label>

      {file && (
        <div className="mt-4 rounded-xl border border-line p-3">
          <div className="flex items-start gap-3">
            {previewUrl && <img src={previewUrl} alt="Preview of the selected floor plan" className="h-28 w-36 shrink-0 rounded-lg border border-line bg-white object-contain" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileImage size={17} className="shrink-0 text-leaf" />
                  <span className="truncate text-sm font-semibold">{file.name}</span>
                </div>
                <button
                  type="button"
                  aria-label="Remove selected image"
                  onClick={() => {
                    setFile(null)
                    setAnalysis('')
                    setError('')
                    if (fileInput.current) fileInput.current.value = ''
                  }}
                  className="rounded-md p-1 text-muted hover:bg-ivory hover:text-ink"
                ><X size={16} /></button>
              </div>
              <p className="mt-1 text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                type="button"
                onClick={analyze}
                disabled={isAnalyzing}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isAnalyzing ? 'Analyzing with Gemini…' : 'Analyze with Gemini'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {analysis && (
        <section aria-labelledby="floor-plan-analysis-heading" className="mt-5 rounded-xl border border-line bg-white p-4">
          <h3 id="floor-plan-analysis-heading" className="mb-2 flex items-center gap-2 font-semibold text-ink"><Sparkles size={17} className="text-leaf" /> Gemini floor plan analysis</h3>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink/90">{analysis}</div>
        </section>
      )}
      <p className="mt-3 text-xs text-muted">When you select Analyze, the image is sent to Gemini for processing. Avoid uploading plans containing sensitive personal information.</p>
    </div>
  )
}
