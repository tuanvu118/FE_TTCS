import { apiRequest } from './apiClient'
import { getStoredAuthSession } from './authSession'

export async function getMyUnitEventsBySemester(semesterId, unitId) {
  const sid = semesterId ? String(semesterId).trim() : ''
  const uid = unitId ? String(unitId).trim() : ''
  const accessToken = getStoredAuthSession()?.accessToken || ''

  if (!sid || !uid) {
    return []
  }

  const response = await apiRequest(`/unit-events/my?semesterId=${sid}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Unit-Id': uid,
    },
    ...(accessToken ? { authToken: accessToken } : {}),
  })

  return Array.isArray(response) ? response : []
}

export async function getMyUnitEventById(semesterId, unitId, taskId) {
  const tid = taskId ? String(taskId).trim() : ''
  if (!tid) {
    return null
  }

  const events = await getMyUnitEventsBySemester(semesterId, unitId)
  return events.find((item) => String(item?.id || '') === tid) || null
}

export async function getUnitEventSubmissionByEventId(unitEventId, unitId) {
  const eventId = unitEventId ? String(unitEventId).trim() : ''
  const uid = unitId ? String(unitId).trim() : ''
  const accessToken = getStoredAuthSession()?.accessToken || ''

  if (!eventId || !uid) {
    return null
  }

  return apiRequest(`/unit-event-submissions/HTTT?unit_event_id=${eventId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-Unit-Id': uid,
    },
    ...(accessToken ? { authToken: accessToken } : {}),
  })
}

export async function updateUnitEventSubmissionByEventId(unitEventId, unitId, payload) {
  const eventId = unitEventId ? String(unitEventId).trim() : ''
  const uid = unitId ? String(unitId).trim() : ''
  const accessToken = getStoredAuthSession()?.accessToken || ''

  if (!eventId || !uid) {
    return null
  }

  return apiRequest(`/unit-event-submissions/HTTT?unit_event_id=${eventId}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Unit-Id': uid,
    },
    body: JSON.stringify({
      content: payload?.content || '',
      evidenceUrl: payload?.evidenceUrl || '',
    }),
    ...(accessToken ? { authToken: accessToken } : {}),
  })
}

export async function createUnitEventSubmission(unitEventId, unitId, payload) {
  const eventId = unitEventId ? String(unitEventId).trim() : ''
  const uid = unitId ? String(unitId).trim() : ''
  const accessToken = getStoredAuthSession()?.accessToken || ''

  if (!eventId || !uid) {
    return null
  }

  return apiRequest('/unit-event-submissions/HTTT', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Unit-Id': uid,
    },
    body: JSON.stringify({
      unitEventId: eventId,
      unitId: uid,
      content: payload?.content || '',
      evidenceUrl: payload?.evidenceUrl || '',
    }),
    ...(accessToken ? { authToken: accessToken } : {}),
  })
}
