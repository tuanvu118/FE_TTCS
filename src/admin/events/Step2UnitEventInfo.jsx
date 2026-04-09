import { useState, useEffect, useRef } from 'react'
import { 
  Image as ImageIcon,
  ArrowLeft,
  ArrowRight,
  Trash,
} from '@phosphor-icons/react'
import { Select, InputNumber, Badge } from 'antd'
import { getUnits } from '../../service/unitService'
import { getSemesters } from '../../service/semesterService'
import { getStoredAuthSession } from '../../service/authSession'
import styles from './step2UnitEventInfo.module.css'

export default function Step2UnitEventInfo({ type, data, setData, isSubmitting, onBack, onNext }) {
  const [units, setUnits] = useState([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [semesters, setSemesters] = useState([])
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadUnits()
    loadSemesters()
  }, [])

  async function loadSemesters() {
    setIsLoadingSemesters(true)
    try {
      const token = getStoredAuthSession()?.accessToken
      const res = await getSemesters(token)
      setSemesters(res.items || [])
      if (!data.semesterId && res.items?.length > 0) {
        const active = res.items.find(s => s.is_active) || res.items[0]
        setData(prev => ({ ...prev, semesterId: active.id }))
      }
    } catch (err) {
      console.error('Failed to load semesters', err)
    } finally {
      setIsLoadingSemesters(false)
    }
  }

  async function loadUnits() {
    setIsLoadingUnits(true)
    try {
      // Fetch all units, limited to a large number to ensure we get most
      const res = await getUnits({ limit: 100 })
      setUnits(res.items || [])
    } catch (err) {
      console.error('Failed to load units', err)
    } finally {
      setIsLoadingUnits(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setData(prev => ({ 
          ...prev, 
          imageFile: file, 
          imagePreview: reader.result 
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const isFormValid = data.title && data.description && data.listUnitId?.length > 0 && data.semesterId

  return (
    <div className={styles.container}>
      {/* 1. THÔNG TIN CƠ BẢN */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Thông tin cơ bản</h3>
            <p className={styles.sectionDesc}>Nhập tên và hình ảnh mô tả cho yêu cầu hỗ trợ.</p>
          </div>
        </div>
        
        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>TIÊU ĐỀ YÊU CẦU</label>
            <input 
              className={styles.input}
              placeholder={type === 'HTTT' ? "Ví dụ: Hỗ trợ truyền thông Giải bóng đá sinh viên" : "Ví dụ: Hỗ trợ nhân sự Hội thảo Career Talk"}
              value={data.title}
              onChange={e => setData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>ẢNH MINH HỌA (NẾU CÓ)</label>
            <div 
              className={`${styles.uploadArea} ${data.imagePreview ? styles.hasPreview : ''}`}
              onClick={triggerFileInput}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                className={styles.hiddenInput} 
                accept="image/*"
              />
              {data.imagePreview ? (
                <img src={data.imagePreview} alt="Preview" className={styles.previewImage} />
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <ImageIcon size={40} weight="light" color="#94a3b8" />
                  <p>Tải ảnh lên</p>
                  <span>Khuyên dùng: 16:9 (JPG, PNG)</span>
                </div>
              )}
              {data.imagePreview && (
                <button 
                  className={styles.removeImgBtn} 
                  onClick={(e) => {
                    e.stopPropagation()
                    setData(prev => ({ ...prev, imageFile: null, imagePreview: null }))
                  }}
                >
                  <Trash size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. CHI TIẾT & ĐỐI TƯỢNG */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <h3 className={styles.sectionTitle}>Chi tiết & Đối tượng</h3>
            <p className={styles.sectionDesc}>Mô tả yêu cầu và lựa chọn các đơn vị sẽ thực hiện.</p>
          </div>
        </div>

        <div className={styles.sectionContent}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>NỘI DUNG YÊU CẦU HỖ TRỢ</label>
              <textarea 
                className={styles.textarea}
                placeholder="Mô tả chi tiết các hạng mục cần hỗ trợ..."
                value={data.description}
                onChange={e => setData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className={styles.fieldGroup} style={{ maxWidth: '300px' }}>
                <label className={styles.label}>HỌC KỲ</label>
                <Select 
                    className={styles.select}
                    placeholder="Chọn học kỳ"
                    loading={isLoadingSemesters}
                    value={data.semesterId}
                    onChange={val => setData(prev => ({ ...prev, semesterId: val }))}
                    options={semesters.map(s => ({ 
                        value: s.id, 
                        label: (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <span>{s.name} - {s.academic_year}</span>
                                {s.is_active && <Badge count="Đang diễn ra" style={{ backgroundColor: '#10b981', marginLeft: '10px', fontSize: '10px' }} />}
                            </div>
                        )
                    }))}
                />
            </div>
          
          <div className={styles.row}>
            <div className={styles.fieldGroup} style={{ flex: 2 }}>
              <label className={styles.label}>ĐƠN VỊ PHỐI HỢP / NHẬN YÊU CẦU</label>
              <Select 
                mode="multiple"
                className={styles.select}
                placeholder="Chọn các đơn vị tham gia"
                loading={isLoadingUnits}
                value={data.listUnitId}
                onChange={val => setData(prev => ({ ...prev, listUnitId: val }))}
                options={units.map(u => ({ value: u.id, label: u.name }))}
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label className={styles.label}>ĐIỂM THƯỞNG (NẾU CÓ)</label>
              <div className={styles.inputWithSuffix}>
                <InputNumber 
                  className={styles.numberInput}
                  min={0}
                  max={10}
                  step={0.1}
                  value={data.point}
                  onChange={val => setData(prev => ({ ...prev, point: val }))}
                />
                <span className={styles.suffix}>ĐIỂM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <button className={styles.backButton} onClick={onBack} disabled={isSubmitting}>
          <ArrowLeft size={16} weight="bold" />
          Quay lại
        </button>
        <div className={styles.footerRight}>
          <button 
            className={styles.nextButton} 
            disabled={!isFormValid || isSubmitting}
            onClick={onNext}
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
            {!isSubmitting && <ArrowRight size={16} weight="bold" />}
          </button>
        </div>
      </footer>
    </div>
  )
}
