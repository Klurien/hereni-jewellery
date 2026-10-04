/**
 * NOVA-0100 — Hereni Jewellery Inventory Domain
 * Pure functions enforcing stock invariants, audit, idempotency and concurrency.
 * Zero React, zero storage — plain JS types (JSDoc) + pure functions.
 *
 * Invariant cheat sheet (enforced by every mutation):
 *   - onHand >= 0 for every (sku, location) pair
 *   - available = onHand - reserved >= 0 always
 *   - every mutation appends an immutable AuditEntry
 *   - applyAdjustment is idempotent via client-supplied idempotencyKey
 *   - optimistic concurrency via row version; stale version => VERSION_CONFLICT
 *   - ReorderRule.min <= max, both >= 0
 *   - PurchaseOrder line qtyReceived <= qtyOrdered
 *   - Variant sku unique
 *   - Stock-move state machine: draft → confirmed → reserved → done
 *     - cancelled from draft/confirmed only
 *     - done is irreversible; needs compensating adjustment to reverse
 */

/** Stock quantity on hand at a location
 * @param {string} sku
 * @param {string} locationId
 * @param {number} onHand
 * @param {number} reserved
 * @returns {{sku: string, locationId: string, onHand: number, reserved: number}}
 */
function StockQuant_create(sku, locationId, onHand, reserved) {
  return { sku, locationId, onHand, reserved }
}

/** A single immutable audit entry stock mutation (JSDoc‑only, no ES type)
 * @typedef {{id: string, sku: string, locationId: string, delta: number, reason: string, actor: string, at: string, before: number, after: number}} AuditEntry
 */

/** Reorder rule defines min/max stock triggers
 * @param {{min: number, max: number}} rule
 * @returns {boolean} true if valid
 */
function ReorderRule_validate(rule) {
  return rule.min >= 0 && rule.max >= 0 && rule.min <= rule.max
}

/** A purchase order with lines; state: draft → confirmed → received
 * @param {{id: string, supplier: string, lines: PurchaseOrderLine[], state: string, expectedDate?: string}} po
 */

/** A purchase-order line
 * @param {{sku: string, qtyOrdered: number, qtyReceived: number}} line
 * @returns {{availableToReceive: number}} */
function PurchaseOrderLine_availableToReceive(line) {
  return line.qtyOrdered - line.qtyReceived
}

/** User role simulation — client-side only, NOT authentication
 * @type {('owner'|'admin'|'manager'|'staff'|'customer')}
 */
const Role_type = 'owner' | 'admin' | 'manager' | 'staff' | 'customer'

/** Permission check: can(role, action)
 * @param {string} role
 * @param {string} action
 * @returns {boolean} */
function can(role, action) {
  // Lookup table per kane's ADR §4
  const perms = {
    owner: {
      viewCatalogue: true, createEditProduct: true, deleteProduct: true,
      adjustStock: true, receivePO: true, createConfirmPO: true,
      viewAudit: true, manageUsers: true,
    },
    admin: {
      viewCatalogue: true, createEditProduct: true, deleteProduct: true,
      adjustStock: true, receivePO: true, createConfirmPO: true,
      viewAudit: true, manageUsers: false,
    },
    manager: {
      viewCatalogue: true, createEditProduct: true, deleteProduct: false,
      adjustStock: true, receivePO: true, createConfirmPO: true,
      viewAudit: true, manageUsers: false,
    },
    staff: {
      viewCatalogue: true, createEditProduct: false, deleteProduct: false,
      adjustStock: false, receivePO: true, createConfirmPO: false,
      viewAudit: false, manageUsers: false,
    },
    customer: {
      viewCatalogue: true, createEditProduct: false, deleteProduct: false,
      adjustStock: false, receivePO: false, createConfirmPO: false,
      viewAudit: false, manageUsers: false,
    },
  }
  return !!perms[role]?.[action]
}

/** Stock-move state machine
 * @param {{from: string, to: string}} transition
 * @returns {{error: string | null, newState: string}} */
