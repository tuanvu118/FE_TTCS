import { useState } from 'react'
import { Eye, EyeSlash, GoogleLogo, FacebookLogo } from '@phosphor-icons/react'
import { message } from 'antd'
import NotificationPopup from '../components/NotificationPopup'
import { PATHS } from '../utils/routes'
import styles from './LoginPage.module.css'

function LoginPage({ isAuthenticated = false, user = null, onLogin, navigate }) {
  const [form, setForm] = useState({
    studentId: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState({
    loading: false,
    error: '',
  })

  function handleChange(event) {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const getFriendlyErrorMessage = (errorMsg) => {
    if (!errorMsg) return 'Đăng nhập thất bại. Vui lòng thử lại.'
    const msg = errorMsg.toLowerCase()
    
    // Xử lý các lỗi từ Backend (cả tiếng Anh lẫn tiếng Việt không dấu)
    if (
      msg.includes('incorrect') || 
      msg.includes('invalid') || 
      msg.includes('credentials') ||
      msg.includes('thong tin dang nhap') ||
      msg.includes('khong chinh xac')
    ) {
      return 'Tài khoản hoặc mật khẩu không chính xác.'
    }
    
    if (msg.includes('inactive') || msg.includes('disabled') || msg.includes('vo hieu hoa')) {
      return 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
    }
    
    if (msg.includes('not found') || msg.includes('khong ton tai')) {
      return 'Tài khoản không tồn tại trong hệ thống.'
    }
    
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.'
    }
    
    return errorMsg
  }

  function handleForgotPassword() {
    message.info('Vui lòng liên hệ Quản trị hệ thống để được hỗ trợ cấp lại mật khẩu.')
  }



  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.studentId.trim() || !form.password.trim()) {
      setStatus({
        loading: false,
        error: 'Vui lòng nhập đầy đủ mã sinh viên và mật khẩu.',
      })
      return
    }

    setStatus({
      loading: true,
      error: '',
    })

    try {
      await onLogin(form)
      navigate(PATHS.home)
    } catch (error) {
      setStatus({
        loading: false,
        error: getFriendlyErrorMessage(error.message),
      })
      // Tối ưu: Xóa mật khẩu khi đăng nhập sai để người dùng dễ nhập lại
      setForm(prev => ({ ...prev, password: '' }))
    }
  }


  if (isAuthenticated) {
    return (
      <section className={styles.authView}>
        <div className={styles.bannerSection}>
        <div className={styles.bannerIllustrations} aria-hidden>
          <img src="/Teenager-cuate.svg" alt="" className={styles.bannerIllustrationPrimary} />
          <img src="/Young and happy-amico.svg" alt="" className={styles.bannerIllustrationSecondary} />
        </div>
          <img 
            src="/login_side_banner_png_1777403397186.png" 
            alt="Đoàn Thanh Niên" 
            className={styles.bannerImg}
          />
          <div className={styles.bannerContent}>
            <div className={styles.bannerLogos} aria-hidden>
              <img src="/HuyHieuDoan.png" alt="" className={styles.bannerLogo} />
              <img src="/logo-white-circle.png" alt="" className={styles.bannerLogo} />
            </div>
            <h2>Đoàn Thanh Niên</h2>
            <p>Hệ thống quản lý hoạt động và sinh hoạt Đoàn trực tuyến.</p>
          </div>
        </div>
        <div className={styles.loginSection}>
          <div className={styles.authCard}>
            <div className={styles.authCopy}>
              <h1>Chào mừng</h1>
              <p>
                Bạn đã đăng nhập với tài khoản <strong>{user?.studentId}</strong>.
              </p>
            </div>
            <button className={styles.submitBtn} onClick={() => navigate(PATHS.home)}>
              Đi tới Trang chủ
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.authView}>
      <NotificationPopup
        isOpen={Boolean(status.error)}
        title="Đăng nhập thất bại"
        message={status.error}
        onClose={() =>
          setStatus((currentStatus) => ({
            ...currentStatus,
            error: '',
          }))
        }
      />

      <div className={styles.bannerSection}>
        <div className={styles.bannerIllustrations} aria-hidden>
          <img src="/Teenager-cuate.svg" alt="" className={styles.bannerIllustrationPrimary} />
          <img src="/Young and happy-amico.svg" alt="" className={styles.bannerIllustrationSecondary} />
        </div>
        {/* <img 
          src="/HuyHieuDoan.png" 
          alt="Đoàn Thanh Niên Banner" 
          className={styles.bannerImg}
        /> */}
        <div className={styles.bannerContent}>
          <div className={styles.bannerLogos} aria-hidden>
            <img src="/HuyHieuDoan.png" alt="" className={styles.bannerLogo} />
            <img src="/logo-white-circle.png" alt="" className={styles.bannerLogo} />
          </div>
          <h2>Đoàn Thanh Niên</h2>
          <p>Nâng cao hiệu quả công tác Đoàn và phong trào thanh niên qua chuyển đổi số.</p>
        </div>
      </div>

      <div className={styles.loginSection}>
        <div className={styles.authCard}>
          <div className={styles.authCopy}>
            <h1>Đăng nhập</h1>
            <p>Sử dụng tài khoản sinh viên để tiếp tục.</p>
          </div>

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Tài khoản</span>
              <input
                name="studentId"
                type="text"
                className={styles.inputField}
                value={form.studentId}
                onChange={handleChange}
                placeholder="Nhập mã sinh viên"
                required
              />
            </div>

            <div className={styles.field}>
              <div className={styles.authFormRow}>
                <span className={styles.fieldLabel}>Mật khẩu</span>
                <button type="button" className={styles.forgotLink} onClick={handleForgotPassword}>
                  Quên mật khẩu?
                </button>
              </div>
              <div className={styles.passwordWrapper}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.inputField}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={status.loading}
            >
              {status.loading ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>

          <p className={styles.switchCopy}>
            Hệ thống quản lý nội bộ. Vui lòng không chia sẻ tài khoản cho người khác.
          </p>
        </div>
      </div>
    </section>
  )
}


export default LoginPage

