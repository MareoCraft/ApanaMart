import { useStore } from '../context/StoreContext'
import { formatPrice } from '../utils/shopHelpers'
import { useNavigate } from 'react-router-dom'
import poster from "/FreeDelivary.jpeg"

import './shop.css'

function ProductGridSkeleton() {
  return (
    <div className="product-grid skeleton-grid" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, index) => (
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
  )
}


function ShopPage() {
  const navigate = useNavigate()
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredProducts,
    cart,
    favorites,
    toggleFavorite,
    addToCart,
    updateQuantity,
    isProductsLoading,
  } = useStore()

  const shouldShowSkeleton = isProductsLoading && filteredProducts.length === 0

  return (
    <section>
      <div className="search-wrap">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="🔍 Search kirana, snacks, drinks..."
          aria-label="Search products"
        />
      </div>

      <div className="category-strip">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={selectedCategory === category ? 'active' : ''}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <article className="offer-banner">
        <img width={'100%'} src={poster} alt="" />
        <div className="shine"></div>
        {/* <p>Lightning Offer</p>
        <h2>Free delivery above {formatPrice(SHOP_INFO.freeDeliveryAbove)}</h2>
        <span>Single shop dispatch. Packed fresh every hour.</span> */}
      </article>

      {/* ================= BESTSELLERS ================= */}
      <section className="bestsellers-section">

        <div className="bestsellers-title">
          <h2>Bestsellers</h2>
        </div>

        <div className="bestsellers-grid">

          {categories
            .filter((category) => category !== 'All')
            .slice(0, 6)
            .map((category) => {

              const categoryProducts = filteredProducts.filter(
                (product) => product.category === category
              )

              if (categoryProducts.length === 0) return null

              // Show only first 4 products in the preview
              const previewProducts = categoryProducts.slice(0, 4)

              // Remaining product count
              const remainingCount = Math.max(
                categoryProducts.length - 4,
                0
              )

              return (
                <article
                  className="bestseller-category"
                  key={category}
                >

                  {/* Product Images */}
                  <div className="bestseller-images">

                    {previewProducts.map((product) => {

                      const hasImage =
                        product.image?.startsWith('data:image') ||
                        product.image?.startsWith('http://') ||
                        product.image?.startsWith('https://')

                      return (
                        <div
                          className="bestseller-image-box"
                          key={product.id}
                        >

                          {hasImage ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                            />
                          ) : (
                            <div className="bestseller-emoji">
                              {product.image}
                            </div>
                          )}

                        </div>
                      )
                    })}

                  </div>

                  {/* Remaining Products */}
                  {remainingCount > 0 && (
                    <div className="bestseller-more">
                      +{remainingCount} more
                    </div>
                  )}

                  {/* Category Name */}
                  <div className="bestseller-category-name">
                    <h3>{category}</h3>
                  </div>

                </article>
              )
            })}

        </div>

      </section>

      {shouldShowSkeleton ? (
        <ProductGridSkeleton />
      ) : filteredProducts.length === 0 ? (
        <p className="empty">No products available. Admin can add products from admin panel.</p>
      ) : (
        <div className="shop-sections">

          {categories
            .filter((category) => category !== 'All')
            .map((category) => {

              const categoryProducts = filteredProducts.filter(
                (product) => product.category === category
              )

              if (categoryProducts.length === 0) return null

              return (
                <section
                  key={category}
                  className="shop-category-block"
                >

                  {/* Category Header */}
                  <div className="shop-category-head">

                    <div>
                      <h2 style={{ margin: 0 }}>{category}</h2>
                      {/* <p>{categoryProducts.length} Products</p> */}
                    </div>

                    <button
                      className="view-all-btn"
                      onClick={() => {
                        navigate(`/products/${encodeURIComponent(category)}`)
                      }}
                    >
                      View All
                    </button>

                  </div>

                  {/* Products */}
                  <div
                    className="product-grid horizontal-grid"
                  >

                    {categoryProducts.slice(0, 10).map((product) => {

                      const quantity = cart[product.id] || 0
                      const isOutOfStock = product.stock <= 0

                      const isFavorite =
                        favorites.includes(product.id)

                      const discount = Math.max(
                        0,
                        product.originalPrice - product.price
                      )

                      const hasImageFile =
                        product.image?.startsWith('data:image') ||
                        product.image?.startsWith('http://') ||
                        product.image?.startsWith('https://')

                      return (
                        <article
                          key={product.id}
                          className="product-card"
                        >

                          {/* Favorite */}
                          <button
                            type="button"
                            className={
                              isFavorite
                                ? 'fav-btn active'
                                : 'fav-btn'
                            }
                            onClick={() =>
                              toggleFavorite(product.id)
                            }
                            aria-label={`Toggle favorite for ${product.name}`}
                          >
                            {isFavorite ? (
                              <i className="fa-solid fa-heart"></i>
                            ) : (
                              <i className="fa-solid fa-heart-circle-plus"></i>
                            )}
                          </button>

                          {/* Image */}
                          {hasImageFile ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="product-image"
                            />
                          ) : (
                            <div className="emoji">
                              {product.image}
                            </div>
                          )}

                          {/* Body */}
                          <div className="card-body">

                            <div className="badge-body">
                              <p className="badge">{product.badge}</p>
                              <span className={`stock-meta ${isOutOfStock ? 'stock-meta--out' : ''}`}>
                                {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
                              </span>
                            </div>

                            <h3>
                              {product.name.length > 15
                                ? `${product.name.slice(0, 12)}...`
                                : product.name}

                              <span style={{ color: 'green' }}>
                                {' '}|{' '}
                              </span>

                              {product.unit}
                            </h3>

                            <div className="price-row">

                              <div>
                                <strong style={{ fontSize: 20 }}>
                                  {formatPrice(product.price)}
                                </strong>

                                &nbsp;

                                {discount > 0 && (
                                  <span>
                                    {formatPrice(product.originalPrice)}
                                  </span>
                                )}
                              </div>

                              <p className="meta">
                                {product.eta} M
                              </p>

                            </div>

                            {quantity > 0 && !isOutOfStock ? (

                              <div className="qty-box">

                                <button
                                  type="button"
                                  disabled={quantity >= product.stock}
                                  onClick={() =>
                                    updateQuantity(
                                      product.id,
                                      quantity - 1
                                    )
                                  }
                                >
                                  -
                                </button>

                                <span>{quantity}</span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(
                                      product.id,
                                      quantity + 1
                                    )
                                  }
                                >
                                  +
                                </button>

                              </div>

                            ) : (

                              <button
                                type="button"
                                className="add-btn"
                                disabled={isOutOfStock}
                                onClick={() =>
                                  addToCart(product.id)
                                }
                              >
                                {isOutOfStock ? 'Out of Stock' : (
                                  <>
                                    Add&nbsp;&nbsp;
                                    <i className="fa-solid fa-cart-arrow-down"></i>
                                  </>
                                )}
                              </button>

                            )}

                          </div>

                        </article>
                      )
                    })}

                  </div>

                </section>
              )
            })}

        </div>
      )}

      <div className="promo-card">

        <div className="promo-top">
          <div className="promo-badge">
            <i className="fa-solid fa-bolt"></i>
            Village Fast Delivery
          </div>
        </div>

        <div className="promo-content">
          <h2>
            Grocery Delivered In Minutes
          </h2>

          <p>
            Fresh snacks, cold drinks, daily essentials and more delivered directly
            to your home.
          </p>

          <div className="promo-features">
            <div>
              <i className="fa-solid fa-truck-fast"></i>
              Fast Delivery
            </div>

            <div>
              <i className="fa-solid fa-leaf"></i>
              Fresh Products
            </div>

            <div>
              <i className="fa-solid fa-wallet"></i>
              Best Prices
            </div>

            <div>
              <i className="fa-solid fa-tags"></i>
              Best Discount
            </div>
          </div>

          <button className="promo-btn">
            Order Now
            <i className="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </section>
  )
}

export default ShopPage
