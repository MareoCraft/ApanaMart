import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatPrice } from '../utils/shopHelpers'
import { SHOP_INFO } from '../shopData'

function CartPage() {
  const navigate = useNavigate()
  const { cartItems, cartStats, updateQuantity, validateCheckout, setNotice } = useStore()

  const proceedCheckout = () => {
    const validation = validateCheckout()
    if (!validation.ok) {
      setNotice(validation.message)
      return
    }

    navigate('/checkout')
  }

  return (
    <section className="">
      {cartItems.length === 0 ? (
        <article className="offer-banner2">
          <span className="offer-badge">
            <i className="fa-solid fa-bolt"></i> Lightning Offer
          </span>
          <h2>Free delivery above <span>{formatPrice(SHOP_INFO.freeDeliveryAbove)}</span></h2>
          <span>Single shop dispatch. Packed fresh every hour.</span>
        </article>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-row">
                <div className='card-row-item'>
                  <img width={30} src={item.image} alt="" />
                  <div>
                    <strong style={{ fontSize: 12 }}>{item.name}</strong>
                    <p>Unit : {item.unit}</p>
                  </div>
                </div>
                <div className="qty-box compact">
                  <button type="button" onClick={() => updateQuantity(item.id, item.qty - 1)}>
                    -
                  </button>
                  <span>{item.qty}</span>
                  <button type="button" onClick={() => updateQuantity(item.id, item.qty + 1)}>
                    +
                  </button>
                </div>
                <strong>{formatPrice(item.lineTotal)}</strong>
              </div>
            ))}
          </div>

          <div className="bill-box">
            <strong>Bill Details</strong>
            <hr />
            <p>
              <span className='bill-items'><i className="fa-solid fa-list-ol"></i> Items total</span>
              <strong>{formatPrice(cartStats.subtotal)}</strong>
            </p>
            <p>
              <span className='bill-items'><i className="fa-solid fa-bicycle"></i> Delivery Fee</span>
              <strong
                style={{
                  color: cartStats.deliveryFee === 0 ? "#16a34a" : "inherit",
                }}
              >
                {cartStats.deliveryFee === 0
                  ? "FREE"
                  : formatPrice(cartStats.deliveryFee)}
              </strong>
            </p>
            <p>
              <span className='bill-items'><i className="fa-solid fa-bag-shopping"></i> Handling</span>
              <strong>{formatPrice(cartStats.handlingFee)}</strong>
            </p>
            <p>
              <span className='bill-items'><i className="fa-solid fa-percent"></i> Taxes</span>
              <strong>{formatPrice(cartStats.tax)}</strong>
            </p>
            <p className="total">
              <span className='bill-items'><i className="fa-solid fa-calculator"></i>Grand Total</span>
              <strong>{formatPrice(cartStats.total)}</strong>
            </p>
          </div>

          <button type="button" className="checkout-btn" onClick={proceedCheckout}>
            Proceed To Checkout
          </button>
        </>
      )}
    </section>
  )
}

export default CartPage
