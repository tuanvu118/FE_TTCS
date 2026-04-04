import ForbiddenPage from '../page/ForbiddenPage'
import NotFoundPage from '../page/NotFoundPage'
import AdminPage from './users/AdminPage'
import EventPage from './events/EventPage'
import SemestersPage from './semesters/SemestersPage'
import UnitsPage from './UnitsPage'
import {
  hasManageAccess,
  MANAGE_ADMIN_PANELS,
  getManageRoleForUnit,
  USER_ROLES,
} from '../utils/routes'
import { parseAdminPath } from './adminPaths'
import routerStyles from './adminRouter.module.css'

export default function AdminRouter({
  pathname,
  search,
  navigate,
  user,
  roleLabel,
  accessToken,
  onSessionExpired,
}) {
  const { unitId: adminUnitId, panel: adminPanelRaw } = parseAdminPath(pathname)
  const canAccessManage = hasManageAccess(user)
  const scopedRole = getManageRoleForUnit(user, adminUnitId)
  const defaultPanelForRole =
    scopedRole === USER_ROLES.staff ? 'members' : MANAGE_ADMIN_PANELS.users
  const adminPanel = adminPanelRaw || defaultPanelForRole

  const staffPanels = new Set(['members', 'reports', 'tasks'])
  const adminPanels = new Set([
    MANAGE_ADMIN_PANELS.users,
    MANAGE_ADMIN_PANELS.units,
    MANAGE_ADMIN_PANELS.events,
    MANAGE_ADMIN_PANELS.semesters,
  ])

  if (!canAccessManage) {
    return <ForbiddenPage requiredRoleLabel="Admin, Manager hoặc Staff" />
  }

  if (!adminUnitId) {
    return (
      <section className={`page-card ${routerStyles.pickUnitCard}`}>
        <h1>Vui lòng chọn đơn vị để bắt đầu quản trị</h1>
      </section>
    )
  }

  if (scopedRole === USER_ROLES.staff) {
    if (!staffPanels.has(adminPanel)) {
      return <NotFoundPage />
    }
    return (
      <UnitsPage
        accessToken={accessToken}
        role={scopedRole}
        roleLabel={roleLabel}
        user={user}
        navigate={navigate}
        search={`?unit=${adminUnitId}`}
        onSessionExpired={onSessionExpired}
        mode="staff-manage"
        staffPanel={adminPanel === 'tasks' ? 'events' : adminPanel}
      />
    )
  }

  if (scopedRole === USER_ROLES.admin || scopedRole === USER_ROLES.manager) {
    if (!adminPanels.has(adminPanel)) {
      return <NotFoundPage />
    }
    if (adminPanel === MANAGE_ADMIN_PANELS.users) {
      return (
        <AdminPage
          accessToken={accessToken}
          roleLabel={roleLabel}
          role={scopedRole}
          user={user}
          onSessionExpired={onSessionExpired}
        />
      )
    }
    if (adminPanel === MANAGE_ADMIN_PANELS.units) {
      return (
        <UnitsPage
          accessToken={accessToken}
          role={scopedRole}
          roleLabel={roleLabel}
          user={user}
          navigate={navigate}
          search={search}
          onSessionExpired={onSessionExpired}
          mode="admin-manage"
        />
      )
    }
    if (adminPanel === MANAGE_ADMIN_PANELS.events) {
      return <EventPage />
    }
    return (
      <SemestersPage
        accessToken={accessToken}
        role={scopedRole}
        roleLabel={roleLabel}
        onSessionExpired={onSessionExpired}
      />
    )
  }

  return <ForbiddenPage requiredRoleLabel="Admin hoặc Manager tại đơn vị đã chọn" />
}
