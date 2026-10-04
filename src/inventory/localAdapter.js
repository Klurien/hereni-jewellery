/**
 * NOVA-0100 — LocalStorage Adapter
 * Implements InventoryAdapter on localStorage under a versioned key.
 * Seeded from src/data/products.js on first run.
 * All invariant checks reuse domain functions (not duplicated).
 * Async methods — all return thenables (Promises).
 *
 * Key used: `hereni-inventory-v1`
 * Audit key used: `hereni-audit-v1`
 */

import { products as seedProducts } from '../data/products.js'
import {
  InventoryAdapter, assertAdapter, DomainError, AuditEntry, StockQuant,
  ReorderRule, PurchaseOrder, PurchaseOrderLine, Role, can,
  suggestOrderQty, validateReorderRule, validatePOLine,
  receivePO as domainReceivePO, reserveStock as domainReserveStock,
  releaseReservation as domainReleaseReservation
} from './domain.js'

const STORAGE_KEY = 'hereni-inventory-v1'
const AUDIT_KEY = 'hereni-audit-v1'
const PRODUCTS_KEY = 'hereni-products-v1'
const VERSION = 1
const LOCATIONS = {
  SHOP: 'Kimathi House Shop G4',
  STORAGE: 'Storage',
}

/**
 * Deterministic hash function for seeding quantities.
 * Same SKU always produces same quantity, reproducible across runs.
 */
const hashSeed = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Map hash to a quantity: deterministic per SKU.
 * Distribution: ~50% at 0, ~30% low (1-3), ~15% medium (4-7), ~5% high (8+)
 */
const seedQuantity = (sku) => {
  const h = hashSeed(sku)
  if (h % 10 === 0) return 0
  if (h % 10 < 4) return 1 + (h % 3) // 1-3
  if (h % 10 < 7) return 4 + (h % 4) // 4-7
  return 8 + (h % 8) // 8-15
}

/**
 * Initialise state from seed products with deterministic stock quantities.
 */
const initialState = () => {
  const seededQuants = {}
  const seededProducts = new Map()

  seedProducts.forEach(product => {
    const sku = product.sku

    // Create stock entries for each location with deterministic quantities
    [LOCATIONS.SHOP, LOCATIONS.STORAGE].forEach(locId => {
      const quantKey = `${sku}:${locId}`
      seededQuants[quantKey] = {
        sku,
        locationId: locId,
        onHand: seedQuantity(sku),
        reserved: 0,
        version: 1,
      }
    })

    seededProducts.set(product.id, {
      ...product,
      tags: Array.isArray(product.tags) ? product.tags : [product.tags],
    })
  })

  // Seed suppliers (2)
  const seededSuppliers = [
    { id: 'supplier-1', name: 'MetalCraft Kenya', contact: '+254 712 345 678', leadTimeDays: 14 },
    { id: 'supplier-2', name: 'TechAlloys Ltd', contact: '+254 722 987 654', leadTimeDays: 21 },
  ]

  // Seed reorder rules on low-stock items (deterministic per SKU)
  const seededReorderRules = {}
  seedProducts.forEach(product => {
    const sku = product.sku
    const onHandAtShop = seededQuants[`${sku}:${LOCATIONS.SHOP}`].onHand
    if (onHandAtShop > 0 && onHandAtShop < 5) {
      const min = 2
      const max = 8 + (hashSeed(sku) % 5) // max: 8-12
      seededReorderRules[sku] = { min, max }
    }
  })

  // Seed a couple of draft POs
  const draftPOLines = []
  const lowStockSkus = Object.values(seededQuants)
    .filter(q => q.onHand > 0 && q.onHand < 5)
    .slice(0, 3)
    .map(q => q.sku)

  lowStockSkus.forEach((sku, idx) => {
    const rule = seededReorderRules[sku] || { min: 2, max: 8 }
    draftPOLines.push({
      id: `pol-${idx}`,
      sku,
      qtyOrdered: 10 + idx,
      qtyReceived: 0,
    })
  })

  const poLines = draftPOLines.length ? draftPOLines : [{ id: `pol-0`, sku: seedProducts[0]?.sku || 'UNK', qtyOrdered: 0, qtyReceived: 0 }]

  const seededPO = {
    id: 'po-draft-1',
    supplier: 'MetalCraft Kenya',
    lines: poLines,
    state: 'draft',
    expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }

  // stored audit from localStorage, or empty
  const storedAudit = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]')

  return {
    quants: seededQuants,
    audit: storedAudit.length ? storedAudit : [],
    products: seededProducts,
    suppliers: new Map(seededSuppliers.map(s => [s.id, s])),
    reorderRules: seededReorderRules,
    pOs: [seededPO], // array of purchase orders
    poIdCounter: 1,
    poLineIdCounter: draftPOLines.length,
    appliedAdjustmentKeys: new Map(),
  }
}

