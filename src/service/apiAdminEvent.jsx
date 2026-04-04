import { message } from 'antd/es'
import { apiRequest, ApiError } from './apiClient'
import { getStoredAuthSession } from './authSession'

function notifyPublicEventsError(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        break
      case 403:
        message.error('Bạn không có quyền xem danh sách sự kiện.')
        break
      case 404:
        message.error('Không tìm thấy dữ liệu sự kiện.')
        break
      default:
        message.error(error.message || 'Không thể tải danh sách sự kiện.')
    }
    return
  }

  message.error('Không thể kết nối đến máy chủ.')
}

function notifyUnitEventsListError(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        break
      case 403:
        message.error('Bạn không có quyền xem sự kiện đơn vị.')
        break
      case 404:
        message.error('Không tìm thấy kỳ học hoặc dữ liệu sự kiện.')
        break
      default:
        message.error(error.message || 'Không thể tải danh sách sự kiện đơn vị.')
    }
    return
  }

  message.error('Không thể kết nối đến máy chủ.')
}

function normalizePoint(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function eventCreatedAt(raw) {
  return raw?.created_at ?? raw?.create_at ?? ''
}

function publicEventSemesterId(raw) {
  const v = raw?.semester_id ?? raw?.semesterId
  return v != null ? String(v) : ''
}

/**
 * @param {Record<string, unknown>} item
 * @param {string} type — "SK" | "HTSK" | "HTTT"
 */
function toAdminEventRow(item, type) {
  const created = eventCreatedAt(item)
  return {
    id: String(item?.id ?? ''),
    title: String(item?.title ?? ''),
    point: normalizePoint(item?.point),
    create_at: created,
    type,
  }
}

function parseCreatedTime(createAt) {
  const t = new Date(createAt).getTime()
  return Number.isNaN(t) ? 0 : t
}

export async function getAllUnitEventsForAdmin(semesterId) {
  if (!semesterId) {
    message.warning('Thiếu học kỳ để tải sự kiện đơn vị.')
    return []
  }

  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const params = new URLSearchParams({ semesterId: String(semesterId).trim() })
    const response = await apiRequest(`/unit-events/all?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return Array.isArray(response) ? response : []
  } catch (error) {
    notifyUnitEventsListError(error)
    throw error
  }
}

export async function getAllPublicEventsForAdmin() {
  const accessToken = getStoredAuthSession()?.accessToken || ''
  try {
    const response = await apiRequest('/events/', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      ...(accessToken ? { authToken: accessToken } : {}),
    })
    return Array.isArray(response) ? response : []
  } catch (error) {
    notifyPublicEventsError(error)
    throw error
  }
}

/**
 * Gộp sự kiện đơn vị (HTSK/HTTT) và sự kiện public (type "SK") trong cùng học kỳ.
 * Sắp xếp theo ngày tạo: cũ → mới.
 * @returns {Promise<Array<{ id: string, title: string, point: number, create_at: string, type: string }>>}
 */
export async function getAllEventBySemesterIdForAdmin(semesterId) {
  if (!semesterId) {
    message.warning('Thiếu học kỳ.')
    return []
  }

  const sid = String(semesterId).trim()
  const [unitList, publicList] = await Promise.all([
    getAllUnitEventsForAdmin(sid),
    getAllPublicEventsForAdmin(),
  ])

  const unitRows = unitList.map((item) =>
    toAdminEventRow(item, String(item?.type ?? 'HTSK')),
  )

  const publicInSemester = publicList.filter((item) => publicEventSemesterId(item) === sid)
  const publicRows = publicInSemester.map((item) => toAdminEventRow(item, 'SK'))

  const merged = [...unitRows, ...publicRows]
  merged.sort((b, a) => parseCreatedTime(a.create_at) - parseCreatedTime(b.create_at))

  return merged
}
