import { useEffect, useState } from 'react'
import { Broadcast, Globe, Handshake, Tag } from '@phosphor-icons/react'
import { getAllEventBySemesterIdForAdmin } from '../../service/apiAdminEvent'
import {
  CURRENT_SEMESTER_STORAGE_KEY,
  getStoredCurrentSemester,
} from '../../utils/currentSemesterStorage'
import { buildAdminEventDetailPath } from '../adminPaths'
import styles from './eventPage.module.css'

const TYPE_LABEL = {
  SK: 'Sự kiện',
  HTSK: 'Hỗ trợ sự kiện',
  HTTT: 'Hỗ trợ truyền thông',
}

const EVENT_TYPE_ICON = {
  SK: Globe,
  HTSK: Handshake,
  HTTT: Broadcast,
}

const TYPE_ICON_SIZE = 20

function EventTitleCell({ title, eventType }) {
  const Icon = EVENT_TYPE_ICON[eventType] ?? Tag
  const typeLabel = TYPE_LABEL[eventType] ?? eventType
  return (
    <div className={styles.eventTitleCell}>
      <span className={styles.eventTitleIcon} data-event-type={eventType} aria-hidden>
        <Icon size={TYPE_ICON_SIZE} weight="regular" />
      </span>
      <span className={styles.eventTitleText} title={`${typeLabel} — ${title}`}>
        {title}
      </span>
    </div>
  )
}

function EventTypeBadge({ eventType }) {
  const label = TYPE_LABEL[eventType] ?? eventType
  return (
    <span className={styles.typeBadge} data-event-type={eventType} title={eventType}>
      {label}
    </span>
  )
}

function formatSemesterNameFromStorage(semester) {
  if (!semester?.id) {
    return 'Chưa chọn học kỳ'
  }
  const name = String(semester.name || '').trim()
  if (name) {
    return name
  }
  const year = String(semester.academic_year || '').trim()
  if (year) {
    return year
  }
  return 'Học kỳ đã lưu'
}

export default function EventPage({ navigate, adminUnitId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentSemester, setCurrentSemester] = useState(() => getStoredCurrentSemester())

  useEffect(() => {
    let cancelled = false

    async function load() {
      const semester = getStoredCurrentSemester()
      if (!cancelled) {
        setCurrentSemester(semester)
      }

      const semesterId = semester?.id
      if (!semesterId) {
        if (!cancelled) {
          setRows([])
          setLoading(false)
          setError('Chưa chọn học kỳ.')
        }
        return
      }

      setLoading(true)
      setError('')

      try {
        const events = await getAllEventBySemesterIdForAdmin(semesterId)
        if (!cancelled) {
          setRows(events)
        }
      } catch (e) {
        if (!cancelled) {
          setError('Không tải được danh sách sự kiện.')
          setRows([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function onStorage(e) {
      if (e.key !== CURRENT_SEMESTER_STORAGE_KEY) {
        return
      }
      setCurrentSemester(getStoredCurrentSemester())
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function goDetail(row) {
    if (!adminUnitId) {
      return
    }
    navigate(buildAdminEventDetailPath(adminUnitId, row.id, row.type))
  }

  const semesterDisplayName = formatSemesterNameFromStorage(currentSemester)

  return (
    <section className={`page-card ${styles.eventsRoot}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sự kiện</h1>
        <div className={styles.actions}>
          <button type="button" className={styles.filterBtn}>
            <span className={styles.filterBtnLabel} title={semesterDisplayName}>
              {semesterDisplayName}
            </span>
          </button>
          <button type="button" className={styles.createBtn}>
            Tạo sự kiện mới
          </button>
        </div>
      </div>
      {loading ? (
        <p className={styles.hint}>Đang tải…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : rows.length === 0 ? (
        <p className={styles.empty}>Không có sự kiện trong học kỳ này.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Điểm</th>
                <th>Loại</th>
                <th aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.type}-${row.id}`}>
                  <td>
                    <EventTitleCell title={row.title} eventType={row.type} />
                  </td>
                  <td>
                    <span className={styles.pointCell}>
                      <span className={styles.pointDot} aria-hidden />
                      <span>{row.point}</span>
                    </span>
                  </td>
                  <td>
                    <EventTypeBadge eventType={row.type} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => goDetail(row)}
                      disabled={!adminUnitId}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
