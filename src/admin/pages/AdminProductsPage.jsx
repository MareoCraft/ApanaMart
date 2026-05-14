import { useState } from 'react'
import { useStore } from '../../context/StoreContext'
import { formatPrice } from '../../utils/shopHelpers'

const BLANK_PRODUCT = {
  id: '',
  name: '',
  category: '',
  unit: '',
  price: '',
  originalPrice: '',
  stock: '',
  eta: '15',
  badge: '',
  image: '',
}

function AdminProductsPage() {
  const { products, saveProduct, deleteProduct } = useStore()
  const [editor, setEditor] = useState(BLANK_PRODUCT)
  const [formNotice, setFormNotice] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleStartEdit = (product) => {
    setEditor({
      id: product.id,
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      eta: product.eta,
      badge: product.badge,
      image: product.image,
    })
    setFormNotice(`Editing ${product.name}`)
    setShowForm(true)
  }

  const resetEditor = () => {
    setEditor(BLANK_PRODUCT)
    setFormNotice('')
    setShowForm(false)
  }

  const handleProductSubmit = async (event) => {
    event.preventDefault()
    const result = await saveProduct(editor)

    if (!result.ok) {
      setFormNotice(result.message)
      return
    }

    setFormNotice(editor.id ? 'Product updated in database.' : 'Product added in database.')
    setEditor(BLANK_PRODUCT)
    setShowForm(false)
  }

  const handleDelete = async (product) => {
    const shouldDelete = window.confirm(`Delete ${product.name}?`)
    if (!shouldDelete) return

    const result = await deleteProduct(product.id)
    if (!result.ok) {
      setFormNotice(result.message)
      return
    }

    if (editor.id === product.id) {
      resetEditor()
    }
  }

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setEditor((prev) => ({ ...prev, image: String(reader.result || '') }))
      setFormNotice('Image loaded. Save product to publish.')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="admin-products-layout">
      {showForm && (
        <div
          className="admin-panel-overlay"
          onClick={() => setShowPanel(false)}
        >
          <article
            className="admin-panel-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-panel-handle"></div>

            <div className="admin-panel-head">
              <h3>{editor.id ? "Edit Product" : "Add Product"}</h3>

              <button
                type="button"
                className="admin-close-btn"
                onClick={() => {
                  resetEditor();
                  setShowPanel(false);
                }}
              >
                ✕
              </button>
            </div>

            <form className="admin-product-form" onSubmit={handleProductSubmit}>
              <input
                placeholder="Product name"
                value={editor.name}
                onChange={(event) =>
                  setEditor((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />

              <input
                placeholder="Category"
                value={editor.category}
                onChange={(event) =>
                  setEditor((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
              />

              <input
                placeholder="Unit (1 kg, 500 ml)"
                value={editor.unit}
                onChange={(event) =>
                  setEditor((prev) => ({
                    ...prev,
                    unit: event.target.value,
                  }))
                }
              />

              <div className="admin-grid-2">
                <input
                  placeholder="Price"
                  type="number"
                  min="1"
                  value={editor.price}
                  onChange={(event) =>
                    setEditor((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                />

                <input
                  placeholder="Original price"
                  type="number"
                  min="1"
                  value={editor.originalPrice}
                  onChange={(event) =>
                    setEditor((prev) => ({
                      ...prev,
                      originalPrice: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="admin-grid-2">
                <input
                  placeholder="Stock"
                  type="number"
                  min="0"
                  value={editor.stock}
                  onChange={(event) =>
                    setEditor((prev) => ({
                      ...prev,
                      stock: event.target.value,
                    }))
                  }
                />

                <input
                  placeholder="ETA"
                  type="number"
                  min="1"
                  value={editor.eta}
                  onChange={(event) =>
                    setEditor((prev) => ({
                      ...prev,
                      eta: event.target.value,
                    }))
                  }
                />
              </div>

              <input
                placeholder="Category badge"
                value={editor.badge}
                onChange={(event) =>
                  setEditor((prev) => ({
                    ...prev,
                    badge: event.target.value,
                  }))
                }
              />

              <input
                placeholder="Image URL or Emoji"
                value={editor.image}
                onChange={(event) =>
                  setEditor((prev) => ({
                    ...prev,
                    image: event.target.value,
                  }))
                }
              />

              <label
                className="admin-upload-label"
                htmlFor="admin-product-image"
              >
                <input
                id="admin-product-image"
                type="file"
                disabled
                accept="image/*"
                onChange={handleImageUpload}
              />
              </label>             

              <button type="submit" className="admin-add-btn">
                {editor.id ? "Update Product" : "Add Product"}
              </button>
            </form>

            {formNotice && (
              <p className="admin-form-note">{formNotice}</p>
            )}
          </article>
        </div>
      )}

      <article className="admin-panel-card">
        <div className="admin-panel-head">
          <div className='admin-panel-head-top'>
            <h3>Product Catalog</h3>
            <span>{products.length} items</span>
          </div>
        </div>

        <div className="admin-products-head-actions">
          <button
            type="button"
            className="admin-primary-btn"
            onClick={() => {
              setEditor(BLANK_PRODUCT)
              setFormNotice('')
              setShowForm(true)
            }}
          >
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>

        <div className="admin-product-list">
          {products.length === 0 ? (
            <p className="admin-empty">
              No products in database. Add products from the form.
            </p>
          ) : (
            products.map((product) => {
              const hasImageFile =
                product.image?.startsWith('data:image') ||
                product.image?.startsWith('http://') ||
                product.image?.startsWith('https://')

              return (
                <div key={product.id} className="admin-product-card">
                  <div className="admin-product-left">
                    {hasImageFile ? (
                      <img src={product.image} alt={product.name} className="admin-product-img" />
                    ) : (
                      <div className="admin-emoji-box">{product.image}</div>
                    )}
                  </div>

                  <div className="admin-product-info">
                    <span className="stock-badge">{product.stock} left</span>
                    <div className="admin-product-top">
                      <strong>{product.name}</strong>
                      <h4>{formatPrice(product.price)}</h4>
                    </div>

                    <p>
                      {product.category} • {product.unit}
                    </p>


                    <div className="admin-actions-inline">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleStartEdit(product)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDelete(product)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </article>
    </div>
  )
}

export default AdminProductsPage
