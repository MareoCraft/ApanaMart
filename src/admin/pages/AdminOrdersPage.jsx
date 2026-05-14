import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import { formatPrice, ORDER_STAGES } from '../../utils/shopHelpers'

function AdminOrdersPage() {
  const { orders, setOrderStatus } = useStore()
  const [formNotice, setFormNotice] = useState('')

  const handleStatusChange = async (orderId, status) => {
    const result = await setOrderStatus(orderId, status)
    if (!result.ok) {
      setFormNotice(result.message || 'Failed to update order status.')
      return
    }

    setFormNotice('')
  }

  const [orderTab, setOrderTab] = useState("new")

  const newOrders = orders.filter(
    (order) => order.status !== "Delivered"
  )

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  )

  const visibleOrders =
    orderTab === "new" ? newOrders : deliveredOrders

  return (
    <article className="admin-panel-card">
      <div className="admin-panel-head">
        <h3 style={{ margin: 0 }}>Orders</h3>
      </div>

      <div className="admin-order-tabs">
        <button
          className={orderTab === "new" ? "active" : ""}
          onClick={() => setOrderTab("new")}
        >
          New Orders
          <span>{newOrders.length}</span>
        </button>

        <button
          className={orderTab === "delivered" ? "active" : ""}
          onClick={() => setOrderTab("delivered")}
        >
          Delivered
          <span>{deliveredOrders.length}</span>
        </button>
      </div>

      {formNotice && (
        <p className="admin-form-note">{formNotice}</p>
      )}

      <div className="admin-order-list">
        {visibleOrders.length === 0 ? (
          <p className="admin-empty">
            No {orderTab === "new" ? "new" : "delivered"} orders.
          </p>
        ) : (
          visibleOrders.map((order) => {
            const customerName =
              order.customer?.name ||
              order.name ||
              "Customer"

            const customerPhone =
              order.customer?.phone ||
              order.phone ||
              ""

            const customerAddress =
              order.customer?.address ||
              order.address ||
              "N/A"

            return (
              <div
                key={order.id}
                className="admin-order-card"
              >
                <div className="admin-order-main">
                  <div className="admin-order-head">
                    <strong className="admin-order-id">
                      {order.id}
                    </strong>

                    <strong className="admin-order-price">
                      {formatPrice(
                        order.pricing?.total || 0
                      )}
                    </strong>
                  </div>

                  <div className="admin-order-customer">
                    <p>
                      <strong>{customerName}</strong>
                    </p>

                    <p>{customerPhone || "N/A"}</p>

                    <p>{customerAddress}</p>
                  </div>

                  <p className="admin-order-summary">
                    {order.items?.length || 0} items |{" "}
                    {order.items?.reduce(
                      (sum, item) =>
                        sum + (item.qty || 0),
                      0
                    ) || 0}{" "}
                    qty
                  </p>

                  <p className="admin-order-payment">
                    Payment:{" "}
                    {order.payment?.mode ||
                      order.paymentMode ||
                      "Cash On Delivery"}{" "}
                    |{" "}
                    {order.payment?.status ||
                      "Pending"}
                  </p>

                  <div className="admin-order-items">
                    {order.items?.map((item, index) => (
                      <div
                        key={index}
                        className="admin-order-item-row"
                      >
                        <span>{item.name}</span>

                        <strong>
                          Qty: {item.qty}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {customerPhone && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="admin-call-btn"
                    >
                      Call Customer
                    </a>
                  )}
                </div>

                <div
                  className={`admin-order-controls ${order.status === "Delivered"
                      ? "disabled-control"
                      : ""
                    }`}
                >
                  <label
                    htmlFor={`order-status-${order.id}`}
                  >
                    Status
                  </label>

                  <select
                    id={`order-status-${order.id}`}
                    value={
                      order.status ||
                      ORDER_STAGES[0]
                    }
                    disabled={
                      order.status === "Delivered"
                    }
                    onChange={(event) =>
                      handleStatusChange(
                        order.id,
                        event.target.value
                      )
                    }
                  >
                    {ORDER_STAGES.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })
        )}
      </div>
    </article>
  )
}

export default AdminOrdersPage
