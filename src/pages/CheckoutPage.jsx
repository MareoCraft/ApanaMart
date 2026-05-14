import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../context/StoreContext'
import { buildSlots, formatPrice } from '../utils/shopHelpers'
import cargoBike from "/bike-.png"

function CheckoutPage() {
  const navigate = useNavigate()

  const {
    cartStats,
    checkoutInfo,
    setCheckoutInfo,
    profile,
    placeOrder,
    validateCheckout,
    setNotice,
  } = useStore()

  const [isPlacing, setIsPlacing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const place = async () => {
    if (isPlacing) return

    const check = validateCheckout()
    if (!check.ok) {
      setNotice(check.message)
      navigate('/cart')
      return
    }

    setIsPlacing(true)

    const result = await placeOrder()

    if (result.ok) {
      setIsSuccess(true)

      setTimeout(() => {
        navigate('/orders')
      }, 1200)
    } else {
      setIsPlacing(false)
      navigate('/account')
    }
  }

  return (
    <section>
      <div className="checkout-card">
        <div className="checkout-header">
          <div className="location-icon">
            <i className="fa-solid fa-location-dot"></i>
          </div>

          <div>
            <h4>Deliver To</h4>
            <span>Delivery Address</span>
          </div>
        </div>

        <div className="checkout-user">
          <i className="fa-solid fa-user"></i>
          <p>{profile.name || "Name missing"}</p>
        </div>

        <div className="checkout-address">
          <i className="fa-solid fa-house-chimney"></i>

          <div>
            <p>{profile.address || "Address missing"}</p>

            {profile.landmark && (
              <span>
                <i className="fa-solid fa-map-pin"></i> {profile.landmark}
              </span>
            )}
          </div>
        </div>

        <div className="checkout-phone">
          <i className="fa-solid fa-phone"></i>
          <p>{profile.phone || "Phone missing"}</p>
        </div>
      </div>

      <div className="checkout-block">
        <h4>Delivery Slot</h4>
        <select
          style={{ width: "100%", textAlign: "center" }}
          value={checkoutInfo.slot}
          onChange={(event) =>
            setCheckoutInfo((prev) => ({ ...prev, slot: event.target.value }))
          }
        >
          {buildSlots().map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <div className="checkout-block">
        <h4>Payment Mode</h4>
        <p>Cash On Delivery</p>
      </div>

      <button
        type="button"
        className={`checkout-btn 
          ${isPlacing ? 'loading' : ''} 
          ${isSuccess ? 'success' : ''}`}
        onClick={place}
        disabled={isPlacing}
      >
        {isSuccess ? (
          <span className="success-text">
            <img style={{ width: 30 }} src={cargoBike} alt="" /> Order Placed
          </span>
        ) : isPlacing ? (
          <span className="vehicle-loader">
            <img className='bike' style={{ width: 30 }} src={cargoBike} alt="" />
          </span>
        ) : (
          <div className='place-btn'>
            <img style={{ width: 30 }} src={cargoBike} alt="" />
            Place Order {formatPrice(cartStats.total)}
          </div>
        )}
      </button>
    </section>
  )
}

export default CheckoutPage
