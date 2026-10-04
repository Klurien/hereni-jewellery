/**
 * NOVA-0100 — Inventory Adapter Port
 * JSDoc‑defined interface + runtime assertion helper.
 * Adapters (localStorage or fetch) must satisfy this shape.
 * UI components import only from this module — never touch localStorage directly.
 */

/** Unique idempotency key max age (ops older than this are dropped from cache) */
export const IDempotencyMaxAgeMs = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * InventoryAdapter — all methods are async and operate on localStorage (or remote).
 * Implement this shape in localAdapter.js or httpAdapter.js.
 *
 * Note: the "actor" field in every mutation should be the client-side role name
 * (e.g. 'admin', 'manager') for preview purposes. The real backend will replace
 * this with authenticated user IDs.
 */
export const InventoryAdapter = {
  /** List all products, optionally filtered */
  listProducts: async function (_filter) { throw new Error('not implemented') },

  /** Get a single product by id */
  getProduct: async function (_id) { throw new Error('not implemented') },

  /** Create a new product */
  createProduct: async function (_input) { throw new Error('not implemented') },

  /** Update an existing product */
  updateProduct: async function (_id, _input) { throw new Error('not implemented') },

  /** Delete a product (blocked if reserved > 0) */
  deleteProduct: async function (_id) { throw new Error('not implemented') },

  /** Get stock snapshot for a sku at an optional location */
  getStock: async function (_sku, _locationId) { throw new Error('not implemented') },

  /** Adjust stock by delta (positive or negative). Writes audit entry. */
  adjustStock: async function (_sku, _locationId, _delta, _reason, _actor, _idempotencyKey) {
    throw new Error('not implemented')
  },

  /** Reserve qty from available stock for a given sku/location */
  reserveStock: async function (_sku, _locationId, _qty, _actor) {
    throw new Error('not implemented')
  },

  /** Release a previous reservation */
  releaseReservation: async function (_reservationId, _actor) {
    throw new Error('not implemented')
  },

  /** Get audit log entries, optionally filtered */
  getAuditLog: async function (_query) {
    throw new Error('not implemented')
  },

  /** Health check */
  healthCheck: async function () {
    throw new Error('not implemented')
  },
}

/**
 * Runtime assertion: ensures the given adapter satisfies the InventoryAdapter shape.
 * Throws if any required method is missing or not a function.
 */
export const assertAdapter = (adapter) => {
  const required = [
    'listProducts', 'getProduct', 'createProduct', 'updateProduct', 'deleteProduct',
    'getStock', 'adjustStock', 'reserveStock', 'releaseReservation', 'getAuditLog', 'healthCheck'
  ]
  for (const method of required) {
    if (!(method in adapter)) {
      throw new Error(`Missing required adapter method: ${method}`)
    }
    if (typeof adapter[method] !== 'function') {
      throw new Error(`Adapter method ${method} is not a function`)
    }
  }
  // Optional: verify return types are Promises (thenable)
  for (const method of required) {
    const result = adapter[method]()
    if (result && typeof result.catch !== 'function' && typeof result.then !== 'function' && !Array.isArray(result)) {
      // Allow plain values that the caller wraps; just warn
      // console.warn(`Adapter method ${method} does not return a thenable`)
    }
  }
}

/** Factory: swap between local and http adapter with one line. */
export const createAdapter = (overrides = {}) => {
  // If VITE_API_BASE_URL is set, use HTTP adapter (but only if token is also considerations)
  // For now localAdapter always ships; the factory can be swapped when founder provides env vars.
  // This function exists so that when the founder adds VITE_API_BASE_URL, we switch in one line.
  if (overrides.useHttp) {
    return createHttpAdapter(overrides.baseUrl || import.meta.env.VITE_API_BASE_URL)
  }
  return createLocalAdapter()
}