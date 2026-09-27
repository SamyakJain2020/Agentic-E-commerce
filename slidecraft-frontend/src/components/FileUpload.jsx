import { useRef, useState } from 'react'
import { DocumentArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { api } from '../api'

export default function FileUpload({ uploads, setUploads, compact = false }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setBusy(true)
    setError(null)
    try {
      const res = await api.uploadFiles(files)
      setUploads(res.uploads)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-w-0">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed px-4 text-center transition ${
          compact ? 'py-3' : 'py-6'
        } ${dragOver ? 'border-violet-400 bg-violet-500/10' : 'border-white/15 hover:border-white/30'}`}
      >
        <DocumentArrowUpIcon className={compact ? 'h-5 w-5 text-white/40' : 'h-7 w-7 text-white/40'} />
        <p className="text-xs text-white/50">
          {busy ? 'Uploading…' : <>Drop files or <span className="text-violet-300 underline">browse</span> — PDF, DOCX, TXT</>}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {uploads?.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {uploads.map((u) => (
            <li key={u.filename} className="flex min-w-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/70">
              <DocumentIcon className="h-3 w-3 shrink-0" />
              <span className="max-w-[140px] truncate">{u.filename}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
