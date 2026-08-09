import { useRef, useState } from 'react'
import { EmptyState, ListSkeleton, PortalError } from '@/components/portal/CustomerPortalUi'
import { PortalFileListItem } from '@/components/portal/PortalFileListItem'
import { formatFileSize } from '@/lib/portal/format-file-size'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { friendlyCustomerPortalError } from '@/lib/customer/portal-errors'
import { customerApi, type CustomerProjectFile } from '@/services/customer-portal'
import { PROJECT_FILE_MAX_BYTES_LABEL } from '@/lib/files/project-file-constants'

type Props = {
  projectId: string
}

export function ProjectDocumentsSection({ projectId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const { data, error, loading, reload } = useFetch(
    () => customerApi.projects.listFiles(projectId),
    [projectId],
  )

  async function download(fileId: string) {
    const result = await customerApi.projects.downloadFile(projectId, fileId)
    if (result.configured && result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } else {
      alert(result.message ?? 'Download is not available.')
    }
  }

  async function onFileSelected(file: File) {
    setUploading(true)
    setUploadStatus(null)
    try {
      const prep = await customerApi.projects.prepareUpload(projectId, {
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        category: 'customer_upload',
      })
      if (!prep.upload.configured) {
        setUploadStatus(prep.upload.message ?? 'Upload is not available.')
        return
      }
      const put = await fetch(prep.upload.signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!put.ok) {
        setUploadStatus('Upload failed. Please try again.')
        return
      }
      await customerApi.projects.finalizeUpload(projectId, prep.file.id)
      setUploadStatus('File uploaded successfully.')
      reload()
    } catch {
      setUploadStatus('Could not upload file. Check type and size, then try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (loading) return <ListSkeleton rows={3} />
  if (error) return <PortalError message={friendlyCustomerPortalError(error)} onRetry={reload} />

  const documents = data?.documents ?? []
  const deliverables = data?.deliverables ?? []

  return (
    <>
      <section id="project-files" style={{ marginTop: 'var(--space-8)' }} aria-labelledby="project-documents">
        <h2 id="project-documents" className="text-h3">
          Documents
        </h2>
        <p className={ui.meta} id="project-upload-hint">
          Allowed: PDF, Office documents, images, TXT, CSV, ZIP. Max {PROJECT_FILE_MAX_BYTES_LABEL}.
        </p>
        <div className={ui.actionsRow} style={{ marginTop: 'var(--space-3)' }}>
          <Button type="button" disabled={uploading} aria-busy={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? 'Uploading…' : 'Upload file'}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          aria-describedby="project-upload-hint"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void onFileSelected(file)
          }}
        />
        <p className={ui.meta} role="status" aria-live="polite">
          {uploadStatus}
        </p>
        {documents.length === 0 ? (
          <EmptyState title="No project documents yet" description="No project documents yet." />
        ) : (
          <ul className={ui.stack} style={{ marginTop: 'var(--space-4)' }}>
            {documents.map((file: CustomerProjectFile) => (
              <PortalFileListItem
                key={file.id}
                fileName={file.fileName}
                metaLine={`${file.category} · ${formatFileSize(file.sizeBytes)} · ${new Date(file.uploadedAt).toLocaleDateString()}`}
                onDownload={() => void download(file.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 'var(--space-8)' }} aria-labelledby="project-deliverables">
        <h2 id="project-deliverables" className="text-h3">
          Deliverables
        </h2>
        {deliverables.length === 0 ? (
          <EmptyState
            title="No deliverables yet"
            description="Deliverables will appear here as your project progresses."
          />
        ) : (
          <ul className={ui.stack}>
            {deliverables.map((file: CustomerProjectFile) => (
              <PortalFileListItem
                key={file.id}
                fileName={file.fileName}
                metaLine={`${file.mimeType} · ${formatFileSize(file.sizeBytes)} · ${new Date(file.uploadedAt).toLocaleDateString()}`}
                onDownload={() => void download(file.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
