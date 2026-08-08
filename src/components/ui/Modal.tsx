import { useEffect, useId, type RefObject, type ReactNode } from 'react'
import { HiXMark } from 'react-icons/hi2'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import styles from './Modal.module.css'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const titleId = useId()
  const containerRef = useFocusTrap(open)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <dialog
        ref={containerRef as RefObject<HTMLDialogElement>}
        open
        className={styles.dialog}
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onCancel={(event) => {
          event.preventDefault()
          onClose()
        }}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <HiXMark aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </dialog>
    </div>
  )
}
