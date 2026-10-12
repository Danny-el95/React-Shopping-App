import { Link } from 'react-router-dom'

const ForgotPassword = () => {
  return (
    <main className="page auth-page forgot-password-page">
      <div className="container">
        <section className="auth-container" aria-labelledby="forgot-password-title">
          <p className="product-card-eyebrow auth-brand">D&apos;s NutShop</p>
          <h1 id="forgot-password-title" className="auth-title">Forgot Password?</h1>
          <p className="auth-subtitle">Enter your email address to reset your password.</p>
          <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email address</label>
              <input className="form-input" id="reset-email" type="email" name="email" autoComplete="email" required placeholder="your.email@example.com" />
            </div>
            <button className="auth-submit" type="submit">Reset Password</button>
          </form>
          <div className="auth-switch">
            <Link className="auth-back-link" to="/auth" state={{ initialMode: 'login' }}>Back to Login</Link>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ForgotPassword
