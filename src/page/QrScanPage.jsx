import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography, message } from 'antd'
import { getCurrentCoordinates } from '../utils/geolocation'
import { scanAttendanceQr } from '../service/apiStudentEvent'
import { LOCATION_STORAGE_KEY } from '../service/locationHeartbeatService'
import { readStorage } from '../utils/storage'
import DownloadModal from './DownloadModal'

const { Text } = Typography

function getCoordinatesFromStorage() {
  const stored = readStorage(LOCATION_STORAGE_KEY)
  const latitude = Number(stored?.latitude)
  const longitude = Number(stored?.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }
  return { latitude, longitude }
}

function QrScanPage() {
  const navigate = useNavigate()
  const [accessReady, setAccessReady] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [gateMessage, setGateMessage] = useState('')
  const [isGateModalOpen, setIsGateModalOpen] = useState(true)
  const [isGateModalDismissed, setIsGateModalDismissed] = useState(false)
  const [qrValue, setQrValue] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null })
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanError, setScanError] = useState('')
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const scanFrameRef = useRef(null)
  const detectorRef = useRef(null)
  const scanTimeoutRef = useRef(null)
  const cameraActiveRef = useRef(false)
  const handlingScanRef = useRef(false)

  function toDateTimeLocalInput(value) {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  function parseScannedPayload(rawValue) {
    if (!rawValue) return
    try {
      const parsed = JSON.parse(rawValue)
      const parsedQr = parsed?.qr_value ?? parsed?.qrValue ?? rawValue
      const parsedFrom = parsed?.valid_from ?? parsed?.validFrom ?? ''
      const parsedUntil = parsed?.valid_until ?? parsed?.validUntil ?? ''
      return {
        qrValue: String(parsedQr),
        validFrom: parsedFrom ? toDateTimeLocalInput(parsedFrom) : '',
        validUntil: parsedUntil ? toDateTimeLocalInput(parsedUntil) : '',
      }
    } catch {
      return {
        qrValue: rawValue,
        validFrom: '',
        validUntil: '',
      }
    }
  }

  function stopCamera() {
    cameraActiveRef.current = false
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current)
      scanTimeoutRef.current = null
    }
    if (scanFrameRef.current) {
      cancelAnimationFrame(scanFrameRef.current)
      scanFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  function scanLoop() {
    const video = videoRef.current
    const detector = detectorRef.current
    if (!video || !detector || !cameraActiveRef.current) {
      return
    }

    if (video.readyState < 2) {
      scanFrameRef.current = requestAnimationFrame(scanLoop)
      return
    }

    detector.detect(video)
      .then((codes) => {
        if (Array.isArray(codes) && codes.length > 0) {
          const qrRawValue = codes[0]?.rawValue || ''
          if (qrRawValue) {
            setScanError('')
            void handleDetectedQr(qrRawValue)
            return
          }
        }
        scanFrameRef.current = requestAnimationFrame(scanLoop)
      })
      .catch(() => {
        scanFrameRef.current = requestAnimationFrame(scanLoop)
      })
  }

  async function ensureQrDetector() {
    if (!('BarcodeDetector' in window)) {
      throw new Error('Thiết bị/trình duyệt chưa hỗ trợ Barcode Detection API.')
    }

    if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
      const supportedFormats = await window.BarcodeDetector.getSupportedFormats()
      if (Array.isArray(supportedFormats) && !supportedFormats.includes('qr_code')) {
        throw new Error('Trình duyệt có BarcodeDetector nhưng không hỗ trợ định dạng qr_code.')
      }
    }

    if (!detectorRef.current) {
      detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] })
    }

    return detectorRef.current
  }

  async function startCameraScan() {
    setScanError('')
    if (!window.isSecureContext) {
      setScanError('Quét QR chỉ hoạt động trong secure context (HTTPS hoặc localhost).')
      return
    }

    try {
      await ensureQrDetector()

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      cameraActiveRef.current = true
      setCameraActive(true)
      scanTimeoutRef.current = setTimeout(() => {
        if (scanFrameRef.current) {
          setScanError('Chưa nhận diện được QR. Hãy tăng sáng, giữ máy ổn định và đưa mã vào gần camera hơn.')
        }
      }, 12000)
      scanFrameRef.current = requestAnimationFrame(scanLoop)
    } catch (error) {
      if (
        String(error?.message || '').includes('Barcode Detection API') ||
        String(error?.message || '').includes('qr_code')
      ) {
        message.error(error?.message || 'Thiết bị/trình duyệt chưa hỗ trợ Barcode Detection API.')
        navigate('/')
        return
      }
      setScanError(error?.message || 'Không thể mở camera để quét QR.')
      stopCamera()
    }
  }

  async function handleRetryCamera() {
    stopCamera()
    setScanError('')
    await startCameraScan()
  }

  async function handleDetectedQr(rawValue) {
    if (handlingScanRef.current) {
      return
    }
    handlingScanRef.current = true
    stopCamera()
    setSubmitting(true)

    try {
      const parsedPayload = parseScannedPayload(rawValue)
      const scannedQrValue = parsedPayload?.qrValue?.trim() || ''
      const scannedValidFrom = parsedPayload?.validFrom || ''
      const scannedValidUntil = parsedPayload?.validUntil || ''

      setQrValue(scannedQrValue)
      setValidFrom(scannedValidFrom)
      setValidUntil(scannedValidUntil)

      if (!scannedQrValue) {
        message.error('QR không hợp lệ.')
        return
      }

      if (!scannedValidFrom || !scannedValidUntil) {
        message.error('QR không có đầy đủ thời gian hiệu lực.')
        return
      }

      const fromMs = new Date(scannedValidFrom).getTime()
      const untilMs = new Date(scannedValidUntil).getTime()
      const nowMs = Date.now()

      if (!Number.isFinite(fromMs) || !Number.isFinite(untilMs) || untilMs < fromMs) {
        message.error('Khoảng thời gian hợp lệ không đúng định dạng.')
        return
      }

      if (nowMs < fromMs || nowMs > untilMs) {
        message.error('QR không hợp lệ.')
        return
      }

      const storedCoords = getCoordinatesFromStorage()
      if (!storedCoords) {
        message.error('Không có tọa độ trong localStorage để gửi điểm danh.')
        return
      }

      setCoordinates(storedCoords)

      await scanAttendanceQr({
        qrValue: scannedQrValue,
        latitude: storedCoords.latitude,
        longitude: storedCoords.longitude,
      })

      message.success('Quét QR điểm danh thành công.')
      navigate('/')
    } catch (error) {
      message.error(error?.message || 'Quét QR thất bại.')
    } finally {
      setSubmitting(false)
      handlingScanRef.current = false
    }
  }

  const evaluateAccess = async () => {
    setCheckingAccess(true)
    const standaloneOnIos = window.navigator.standalone === true
    const standaloneOnOthers = window.matchMedia('(display-mode: standalone)').matches
    const isInstalled = Boolean(standaloneOnIos || standaloneOnOthers)

    const notifications = Notification.permission
    let camera = 'prompt'
    let geolocation = 'prompt'

    if (navigator.permissions?.query) {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' })
        camera = cameraPermission.state
      } catch {
        // Browser does not support querying camera permission.
      }
      try {
        const geoPermission = await navigator.permissions.query({ name: 'geolocation' })
        geolocation = geoPermission.state
      } catch {
        // Browser does not support querying geolocation permission.
      }
    }

    const allPermissionsGranted =
      notifications === 'granted' && camera === 'granted' && geolocation === 'granted'
    const ready = isInstalled && allPermissionsGranted

    setAccessReady(ready)
    if (!ready) {
      const missing = []
      if (!isInstalled) missing.push('chưa cài đặt ứng dụng')
      if (notifications !== 'granted') missing.push('chưa cấp quyền thông báo')
      if (camera !== 'granted') missing.push('chưa cấp quyền camera')
      if (geolocation !== 'granted') missing.push('chưa cấp quyền vị trí')
      setGateMessage(`Bạn cần hoàn tất các điều kiện trước khi quét QR: ${missing.join(', ')}.`)
    } else {
      setGateMessage('')
    }
    setCheckingAccess(false)
  }

  useEffect(() => {
    evaluateAccess()
    const onAppInstalled = () => evaluateAccess()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        evaluateAccess()
      }
    }
    window.addEventListener('appinstalled', onAppInstalled)
    window.addEventListener('focus', evaluateAccess)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('appinstalled', onAppInstalled)
      window.removeEventListener('focus', evaluateAccess)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!accessReady) {
      if (isGateModalDismissed) {
        return
      }
      setIsGateModalOpen(true)
      return
    }
    setIsGateModalDismissed(false)
  }, [accessReady, isGateModalDismissed])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    if (!accessReady || cameraActiveRef.current || submitting) {
      return
    }
    void startCameraScan()
  }, [accessReady, submitting])

  useEffect(() => {
    if (!accessReady) {
      return undefined
    }
    let cancelled = false
    async function loadCoordinates() {
      setLoadingLocation(true)
      try {
        let current = getCoordinatesFromStorage()
        if (!current) {
          current = await getCurrentCoordinates()
        }
        if (!cancelled) {
          setCoordinates({
            latitude: current.latitude,
            longitude: current.longitude,
          })
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
  }, [accessReady])

  if (!accessReady) {
    return (
      <>
        <DownloadModal
          open={isGateModalOpen}
          onClose={() => {
            setIsGateModalOpen(false)
            setIsGateModalDismissed(true)
          }}
          noticeMessage={checkingAccess ? 'Đang kiểm tra điều kiện truy cập tính năng quét QR…' : gateMessage}
          closable
          maskClosable={false}
        />
        <section className="page-card" style={{ display: 'grid', gap: 12 }}>
          <h1>Quét QR điểm danh</h1>
          <Text type="secondary">
            {checkingAccess
              ? 'Đang kiểm tra trạng thái cài đặt ứng dụng và quyền truy cập...'
              : 'Vui lòng hoàn tất yêu cầu trong modal để tiếp tục quét QR.'}
          </Text>
        </section>
      </>
    )
  }

  return (
    <section
      className="page-card"
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: '90vw',
            height: '50vh',
            maxWidth: 560,
            maxHeight: 560,
            minWidth: 280,
            minHeight: 280,
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            background: '#000',
            objectFit: 'cover',
            display: cameraActive ? 'block' : 'none',
          }}
        />
        {submitting ? <Text type="secondary">Đang gửi điểm danh...</Text> : null}
        {!cameraActive && !submitting ? <Text type="secondary">Đang khởi động camera...</Text> : null}
        {scanError ? <Text type="danger">{scanError}</Text> : null}
        {scanError && !submitting ? (
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: 2,
            }}
          >
            <Button
              type="primary"
              onClick={() => void handleRetryCamera()}
              style={{
                borderRadius: 10,
                fontWeight: 600,
                minWidth: 164,
                height: 40,
              }}
            >
              Mở lại camera
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default QrScanPage
