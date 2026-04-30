import DetailHTSKManual from './DetailHTSKManual'
import DetailHTSKStudentRegistration from './DetailHTSKStudentRegistration'

export default function DetailHTSK(props) {
  if (props?.data?.is_student_registration) {
    return <DetailHTSKStudentRegistration {...props} />
  }
  return <DetailHTSKManual {...props} />
}
