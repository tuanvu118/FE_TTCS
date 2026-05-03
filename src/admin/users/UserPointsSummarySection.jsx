import { useEffect, useState } from 'react'
import { getUserPointsSummary } from '../../service/userService'

function UserPointsSummarySection({ userId, accessToken, onApiError }) {
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSemesterId, setSelectedSemesterId] = useState('')

  useEffect(() => {
    async function loadSummary() {
      if (!userId || !accessToken) return
      setIsLoading(true)
      try {
        const data = await getUserPointsSummary(userId, accessToken)
        setSummary(data)
        
        // Find active semester or default to the first one
        if (data.items && data.items.length > 0) {
          const active = data.items.find(item => item.is_active)
          if (active) {
            setSelectedSemesterId(active.semester_id)
          } else {
            setSelectedSemesterId(data.items[0].semester_id)
          }
        }
      } catch (error) {
        console.error('Failed to load points summary', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSummary()
  }, [userId, accessToken])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ĐIỂM
        </span>
        <strong style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '700' }}>
          Đang tải...
        </strong>
      </div>
    )
  }

  if (!summary || !summary.items || summary.items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ĐIỂM
        </span>
        <strong style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '700' }}>
          -
        </strong>
      </div>
    )
  }

  const selectedItem = summary.items.find(item => item.semester_id === selectedSemesterId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ 
          fontSize: '0.65rem', 
          fontWeight: '800', 
          color: '#94a3b8', 
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          ĐIỂM
        </span>
        <select 
          value={selectedSemesterId} 
          onChange={(e) => setSelectedSemesterId(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '0.65rem',
            color: '#3b82f6',
            fontWeight: '800',
            cursor: 'pointer',
            outline: 'none',
            padding: '0',
            margin: '0',
            textTransform: 'uppercase'
          }}
        >
          {summary.items.map(item => (
            <option key={item.semester_id} value={item.semester_id} style={{ textTransform: 'none', color: 'black' }}>
              {item.semester_name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <strong style={{ 
          fontSize: '0.9rem', 
          color: '#10b981', 
          fontWeight: '700' 
        }}>
          {selectedItem?.total_points.toFixed(1) || '0.0'}
        </strong>
      </div>
    </div>
  )
}

export default UserPointsSummarySection
