import AdminShell from './components/AdminShell'
import TopNav from './components/TopNav'
import { useAuth } from './hooks/useAuth'
import { useRouter } from './hooks/useRouter'
import AdminPage from './page/AdminPage'
import AboutPage from './page/AboutPage'
import ClubDetailPage from './page/ClubDetailPage'
import ClubPage from './page/ClubPage'
import EventDetailPage from './page/EventDetailPage'
import EventPage from './page/EventPage'
import ForbiddenPage from './page/ForbiddenPage'
import HomePage from './page/HomePage'
import LoginPage from './page/LoginPage'
import LogoutPage from './page/LogoutPage'
import NotFoundPage from './page/NotFoundPage'
import ProfilePage from './page/ProfilePage'
import QrScanPage from './page/QrScanPage'
import RegisterPage from './page/RegisterPage'
import SemestersPage from './page/SemestersPage'
import UnitDetailPage from './page/UnitDetailPage'
import UnitsPage from './page/UnitsPage'
import {
  hasManageAccess,
  MANAGE_ADMIN_PANELS,
  PATHS,
  getClubUnitIdFromPath,
  getManageRoleForUnit,
  USER_ROLES,
} from './utils/routes'

function App() {
  const { pathname, search, navigate, replace } = useRouter()
  const {
    user,
    role,
    roleLabel,
    dashboardPath,
    accessToken,
    isAuthenticated,
    isLoadingUser,
    login,
    logout,
    refreshUser,
  } = useAuth()

  function handleSessionExpired() {
    logout({ skipServer: true })
    replace(PATHS.login)
  }

  const clubUnitId = getClubUnitIdFromPath(pathname)
  const eventIdMatched = pathname.match(/^\/events\/([^/]+)$/)
  const eventId = eventIdMatched?.[1] || ''
  const unitIdMatched = pathname.match(/^\/units\/([^/]+)$/)
  const unitId = unitIdMatched?.[1] || ''
  const adminMatched = pathname.match(/^\/admin(?:\/([^/]+)(?:\/([^/]+))?)?$/)
  const adminUnitId = adminMatched?.[1] || ''
  const adminPanelRaw = adminMatched?.[2] || ''
  const isAdminArea = pathname === PATHS.admin || Boolean(adminMatched?.[0])
  const isAdminLayout = isAuthenticated && (pathname === PATHS.register || isAdminArea)

  let page = <NotFoundPage />

  const requiresAuthPaths = new Set([PATHS.profile, PATHS.register, PATHS.logout, PATHS.qrScan])
  const mustCheckAuth = requiresAuthPaths.has(pathname) || isAdminArea || Boolean(unitId)

  if (mustCheckAuth && !isAuthenticated) {
    page = <LoginPage onLogin={login} navigate={navigate} />
  } else if (mustCheckAuth && isLoadingUser) {
    page = <section className="page-card">Đang tải thông tin người dùng...</section>
  } else if (pathname === PATHS.home) {
    page = <HomePage />
  } else if (pathname === '/event') {
    page = <EventPage />
  } else if (pathname === PATHS.event) {
    page = <EventPage />
  } else if (eventId) {
    page = <EventDetailPage eventId={eventId} />
  } else if (pathname === PATHS.qrScan) {
    page = <QrScanPage />
  } else if (pathname === PATHS.about) {
    page = <AboutPage />
  } else if (pathname === PATHS.club) {
    page = <ClubPage navigate={navigate} search={search} />
  } else if (clubUnitId) {
    page = <ClubDetailPage unitId={clubUnitId} navigate={navigate} />
  } else if (pathname === PATHS.login) {
    page = (
      <LoginPage
        isAuthenticated={isAuthenticated}
        user={user}
        onLogin={login}
        navigate={navigate}
      />
    )
  } else if (pathname === PATHS.register) {
    if (role !== USER_ROLES.admin && role !== USER_ROLES.manager) {
      page = <ForbiddenPage requiredRoleLabel="Admin hoặc Manager" />
    } else {
      page = (
        <RegisterPage
          accessToken={accessToken}
          roleLabel={roleLabel}
          role={role}
          onSessionExpired={handleSessionExpired}
        />
      )
    }
  } else if (pathname === PATHS.profile) {
    page = (
      <ProfilePage
        accessToken={accessToken}
        roleLabel={roleLabel}
        onProfileUpdated={refreshUser}
        onSessionExpired={handleSessionExpired}
        navigate={navigate}
      />
    )
  } else if (pathname === PATHS.admin || isAdminArea) {
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
      page = <ForbiddenPage requiredRoleLabel="Admin, Manager hoặc Staff" />
    } else if (!adminUnitId) {
      page = (
        <section className="page-card">
          <h1>Vui lòng chọn đơn vị để bắt đầu quản trị</h1>
        </section>
      )
    } else if (scopedRole === USER_ROLES.staff) {
      if (!staffPanels.has(adminPanel)) {
        page = <NotFoundPage />
      } else {
        page = (
          <UnitsPage
            accessToken={accessToken}
            role={scopedRole}
            roleLabel={roleLabel}
            user={user}
            navigate={navigate}
            search={`?unit=${adminUnitId}`}
            onSessionExpired={handleSessionExpired}
            mode="staff-manage"
            staffPanel={adminPanel === 'tasks' ? 'events' : adminPanel}
          />
        )
      }
    } else if (scopedRole === USER_ROLES.admin || scopedRole === USER_ROLES.manager) {
      if (!adminPanels.has(adminPanel)) {
        page = <NotFoundPage />
      } else if (adminPanel === MANAGE_ADMIN_PANELS.users) {
        page = (
          <AdminPage
            accessToken={accessToken}
            roleLabel={roleLabel}
            role={scopedRole}
            user={user}
            onSessionExpired={handleSessionExpired}
          />
        )
      } else if (adminPanel === MANAGE_ADMIN_PANELS.units) {
        page = (
          <UnitsPage
            accessToken={accessToken}
            role={scopedRole}
            roleLabel={roleLabel}
            user={user}
            navigate={navigate}
            search={search}
            onSessionExpired={handleSessionExpired}
            mode="admin-manage"
          />
        )
      } else if (adminPanel === MANAGE_ADMIN_PANELS.events) {
        page = <EventPage />
      } else {
        page = (
          <SemestersPage
            accessToken={accessToken}
            role={scopedRole}
            roleLabel={roleLabel}
            onSessionExpired={handleSessionExpired}
          />
        )
      }
    } else {
      page = <ForbiddenPage requiredRoleLabel="Admin hoặc Manager tại đơn vị đã chọn" />
    }
  } else if (unitId) {
    if (role !== USER_ROLES.admin && role !== USER_ROLES.manager && role !== USER_ROLES.staff) {
      page = <ForbiddenPage requiredRoleLabel="Admin, Manager hoặc Staff" />
    } else {
      page = (
        <UnitDetailPage
          unitId={unitId}
          accessToken={accessToken}
          role={role}
          roleLabel={roleLabel}
          user={user}
          navigate={navigate}
          onSessionExpired={handleSessionExpired}
        />
      )
    }
  } else if (pathname === PATHS.logout) {
    page = <LogoutPage onLogout={logout} replace={replace} />
  } else {
    page = <NotFoundPage />
  }

  return (
    <div className="app-shell">
      <TopNav
        currentPath={pathname}
        isAuthenticated={isAuthenticated}
        dashboardPath={dashboardPath}
        navigate={navigate}
      />
      {isAdminLayout ? (
        <AdminShell
          currentPath={pathname}
          user={user}
          role={role}
          accessToken={accessToken}
          search={search}
          navigate={navigate}
        >
          {page}
        </AdminShell>
      ) : (
        <main className="page-content">{page}</main>
      )}
    </div>
  )
}

export default App
