import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatPrice, getStatusIndex, ORDER_STAGES } from '../utils/shopHelpers'
import cargoBike from "/bike-.png"

function OrdersSkeleton() {
  return (
    <div className="orders-skeleton" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, index) => (
        <article key={index} className="order-card modern-user-card skeleton-card">
          <div className="skeleton shimmer skeleton-line" />
          <div className="skeleton shimmer skeleton-line short" />
          <div className="skeleton shimmer skeleton-progress" />
          <div className="skeleton shimmer skeleton-line" />
          <div className="skeleton shimmer skeleton-line short" />
        </article>
      ))}
    </div>
  )
}

function OrdersPage() {
  const navigate = useNavigate()
  const { nowMs, activeOrders, completedOrders, reorder, isOrdersLoading } = useStore()

  return (
    <section className="orders-panel">
      {isOrdersLoading ? (
        <OrdersSkeleton />
      ) : activeOrders.length === 0 ? (
        <p className="empty">No active orders right now.</p>
      ) : (
        activeOrders.map((order) => {
          const statusIndex = getStatusIndex(order, nowMs)
          const stage = ORDER_STAGES[statusIndex]
          const progress = ((statusIndex + 1) / ORDER_STAGES.length) * 100
          const customerName = order.customer?.name || order.name || 'Customer'
          const customerPhone = order.customer?.phone || order.phone || 'No phone'
          const customerAddress = order.customer?.address || order.address || 'No address'

          const totalQty =
            order.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0

          return (
            <article key={order.id} className="order-card modern-user-card">

              {/* 🔝 Header */}
              <div className="order-head">
                <strong>#{order.id}</strong>
                <span className="order-total">{formatPrice(order.pricing.total)}</span>
              </div>

              {/* 📦 Status */}
              <p className="order-stage">{stage}</p>

              {/* 📊 Progress */}
              <div className="progress-track">
                <div style={{ width: `${progress}%` }}></div>
              </div>

              {/* 📦 Meta */}
              <p className="order-meta">
                {totalQty} items • {order.slot}
              </p>

              {/* 🛒 Items */}
              <div className="order-items">
                {order.items?.map((item, i) => (
                  <div key={i} className="order-item">
                    <span>{item.name}</span>
                    <strong>
                      <span>{item.qty} = {formatPrice(item.price)}</span>
                    </strong>
                  </div>
                ))}
              </div>

              {/* 📍 Address */}
              <div className="order-address">
                <i className="fa-solid fa-location-dot"></i>
                <span style={{ color: 'green' }}>                 
                  {customerAddress}
                </span>
              </div>

            </article>
          )
        })
      )}

      {!isOrdersLoading && (
        <>
          <h2>Order History</h2>
          {completedOrders.length === 0 ? (
            <p className="empty">Completed orders will show here.</p>
          ) : (
            completedOrders.map((order) => (
              <article key={order.id} className="order-card done">

                <div className="order-head">
                  <div>
                    <strong># {order.id}</strong>
                  </div>

                  <div className="order-total">
                    <span>{formatPrice(order.pricing.total)}</span>
                  </div>
                </div>

                <p className="order-meta">
                  Delivered • {new Date(order.createdAt).toLocaleString()}
                </p>

                {/* Items List */}
                <div className="order-items">
                  {order.items?.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-left">
                        <span className="item-name">{item.name}</span>
                        <span className="item-qty">x {item.qty}</span>
                      </div>

                      <div className="item-price">
                        {formatPrice(item.price * item.qty)}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  style={{ width: "100%" }}
                  className="reorder-btn"
                  onClick={() => reorder(order)}
                >
                  Reorder <img style={{ width: 30 }} src={cargoBike} alt="" />
                </button>
              </article>
            ))
          )}
        </>
      )}
    </section>
  )
}

export default OrdersPage
