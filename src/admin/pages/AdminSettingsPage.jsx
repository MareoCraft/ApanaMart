import { ADMIN_CREDENTIALS } from '../adminConfig'

function AdminSettingsPage() {
  return (
    <article className="admin-panel-card">
      <h3>Operations Menu</h3>
      <div className="admin-settings-grid">
        <div>
          <h4>Admin Access</h4>
          <p>Phone: {ADMIN_CREDENTIALS.phone}</p>
          <p>Password: {ADMIN_CREDENTIALS.password}</p>
        </div>
        <div>
          <h4>Order Workflow</h4>
          <p>Pending to Accepted to Out for delivery to Delivered</p>
          <p>Order updates sync in realtime for customers and admin.</p>
        </div>
        <div>
          <h4>Catalog Workflow</h4>
          <p>Only Realtime Database products are shown in customer app.</p>
          <p>Add products from Products menu to publish instantly.</p>
        </div>
      </div>
    </article>
  )
}

export default AdminSettingsPage
