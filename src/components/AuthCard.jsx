import { SHOP_INFO } from '../shopData'

function AuthCard({ title, subtitle, children, footer }) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-top">
          <p>{SHOP_INFO.name}</p>
          <h1>{title}</h1>
          <span>{subtitle}</span>
        </div>
        {children}
        {footer}
      </section>
    </main>
  )
}

export default AuthCard
