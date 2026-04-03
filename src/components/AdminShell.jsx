import {
  Buildings,
  CalendarBlank,
  CalendarDots,
  CaretDown,
  ChartBar,
  Users,
  UsersThree,
} from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getManagedUnits, getUnitById } from '../service/unitService'
import { formatUnitType } from '../utils/unitUtils'
import {
  MANAGE_ADMIN_PANELS,
  PATHS,
  USER_ROLES,
  getManageOptionsFromUser,
  getManageRoleForUnit,
} from '../utils/routes'

function unitTypePrefixLabel(type) {
  if (!type || typeof type !== 'string') {
    return ''
  }

  return formatUnitType(type.trim().toUpperCase())
}

function manageRoleOptionLabel(role) {
  if (role === USER_ROLES.admin) {
    return 'Quản trị'
  }

  if (role === USER_ROLES.manager) {
    return 'Thành viên'
  }

  if (role === USER_ROLES.staff) {
    return 'Quản lý đơn vị'
  }

  return role || ''
}

const FETCH_LIMIT = 100

const DEFAULT_UNIT_LOGO = '/HuyHieuDoan.png'

const actionIconSize = 20

function unitLogoSrc(unitId, unitLogoById, manageableUnits) {
  if (!unitId) {
    return DEFAULT_UNIT_LOGO
  }

  const fromList = manageableUnits.find((u) => u.id === unitId)?.logo?.trim() || ''
  const hasDetail = Object.prototype.hasOwnProperty.call(unitLogoById, unitId)
  const fromDetail = hasDetail ? (unitLogoById[unitId] || '').trim() : null

  if (fromDetail) {
    return fromDetail
  }

  if (hasDetail) {
    return fromList || DEFAULT_UNIT_LOGO
  }

  return fromList || DEFAULT_UNIT_LOGO
}

function buildStaffPath(unitId, panel = 'members') {
  if (!unitId) {
    return PATHS.admin
  }

  return `${PATHS.admin}/${unitId}/${panel}`
}

function buildAdminPath(unitId, panel = MANAGE_ADMIN_PANELS.users) {
  if (!unitId) {
    return PATHS.admin
  }

  return `${PATHS.admin}/${unitId}/${panel}`
}

function parseAdminPath(pathname = '') {
  const matched = pathname.match(/^\/admin(?:\/([^/]+)(?:\/([^/]+))?)?$/)
  return {
    unitId: matched?.[1] || '',
    panel: matched?.[2] || '',
  }
}

