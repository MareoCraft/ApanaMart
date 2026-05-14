import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { formatPrice } from '../../utils/shopHelpers'

function AdminOverviewPage() {
  const navigate = useNavigate()
  const { products, orders } = useStore()

  const summary = useMemo(() => {
    const deliveredCount = orders.filter((order) => order.status === 'Delivered').length
    const pendingCount = orders.filter((order) => order.status !== 'Delivered').length
    const revenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0)
    const lowStock = products.filter((product) => product.stock <= 5).length

    return { deliveredCount, pendingCount, revenue, lowStock }
  }, [orders, products])

  return (
    <div className="admin-grid admin-grid-overview">
      <article className="admin-stat-card">
        <p>Products</p>
        <strong>{products.length}</strong>
      </article>
      <article className="admin-stat-card">
        <p>Pending Orders</p>
        <strong>{summary.pendingCount}</strong>
      </article>
      <article className="admin-stat-card">
        <p>Delivered Orders</p>
        <strong>{summary.deliveredCount}</strong>
      </article>
      <article className="admin-stat-card">
        <p>Total Revenue</p>
        <strong>{formatPrice(summary.revenue)}</strong>
      </article>
      <article className="admin-stat-card">
        <p>Low Stock Alerts</p>
        <strong>{summary.lowStock}</strong>
      </article>
      <article className="admin-stat-card admin-stat-actions">
        <p>Quick Actions</p>
        <div>
          <button type="button" onClick={() => navigate('/admin/panel/products')}>
            Add Product
          </button>
          <button type="button" onClick={() => navigate('/admin/panel/orders')}>
            Update Orders
          </button>
        </div>
      </article>
    </div>
  )
}

export default AdminOverviewPage
