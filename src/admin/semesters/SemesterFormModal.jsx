import { useEffect, useState } from 'react'
import { X, Calendar, GraduationCap, CheckCircle } from '@phosphor-icons/react'
import NotificationPopup from '../../components/NotificationPopup'
import { toApiDateTimeValue, toDateTimeLocalValue } from '../../utils/semesterUtils'
import styles from './adminSemesters.module.css'

const initialFormState = {
  name: '',
  academic_year: '',
  start_date: '',
  end_date: '',
  is_active: false,
}

function buildFormState(initialValues) {
  return {
    name: initialValues?.name || '',
    academic_year: initialValues?.academic_year || '',
    start_date: toDateTimeLocalValue(initialValues?.start_date),
    end_date: toDateTimeLocalValue(initialValues?.end_date),
    is_active: Boolean(initialValues?.is_active),
  }
}

function SemesterFormModal({ isOpen, mode, initialValues, isSubmitting, onClose, onSubmit }) {
  const [form, setForm] = useState(initialFormState)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setForm(buildFormState(initialValues))
    setNotice('')
  }, [initialValues, isOpen])

  if (!isOpen) {
    return null
  }

  function handleChange(event) {
    const { name, value, checked, type } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const startDate = new Date(form.start_date)
    const endDate = new Date(form.end_date)

    if (
      mode === 'create' &&
      (!form.name.trim() ||
        !form.academic_year.trim() ||
        !form.start_date ||
        !form.end_date)
    ) {
      setNotice('Vui lòng nhập đầy đủ các trường bắt buộc.')
      return
    }

    if (
      form.start_date &&
      form.end_date &&
      !Number.isNaN(startDate.getTime()) &&
      !Number.isNaN(endDate.getTime()) &&
      startDate >= endDate
    ) {
      setNotice('Ngày bắt đầu phải nhỏ hơn ngày kết thúc.')
      return
    }

    const payload = {
      ...(mode === 'create' || form.name.trim() ? { name: form.name.trim() } : {}),
      ...(mode === 'create' || form.academic_year.trim()
        ? { academic_year: form.academic_year.trim() }
        : {}),
      ...(mode === 'create' || form.start_date
        ? { start_date: toApiDateTimeValue(form.start_date) }
        : {}),
      ...(mode === 'create' || form.end_date
        ? { end_date: toApiDateTimeValue(form.end_date) }
        : {}),
      is_active: form.is_active,
    }

    await onSubmit(payload)
  }

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <NotificationPopup
        isOpen={Boolean(notice)}
        title="Lỗi biểu mẫu"
        message={notice}
        onClose={() => setNotice('')}
      />

      <section
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="semester-form-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div>
            <h2 id="semester-form-title" className={styles.modalTitle}>
              {mode === 'create' ? 'Tạo học kỳ mới' : 'Cập nhật học kỳ'}
            </h2>
            <p className={styles.modalSubtitle}>
              {mode === 'create'
                ? 'Thiết lập thông tin cho học kỳ mới trong hệ thống.'
                : 'Thay đổi các mốc thời gian hoặc trạng thái của học kỳ.'}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Đóng biểu mẫu học kỳ"
            onClick={onClose}
          >
            <X weight="bold" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <form className={styles.formGrid} onSubmit={handleSubmit}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <span>
                <GraduationCap size={14} weight="bold" style={{ marginRight: '4px' }} />
                Tên học kỳ
              </span>
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Ví dụ: Học kỳ 1"
                required
              />
            </div>

            <div className={styles.field}>
              <span>Năm học</span>
              <input
                name="academic_year"
                type="text"
                value={form.academic_year}
                onChange={handleChange}
                placeholder="Ví dụ: 2025-2026"
                required
              />
            </div>

            <div className={styles.field}>
              <span>
                <Calendar size={14} weight="bold" style={{ marginRight: '4px' }} />
                Ngày bắt đầu
              </span>
              <input
                name="start_date"
                type="datetime-local"
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.field}>
              <span>Ngày kết thúc</span>
              <input
                name="end_date"
                type="datetime-local"
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.checkboxWrapper}>
                <input
                  name="is_active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <span>Đặt làm học kỳ hiện tại (Active)</span>
              </label>
            </div>

            <div className={`${styles.formActions} ${styles.fieldFull}`}>
              <button 
                type="button" 
                className={styles.secondaryBtn} 
                onClick={onClose} 
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Đang xử lý...' : mode === 'create' ? 'Tạo học kỳ' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default SemesterFormModal