function AdminShell({
  currentPath,
  navigate,
  user,
  accessToken,
  children,
}) {
  const [manageableUnits, setManageableUnits] = useState([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)
  const [unitLogoById, setUnitLogoById] = useState({})
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const unitSelectorRef = useRef(null)
  const manageOptions = useMemo(() => getManageOptionsFromUser(user), [user])
  const managedUnitIdsKey = useMemo(() => {
    const ids = [...new Set(manageOptions.map((o) => o.unitId))].filter(Boolean)
    ids.sort()
    return ids.join('|')
  }, [manageOptions])
  const { unitId: selectedUnitId, panel: selectedPanelRaw } = parseAdminPath(currentPath)
  const selectedUnitRole = getManageRoleForUnit(user, selectedUnitId)
  const selectedPanel =
    selectedPanelRaw || (selectedUnitRole === USER_ROLES.staff ? 'members' : MANAGE_ADMIN_PANELS.users)
  const selectedUnit = manageableUnits.find((unitItem) => unitItem.id === selectedUnitId)
  const canRenderSidebar = Boolean(selectedUnitId && selectedUnitRole)
  const isStaffSelected = selectedUnitRole === USER_ROLES.staff

  useEffect(() => {
    if (!accessToken) {
      setManageableUnits([])
      return
    }

    let isCancelled = false

    async function loadUnits() {
      setIsLoadingUnits(true)

      try {
        const firstResponse = await getManagedUnits({ skip: 0, limit: FETCH_LIMIT }, accessToken)
        const items = [...firstResponse.items]

        let loaded = items.length
        while (loaded < firstResponse.total) {
          const nextResponse = await getManagedUnits({ skip: loaded, limit: FETCH_LIMIT }, accessToken)

          if (!nextResponse.items.length) {
            break
          }

          items.push(...nextResponse.items)
          loaded += nextResponse.items.length
        }

        if (!isCancelled) {
          const allowedUnitIds = new Set(manageOptions.map((optionItem) => optionItem.unitId))
          setManageableUnits(items.filter((item) => allowedUnitIds.has(item.id)))
        }
      } catch {
        if (!isCancelled) {
          setManageableUnits([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingUnits(false)
        }
      }
    }

    loadUnits()

    return () => {
      isCancelled = true
    }
  }, [accessToken, manageOptions])

  useEffect(() => {
    if (!accessToken || !managedUnitIdsKey) {
      setUnitLogoById({})
      return
    }

    const ids = managedUnitIdsKey.split('|').filter(Boolean)
    let isCancelled = false

    async function loadLogos() {
      const entries = await Promise.all(
        ids.map(async (unitId) => {
          try {
            const unit = await getUnitById(unitId, accessToken)
            return [unitId, unit.logo || '']
          } catch {
            return [unitId, '']
          }
        }),
      )

      if (!isCancelled) {
        setUnitLogoById(Object.fromEntries(entries))
      }
    }

    loadLogos()

    return () => {
      isCancelled = true
    }
  }, [accessToken, managedUnitIdsKey])

  useEffect(() => {
    if (!manageOptions.length || !manageableUnits.length) {
      return
    }

    if (currentPath === PATHS.admin) {
      const defaultOption = manageOptions[0]
      if (defaultOption.role === USER_ROLES.staff) {
        navigate(buildStaffPath(defaultOption.unitId, 'members'))
      } else {
        navigate(buildAdminPath(defaultOption.unitId, MANAGE_ADMIN_PANELS.users))
      }
      return
    }

    const selectedOption = manageOptions.find((optionItem) => optionItem.unitId === selectedUnitId)
    if (!selectedOption) {
      const defaultOption = manageOptions[0]
      if (defaultOption.role === USER_ROLES.staff) {
        navigate(buildStaffPath(defaultOption.unitId, 'members'))
      } else {
        navigate(buildAdminPath(defaultOption.unitId, MANAGE_ADMIN_PANELS.users))
      }
    }
  }, [currentPath, manageOptions, manageableUnits, navigate, selectedUnitId])

  useEffect(() => {
    if (!isDropdownOpen) {
      return
    }

    function handlePointerDown(event) {
      if (unitSelectorRef.current && !unitSelectorRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isDropdownOpen])

  function handleSelectUnit(optionItem) {
    if (optionItem.role === USER_ROLES.staff) {
      navigate(buildStaffPath(optionItem.unitId, 'members'))
    } else {
      navigate(buildAdminPath(optionItem.unitId, MANAGE_ADMIN_PANELS.users))
    }
    setIsDropdownOpen(false)
  }

  const staffActions = [
    { key: 'members', label: 'Quản lý thành viên', Icon: UsersThree },
    { key: 'reports', label: 'Quản lý báo cáo', Icon: ChartBar },
    { key: 'tasks', label: 'Quản lý sự kiện được giao', Icon: CalendarBlank },
  ]

  const adminActions = [
    { panel: MANAGE_ADMIN_PANELS.users, label: 'Quản lý người dùng', Icon: Users },
    { panel: MANAGE_ADMIN_PANELS.units, label: 'Quản lý đơn vị', Icon: Buildings },
    { panel: MANAGE_ADMIN_PANELS.semesters, label: 'Quản lý học kì', Icon: CalendarDots },
    { panel: MANAGE_ADMIN_PANELS.events, label: 'Quản lý sự kiện', Icon: CalendarBlank },
  ]

  return (
    <section className="admin-shell">
      <aside className="admin-shell-sidebar">
        <section className="admin-shell-unit-selector" ref={unitSelectorRef}>
          <button
            type="button"
            className="admin-shell-unit-selector-button"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            onClick={() => setIsDropdownOpen((currentValue) => !currentValue)}
          >
            <span className="admin-shell-unit-selector-inner">
              <img
                className="admin-shell-unit-logo"
                src={unitLogoSrc(selectedUnitId, unitLogoById, manageableUnits)}
                alt=""
                decoding="async"
                onError={(event) => {
                  event.currentTarget.onerror = null
                  event.currentTarget.src = DEFAULT_UNIT_LOGO
                }}
              />
              <div className="admin-shell-unit-selector-text">
                <strong className="admin-shell-unit-name-line">
                  {selectedUnit?.type ? (
                    <span className="admin-shell-unit-type-prefix">{unitTypePrefixLabel(selectedUnit.type)}</span>
                  ) : null}
                  <span className="admin-shell-unit-name-core">
                    {selectedUnit?.name || 'Chọn đơn vị quản trị'}
                  </span>
                </strong>
                <span>
                  {selectedUnitRole === USER_ROLES.staff
                    ? 'Quản lý đơn vị'
                    : selectedUnitRole === USER_ROLES.manager
                      ? 'Văn phòng Đoàn'
                      : selectedUnitRole === USER_ROLES.admin
                        ? 'Quản trị viên'
                        : 'Vui lòng chọn đơn vị'}
                </span>
              </div>
            </span>
            <span className={isDropdownOpen ? 'admin-shell-dropdown-arrow open' : 'admin-shell-dropdown-arrow'}>
              <CaretDown size={18} weight="bold" aria-hidden />
            </span>
          </button>

          {isDropdownOpen && (
            <div className="admin-shell-unit-dropdown">
              {isLoadingUnits ? (
                <p>Đang tải đơn vị...</p>
              ) : (
                manageOptions.map((optionItem) => {
                  const unitItem = manageableUnits.find((managed) => managed.id === optionItem.unitId)
                  return (
                    <button
                      key={`${optionItem.unitId}-${optionItem.role}`}
                      type="button"
                      className={
                        optionItem.unitId === selectedUnitId
                          ? 'admin-shell-unit-option active'
                          : 'admin-shell-unit-option'
                      }
                      onClick={() => handleSelectUnit(optionItem)}
                    >
                      <img
                        className="admin-shell-unit-logo admin-shell-unit-logo--dropdown"
                        src={unitLogoSrc(optionItem.unitId, unitLogoById, manageableUnits)}
                        alt=""
                        decoding="async"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null
                          event.currentTarget.src = DEFAULT_UNIT_LOGO
                        }}
                      />
                      <div className="admin-shell-unit-option-text">
                        <strong className="admin-shell-unit-name-line">
                          {unitItem?.type ? (
                            <span className="admin-shell-unit-type-prefix">
                              {unitTypePrefixLabel(unitItem.type)}
                            </span>
                          ) : null}
                          <span className="admin-shell-unit-name-core">
                            {unitItem?.name || optionItem.unitId}
                          </span>
                        </strong>
                        <span>{manageRoleOptionLabel(optionItem.role)}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </section>

        {canRenderSidebar && (
          <nav className="admin-shell-action-list" aria-label="Điều hướng quản trị">
            {isStaffSelected
              ? staffActions.map((actionItem) => {
                  const ActionIcon = actionItem.Icon
                  return (
                    <button
                      key={actionItem.key}
                      type="button"
                      className={
                        selectedPanel === actionItem.key
                          ? 'admin-shell-action-button active'
                          : 'admin-shell-action-button'
                      }
                      onClick={() => navigate(buildStaffPath(selectedUnitId, actionItem.key))}
                    >
                      <ActionIcon size={actionIconSize} weight="regular" aria-hidden />
                      <span>{actionItem.label}</span>
                    </button>
                  )
                })
              : adminActions.map((actionItem) => {
                  const ActionIcon = actionItem.Icon
                  return (
                    <button
                      key={actionItem.panel}
                      type="button"
                      className={
                        currentPath.startsWith(PATHS.admin) && selectedPanel === actionItem.panel
                          ? 'admin-shell-action-button active'
                          : 'admin-shell-action-button'
                      }
                      onClick={() => navigate(buildAdminPath(selectedUnitId, actionItem.panel))}
                    >
                      <ActionIcon size={actionIconSize} weight="regular" aria-hidden />
                      <span>{actionItem.label}</span>
                    </button>
                  )
                })}
          </nav>
        )}
      </aside>

      <div className="admin-shell-content">
        <main className="admin-shell-main">{children}</main>
      </div>
    </section>
  )
}

export default AdminShell
