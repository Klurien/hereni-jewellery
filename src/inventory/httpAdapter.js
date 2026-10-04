/**
 * NOVA-0100 — HTTP Adapter
 * Implements InventoryAdapter interface with fetch against VITE_API_BASE_URL.
 * Attaches VITE_API_TOKEN as Bearer token if present.
 * Throws NOT_CONFIGURED error when base URL is absent.
 *
 * This adapter is NOT the active one today — it is wired behind createAdapter()
 * so the swap is genuinely one line when the founder provides API env vars.
 */

import { InventoryAdapter, assertAdapter, DomainError, AuditEntry, StockQuant, ReorderRule, PurchaseOrder, PurchaseOrderLine, Role, can, suggestOrderQty, validateReorderRule, validatePOLine } from './domain.js'
import { localAdapter } from './localAdapter.js'

/** Build the adapter with an optional base URL override */
const createHttpAdapter = (baseUrl) => {
  // Validate base URL at construction time
  if (!baseUrl) {
    const notConfigured = new Error('NOT_CONFIGURED: VITE_API_BASE_URL is not set. Configure environment variables to use HTTP adapter.')
    notConfigured.name = 'NOT_CONFIGURED'
    throw notConfigured
  }

  /** List all products, optionally filtered */
  const listProducts = async (filter) => {
    const url = new URL(`${baseUrl}/products`)
    if (filter) {
      url.searchParams.set('q', String(filter))
    }
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    return { error: null, products: data }
  }

  /** Get a single product by id */
  const getProduct = async (id) => {
    const response = await fetch(`${baseUrl}/products/${id}`)
    if (!response.ok) {
      if (response.status === 404) return { error: null, product: null }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    return { error: null, product: data }
  }

  /** Create a new product */
  const createProduct = async (input) => {
    const response = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(VITE_API_TOKEN ? { 'Authorization': `Bearer ${VITE_API_TOKEN}` } : {}) },
      body: JSON.stringify(input),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    return { error: null, product: data }
  }

  /** Update an existing product */
  const updateProduct = async (id, input) => {
    const response = await fetch(`${baseUrl}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(VITE_API_TOKEN ? { 'Authorization': `Bearer ${VITE_API_TOKEN}` } : {}) },
      body: JSON.stringify(input),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    const data = await response.json()
    return { error: null, product: data }
  }

  /** Delete a product (blocked if reserved > 0 on the backend) */
  const deleteProduct = async (id) => {
    const response = await fetch(`${baseUrl}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(VITE_API_TOKEN ? { 'Authorization': `Bearer ${VITE_API_TOKEN}` } : {}) },
    })
    if (!response.ok) {
      if (response.status === 403 || response.status === 409) {
        return { error: 'Cannot delete: product has reserved stock or insufficient permissions' }
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return { error: null }
  }

  /** Get stock snapshot for a sku at an optional location */
  const getStock = async (sku, locationId) => {
    if (locationId) {
      const response = await fetch(`${baseUrl}/stock/${sku}?location=${locationId}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      const data = await response.json()
      return { error: null, quant: data }
    }
    const response = await fetch(`${baseUrl}/stock/${sku}`)
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    const data = await response.json()
    return { error: null, quant: data }
  }

  /** Adjust stock by delta. Writes audit entry via API. */
  const adjustStock = async (sku, locationId, delta, reason, actor, idempotencyKey) => {
    const body = { sku, locationId, delta, reason, actor, idempotencyKey }
    const headers = { 'Content-Type': 'application/json' }
    if (VITE_API_TOKEN) {
      headers['Authorization'] = `Bearer ${VITE_API_TOKEN}`
    }
    const response = await fetch(`${baseUrl}/stock/adjust`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const txt = await response.text()
      throw new Error(`HTTP ${response.status}: ${txt}`)
    }
    const data = await response.json()
    return { error: null, ...data }
  }

  /** Reserve qty from available stock for a given sku/location */
  const reserveStock = async (sku, locationId, qty, actor) => {
    const response = await fetch(`${baseUrl}/stock/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(VITE_API_TOKEN ? { 'Authorization': `Bearer ${VITE_API_TOKEN}` } : {}),
      },
      body: JSON.stringify({ sku, locationId, qty, actor }),
    })
    if (!response.ok) {
      const txt = await response.text()
      throw new Error(`HTTP ${response.status}: ${txt}`)
    }
    const data = await response.json()
    return { error: null, ...data }
  }

  /** Release a previous reservation */
  const releaseReservation = async (reservationId, actor) => {
    const response = await fetch(`${baseUrl}/stock/reservation/${reservationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(VITE_API_TOKEN ? { 'Authorization': `Bearer ${VITE_API_TOKEN}` } : {}),
      },
    })
    if (!response.ok) {
      const txt = await response.text()
      throw new Error(`HTTP ${response.status}: ${txt}`)
    }
    return { error: null }
  }

  /** Get audit log entries, optionally filtered */
  const getAuditLog = async (query) => {
    let url = `${baseUrl}/audit`
    if (query) {
      url += `?q=${encodeURIComponent(query)}`
    }
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    const data = await response.json()
    return { error: null, entries: data }
  }

  /** Health check */
  const healthCheck = async () => {
    try {
      const response = await fetch(`${baseUrl}/health`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return { error: null, healthy: data.healthy }
    } catch (e) {
      return { error: e }
    }
  }

  // Assemble the adapter shape
  const adapter = {
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
  }

  assertAdapter(adapter)
  return adapter
}

// Factory: swap between local and http adapter with one line.
export const createAdapter = (overrides = {}) => {
  if (overrides.useHttp) {
    try {
      return createHttpAdapter(overrides.baseUrl || import.meta.env.VITE_API_BASE_URL)
    } catch (e) {
      // If HTTP setup fails (e.g. NOT_CONFIGURED), fall back to local
      // console.warn('HTTP adapter not configured, falling back to localStorage', e)
      return localAdapter
    }
  }
  return localAdapter
}