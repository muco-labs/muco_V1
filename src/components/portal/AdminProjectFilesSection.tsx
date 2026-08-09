import { useRef, useState } from 'react'
import { EmptyState, ListSkeleton, PortalError } from '@/components/portal/CustomerPortalUi'
import ui from '@/components/portal/CustomerPortalUi.module.css'
import { Button } from '@/components/ui/Button'
import { useFetch } from '@/hooks/useFetch'
import { adminApi } from '@/services/admin-portal'
import { PROJECT_FILE_MAX_BYTES_LABEL } from '@/lib/files/project-file-constants'

type AdminProjectFile = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  category: string
  visibility: string
  status: string
  uploadedByCustomer: boolean
}

type Props = {
  projectId: string
  canManage: boolean
}

export function AdminProjectFilesSection({ projectId, canManage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const { data, error, loading, reload } = useFetch(
    () => adminApi.projects.listFiles(projectId),
    [projectId],
  )

  const items = (data?.items as AdminProjectFile[]) ?? []

  async function download(fileId: string) {
    const result = await adminApi.projects.downloadFile(projectId, fileId)
    if (result.configured && result.url) window.open(result.url, '_blank', 'noopener,noreferrer')
  }

  async function patchFile(fileId: string, body: Record<string, unknown>) {
    await adminApi.projects.updateFile(projectId, fileId, body)
    reload()
  }

  async function onFileSelected(file: File) {
    setBusy(true)
    setMessage(null)
    try {
      const prep = await adminApi.projects.prepareUpload(projectId, {
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        category: 'project_document',
        visibility: 'internal',
      })
      if (!prep.upload.configured) {
        setMessage(prep.upload.message ?? 'Storage not configured.')
        return
      }
      const put = await fetch(prep.upload.signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!put.ok) {
        setMessage('Upload failed.')
        return
      }
      await adminApi.projects.finalizeUpload(projectId, prep.file.id)
      setMessage('Uploaded.')
      reload()
    } catch {
      setMessage('Upload failed.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (loading) return <ListSkeleton rows={3} />
  if (error) return <PortalError message={error} onRetry={reload} />

  return (
    <section className={ui.stack} style={{ marginTop: 'var(--space-6)' }} aria-labelledby="admin-project-files">
      <h2 id="admin-project-files" className="text-h3">
        Project files
      </h2>
      {canManage ? (
        <>
          <p className={ui.meta}>Max {PROJECT_FILE_MAX_BYTES_LABEL}. Files default to internal until marked customer-visible.</p>
          <input
            ref={inputRef}
            type="file"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void onFileSelected(file)
            }}
          />
          <Button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
            Upload
          </Button>
          <p className={ui.meta} role="status" aria-live="polite">
            {message}
          </p>
        </>
      ) : null}
      {items.length === 0 ? (
        <EmptyState title="No files" description="Project files will appear here." />
      ) : (
        <ul className={ui.stack}>
          {items.map((file) => (
            <li key={file.id} className={`surface ${ui.dataCard}`}>
              <button type="button" className="link-underline" onClick={() => void download(file.id)}>
                {file.fileName}
              </button>
              <p className={ui.meta}>
                {file.category} · {file.visibility} · {file.status} ·{' '}
                {file.uploadedByCustomer ? 'Customer upload' : 'Team upload'}
              </p>
              {canManage ? (
                <div className={ui.actionsRow}>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void patchFile(file.id, {
                        visibility:
                          file.visibility === 'customer_visible' ? 'internal' : 'customer_visible',
                      })
                    }
                  >
                    {file.visibility === 'customer_visible' ? 'Make internal' : 'Share with customer'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void patchFile(file.id, { category: 'deliverable', visibility: 'customer_visible' })}
                  >
                    Mark deliverable
                  </Button>
                  {file.status !== 'archived' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => void patchFile(file.id, { status: 'archived' })}
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
