import { MANAGE_ADMIN_PANELS, PATHS } from '../utils/routes'

export const ADMIN_PATH_REGEX = /^\/admin(?:\/([^/]+)(?:\/([^/]+))?)?$/

export function isAdminPath(pathname) {
  return ADMIN_PATH_REGEX.test(pathname)
}

export function parseAdminPath(pathname = '') {
  const matched = pathname.match(ADMIN_PATH_REGEX)
  return {
    unitId: matched?.[1] || '',
    panel: matched?.[2] || '',
  }
}

export function buildStaffPath(unitId, panel = 'members') {
  if (!unitId) {
    return PATHS.admin
  }
  return `${PATHS.admin}/${unitId}/${panel}`
}

export function buildAdminPath(unitId, panel = MANAGE_ADMIN_PANELS.users) {
  if (!unitId) {
    return PATHS.admin
  }
  return `${PATHS.admin}/${unitId}/${panel}`
}
