import StaffUnitsWorkspace from './members/StaffUnitsWorkspace'
import StaffReportsPanel from './reports/StaffReportsPanel'
import StaffAssignedEventsPanel from './tasks/StaffAssignedEventsPanel'
import UnitsManagementPage from './units/UnitsManagementPage'

function UnitsPage({
  accessToken,
  role,
  roleLabel,
  user,
  navigate,
  search,
  onSessionExpired,
  mode = 'admin-manage',
  staffPanel = 'members',
}) {
  if (mode === 'staff-manage') {
    const params = new URLSearchParams(search || '')
    const selectedUnitId = params.get('unit') || ''
    const activePanel = ['members', 'reports', 'events'].includes(staffPanel) ? staffPanel : 'members'

    if (activePanel === 'reports') {
      return <StaffReportsPanel />
    }

    if (activePanel === 'events') {
      return <StaffAssignedEventsPanel />
    }

    return (
      <StaffUnitsWorkspace
        accessToken={accessToken}
        selectedUnitId={selectedUnitId}
        activePanel={activePanel}
        onSessionExpired={onSessionExpired}
      />
    )
  }

  return (
    <UnitsManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      user={user}
      navigate={navigate}
      onSessionExpired={onSessionExpired}
    />
  )
}

export default UnitsPage
