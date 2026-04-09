import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PencilSimple, Trash, WarningCircle } from '@phosphor-icons/react'
import { Spin } from 'antd'
import { getPublicEventById, getUnitEventById } from '../../service/apiAdminEvent'
import EventPublicDetail from './EventPublicDetail'
import EventUnitDetail from './EventUnitDetail'
import styles from './adminEventDetail.module.css'

export default function AdminEventDetailPage() {
  const { unitId, eventScope, eventId } = useParams()
  const navigate = useNavigate()
  
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [eventId, eventScope])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      let response
      if (eventScope === 'p') {
        response = await getPublicEventById(eventId)
      } else {
        response = await getUnitEventById(eventId, unitId)
      }
      setData(response)
    } catch (err) {
      console.error('Fetch event detail failed', err)
      setError('Không thể tải thông tin sự kiện. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => navigate(`/admin/${unitId}/events`)

  const handleEdit = () => navigate(`/admin/${unitId}/events/${eventScope}/${eventId}/edit`)

  if (isLoading) {
    return (
      <div className={styles.loadingBox}>
        <Spin size="large" />
        <p>Đang tải thông tin sự kiện...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={styles.loadingBox}>
        <WarningCircle size={48} color="#ef4444" />
        <p>{error || 'Không tìm thấy dữ liệu.'}</p>
        <button className="secondary-button" onClick={handleBack}>Quay lại</button>
      </div>
    )
  }

  return (
    <div className={styles.detailRoot}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backLink} onClick={handleBack}>
            <ArrowLeft size={16} weight="bold" />
            QUAY LẠI DANH SÁCH
          </button>
          <h1 className={styles.title}>{data.title}</h1>
        </div>
        <div className={styles.actions}>
          <button 
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={handleEdit}
          >
            <PencilSimple size={18} />
            Chỉnh sửa
          </button>
          <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>
            <Trash size={18} />
            Xóa sự kiện
          </button>
        </div>
      </header>

      {eventScope === 'p' ? (
        <EventPublicDetail data={data} />
      ) : (
        <EventUnitDetail data={data} />
      )}
    </div>
  )
}