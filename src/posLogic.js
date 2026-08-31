const initialCatalog = [
  { id: 1, barcode: '123456', name: 'Classic Coffee', price: 4.5 },
  { id: 2, barcode: '654321', name: 'Sandwich', price: 7.25 },
  { id: 3, barcode: '111111', name: 'Muffin', price: 3.0 },
]

export function createInitialState() {
  return {
    carts: [createCartShape(1)],
    activeCartId: 1,
    catalog: initialCatalog,
    orders: [],
    pendingBarcode: null,
    customers: [],
    staff: [
      {
        id: 'STF-001',
        name: 'Admin',
        pin: '1234',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

export function createCart(state) {
  const nextId = Math.max(...state.carts.map((cart) => cart.id), 0) + 1
  return {
    ...state,
    carts: [...state.carts, createCartShape(nextId)],
  }
}

export function createCartShape(id) {
  return { id, name: `Cart ${id}`, items: [] }
}

export function addItemToCart(state, cartId, product, quantity = 1) {
  return {
    ...state,
    carts: state.carts.map((cart) => {
      if (cart.id !== cartId) return cart
      const existingItem = cart.items.find((item) => item.productId === product.id)
      if (existingItem) {
        return {
          ...cart,
          items: cart.items.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          ),
        }
      }

      return {
        ...cart,
        items: [...cart.items, { productId: product.id, name: product.name, price: product.price, quantity }],
      }
    }),
  }
}

export function addBarcodeItem(state, barcode, cartId) {
  const product = state.catalog.find((item) => item.barcode === barcode)

  if (product) {
    return addItemToCart(state, cartId, product, 1)
  }

  return {
    ...state,
    pendingBarcode: barcode,
  }
}

export function completeNewItem(state, product) {
  return {
    ...state,
    catalog: [...state.catalog, product],
    pendingBarcode: null,
  }
}

export function finalizeOrder(state, cartId) {
  const cart = state.carts.find((entry) => entry.id === cartId)
  if (!cart || cart.items.length === 0) {
    return state
  }

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const order = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    cartName: cart.name,
    items: cart.items,
    total: Number(total.toFixed(2)),
  }

  return {
    ...state,
    orders: [order, ...state.orders],
    carts: state.carts.map((entry) => (entry.id === cartId ? { ...entry, items: [] } : entry)),
  }
}

/* ─── Catalog Management ─── */

export function updateCatalogItem(state, productId, updates) {
  return {
    ...state,
    catalog: state.catalog.map((item) =>
      item.id === productId ? { ...item, ...updates } : item,
    ),
  }
}

export function deleteCatalogItem(state, productId) {
  return {
    ...state,
    catalog: state.catalog.filter((item) => item.id !== productId),
  }
}

/* ─── Customer Management ─── */

function nextCustomerId(customers) {
  const nums = (customers || []).map((c) => {
    const m = c.id.match(/CUS-(\d+)/)
    return m ? parseInt(m[1], 10) : 0
  })
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `CUS-${String(max + 1).padStart(4, '0')}`
}

export function addCustomer(state, { name, phone }) {
  const customers = state.customers || []
  const id = nextCustomerId(customers)
  return {
    ...state,
    customers: [
      ...customers,
      { id, name, phone, createdAt: new Date().toISOString() },
    ],
  }
}

export function updateCustomer(state, customerId, updates) {
  return {
    ...state,
    customers: (state.customers || []).map((c) =>
      c.id === customerId ? { ...c, ...updates } : c,
    ),
  }
}

export function deleteCustomer(state, customerId) {
  return {
    ...state,
    customers: (state.customers || []).filter((c) => c.id !== customerId),
  }
}

/* ─── Staff Management ─── */

function nextStaffId(staffList) {
  const nums = (staffList || []).map((s) => {
    const m = s.id.match(/STF-(\d+)/)
    return m ? parseInt(m[1], 10) : 0
  })
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `STF-${String(max + 1).padStart(3, '0')}`
}

export function addStaff(state, { name, pin, role }) {
  const staffList = state.staff || []
  const id = nextStaffId(staffList)
  return {
    ...state,
    staff: [
      ...staffList,
      { id, name, pin, role: role || 'cashier', createdAt: new Date().toISOString() },
    ],
  }
}

export function updateStaff(state, staffId, updates) {
  return {
    ...state,
    staff: (state.staff || []).map((s) =>
      s.id === staffId ? { ...s, ...updates } : s,
    ),
  }
}

export function deleteStaff(state, staffId) {
  return {
    ...state,
    staff: (state.staff || []).filter((s) => s.id !== staffId),
  }
}

export function authenticateStaff(state, staffId, pin) {
  const member = (state.staff || []).find((s) => s.id === staffId)
  return member ? member.pin === pin : false
}
