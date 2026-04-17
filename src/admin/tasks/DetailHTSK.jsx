import styles from './detailCommon.module.css'

export default function DetailHTSK({ data, semesterDisplay }) {
  return (
    <section className={`page-card ${styles.card}`}>
      <h1 className={styles.title}>{data?.title || ''}</h1>
      <p className={styles.paragraph}>{data?.description || ''}</p>
      <p className={styles.line}>
        <strong>Điểm:</strong> {data?.point ?? 0}
      </p>
      <p className={styles.line}>
        <strong>Học kỳ:</strong> {semesterDisplay}
      </p>
    </section>
  )
}
