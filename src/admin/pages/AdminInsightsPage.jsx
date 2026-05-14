import { useMemo } from 'react'
import { useStore } from '../../context/StoreContext'

function AdminInsightsPage() {
  const { products, orders } = useStore()

  const categoryStats = useMemo(() => {
    const counts = {}

    products.forEach((product) => {
      counts[product.category] = (counts[product.category] || 0) + 1
    })

    return Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }, [products])

  const lowStockItems = useMemo(
    () => products.filter((product) => product.stock <= 5),
    [products],
  )

  const averageOrderValue = useMemo(() => {
    if (!orders.length) return 0
    const total = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0)
    return Math.round(total / orders.length)
  }, [orders])

  return (
    <div className="admin-grid admin-grid-two-col">
      <article className="admin-panel-card">
        <h3>Category Distribution</h3>
        <div className="admin-simple-list">
          {categoryStats.length === 0 ? (
            <p className="admin-empty">No product categories available yet.</p>
          ) : (
            categoryStats.map((entry) => (
              <p key={entry.category}>
                <span>{entry.category}</span>
                <strong>{entry.count}</strong>
              </p>
            ))
          )}
        </div>
      </article>

      <article className="admin-panel-card">
        <h3>Low Stock Items</h3>
        {lowStockItems.length === 0 ? (
          <p className="admin-empty">All items have healthy stock.</p>
        ) : (
          <div className="admin-simple-list">
            {lowStockItems.map((product) => (
              <p key={product.id}>
                <span>{product.name}</span>
                <strong>{product.stock}</strong>
              </p>
            ))}
          </div>
        )}
      </article>

      <article className="admin-panel-card admin-kpi-card">
        <h3>Orders Received</h3>
        <strong>{orders.length}</strong>
      </article>

      <article className="admin-panel-card admin-kpi-card">
        <h3>Average Order Value</h3>
        <strong>INR {averageOrderValue}</strong>
      </article>
    </div>
  )
}

export default AdminInsightsPage
