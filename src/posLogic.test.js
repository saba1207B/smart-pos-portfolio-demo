import { describe, expect, it } from 'vitest'

import {
  addBarcodeItem,
  addItemToCart,
  createCart,
  createInitialState,
  finalizeOrder,
  updateCatalogItem,
  deleteCatalogItem,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  addStaff,
  updateStaff,
  deleteStaff,
  authenticateStaff,
} from './posLogic'

describe('POS cart workflows', () => {
  it('adds a scanned item to the active cart when the barcode exists', () => {
    const state = createInitialState()
    const updated = addBarcodeItem(state, '123456', state.carts[0].id)

    expect(updated.carts[0].items).toHaveLength(1)
    expect(updated.carts[0].items[0].name).toBe('Classic Coffee')
    expect(updated.carts[0].items[0].price).toBe(4.5)
  })

  it('creates a new item entry when the barcode is unknown', () => {
    const state = createInitialState()
    const updated = addBarcodeItem(state, '999999', state.carts[0].id)

    expect(updated.catalog).toHaveLength(3)
    expect(updated.pendingBarcode).toBe('999999')
    expect(updated.carts[0].items).toHaveLength(0)
  })

  it('finalizes an order and stores a transaction history entry', () => {
    const state = createInitialState()
    const withItems = addItemToCart(state, state.carts[0].id, state.catalog[0], 2)
    const finalized = finalizeOrder(withItems, state.carts[0].id)

    expect(finalized.orders).toHaveLength(1)
    expect(finalized.orders[0].items).toHaveLength(1)
    expect(finalized.orders[0].total).toBe(9)
    expect(finalized.carts[0].items).toHaveLength(0)
  })

  it('creates an additional cart tab without losing the existing one', () => {
    const state = createInitialState()
    const withSecondCart = createCart(state)

    expect(withSecondCart.carts).toHaveLength(2)
    expect(withSecondCart.carts[0].items).toHaveLength(0)
    expect(withSecondCart.carts[1].items).toHaveLength(0)
  })
})

describe('Catalog management', () => {
  it('updates a catalog item name and price', () => {
    const state = createInitialState()
    const updated = updateCatalogItem(state, 1, { name: 'Premium Coffee', price: 6.0 })

    expect(updated.catalog[0].name).toBe('Premium Coffee')
    expect(updated.catalog[0].price).toBe(6.0)
    expect(updated.catalog[0].barcode).toBe('123456')
  })

  it('deletes a catalog item', () => {
    const state = createInitialState()
    const updated = deleteCatalogItem(state, 2)

    expect(updated.catalog).toHaveLength(2)
    expect(updated.catalog.find((p) => p.id === 2)).toBeUndefined()
  })
})

describe('Customer management', () => {
  it('adds a customer with auto-generated ID CUS-0001', () => {
    const state = createInitialState()
    const updated = addCustomer(state, { name: 'Ravi Kumar', phone: '91234 56789' })

    expect(updated.customers).toHaveLength(1)
    expect(updated.customers[0].id).toBe('CUS-0001')
    expect(updated.customers[0].name).toBe('Ravi Kumar')
    expect(updated.customers[0].phone).toBe('91234 56789')
  })

  it('generates sequential customer IDs', () => {
    const state = createInitialState()
    const s1 = addCustomer(state, { name: 'First', phone: '111' })
    const s2 = addCustomer(s1, { name: 'Second', phone: '222' })

    expect(s2.customers[0].id).toBe('CUS-0001')
    expect(s2.customers[1].id).toBe('CUS-0002')
  })

  it('updates a customer', () => {
    const state = createInitialState()
    const s1 = addCustomer(state, { name: 'Old Name', phone: '111' })
    const s2 = updateCustomer(s1, 'CUS-0001', { name: 'New Name' })

    expect(s2.customers[0].name).toBe('New Name')
    expect(s2.customers[0].phone).toBe('111')
  })

  it('deletes a customer', () => {
    const state = createInitialState()
    const s1 = addCustomer(state, { name: 'ToDelete', phone: '000' })
    const s2 = deleteCustomer(s1, 'CUS-0001')

    expect(s2.customers).toHaveLength(0)
  })
})

describe('Staff management', () => {
  it('initial state has default Admin staff STF-001', () => {
    const state = createInitialState()

    expect(state.staff).toHaveLength(1)
    expect(state.staff[0].id).toBe('STF-001')
    expect(state.staff[0].name).toBe('Admin')
    expect(state.staff[0].role).toBe('admin')
  })

  it('adds a new staff member with sequential ID', () => {
    const state = createInitialState()
    const updated = addStaff(state, { name: 'Ravi', pin: '5678', role: 'cashier' })

    expect(updated.staff).toHaveLength(2)
    expect(updated.staff[1].id).toBe('STF-002')
    expect(updated.staff[1].name).toBe('Ravi')
    expect(updated.staff[1].role).toBe('cashier')
  })

  it('authenticates staff with correct PIN', () => {
    const state = createInitialState()

    expect(authenticateStaff(state, 'STF-001', '1234')).toBe(true)
    expect(authenticateStaff(state, 'STF-001', '0000')).toBe(false)
    expect(authenticateStaff(state, 'STF-999', '1234')).toBe(false)
  })

  it('updates staff details', () => {
    const state = createInitialState()
    const updated = updateStaff(state, 'STF-001', { name: 'Super Admin', pin: '9999' })

    expect(updated.staff[0].name).toBe('Super Admin')
    expect(updated.staff[0].pin).toBe('9999')
    expect(updated.staff[0].role).toBe('admin')
  })

  it('deletes a staff member', () => {
    const state = createInitialState()
    const s1 = addStaff(state, { name: 'ToDelete', pin: '0000', role: 'cashier' })
    const s2 = deleteStaff(s1, 'STF-002')

    expect(s2.staff).toHaveLength(1)
    expect(s2.staff[0].id).toBe('STF-001')
  })
})
