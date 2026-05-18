import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import { formatPrice } from '../utils/shopHelpers'

function CategoryProductsPage() {
  const navigate = useNavigate()
  const { categoryName = '' } = useParams()
  const decodedCategory = decodeURIComponent(categoryName)

  const {
    products,
    cart,
    favorites,
    toggleFavorite,
    addToCart,
    updateQuantity,
    isProductsLoading,
  } = useStore()

  const categoryProducts = useMemo(() => {
    return products.filter((product) => product.category === decodedCategory)
  }, [products, decodedCategory])

  const shouldShowSkeleton = isProductsLoading && categoryProducts.length === 0

  return (
    <section className="category-products-page">
      <div className="category-products-head">
        <button
          type="button"
          className="category-back-btn"
          onClick={() => navigate('/shop')}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <div className="category-head">
          <h2>{decodedCategory || 'Products'}</h2>
          <p>{categoryProducts.length} products</p>
        </div>
      </div>

      {shouldShowSkeleton ? (
        <div className="product-grid vertical-grid skeleton-grid" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <article key={index} className="product-card skeleton-card">
              <div className="skeleton shimmer skeleton-fav" />
              <div className="skeleton shimmer skeleton-image" />
              <div className="skeleton shimmer skeleton-badge" />
              <div className="skeleton shimmer skeleton-line" />
              <div className="skeleton shimmer skeleton-line short" />
              <div className="skeleton shimmer skeleton-cta" />
            </article>
          ))}
        </div>
      ) : categoryProducts.length === 0 ? (
        <p className="empty">No products found in this category.</p>
      ) : (
        <div className="product-grid vertical-grid">
          {categoryProducts.map((product) => {
            const quantity = cart[product.id] || 0
            const isFavorite = favorites.includes(product.id)
            const discount = Math.max(0, product.originalPrice - product.price)
            const hasImageFile =
              product.image?.startsWith('data:image') ||
              product.image?.startsWith('http://') ||
              product.image?.startsWith('https://')

            return (
              <article key={product.id} className="product-card">
                <button
                  type="button"
                  className={isFavorite ? 'fav-btn active' : 'fav-btn'}
                  onClick={() => toggleFavorite(product.id)}
                  aria-label={`Toggle favorite for ${product.name}`}
                >
                  {isFavorite ? (
                    <i className="fa-solid fa-heart"></i>
                  ) : (
                    <i className="fa-solid fa-heart-circle-plus"></i>
                  )}
                </button>

                {hasImageFile ? (
                  <img src={product.image} alt={product.name} className="product-image" />
                ) : (
                  <div className="emoji">{product.image}</div>
                )}

                <div className="card-body">
                  <p className="badge">{product.badge}</p>

                  <h3>
                    {product.name.length > 15 ? `${product.name.slice(0, 12)}...` : product.name}
                    <span style={{ color: 'green' }}> | </span>
                    {product.unit}
                  </h3>

                  <div className="price-row">
                    <div>
                      <strong style={{ fontSize: 20 }}>{formatPrice(product.price)}</strong>
                      &nbsp;
                      {discount > 0 && <span>{formatPrice(product.originalPrice)}</span>}
                    </div>
                    <p className="meta">{product.eta} M</p>
                  </div>

                  {quantity > 0 ? (
                    <div className="qty-box">
                      <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)}>
                        -
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => updateQuantity(product.id, quantity + 1)}>
                        +
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="add-btn" onClick={() => addToCart(product.id)}>
                      Add&nbsp;&nbsp;
                      <i className="fa-solid fa-cart-arrow-down"></i>
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default CategoryProductsPage
