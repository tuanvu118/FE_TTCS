import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Buildings,
  Calendar,
  Link,
  PencilSimple,
  Trash,
  Trophy,
  WarningCircle,
} from '@phosphor-icons/react'
import { Popconfirm, Spin, message } from 'antd'
import { deleteUnitEvent, getUnitEventById } from '../../../service/apiAdminEvent'
import { getStoredCurrentSemester } from '../../../utils/currentSemesterStorage'
import styles from './EventUnitDetail.module.css'

export default function UnitEventDetailPage() {
  const { unitId, eventId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [unitId, eventId])

  async function fetchData() {
    setIsLoading(true)
    setError(null)
    try {
      const eventRes = await getUnitEventById(eventId, unitId)
      setData(eventRes)
    } catch (err) {
      console.error('Fetch unit event detail failed', err)
      setError('Không thể tải thông tin yêu cầu. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentSemester = getStoredCurrentSemester()
  const semesterObj =
    data && currentSemester?.id === (data.semester_id || data.semesterId) ? currentSemester : null

  const handleBack = () => navigate(`/admin/${unitId}/events`)
  const handleEdit = () => navigate(`/admin/${unitId}/events/u/${eventId}/edit`)

  const handleDelete = async () => {
    try {
      await deleteUnitEvent(eventId)
      handleBack()
    } catch (e) {
      // Error handled by service
    }
  }

  const handleCopyUrl = () => {
    const taskUrl = `${window.location.origin}/task/${eventId}`
    navigator.clipboard.writeText(taskUrl)
      .then(() => {
        message.success('Đã sao chép đường dẫn yêu cầu!')
      })
      .catch(() => {
        message.error('Không thể sao chép đường dẫn.')
      })
  }

  if (isLoading) {
    return (
      <div className={styles.loadingBox}>
        <Spin size="large" />
        <p>Đang tải thông tin yêu cầu...</p>
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
            className={`${styles.actionBtn} ${styles.copyBtn}`}
            onClick={handleCopyUrl}
            title="Sao chép link xem của sinh viên"
          >
            <Link size={18} />
            Copy Link
          </button>
          <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={handleEdit}>
            <PencilSimple size={18} />
            Chỉnh sửa
          </button>
          <Popconfirm
            title="Xóa yêu cầu"
            description="Bạn có chắc muốn xóa vĩnh viễn yêu cầu này không? Hành động này không thể khôi phục."
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>
              <Trash size={18} />
              Xóa yêu cầu
            </button>
          </Popconfirm>
        </div>
      </header>

      <div className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>LOẠI YÊU CẦU</span>
                  <span className={styles.infoValue}>
                    {data.type === 'HTTT' ? 'HỖ TRỢ TRUYỀN THÔNG' : 'HỖ TRỢ TỔ CHỨC'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>ĐIỂM THƯỞNG</span>
                  <span className={styles.infoValue}>
                    <Trophy size={16} weight="fill" color="#eab308" style={{ marginRight: '0.25rem' }} />
                    {data.point || 0} ĐIỂM
                  </span>
                </div>
              </div>

              <div className={styles.descriptionSection}>
                <h3 className={styles.cardTitle}>Nội dung chi tiết</h3>
                <p className={styles.descriptionText}>{data.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.rightCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Đơn vị phối hợp</h3>
          </div>
          <div className={styles.cardBody}>
            <p className={styles.sectionDesc}>
              Danh sách các CLB/Khoa tham gia thực hiện yêu cầu này.
            </p>

            <div className={styles.unitList}>
              {data.assigned_units?.length > 0 ? (
                data.assigned_units.map((unit, idx) => (
                  <div key={idx} className={styles.unitItem}>
                    <img
                      src={unit.logo || 'https://via.placeholder.com/40'}
                      alt={unit.name}
                      className={styles.unitLogo}
                    />
                    <div className={styles.unitInfo}>
                      <span className={styles.unitName}>{unit.name}</span>
                      <p className={styles.unitType}>{unit.type}</p>
                    </div>
                  </div>
                ))
              ) : (
                  <p className={styles.emptyText}>Chưa gán đơn vị nào.</p>
              )}
            </div>
          </div>
        </div>

        <div className={`${styles.card} ${styles.rightCard} ${styles.contextCard}`}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Bối cảnh</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.timeline}>
              <div className={styles.timePoint}>
                <div className={styles.timeIcon}>
                  <Calendar size={20} />
                </div>
                <div className={styles.timeContent}>
                  <span className={styles.timeTitle}>THỜI GIAN TẠO</span>
                  <span className={styles.timeValue}>
                    {new Date(data.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className={styles.timePoint}>
                <div className={styles.timeIcon}>
                  <Buildings size={20} />
                </div>
                <div className={styles.timeContent}>
                  <span className={styles.timeTitle}>HỌC KỲ</span>
                  <span className={styles.timeValue}>{semesterObj ? `${semesterObj.name} - ${semesterObj.academic_year}` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
