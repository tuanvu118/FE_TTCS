import UserManagementPage from '../components/users/UserManagementPage'

function AdminPage({ accessToken, role, roleLabel, onSessionExpired }) {
  return (
    <UserManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      pageTitle="Quản trị người dùng"
      pageDescription="ADMIN có thể xem toàn bộ user, tạo user mới, chỉnh sửa user khác và phân quyền RBAC."
      onSessionExpired={onSessionExpired}
    />
  )
}

export default AdminPage