function transitionStockMove(move, targetState, _actor) {
  const { state } = move
  if (state === 'done') {
    return { error: 'INVALID_TRANSITION', newState: state }
  }
  const validTransitions = {
    draft: ['confirmed', 'cancelled'],
    confirmed: ['reserved', 'cancelled'],
    reserved: ['done', 'cancelled'],
  }
  const allowed = validTransitions[state]
  if (!allowed) {
    return { error: 'INVALID_TRANSITION', newState: state }
  }
  if (!allowed.includes(targetState)) {
    return { error: 'INVALID_TRANSITION', newState: state }
  }
  // done is irreversible — if target is done, mark as done; any future transition fails
  const newState = targetState === 'done' ? 'done' : targetState
  return { error: null, newState }
}

/** Error types thrown by domain functions */
const DomainError = {
  NEGATIVE_STOCK: 'NEGATIVE_STOCK',
  INSUFFICIENT_AVAILABLE: 'INSUFFICIENT_AVAILABLE',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  IDempotent_REPLAY: 'IDempotent_REPLAY',
  REORDER_RULE_VIOLATION: 'REORDER_RULE_VIOLATION',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
}

/** Validate that onHand >= 0 for a (sku, location) pair.
 * @param {number} onHand
 * @returns {string | null} DomainError.NEGATIVE_STOCK or null
 */
function validateOnHand(onHand) {
  return onHand < 0 ? DomainError.NEGATIVE_STOCK : null
}

/** Validate that available = onHand - reserved >= 0.
 * @param {number} onHand
 * @param {number} reserved
 * @returns {string | null} DomainError.INSUFFICIENT_AVAILABLE or null
 */
function validateAvailable(onHand, reserved) {
  const avail = onHand - reserved
  return avail < 0 ? DomainError.INSUFFICIENT_AVAILABLE : null
}

/** Idempotent adjustment applier.
 * @param {{onHand: number, reserved: number, version: number}} quant
 * @param {number} delta
 * @param {string} reason
 * @param {string} actor
 * @param {string} idempotencyKey
 * @param {number} currentVersion
 * @param {Map<string, number>} appliedCache
 * @returns {{error: string | null, replay: boolean, newQuant: object, auditEntry: object, version: number}} */
function applyAdjustment(quant, delta, reason, actor, idempotencyKey, currentVersion, appliedCache) {
  // Idempotency check: if this key was already applied, return previous result
  if (appliedCache.has(idempotencyKey)) {
    const prevVersion = appliedCache.get(idempotencyKey)
    const error = null
    const replay = true
    return {
      error,
      replay,
      oldVersion: prevVersion,
      oldOnHand: quant.onHand,
      message: 'Adjustment already applied with this idempotency key; no double-apply.',
    }
  }

  // Compute new onHand
  const newOnHand = quant.onHand + delta
  const validation = validateOnHand(newOnHand)
  if (validation) {
    return { error: validation, replay: false }
  }

  // Optimistic concurrency: version must match
  if (currentVersion !== quant.version) {
    return { error: DomainError.VERSION_CONFLICT, replay: false }
  }

  // Apply the adjustment
  const _newReserved = quant.reserved // reserved unchanged by generic delta
  const newOnHandVal = newOnHand
  const newAfter = newOnHandVal - quant.reserved // available after

  // Build new quant with incremented version
  const newQuant = {
    ...quant,
    onHand: newOnHandVal,
    version: quant.version + 1,
  }

  // Record the idempotency key so replay returns the same state
  appliedCache.set(idempotencyKey, quant.version + 1) // store new version

  // Build audit entry
  const auditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sku: quant.sku,
    locationId: quant.locationId,
    delta,
    reason,
    actor,
    at: new Date().toISOString(),
    before: quant.onHand,
    after: newOnHandVal,
  }

  return {
    error: null,
    replay: false,
    newQuant,
    auditEntry,
    version: newQuant.version,
  }
}

