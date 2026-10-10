import { useEffect, useRef, useState } from 'react'
import { FileImage, LoaderCircle, Sparkles, Upload, X } from 'lucide-react'
import type { FloorPlanAnalysis } from '../../types/dashboard'

const MAX_FILE_SIZE = 3.5 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 8000
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface Props {
  onAnalyzed: (analysis: FloorPlanAnalysis, imageUrl: string) => void
}

function readFile(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this image. Please try another file.'))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read this image. Please try another file.'))
        return
      }
      resolve(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

async function prepareBedrockImage(file: File): Promise<File> {
  if (file.type !== 'image/webp') return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This WEBP image could not be decoded. Try exporting it as PNG or JPG.')
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare this WEBP image for analysis.')

    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    for (const quality of [0.9, 0.75, 0.6]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (!blob) throw new Error('Could not convert this WEBP image for analysis.')
      if (blob.size <= MAX_FILE_SIZE) return new File([blob], file.name.replace(/\.webp$/i, '.jpg'), { type: 'image/jpeg' })
    }
    throw new Error('The converted image is too large. Resize it or export it as a smaller JPG.')
  } finally {
    bitmap.close()
  }
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const body = await response.text()
  if (!body.trim()) {
    throw new Error(`The analysis service returned an empty response (HTTP ${response.status}). Check that the API server is running and try again.`)
  }
  try {
    return JSON.parse(body) as T
  } catch {
    throw new Error(`The analysis service returned an invalid response (HTTP ${response.status}). Check the API server logs and try again.`)
  }
}

export function FloorPlanUploader({ onAnalyzed }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const previewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  const clearPreview = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    setPreviewUrl(null)
  }

  const chooseFile = (nextFile: File | undefined) => {
    setError('')
    if (!nextFile) return
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setFile(null)
      clearPreview()
      setError('Choose a PNG, JPG, or WEBP image.')
      return
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      setFile(null)
      clearPreview()
      setError('The image must be 3.5 MB or smaller for Bedrock image analysis.')
      return
    }
    clearPreview()
    previewUrlRef.current = URL.createObjectURL(nextFile)
    setPreviewUrl(previewUrlRef.current)
    setFile(nextFile)
  }

  const analyze = async () => {
    if (!file) return
    setIsAnalyzing(true)
    setError('')
    try {
      const bedrockFile = await prepareBedrockImage(file)
      const imageDataUrl = await readFile(file)
      const uploadDataUrl = bedrockFile === file ? imageDataUrl : await readFile(bedrockFile)
      const response = await fetch('/api/analyze-floorplan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadDataUrl.slice(uploadDataUrl.indexOf(',') + 1),
          mimeType: bedrockFile.type,
        }),
      })
      const result = await readApiResponse<{ analysis?: FloorPlanAnalysis; error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'Amazon Bedrock could not analyze this image.')
      if (!result.analysis?.rooms?.length) throw new Error('Bedrock returned no room data. Please try a clearer plan.')
      onAnalyzed(result.analysis, imageDataUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not analyze the floor plan.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <label htmlFor="floor-plan-image" className={`flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-ivory px-5 py-8 text-center transition-colors ${isAnalyzing ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-leaf/50 hover:bg-limepale/30'}`}>
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-limepale text-leaf"><Upload size={22} /></span>
        <span className="text-sm font-semibold text-ink">Choose a floor plan image</span>
        <span className="mt-1 text-xs text-muted">PNG, JPG, or WEBP · up to 3.5 MB</span>
        <input
          id="floor-plan-image"
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={isAnalyzing}
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
                  disabled={isAnalyzing}
                  onClick={() => {
                    setFile(null)
                    setError('')
                    clearPreview()
                    if (fileInput.current) fileInput.current.value = ''
                  }}
                  className="rounded-md p-1 text-muted hover:bg-ivory hover:text-ink"
                ><X size={16} /></button>
              </div>
              <p className="mt-1 text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB · Bedrock visual analysis</p>
              <button
                type="button"
                onClick={analyze}
                disabled={isAnalyzing}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isAnalyzing ? 'Analyzing with Bedrock…' : 'Analyze with Bedrock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <p className="mt-3 text-xs text-muted">Submitting sends the image to Amazon Bedrock. Avoid uploading plans containing sensitive personal information.</p>
    </div>
  )
}
