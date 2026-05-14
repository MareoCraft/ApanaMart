import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ref, remove, set, update, onValue } from 'firebase/database'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { authConfig } from '../authConfig'
import { SHOP_INFO } from '../shopData'
import { normalizePhone } from '../utils/authHelpers'
import { buildSlots, getStatusIndex, ORDER_STAGES } from '../utils/shopHelpers'
import { readStorage, writeStorage } from '../utils/storage'
import { firestoreDb, ordersRealtimeDb, realtimeDb } from '../firebaseClient'

const STORAGE_KEYS = {
  users: 'gaon_shop_users_v1',
  session: 'gaon_shop_session_v1',
  cart: 'gaon_shop_cart_v1',
  orders: 'gaon_shop_orders_v1',
  favorites: 'gaon_shop_favorites_v1',
  profile: 'gaon_shop_profile_v1',
  products: 'gaon_shop_products_v1',
}

const DB_PATHS = {
  products: 'gaon/products',
  orders: 'gaon/orders',
}

const DEFAULT_PROFILE = {
  name: '',
  phone: '',
  address: '',
  landmark: '',
  note: '',
}

const StoreContext = createContext(null)

function getProfileStorageKey(session) {
  const normalizedPhone = normalizePhone(session?.phone || '')
  return normalizedPhone
    ? `${STORAGE_KEYS.profile}_${normalizedPhone}`
    : STORAGE_KEYS.profile
}

function normalizeProduct(input) {
  const numericPrice = Number(input.price)
  const numericOriginalPrice = Number(input.originalPrice)
  const numericStock = Number(input.stock)
  const numericEta = Number(input.eta)

  const price =
    Number.isFinite(numericPrice) && numericPrice > 0 ? Math.round(numericPrice) : 0
  const originalPriceRaw =
    Number.isFinite(numericOriginalPrice) && numericOriginalPrice > 0
      ? Math.round(numericOriginalPrice)
      : price
  const originalPrice = Math.max(price, originalPriceRaw)

  return {
    id: input.id,
    name: (input.name || '').trim(),
    category: (input.category || '').trim(),
    unit: (input.unit || '').trim(),
    price,
    originalPrice,
    stock:
      Number.isFinite(numericStock) && numericStock >= 0
        ? Math.round(numericStock)
        : 0,
    eta: Number.isFinite(numericEta) && numericEta > 0 ? Math.round(numericEta) : 10,
    badge: (input.badge || '').trim() || 'Fresh Pick',
    image: (input.image || '').trim() || 'IMG',
    createdAt: Number(input.createdAt) || Date.now(),
    updatedAt: Number(input.updatedAt) || Date.now(),
  }
}

function mapSnapshotToArray(snapshotValue, mapper) {
  if (!snapshotValue || typeof snapshotValue !== 'object') {
    return []
  }

  return Object.entries(snapshotValue).map(([id, value]) => mapper(id, value))
}

