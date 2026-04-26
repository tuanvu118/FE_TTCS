import { useEffect, useState } from 'react'
import { Button, Input, InputNumber, Typography, message } from 'antd'
import { getCurrentCoordinates } from '../utils/geolocation'
import { scanAttendanceQr } from '../service/apiStudentEvent'

const { TextArea } = Input
const { Paragraph, Text } = Typography

function QrScanPage() {
  const [qrValue, setQrValue] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null })
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scanResult, setScanResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadCoordinates() {
      setLoadingLocation(true)
      try {
        const { latitude, longitude } = await getCurrentCoordinates()
        if (!cancelled) {
          setCoordinates({ latitude, longitude })
        }
      } catch (error) {
        if (!cancelled) {
          message.error(error?.message || 'Không thể lấy vị trí hiện tại.')
        }
      } finally {
        if (!cancelled) {
          setLoadingLocation(false)
        }
      }
    }
    loadCoordinates()
    return () => {
      cancelled = true
    }
  }, [])

  const handleScan = async () => {
    if (!qrValue.trim()) {
      message.warning('Vui lòng nhập qr_value.')
      return
    }
    if (!validFrom || !validUntil) {
      message.warning('Vui lòng nhập đầy đủ thời gian hợp lệ từ và hợp lệ đến.')
      return
    }

    const fromMs = new Date(validFrom).getTime()
    const untilMs = new Date(validUntil).getTime()
    const nowMs = Date.now()
    if (!Number.isFinite(fromMs) || !Number.isFinite(untilMs) || untilMs < fromMs) {
      message.error('Khoảng thời gian hợp lệ không đúng định dạng.')
      return
    }
    if (nowMs < fromMs || nowMs > untilMs) {
      message.error('QR không hợp lệ.')
      return
    }

    setSubmitting(true)
    try {
      let latitude = coordinates.latitude
      let longitude = coordinates.longitude

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const current = await getCurrentCoordinates()
        latitude = current.latitude
        longitude = current.longitude
        setCoordinates(current)
      }

      const result = await scanAttendanceQr({
        qrValue: qrValue.trim(),
        latitude,
        longitude,
      })
      setScanResult(result)
      message.success('Quét QR điểm danh thành công.')
    } catch (error) {
      message.error(error?.message || 'Quét QR thất bại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-card" style={{ display: 'grid', gap: 16 }}>
      <h1>Quét QR điểm danh</h1>

      <div style={{ display: 'grid', gap: 8 }}>
        <Text strong>qr_value</Text>
        <TextArea
          rows={6}
          placeholder="Dán hoặc nhập qr_value tại đây"
          value={qrValue}
          onChange={(event) => setQrValue(event.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gap: 4 }}>
        <Text strong>Tọa độ</Text>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary">Vĩ độ</Text>
            <InputNumber
              value={coordinates.latitude}
              onChange={(value) =>
                setCoordinates((prev) => ({
                  ...prev,
                  latitude: typeof value === 'number' ? value : null,
                }))
              }
              placeholder={loadingLocation ? 'Đang lấy...' : 'Nhập vĩ độ'}
              step={0.000001}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary">Kinh độ</Text>
            <InputNumber
              value={coordinates.longitude}
              onChange={(value) =>
                setCoordinates((prev) => ({
                  ...prev,
                  longitude: typeof value === 'number' ? value : null,
                }))
              }
              placeholder={loadingLocation ? 'Đang lấy...' : 'Nhập kinh độ'}
              step={0.000001}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <Text strong>Thời gian hiệu lực</Text>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary">Hợp lệ từ</Text>
            <Input
              type="datetime-local"
              value={validFrom}
              onChange={(event) => setValidFrom(event.target.value)}
            />
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            <Text type="secondary">Hợp lệ đến</Text>
            <Input
              type="datetime-local"
              value={validUntil}
              onChange={(event) => setValidUntil(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <Button type="primary" onClick={handleScan} loading={submitting} disabled={loadingLocation}>
          Gửi điểm danh
        </Button>
      </div>

      {scanResult ? (
        <div>
          <Text strong>Kết quả:</Text>
          <Paragraph
            style={{
              marginTop: 8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 8,
              padding: 12,
            }}
          >
            {JSON.stringify(scanResult, null, 2)}
          </Paragraph>
        </div>
      ) : null}
    </section>
  )
}

export default QrScanPage
