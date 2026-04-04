import TopNav from './components/TopNav'
import { useAuth } from './hooks/useAuth'
import { useRouter } from './hooks/useRouter'
import AdminLayout from './admin/AdminLayout'
import AdminRouter from './admin/AdminRouter'
import { isAdminPath } from './admin/adminPaths'
import AboutPage from './page/AboutPage'
import ClubDetailPage from './page/ClubDetailPage'
import ClubPage from './page/ClubPage'
import EventDetailPage from './page/EventDetailPage'
import EventsPage from './page/EventsPage'
import ForbiddenPage from './page/ForbiddenPage'
import HomePage from './page/HomePage'
import LoginPage from './page/LoginPage'
import LogoutPage from './page/LogoutPage'
import NotFoundPage from './page/NotFoundPage'
import ProfilePage from './page/ProfilePage'
import QrScanPage from './page/QrScanPage'
import UnitDetailPage from './page/UnitDetailPage'
import { PATHS, getClubUnitIdFromPath, USER_ROLES } from './utils/routes'

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
  const isAdminArea = isAdminPath(pathname)
  const isAdminLayout = isAuthenticated && isAdminArea

  let page = <NotFoundPage />

  const requiresAuthPaths = new Set([PATHS.profile, PATHS.logout, PATHS.qrScan])
  const mustCheckAuth = requiresAuthPaths.has(pathname) || isAdminArea || Boolean(unitId)

  if (mustCheckAuth && !isAuthenticated) {
    page = <LoginPage onLogin={login} navigate={navigate} />
  } else if (mustCheckAuth && isLoadingUser) {
    page = <section className="page-card">Đang tải thông tin người dùng...</section>
  } else if (pathname === PATHS.home) {
    page = <HomePage />
  } else if (pathname === PATHS.event) {
    page = <EventsPage />
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
  } else if (isAdminArea) {
    page = (
      <AdminRouter
        navigate={navigate}
        user={user}
        roleLabel={roleLabel}
        accessToken={accessToken}
        onSessionExpired={handleSessionExpired}
      />
    )
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
    <div className={`app-shell${isAdminLayout ? ' app-shell--admin' : ''}`}>
      <TopNav
        currentPath={pathname}
        isAuthenticated={isAuthenticated}
        dashboardPath={dashboardPath}
        navigate={navigate}
      />
      {isAdminLayout ? (
        <AdminLayout currentPath={pathname} navigate={navigate} user={user} accessToken={accessToken}>
          {page}
        </AdminLayout>
      ) : (
        <main className="page-content">{page}</main>
      )}
    </div>
  )
}

export default App