export function StoreProvider({ children, session, scope = 'customer' }) {
  const productsDb = realtimeDb
  const ordersDb = ordersRealtimeDb || realtimeDb
  const [nowMs, setNowMs] = useState(Date.now())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [products, setProducts] = useState(() => readStorage(STORAGE_KEYS.products, []))
  const [cart, setCart] = useState(() => readStorage(STORAGE_KEYS.cart, {}))
  const [allOrders, setAllOrders] = useState(() => readStorage(STORAGE_KEYS.orders, []))
  const [favorites, setFavorites] = useState(() => readStorage(STORAGE_KEYS.favorites, []))
  const [profile, setProfile] = useState(() =>
    readStorage(getProfileStorageKey(session), DEFAULT_PROFILE),
  )
  const [checkoutInfo, setCheckoutInfo] = useState({
    slot: buildSlots()[0],
    paymentMode: 'Cash On Delivery',
  })
  const [notice, setNotice] = useState('')
  const [isProductsLoading, setIsProductsLoading] = useState(Boolean(productsDb))
  const [isOrdersLoading, setIsOrdersLoading] = useState(Boolean(ordersDb))

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now())
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => writeStorage(STORAGE_KEYS.products, products), [products])
  useEffect(() => writeStorage(STORAGE_KEYS.cart, cart), [cart])
  useEffect(() => writeStorage(STORAGE_KEYS.orders, allOrders), [allOrders])
  useEffect(() => writeStorage(STORAGE_KEYS.favorites, favorites), [favorites])
  useEffect(() => {
    writeStorage(getProfileStorageKey(session), profile)
  }, [profile, session])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 2800)
    return () => clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!session) {
      setProfile(DEFAULT_PROFILE)
      return
    }

    const storedProfile = readStorage(getProfileStorageKey(session), DEFAULT_PROFILE)

    setProfile((prev) => {
      const source = storedProfile?.phone ? storedProfile : prev
      const next = {
        ...DEFAULT_PROFILE,
        ...source,
      }

      if (!next.name.trim() && session.name?.trim()) {
        next.name = session.name
      }

      if (!next.phone.trim() && session.phone?.trim()) {
        next.phone = session.phone
      }

      if (!next.address.trim() && session.address?.trim()) {
        next.address = session.address
      }

      if (
        next.name === prev.name &&
        next.phone === prev.phone &&
        next.address === prev.address &&
        next.landmark === prev.landmark &&
        next.note === prev.note
      ) {
        return prev
      }

      return next
    })
  }, [session])

  useEffect(() => {
    if (!productsDb) return undefined

    const productsRef = ref(productsDb, DB_PATHS.products)
    const stopProducts = onValue(
      productsRef,
      (snapshot) => {
        const nextProducts = mapSnapshotToArray(snapshot.val(), (id, value) =>
          normalizeProduct({ id, ...(value || {}) }),
        ).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

        setProducts(nextProducts)
        setIsProductsLoading(false)
      },
      () => setIsProductsLoading(false),
    )

    return () => {
      stopProducts()
    }
  }, [productsDb])

  useEffect(() => {
    if (!ordersDb) return undefined

    const ordersRef = ref(ordersDb, DB_PATHS.orders)
    const stopOrders = onValue(
      ordersRef,
      (snapshot) => {
        const nextOrders = mapSnapshotToArray(snapshot.val(), (id, value) => ({
          id,
          ...(value || {}),
        })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))

        setAllOrders(nextOrders)
        setIsOrdersLoading(false)
      },
      () => setIsOrdersLoading(false),
    )

    return () => {
      stopOrders()
    }
  }, [ordersDb])

  useEffect(() => {
    const validProductIds = new Set(products.map((product) => product.id))

    setCart((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([productId]) => validProductIds.has(productId)),
      )
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })

    setFavorites((prev) => prev.filter((productId) => validProductIds.has(productId)))
  }, [products])

  const categories = useMemo(() => {
    const fromProducts = products.map((product) => product.category).filter(Boolean)
    return ['All', ...Array.from(new Set(fromProducts))]
  }, [products])

  useEffect(() => {
    if (selectedCategory !== 'All' && !categories.includes(selectedCategory)) {
      setSelectedCategory('All')
    }
  }, [categories, selectedCategory])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory
      const text = `${product.name} ${product.category}`.toLowerCase()
      const matchesSearch = text.includes(searchQuery.trim().toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const product = products.find((entry) => entry.id === productId)
        if (!product) return null

        return {
          ...product,
          qty,
          lineTotal: qty * product.price,
        }
      })
      .filter(Boolean)
  }, [cart, products])

  const cartStats = useMemo(() => {
    const itemCount = cartItems.reduce((sum, item) => sum + item.qty, 0)
    const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const deliveryFee =
      subtotal >= SHOP_INFO.freeDeliveryAbove || subtotal === 0
        ? 0
        : SHOP_INFO.deliveryFee
    const handlingFee = subtotal > 0 ? SHOP_INFO.handlingFee : 0
    const tax = Math.round(subtotal * SHOP_INFO.taxRate)
    const total = subtotal + deliveryFee + handlingFee + tax

    return {
      itemCount,
      subtotal,
      deliveryFee,
      handlingFee,
      tax,
      total,
    }
  }, [cartItems])

  const orders = useMemo(() => {
    if (scope === 'admin') return allOrders

    const normalizedSessionPhone = normalizePhone(session?.phone || '')
    if (!normalizedSessionPhone) return allOrders

    return allOrders.filter((order) => {
      const orderPhone = normalizePhone(order.customer?.phone || order.phone || '')
      return orderPhone && orderPhone === normalizedSessionPhone
    })
  }, [allOrders, scope, session])

  const activeOrders = useMemo(() => {
    return orders.filter((order) => getStatusIndex(order, nowMs) < ORDER_STAGES.length - 1)
  }, [orders, nowMs])

  const completedOrders = useMemo(() => {
    return orders.filter((order) => getStatusIndex(order, nowMs) === ORDER_STAGES.length - 1)
  }, [orders, nowMs])

  const addToCart = (productId) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return

    setCart((prev) => {
      const currentQty = prev[productId] || 0
      if (currentQty >= product.stock) return prev
      return { ...prev, [productId]: currentQty + 1 }
    })
  }

  const updateQuantity = (productId, nextQty) => {
    const product = products.find((item) => item.id === productId)
    if (!product) return

    setCart((prev) => {
      if (nextQty <= 0) {
        const clone = { ...prev }
        delete clone[productId]
        return clone
      }

      const safeQty = Math.min(nextQty, product.stock)
      return { ...prev, [productId]: safeQty }
    })
  }

  const toggleFavorite = (productId) => {
    setFavorites((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      }

      return [...prev, productId]
    })
  }

  const validateCheckout = () => {
    if (!cartStats.itemCount) {
      return { ok: false, message: 'Add products before checkout.' }
    }

    if (cartStats.subtotal < SHOP_INFO.minimumOrderValue) {
      return {
        ok: false,
        message: `Minimum order is ${SHOP_INFO.minimumOrderValue}`,
      }
    }

    return { ok: true }
  }

  const placeOrder = async () => {
    const normalizedPhone = normalizePhone(profile.phone || session?.phone || '')

    if (!profile.name.trim() || !normalizedPhone || !profile.address.trim()) {
      setNotice('Complete name, phone and address in account page.')
      return { ok: false, reason: 'profile' }
    }

    const orderId = `OD${Date.now().toString().slice(-7)}`

    const order = {
      id: orderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: ORDER_STAGES[0],
      customer: {
        ...profile,
        phone: normalizedPhone,
      },
      slot: checkoutInfo.slot,
      paymentMode: 'Cash On Delivery',
      payment: {
        mode: 'Cash On Delivery',
        status: 'Pending',
        paidAt: null,
      },
      items: cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        price: item.price,
        qty: item.qty,
      })),
      pricing: {
        ...cartStats,
      },
    }

    try {
      if (ordersDb) {
        await set(ref(ordersDb, `${DB_PATHS.orders}/${orderId}`), order)
      } else {
        setAllOrders((prev) => [order, ...prev])
      }

      setCart({})
      setNotice(`Order ${orderId} placed successfully.`)
      return { ok: true }
    } catch (error) {
      setNotice('Failed to place order. Please try again.')
      return { ok: false, reason: 'database', message: error.message }
    }
  }

  const setOrderStatus = async (orderId, status) => {
    if (!ORDER_STAGES.includes(status)) {
      return { ok: false, message: 'Invalid order status.' }
    }

    try {
      if (ordersDb) {
        await update(ref(ordersDb, `${DB_PATHS.orders}/${orderId}`), {
          status,
          updatedAt: Date.now(),
        })
      } else {
        let updated = false
        setAllOrders((prev) =>
          prev.map((order) => {
            if (order.id !== orderId) return order
            updated = true
            return { ...order, status, updatedAt: Date.now() }
          }),
        )

        if (!updated) {
          return { ok: false, message: 'Order not found.' }
        }
      }

      setNotice(`Order ${orderId} marked as ${status}.`)
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to update order.' }
    }
  }

  const reorder = (order) => {
    const quantityMap = {}

    order.items.forEach((item) => {
      const product = products.find((entry) => entry.id === item.id)
      if (!product) return

      quantityMap[item.id] = Math.min(item.qty, product.stock)
    })

    setCart((prev) => ({ ...prev, ...quantityMap }))
    setNotice('Items added to cart from this order.')
  }

  const saveAccount = async () => {
    const phoneToValidate = profile.phone || session?.phone || ''
    const normalizedPhone = normalizePhone(phoneToValidate)

    if (!profile.name.trim() || !normalizedPhone || !profile.address.trim()) {
      setNotice('Name, phone and address are required.')
      return false
    }

    const nextProfile = {
      ...DEFAULT_PROFILE,
      ...profile,
      phone: normalizedPhone,
    }

    try {
      if (firestoreDb) {
        const userRef = doc(firestoreDb, authConfig.usersCollection, normalizedPhone)
        await setDoc(
          userRef,
          {
            name: nextProfile.name.trim(),
            phone: normalizedPhone,
            address: nextProfile.address.trim(),
            landmark: nextProfile.landmark?.trim() || '',
            note: nextProfile.note?.trim() || '',
            updatedAt: Date.now(),
            updatedAtServer: serverTimestamp(),
          },
          { merge: true },
        )
      }

      setProfile(nextProfile)
      writeStorage(getProfileStorageKey(session), nextProfile)

      const users = readStorage(STORAGE_KEYS.users, [])
      const existingIndex = users.findIndex(
        (entry) => normalizePhone(entry.phone || '') === normalizedPhone,
      )
      const updatedUser = {
        ...(existingIndex >= 0 ? users[existingIndex] : {}),
        name: nextProfile.name.trim(),
        phone: normalizedPhone,
        address: nextProfile.address.trim(),
      }

      if (existingIndex >= 0) {
        const clone = [...users]
        clone[existingIndex] = updatedUser
        writeStorage(STORAGE_KEYS.users, clone)
      } else {
        writeStorage(STORAGE_KEYS.users, [...users, updatedUser])
      }

      const storedSession = readStorage(STORAGE_KEYS.session, {})
      if (storedSession && normalizePhone(storedSession.phone || '') === normalizedPhone) {
        writeStorage(STORAGE_KEYS.session, {
          ...storedSession,
          name: nextProfile.name.trim(),
          address: nextProfile.address.trim(),
          phone: normalizedPhone,
        })
      }
    } catch (error) {
      setNotice(error.message || 'Failed to update account in database.')
      return false
    }

    setNotice('Account details saved.')
    return true
  }

  const saveProduct = async (productInput) => {
    const normalized = normalizeProduct(productInput)

    if (!normalized.name || !normalized.category || !normalized.unit || !normalized.price) {
      return { ok: false, message: 'Name, category, unit and price are required.' }
    }

    if (normalized.stock < 0) {
      return { ok: false, message: 'Stock cannot be negative.' }
    }

    const productId = normalized.id || `pr-${Date.now().toString(36)}`
    const payload = {
      ...normalized,
      id: productId,
      createdAt: normalized.createdAt || Date.now(),
      updatedAt: Date.now(),
    }

    try {
      if (productsDb) {
        await set(ref(productsDb, `${DB_PATHS.products}/${productId}`), payload)
      } else {
        setProducts((prev) => {
          const index = prev.findIndex((item) => item.id === productId)

          if (index < 0) {
            return [payload, ...prev]
          }

          const clone = [...prev]
          clone[index] = payload
          return clone
        })
      }

      setNotice(`Product ${normalized.id ? 'updated' : 'added'} successfully.`)
      return { ok: true, id: productId }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to save product.' }
    }
  }

  const deleteProduct = async (productId) => {
    try {
      if (productsDb) {
        await remove(ref(productsDb, `${DB_PATHS.products}/${productId}`))
      } else {
        let removed = false

        setProducts((prev) => {
          const next = prev.filter((product) => product.id !== productId)
          removed = next.length !== prev.length
          return next
        })

        if (!removed) {
          return { ok: false, message: 'Product not found.' }
        }
      }

      setCart((prev) => {
        if (!prev[productId]) return prev
        const clone = { ...prev }
        delete clone[productId]
        return clone
      })

      setFavorites((prev) => prev.filter((id) => id !== productId))
      setNotice('Product deleted.')
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error.message || 'Failed to delete product.' }
    }
  }

  const value = {
    nowMs,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    products,
    filteredProducts,
    favorites,
    toggleFavorite,
    cart,
    cartItems,
    cartStats,
    addToCart,
    updateQuantity,
    orders,
    activeOrders,
    completedOrders,
    reorder,
    profile,
    setProfile,
    saveAccount,
    checkoutInfo,
    setCheckoutInfo,
    notice,
    setNotice,
    isProductsLoading,
    isOrdersLoading,
    validateCheckout,
    placeOrder,
    saveProduct,
    deleteProduct,
    setOrderStatus,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}