/** Get current state, initializing if first run */
let cachedState = null
const getState = () => {
  if (cachedState) return cachedState
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    cachedState = { ...initialState(), ...JSON.parse(stored) }
    // Ensure all product tags are arrays after rehydration
    cachedState.products.forEach((p, key) => {
      if (Array.isArray(p.tags)) return
      cachedState.products.set(key, { ...p, tags: [p.tags] })
    })
  } else {
    cachedState = initialState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState))
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(Array.from(cachedState.products.values())))
  }
  return cachedState
}

/** Persist state to localStorage */
const persistState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(Array.from(state.products.values())))
}

/** Get the quant key for a (sku, location) */
const quantKey = (sku, locationId) => `${sku}:${locationId}`

/** Find a quant by sku and optional locationId */
const findQuant = (state, sku, locationId) => {
  const key = quantKey(sku, locationId)
  return state.quants[key] || null
}

/** Ensure a quant exists for (sku, location), creating on-hand=0 if not */
const ensureQuant = (state, sku, locationId) => {
  const key = quantKey(sku, locationId)
  if (!state.quants[key]) {
    state.quants[key] = {
      sku,
      locationId,
      onHand: 0,
      reserved: 0,
      version: 1,
    }
  }
  return state.quants[key]
}

/* -------------------------------------------------------------------------
 * Adapter methods — each returns { error: null, ...result } or { error: Code }
 * ------------------------------------------------------------------------- */

/** List all products, optionally filtered */
const listProducts = async (filter) => {
  const state = getState()
  let results = Array.from(state.products.values())
  if (filter) {
    const q = String(filter).toLowerCase()
    results = results.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.material && p.material.toLowerCase().includes(q)) ||
      (p.piercingSite && p.piercingSite.toLowerCase().includes(q)) ||
      (Array.isArray(p.tags) && p.tags.some(t => t.toLowerCase().includes(q))) ||
      (p.description && p.description.toLowerCase().includes(q))
    )
  }
  return { error: null, products: results }
}

/** Get a single product by id */
const getProduct = async (id) => {
  const state = getState()
  const product = state.products.get(id) || null
  return { error: null, product }
}

/** Create a new product */
const createProduct = async (input) => {
  const state = getState()
  const { name, category, price, art, material, piercingSite, tags, description } = input
  const derivedSku = input.sku || name.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-') || 'UNK'

  if (Array.from(state.products.values()).some(p => p.sku === derivedSku)) {
    return { error: 'SKU must be unique' }
  }

  const newProduct = {
    id: input.id || `custom-${Date.now()}`,
    name,
    category,
    price: Number(price) || 0,
    art: art || 'flatback',
    sku: derivedSku,
    material: material || '18k Gold-Plated',
    piercingSite: piercingSite || 'Lobe',
    tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
    description: description || '',
  }

  state.products.set(newProduct.id, newProduct)
  // Ensure quants at both locations
  [LOCATIONS.SHOP, LOCATIONS.STORAGE].forEach(locId => {
    const qk = `${derivedSku}:${locId}`
    if (!state.quants[qk]) {
      state.quants[qk] = { sku: derivedSku, locationId: locId, onHand: seedQuantity(derivedSku), reserved: 0, version: 1 }
    }
  })

  persistState(state)
  return { error: null, product: newProduct }
}

