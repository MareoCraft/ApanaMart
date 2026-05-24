import logo from '/public/ApanaMartLogo2.png'

function AuthCard({ title, subtitle, children, footer }) {
  const variantClass = title.toLowerCase().includes('sign')
    ? 'auth-panel--signup'
    : 'auth-panel--login'

  return (
    <main className="auth-shell">
      <section className={`auth-panel ${variantClass}`}>
        <div className="auth-top">
          <div className="auth-top-brand">
            <img width={150} src={logo} alt="logo" />
          </div>
        </div>
        <div className="auth-title">
          <h1>{title}</h1>
          {children}
        </div>
        {footer}
      </section>
    </main>
  )
}

export default AuthCard
