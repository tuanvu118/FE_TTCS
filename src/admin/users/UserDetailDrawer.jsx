import { createPortal } from 'react-dom'
import UserAvatar from '../../components/users/UserAvatar'
import UserRoleList from '../../components/users/UserRoleList'
import { USER_ROLES } from '../../utils/routes'
import { formatDateOfBirth } from '../../utils/userUtils'
import styles from './adminUsers.module.css'
import UserRoleManagementSection from './UserRoleManagementSection'
import UserPointsSummarySection from './UserPointsSummarySection'

function UserDetailDrawer({
  isOpen,
  isLoading,
  user,
  assignments,
  catalog,
  unitNames,
  role,

  accessToken,
  canEdit,
  onClose,
  onEdit,
  onApiError,
  onRoleChanged,
}) {

  if (!isOpen) {
    return null
  }

  const isAdmin = role === USER_ROLES.admin

  return createPortal(
    <div className={styles.drawerBackdrop} role="presentation" onClick={onClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.drawerHeader}>
          <h2 id="user-detail-title">Chi tiết người dùng</h2>
          <button
            type="button"
            className="notification-popup-close"
            aria-label="Đóng chi tiết người dùng"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles.drawerBody}>
          {isLoading ? (
            <div className={styles.skeletonWrapper}>
              <div className={styles.skeletonHero}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonTextGroup}>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonSubtitle} />
                </div>
              </div>
              <div className={styles.skeletonGrid}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={styles.skeletonField}>
                    <div className={styles.skeletonLabel} />
                    <div className={styles.skeletonValue} />
                  </div>
                ))}
              </div>
              <div className={styles.skeletonSection}>
                <div className={styles.skeletonLabel} />
                <div className={styles.skeletonList} />
              </div>
            </div>
          ) : user ? (

          <div className={styles.detailContent}>
            <div className={styles.detailHero}>
              <div className={styles.detailHeroInfo}>
                <UserAvatar avatarUrl={user.avatar_url} fullName={user.full_name} size="large" />
                <div>
                  <h3>{user.full_name || 'Chưa cập nhật'}</h3>
                  <p>{user.email || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {canEdit && (
                <button
                  type="button"
                  className={`primary-button ${styles.detailEditButton}`}
                  onClick={onEdit}
                >
                  Chỉnh sửa người dùng
                </button>
              )}
            </div>

            <div className={styles.detailGrid}>
              <div>
                <span>Mã sinh viên</span>
                <strong>{user.student_id || 'Chưa cập nhật'}</strong>
              </div>
              <div>
                <span>Lớp</span>
                <strong>{user.class_name || 'Chưa cập nhật'}</strong>
              </div>
              <div>
                <span>Ngày sinh</span>
                <strong>{formatDateOfBirth(user.date_of_birth)}</strong>
              </div>
              <div>
                <span>Trạng thái</span>
                <strong>{user.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}</strong>
              </div>
              {/* Điểm rèn luyện summary section - Now part of the grid */}
              <UserPointsSummarySection 
                key={user.id}
                userId={user.id} 
                accessToken={accessToken} 
                onApiError={onApiError} 
              />
            </div>

            <div className={styles.roleSection}>
              <h4>Quyền đơn vị</h4>
              <UserRoleList roles={user.roles} unitNameMap={unitNames} />
            </div>

            {isAdmin && user.id && (
              <UserRoleManagementSection
                userId={user.id}
                accessToken={accessToken}
                initialAssignments={assignments}
                catalogData={catalog}
                unitNameMap={unitNames}
                onError={onApiError}
                onRoleChanged={onRoleChanged}

              />
            )}

          </div>
        ) : (
          <p className={styles.mutedCopy}>Không tìm thấy người dùng.</p>
        )}
        </div>
      </aside>

    </div>,
    document.body,
  )
}

export default UserDetailDrawer
