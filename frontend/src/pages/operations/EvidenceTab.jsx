import { CircleCheck, Download, FileCheck2, ImageIcon, UploadCloud, Video } from 'lucide-react'
import { useRef, useState } from 'react'

export default function EvidenceTab({ report, uploading, progress, onUpload, onSampleUpload }) {
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)

  function pick(file) {
    if (file) {
      setImageFailed(false)
      onUpload(file)
    }
  }

  function downloadSummary() {
    const text = [
      'LankaLink Verified Service Report',
      `Report ID: ${report.id}`,
      `Provider: ${report.providerName}`,
      `Location: ${report.district} (${report.gpsTag})`,
      `Submitted: ${report.submittedAt}`,
      `Evidence file: ${report.fileName} (${report.fileSize})`,
      '',
      'Notes:',
      report.notes,
      '',
      'Checklist:',
      ...report.checklist.map((c) => `[${c.verified ? 'x' : ' '}] ${c.label}`),
    ].join('\n')
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.id}_summary.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="ops-grid ops-grid--even">
      <section className="panel">
        <h2 className="panel__title">Upload visit evidence</h2>
        <p className="small muted">Photos or walkthrough videos from a finished job become a report the customer can see.</p>

        <div
          className={`dropzone ops-dropzone${over ? ' dropzone--over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setOver(false)
            pick(e.dataTransfer.files?.[0])
          }}
        >
          <UploadCloud size={32} aria-hidden="true" className="ops-dropzone__icon" />
          <p>
            <strong>Drag a photo or video here</strong>
          </p>
          <p className="dropzone__hint">
            <ImageIcon size={13} aria-hidden="true" /> JPG or PNG · <Video size={13} aria-hidden="true" /> MP4 or MOV
          </p>
          <button type="button" className="btn btn--ghost btn--small" onClick={() => inputRef.current?.click()} disabled={uploading}>
            Choose a file
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            hidden
            onChange={(e) => {
              pick(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>

        {uploading && (
          <div className="ops-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="progress progress--always">
              <div className="progress__bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="small muted">Uploading and checking location… {progress}%</p>
          </div>
        )}

        <button type="button" className="btn btn--primary btn--block" onClick={onSampleUpload} disabled={uploading}>
          <UploadCloud size={16} aria-hidden="true" /> Try a sample upload
        </button>
      </section>

      <section className="panel">
        <div className="panel__title-row">
          <div>
            <p className="eyebrow">
              <FileCheck2 size={14} aria-hidden="true" /> Service report · {report.id}
            </p>
            <h2 className="panel__title">{report.district}</h2>
          </div>
          <button type="button" className="btn btn--ghost btn--small" onClick={downloadSummary}>
            <Download size={14} aria-hidden="true" /> Export summary
          </button>
        </div>

        <figure className="ops-evidence">
          {report.mediaType === 'video' ? (
            <video src={report.previewUrl} controls />
          ) : imageFailed ? (
            <div className="ops-evidence__missing">
              <ImageIcon size={28} aria-hidden="true" />
            </div>
          ) : (
            <img src={report.previewUrl} alt={`Evidence: ${report.fileName}`} onError={() => setImageFailed(true)} />
          )}
          <figcaption className="small muted">
            {report.fileName} · {report.fileSize}
          </figcaption>
        </figure>

        <dl className="summary-list">
          <div>
            <dt>Provider</dt>
            <dd>{report.providerName}</dd>
          </div>
          <div>
            <dt>GPS stamp</dt>
            <dd className="mono">{report.gpsTag}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{report.submittedAt}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd>{report.notes}</dd>
          </div>
        </dl>

        <h3 className="ops-subtitle">Checklist</h3>
        <ul className="ops-checklist">
          {report.checklist.map((c) => (
            <li key={c.id}>
              <CircleCheck size={16} aria-hidden="true" className={c.verified ? 'ops-check--ok' : 'ops-check--no'} />
              {c.label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