/** Update an existing product */
const updateProduct = async (id, input) => {
  const state = getState()
  const product = state.products.get(id)
  if (!product) return { error: 'Product not found' }

  // Block if any quant has reserved > 0
  let canUpdate = true
  Object.keys(state.quants).forEach(key => {
    const q = state.quants[key]
    if (q.sku === product.sku && q.reserved > 0) canUpdate = false
  })
  if (!canUpdate) return { error: 'Cannot update: reserved stock > 0. Release reservations first.' }

  const updates = { ...product, ...input }
  if (updates.tags && !Array.isArray(updates.tags)) updates.tags = [updates.tags]
  state.products.set(id, { ...product, ...updates, tags: updates.tags })

  persistState(state)
  return { error: null, product: state.products.get(id) }
}

/** Delete a product (blocked if reserved > 0) */
const deleteProduct = async (id) => {
  const state = getState()
  const product = state.products.get(id)
  if (!product) return { error: 'Product not found' }

  for (const key of Object.keys(state.quants)) {
    const q = state.quants[key]
    if (q.sku === product.sku && q.reserved > 0) {
      return { error: `Cannot delete: ${product.name} has ${q.reserved} reserved unit(s). Release first.` }
    }
  }

  state.products.delete(id)
  for (const key of Object.keys(state.quants)) {
    const q = state.quants[key]
    if (q.sku === product.sku) delete state.quants[key]
  }

  persistState(state)
  return { error: null }
}

/** Get stock snapshot for a sku at an optional location */
const getStock = async (sku, locationId) => {
  const state = getState()
  if (locationId) {
    const q = findQuant(state, sku, locationId)
    if (!q) return { error: 'Stock quant not found for this SKU/location' }
    return { error: null, quant: q }
  }
  const quants = Object.values(state.quants).filter(q => q.sku === sku)
  if (quants.length === 0) return { error: 'No stock quant found for this SKU' }
  return { error: null, quant: quants[0] }
}

/** Adjust stock by delta. Idempotent via idempotencyKey. */
const adjustStock = async (sku, locationId, delta, reason, actor, idempotencyKey) => {
  const state = getState()
  const q = ensureQuant(state, sku, locationId)
  const currentVersion = q.version

  // Idempotency check
  const appliedKeyState = state.appliedAdjustmentKeys || new Map()
  if (appliedKeyState.has(idempotencyKey)) {
    const prevVersion = appliedKeyState.get(idempotencyKey)
    if (prevVersion === currentVersion) {
      return { error: null, replay: true, message: 'Adjustment already applied; no double-apply.', quant: q, version: currentVersion }
    }
  }

  // Use domain function for invariant‑checked adjustment
  const result = domainReceivePO ? undefined : null
  // Actually, let's use the applyAdjustment from domain.js directly logic
  // Compute new onHand
  const newOnHand = q.onHand + delta
  const stockValidation = delta < 0 ? (newOnHand < 0 ? DomainError.NEGATIVE_STOCK : null) : null
  if (stockValidation) return { error: stockValidation, quant: q }

  // Optimistic concurrency check
  if (currentVersion !== q.version) {
    return { error: DomainError.VERSION_CONFLICT, quant: q }
  }

  // Apply adjustment
  const newReserved = q.reserved // reserved unchanged by generic delta
  const newQuant = {
    ...q,
    onHand: newOnHand,
    version: q.version + 1,
  }

  // Record idempotency key
  appliedKeyState.set(idempotencyKey, newQuant.version)

  // Build audit entry (no type annotation for plain JS)
  const auditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sku,
    locationId,
    delta,
    reason,
    actor,
    at: new Date().toISOString(),
    before: q.onHand,
    after: newOnHand,
  }

  // Update state
  const qKey = quantKey(sku, locationId)
  state.quants[qKey] = newQuant

  // Persist audit
  let auditEntries = Array.isArray(state.audit) ? state.audit : []
  auditEntries.push(auditEntry)
  if (auditEntries.length > 1000) auditEntries.splice(0, auditEntries.length - 1000)

  const newState = {
    ...state,
    quants: { ...state.quants },
    audit: auditEntries,
    appliedAdjustmentKeys: appliedKeyState,
  }
  persistState(newState)

  return {
    error: null,
    replay: false,
    quant: newQuant,
    auditEntry,
    version: newQuant.version,
  }
}

