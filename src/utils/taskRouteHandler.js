import { message } from 'antd'
import { getStoredAuthSession } from '../service/authSession'
import { getStoredCurrentSemester } from './currentSemesterStorage'
import { getMyUnitEventById } from '../service/taskService'
import { USER_ROLES } from './routes'

function getManagedUnitIds(tokenClaims) {
  const roleEntries = Array.isArray(tokenClaims?.roles) ? tokenClaims.roles : []
  return roleEntries
    .filter((entry) => entry?.unit_id)
    .filter((entry) => {
      const roles = Array.isArray(entry.roles) ? entry.roles : []
      return roles.some((role) => String(role).toUpperCase() !== 'USER')
    })
    .map((entry) => String(entry.unit_id))
}

function hasAnyStaffRole(tokenClaims) {
  const roleEntries = Array.isArray(tokenClaims?.roles) ? tokenClaims.roles : []
  return roleEntries.some((entry) => {
    const roles = Array.isArray(entry?.roles) ? entry.roles : []
    return roles.some((role) => String(role).toUpperCase() === 'STAFF')
  })
}

export async function handleTaskRouteAuthView(taskId, navigate) {
  if (!taskId || typeof navigate !== 'function') {
    return
  }

  const session = getStoredAuthSession()
  const accessToken = session?.accessToken || ''
  const tokenRole = session?.tokenRole

  if (!accessToken) {
    return
  }

  const canAccessAsStaff =
    tokenRole === USER_ROLES.staff || hasAnyStaffRole(session?.tokenClaims)

  if (!canAccessAsStaff) {
    message.error('Bạn không có quyền.')
    return
  }

  try {
    const currentSemester = getStoredCurrentSemester()
    const semesterId = currentSemester?.id
    const managedUnitIds = getManagedUnitIds(session?.tokenClaims)
    console.log('Danh sách đơn vị người dùng quản lý:', managedUnitIds)

    if (!semesterId || managedUnitIds.length === 0) {
      message.error('Đơn vị của bạn không được giao nhiệm vụ HTTT này.')
      return
    }

    const matchChecks = await Promise.all(
      managedUnitIds.map(async (unitId) => {
        const eventData = await getMyUnitEventById(semesterId, unitId, taskId)
        return eventData ? { unitId, eventData } : null
      }),
    )
    const matched = matchChecks.find(Boolean)
    const matchedUnitId = matched?.unitId || ''
    const assignedUnitIds = matchedUnitId ? [matchedUnitId] : []
    console.log('Danh sách đơn vị được giao:', assignedUnitIds)

    if (!matchedUnitId) {
      message.error('Đơn vị của bạn không được giao nhiệm vụ HTTT này.')
      return
    }

    console.log('Task ID:', taskId)
    navigate(`/staff/${matchedUnitId}/tasks/${taskId}`)
  } catch (error) {
    message.error(error?.message || 'Không thể kiểm tra nhiệm vụ được giao.')
  }
}
