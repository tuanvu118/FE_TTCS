export function getDisplayUnitName(unitName) {
  const rawName = String(unitName || '').trim()
  if (rawName.toUpperCase() === 'DEFAULT') {
    return 'Văn Phòng đoàn'
  }
  return rawName
}
