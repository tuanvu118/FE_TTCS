import { USER_ROLES } from './routes'

export function getRoleLabelVi(role) {
  if (role === USER_ROLES.staff) return 'Quản lý đơn vị'
  if (role === USER_ROLES.manager) return 'Văn phòng đoàn'
  if (role === USER_ROLES.admin) return 'Quản trị'
  if (role === USER_ROLES.user) return 'Thành viên'
  return role || ''
}
