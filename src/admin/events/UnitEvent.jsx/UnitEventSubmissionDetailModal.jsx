import { Modal } from 'antd'
import styles from './UnitEventSubmissionDetailModal.module.css'

function formatDate(value) {
  if (!value) {
    return '—'
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return String(value)
  }
  return d.toLocaleString('vi-VN')
}

export default function UnitEventSubmissionDetailModal({ open, onClose, row }) {
  const sub = row?.submission
  const unit = row?.unit
  const statusLabel = row?.statusLabel ?? 'Chưa phản hồi'

  return (
    <Modal
      title="Chi tiết phản hồi đơn vị"
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      {!row || !sub ? (
        <p className={styles.empty}>Không có dữ liệu phản hồi.</p>
      ) : (
        <div className={styles.body}>
          <div className={styles.unitRow}>
            {unit?.logo ? (
              <img src={unit.logo} alt="" className={styles.logo} />
            ) : (
              <div className={styles.logoPlaceholder} aria-hidden />
            )}
            <div>
              <div className={styles.unitName}>{unit?.name || '—'}</div>
              <div className={styles.unitMeta}>{unit?.type || ''}</div>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Trạng thái phản hồi</span>
            <span className={styles.statusBadge}>{statusLabel}</span>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Nội dung phản hồi</span>
            <p className={styles.blockText}>{sub.content || '—'}</p>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Minh chứng (URL)</span>
            {sub.evidenceUrl ? (
              <a
                href={sub.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                {sub.evidenceUrl}
              </a>
            ) : (
              <span className={styles.muted}>—</span>
            )}
          </div>

          <div className={styles.field}>
            <span className={styles.label}>Thời gian gửi</span>
            <span>{formatDate(sub.submittedAt)}</span>
          </div>
        </div>
      )}
    </Modal>
  )
}
