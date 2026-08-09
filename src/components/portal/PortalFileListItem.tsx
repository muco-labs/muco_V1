import ui from '@/components/portal/CustomerPortalUi.module.css'

type Props = {
  fileName: string
  metaLine: string
  onDownload: () => void
}

export function PortalFileListItem({ fileName, metaLine, onDownload }: Props) {
  return (
    <li className={`surface ${ui.dataCard}`}>
      <button type="button" className="link-underline" onClick={onDownload}>
        {fileName}
      </button>
      <span className={ui.meta}>{metaLine}</span>
    </li>
  )
}