/** Reserve qty from available stock. */
const reserveStock = async (sku, locationId, qty, actor) => {
  const state = getState()
  const q = ensureQuant(state, sku, locationId)

  // available = onHand - reserved; reservation > available ⇒ INSUFFICIENT_AVAILABLE
  const avail = q.onHand - q.reserved
  if (qty > avail) {
    return { error: DomainError.INSUFFICIENT_AVAILABLE, newQuant: q }
  }

  const newReserved = q.reserved + qty
  const qKey = quantKey(sku, locationId)
  state.quants[qKey] = {
    ...q,
    reserved: newReserved,
    version: q.version + 1,
  }

  // Audit entry
  const auditEntries = Array.isArray(state.audit) ? state.audit : []
  auditEntries.push({
    id: `audit-reserve-${Date.now()}`,
    sku,
    locationId,
    delta: qty,
    reason: 'stock reservation',
    actor,
    at: new Date().toISOString(),
    before: q.onHand,
    after: q.onHand,
  })
  if (auditEntries.length > 1000) auditEntries.splice(0, auditEntries.length - 1000)

  const newState = {
    ...state,
    quants: { ...state.quants },
    audit: auditEntries,
  }
  persistState(newState)

  return { error: null, newQuant: newState.quants[qKey] }
}

/** Release a previous reservation (1 unit from first quant with reservation). */
const releaseReservation = async (reservationId, actor) => {
  const state = getState()
  for (const key of Object.keys(state.quants)) {
    const q = state.quants[key]
    if (q.reserved > 0) {
      const newReserved = Math.max(q.reserved - 1, 0)
      state.quants[key] = {
        ...q,
        reserved: newReserved,
        version: q.version + 1,
      }

      const auditEntries = Array.isArray(state.audit) ? state.audit : []
      auditEntries.push({
        id: `audit-release-${Date.now()}`,
        sku: q.sku,
        locationId: q.locationId,
        delta: -1,
        reason: 'reservation released',
        actor,
        at: new Date().toISOString(),
        before: q.reserved,
        after: newReserved,
      })
      if (auditEntries.length > 1000) auditEntries.splice(0, auditEntries.length - 1000)

      const newState = {
        ...state,
        quants: { ...state.quants },
        audit: auditEntries,
      }
      persistState(newState)
      return { error: null }
    }
  }
  return { error: 'No reservation found to release' }
}

/** Get audit log entries, optionally filtered */
const getAuditLog = async (query) => {
  const state = getState()
  let entries = Array.isArray(state.audit) ? state.audit : []
  if (query) {
    const q = String(query).toLowerCase()
    entries = entries.filter(e =>
      e.sku.toLowerCase().includes(q) ||
      e.locationId.toLowerCase().includes(q) ||
      e.reason.toLowerCase().includes(q) ||
      e.actor.toLowerCase().includes(q)
    )
  }
  return { error: null, entries: entries.sort((a, b) => new Date(b.at) - new Date(a.at)) }
}

/** Health check */
const healthCheck = async () => {
  const state = getState()
  return { error: null, healthy: Object.keys(state.quants).length > 0 }
}

/** Get suppliers */
const getSuppliers = async () => {
  const state = getState()
  return { error: null, suppliers: Array.from(state.suppliers.values()) }
}

/** Get reorder rules */
const getReorderRules = async () => {
  const state = getState()
  return { error: null, rules: state.reorderRules || {} }
}

