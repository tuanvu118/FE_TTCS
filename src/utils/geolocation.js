const DEFAULT_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 6000,
  maximumAge: 0,
}

const FALLBACK_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

function mapGeolocationError(error) {
  switch (error?.code) {
    case 1:
      return new Error('Bạn đã từ chối quyền truy cập vị trí.')
    case 2:
      return new Error('Không thể xác định vị trí hiện tại.')
    case 3:
      return new Error('Yêu cầu lấy vị trí đã hết thời gian chờ.')
    default:
      return new Error('Không thể lấy vị trí người dùng.')
  }
}

export function getCurrentCoordinates(options = {}) {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new Error('Trình duyệt không hỗ trợ định vị.'))
  }

  const primaryOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const readPosition = (readOptions) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          resolve({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
        },
        (error) => {
          reject(error)
        },
        readOptions,
      )
    })

  return readPosition(primaryOptions).catch((error) => {
    // Fast-first strategy: if quick network/cached lookup fails,
    // retry once with high accuracy GPS to improve precision.
    const shouldRetry =
      (error?.code === 2 || error?.code === 3) && !primaryOptions.enableHighAccuracy

    if (!shouldRetry) {
      throw mapGeolocationError(error)
    }

    const retryOptions = {
      ...FALLBACK_OPTIONS,
      ...options,
      enableHighAccuracy: false,
    }

    return readPosition(retryOptions).catch((retryError) => {
      throw mapGeolocationError(retryError)
    })
  })
}
