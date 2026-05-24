import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { formatPrice } from '../../utils/shopHelpers'

function AdminOverviewPage() {
  const navigate = useNavigate()
  const { products, orders } = useStore()
  const lowStockProducts = useMemo(
    () =>
      products
        .filter((product) => product.stock <= 5)
        .sort((a, b) => a.stock - b.stock),
    [products],
  )

  const summary = useMemo(() => {
    const deliveredCount = orders.filter((order) => order.status === 'Delivered').length
    const pendingCount = orders.filter((order) => order.status !== 'Delivered').length
    const revenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0)
    const lowStock = lowStockProducts.length

    return { deliveredCount, pendingCount, revenue, lowStock }
  }, [orders, lowStockProducts])

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

      <article className="admin-stat-card admin-overview-low-stock">
        <p>Low Stock Products (5 or less)</p>
        {lowStockProducts.length === 0 ? (
          <div className="admin-overview-low-stock-list">
            <p className="admin-empty">All items have healthy stock.</p>
          </div>
        ) : (
          <div className="admin-overview-low-stock-list">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="admin-overview-low-stock-row">
                <span>{product.name}</span>
                <strong>{product.stock} left</strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}

export default AdminOverviewPage