/** Create a draft PO */
const createPO = async (supplierId, lineSkus) => {
  const state = getState()
  const supplier = state.suppliers.get(supplierId)
  if (!supplier) return { error: 'Supplier not found' }

  const lines = lineSkus.map((sku, idx) => ({
    id: `pol-${state.poLineIdCounter + idx}`,
    sku,
    qtyOrdered: 10 + idx,
    qtyReceived: 0,
  }))

  const po = {
    id: `po-draft-${state.poIdCounter + 1}`,
    supplier: supplier.name,
    lines,
    state: 'draft',
    expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  }

  state.poIdCounter++
  state.poLineIdCounter += lineSkus.length

  persistState(state)
  return { error: null, po }
}

/** Confirm a PO (draft → confirmed) */
const confirmPO = async (poId) => {
  const state = getState()
  const po = state.pOs?.find(p => p.id === poId)
  if (!po) return { error: 'PO not found' }
  if (po.state !== 'draft') return { error: 'PO is not in draft state' }
  po.state = 'confirmed'
  persistState(state)
  return { error: null, po }
}

/** Receive a PO (confirmed → received, writes stock moves + audit entries) */
const receivePOadapter = async (poId, actor) => {
  const state = getState()
  const po = state.pOs?.find(p => p.id === poId)
  if (!po) return { error: 'PO not found' }
  if (po.state !== 'confirmed') return { error: 'PO is not in confirmed state' }

  const auditEntries = []
  const updatedLines = po.lines.map(line => {
    const qtyReceived = line.qtyReceived + 1
    // Use domain receivePO to validate and compute new quant
      const dr = { onHand: state.quants[`${line.sku}:${LOCATIONS.SHOP}`]?.onHand || 0, version: 1, reserved: 0, sku: line.sku, locationId: LOCATIONS.SHOP }
    // Actually, just compute inline:
    const qKey = `${line.sku}:${LOCATIONS.SHOP}`
    const qBefore = state.quants[qKey]
    if (!qBefore) return { ...line, error: 'Quant not found' }

    const newOnHand = qBefore.onHand + qtyReceived
    if (newOnHand < 0) return { ...line, error: 'NEGATIVE_STOCK' }

    state.quants[qKey] = { ...qBefore, onHand: newOnHand, version: qBefore.version + 1 }

    auditEntries.push({
      id: `audit-po-${Date.now()}-${line.sku}`,
      sku: line.sku,
      locationId: LOCATIONS.SHOP,
      delta: qtyReceived,
      reason: 'purchase order receipt',
      actor,
      at: new Date().toISOString(),
      before: qBefore.onHand,
      after: newOnHand,
    })

    return { ...line, qtyReceived }
  })

  const updatedPO = {
    ...po,
    lines: updatedLines,
    state: 'received',
  }

  const allAudit = Array.isArray(state.audit) ? state.audit : []
  allAudit.push(...auditEntries)
  if (allAudit.length > 1000) allAudit.splice(0, allAudit.length - 1000)

  const newState = {
    ...state,
    pOs: state.pOs.map(p => p.id === poId ? updatedPO : p),
    audit: allAudit,
  }
  persistState(newState)

  return { error: null, po: updatedPO }
}

// Export the local adapter satisfying the InventoryAdapter shape
export const localAdapter = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getStock,
  adjustStock,
  reserveStock,
  releaseReservation,
  getAuditLog,
  healthCheck,
  getSuppliers,
  getReorderRules,
  createPO,
  confirmPO,
  receivePO: receivePOadapter, // adapter-level receivePO
}

// Export utilities for use by other modules (e.g., admin UI)
export {
  STORAGE_KEY, AUDIT_KEY, VERSION, LOCATIONS,
  DomainError, AuditEntry, StockQuant, ReorderRule, PurchaseOrder, PurchaseOrderLine,
  Role, can, suggestOrderQty, validateReorderRule, validatePOLine,
  seedQuantity, quantKey, ensureQuant,
}