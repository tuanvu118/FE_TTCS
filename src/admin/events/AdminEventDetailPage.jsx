import styles from './adminEventDetail.module.css'
import EventPublicDetail from './EventPublicDetail'
import EventUnitDetail from './EventUnitDetail'

export default function AdminEventDetailPage({ adminUnitId, eventId, eventScope }) {
  const scopeLabel = eventScope === 'p' ? 'Sự kiện public' : 'Sự kiện đẩy xuống đơn vị (HTSK/HTTT)'
  return (
    <section className="page-card">
      <h1>Chi tiết sự kiện</h1>
      <p>Bạn đang xem sự kiện có id là {eventId}</p>
      <p>Sự kiện này thuộc loại {scopeLabel}</p>

      {eventScope === 'p' && <EventPublicDetail eventId={eventId} />}
      {eventScope === 'u' && <EventUnitDetail eventId={eventId} />}
      
 
    </section>
  )
}