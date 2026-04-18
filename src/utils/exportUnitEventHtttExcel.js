import * as XLSX from 'xlsx'

function stringifyCell(value) {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  try {
    return JSON.stringify(value)
  } catch {
    return '[Không thể chuyển thành chuỗi]'
  }
}

function buildMetaAoA(data, context) {
  const rows = [
    ['THÔNG TIN YÊU CẦU HTTT'],
    ['Trường', 'Giá trị'],
  ]
  if (data && typeof data === 'object') {
    const metaRows = [
      ['id', stringifyCell(data.id)],
      ['title', stringifyCell(data.title)],
      ['description', stringifyCell(data.description)],
      ['point', stringifyCell(data.point)],
      ['created_at', stringifyCell(data.created_at ?? data.createdAt)],
    ]
    for (const row of metaRows) {
      rows.push(row)
    }
  } else {
    rows.push(['(không có dữ liệu sự kiện)', ''])
  }
  if (context.semesterLabel) {
    rows.push(['Học kỳ', context.semesterLabel])
  }
  return rows
}



function buildCooperationAoA(cooperationRows) {
  const header = [
    'STT',
    'unit_id',
    'unit_name',
    'unit_type',
    'unit_logo',
    'unit_introduction',
    'has_submission',
    'status_normalized',
    'status_label_vi',
    'submission_id',
    'submission_status_raw',
    'submission_content',
    'submission_evidence_url',
    'submission_submitted_at',
    'submission_json_full',
  ]
  const body = (cooperationRows || []).map((row, index) => {
    const sub = row.submission
    const sid = row.submissionId || ''
    return [
      index + 1,
      row.unitId,
      row.unit?.name ?? '',
      row.unit?.type ?? '',
      row.unit?.logo ?? '',
      row.unit?.introduction ?? '',
      row.hasSubmission ? 'Có' : 'Không',
      row.status,
      row.statusLabel,
      sid,
      sub?.status ?? '',
      sub?.content ?? '',
      sub?.evidenceUrl ?? sub?.evidence_url ?? '',
      sub ? stringifyCell(sub.submittedAt ?? sub.submitted_at) : '',
      sub ? stringifyCell(sub) : '',
    ]
  })
  return [header, ...body]
}

/**
 * Xuất 2 sheet: (1) toàn bộ object yêu cầu HTTT dạng key–value, (2) đơn vị phối hợp + trạng thái + submission.
 */
export function downloadUnitEventHtttExcel({
  data,
  cooperationRows,
  routeUnitId,
  routeEventId,
  semesterLabel,
}) {
  const wb = XLSX.utils.book_new()

  const wsMeta = XLSX.utils.aoa_to_sheet(
    buildMetaAoA(data, { routeUnitId, routeEventId, semesterLabel }),
  )
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Thong tin HTTT')

  const wsCoop = XLSX.utils.aoa_to_sheet(buildCooperationAoA(cooperationRows))
  XLSX.utils.book_append_sheet(wb, wsCoop, 'Don vi phoi hop')

  const rawTitle = data?.title || 'HTTT'
  const safeTitle = String(rawTitle).replace(/[\\/:*?"<>|]/g, '_').trim().slice(0, 80) || 'HTTT'
  const idSuffix = routeEventId ? `_${String(routeEventId)}` : ''
  XLSX.writeFile(wb, `${safeTitle}${idSuffix}.xlsx`)
}