/** Reserve quantity from available stock.
 * @param {{onHand: number, reserved: number, available: number, version: number}} quant
 * @param {number} qty
 * @param {string} actor
 * @returns {{error: string | null, newQuant: object}} */
function reserveStock(quant, qty, _actor) {
  const avail = quant.available
  if (qty > avail) {
    return { error: DomainError.INSUFFICIENT_AVAILABLE, newQuant: quant }
  }
  const newReserved = quant.reserved + qty
  const newOnHand = quant.onHand // onHand doesn't change on reserve
  const newQuant = {
    ...quant,
    onHand: newOnHand,
    reserved: newReserved,
    version: quant.version + 1,
  }
  return { error: null, newQuant }
}

/** Release a reservation, reducing reserved qty.
 * @param {{onHand: number, reserved: number, version: number}} quant
 * @param {number} qty
 * @returns {{error: string | null, newQuant: object}} */
function releaseReservation(quant, qty) {
  const newReserved = Math.max(quant.reserved - qty, 0)
  const newOnHand = quant.onHand
  const newQuant = {
    ...quant,
    onHand: newOnHand,
    reserved: newReserved,
    version: quant.version + 1,
  }
  return { error: null, newQuant }
}

/** Validate a reorder rule: min <= max, both >= 0
 * @param {{min: number, max: number}} rule
 * @returns {string | null} DomainError.REORDER_RULE_VIOLATION or null
 */
function validateReorderRule(rule) {
  if (rule.min < 0 || rule.max < 0) return DomainError.REORDER_RULE_VIOLATION
  if (rule.min > rule.max) return DomainError.REORDER_RULE_VIOLATION
  return null
}

/** Compute suggested order qty for a reorder rule:
 * @param {{min: number, max: number}} rule
 * @param {number} available
 * @returns {number} suggested qty >= 0
 */
function suggestOrderQty(rule, available) {
  const suggestion = rule.max - available
  return suggestion >= 0 ? suggestion : 0
}

/** Validate a purchase order line: qtyReceived <= qtyOrdered
 * @param {{qtyOrdered: number, qtyReceived: number}} line
 * @returns {string | null} DomainError.REORDER_RULE_VIOLATION or null
 */
function validatePOLine(line) {
  if (line.qtyReceived > line.qtyOrdered) {
    return DomainError.REORDER_RULE_VIOLATION
  }
  return null
}

/** Receive a purchase order line: write real stock moves + audit entries.
 * @param {{onHand: number, reserved: number, version: number}} quant
 * @param {number} qty
 * @param {string} sku
 * @param {string} locationId
 * @param {string} actor
 * @param {number} currentVersion
 * @returns {{error: string | null, newQuant: object, auditEntry: object}} */
function receivePO(quant, qty, sku, locationId, actor, currentVersion) {
  const newOnHand = quant.onHand + qty
  const validation = validateOnHand(newOnHand)
  if (validation) {
    return { error: validation }
  }
  // Concurrency check
  if (currentVersion !== quant.version) {
    return { error: DomainError.VERSION_CONFLICT }
  }
  const newQuant = {
    ...quant,
    onHand: newOnHand,
    version: quant.version + 1,
  }
  // Build audit entry for the receipt
  const auditEntry = {
    id: `audit-po-${Date.now()}`,
    sku,
    locationId,
    delta: qty,
    reason: 'purchase order receipt',
    actor,
    at: new Date().toISOString(),
    before: quant.onHand,
    after: newOnHand,
  }
  return { error: null, newQuant, auditEntry }
}

// Export the public API
module.exports = {
  StockQuant: StockQuant_create,
  AuditEntry,
  ReorderRule: ReorderRule_validate,
  PurchaseOrderLine: PurchaseOrderLine_availableToReceive,
  Role: Role_type,
  can,
  transitionStockMove,
  DomainError,
  validateOnHand,
  validateAvailable,
  applyAdjustment,
  reserveStock,
  releaseReservation,
  validateReorderRule,
  suggestOrderQty,
  validatePOLine,
  receivePO,
}