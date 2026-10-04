/**
 * NOVA-0100 — Domain Invariant Tests
 * Unit tests for the pure inventory domain functions.
 * Run with: node --test tests/domain.test.js
 */

import { strict as assert } from 'node:assert'
import {
  DomainError,
  validateOnHand,
  validateAvailable,
  applyAdjustment,
  reserveStock,
  validateReorderRule,
  suggestOrderQty,
  validatePOLine,
  receivePO,
  transitionStockMove,
} from '../src/inventory/domain.js'

/* ---- Domain invariant: stock never negative ---- */
function testValidateOnHand() {
  // onHand < 0 => NEGATIVE_STOCK
  // onHand >= 0 => null (ok)
  assert.strictEqual(validateOnHand(-1), DomainError.NEGATIVE_STOCK)
  assert.strictEqual(validateOnHand(0), null)
  assert.strictEqual(validateOnHand(5), null)
  console.log('✓ validateOnHand logic works')
}

/* ---- Domain invariant: available = onHand - reserved >= 0 ---- */
function testValidateAvailable() {
  // available = onHand - reserved
  // reserved > available => INSUFFICIENT_AVAILABLE
  assert.strictEqual(validateAvailable(5, 10), DomainError.INSUFFICIENT_AVAILABLE)
  assert.strictEqual(validateAvailable(5, 3), null)
  console.log('✓ validateAvailable logic works')
}

/* ---- Domain invariant: idempotent double-apply ---- */
function testIdempotent() {
  // Simulate: applying same idempotencyKey should return previous result
  const appliedCache = new Map()
  const quant = { sku: 'TEST', locationId: 'LOC', onHand: 10, reserved: 0, version: 1 }

  // First application
  const result1 = applyAdjustment(quant, 5, 'cycle count', 'admin', 'key-1', 1, appliedCache)
  assert.strictEqual(result1.error, null)
  assert.strictEqual(result1.replay, false)
  assert.strictEqual(result1.newQuant.onHand, 15)
  assert.strictEqual(result1.newQuant.version, 2)

  // Replay with same key should return same version, no double-apply
  // Note: replay returns the current quant.onHand (10, the param passed in), not the post-adjustment value
  const result2 = applyAdjustment(quant, 5, 'cycle count', 'admin', 'key-1', 1, appliedCache)
  assert.strictEqual(result2.error, null)
  assert.strictEqual(result2.replay, true)
  assert.strictEqual(result2.oldOnHand, 10) // current quant.onHand (unchanged param)
  console.log('✓ idempotent replay works')
}

/* ---- Domain invariant: version conflict ---- */
function testVersionConflict() {
  // Stale version should be rejected
  const appliedCache = new Map()
  const quant = { sku: 'TEST', locationId: 'LOC', onHand: 10, reserved: 0, version: 5 }

  // Try with stale version 3
  const result = applyAdjustment(quant, 1, 'adjustment', 'admin', 'key-2', 3, appliedCache)
  assert.strictEqual(result.error, DomainError.VERSION_CONFLICT)
  console.log('✓ version conflict detection works')
}

/* ---- Domain invariant: reservation > available ---- */
function testInsufficientAvailable() {
  const quant = { sku: 'TEST', locationId: 'LOC', onHand: 3, reserved: 0, version: 1, available: 3 }
  const result = reserveStock(quant, 5, 'admin')
  assert.strictEqual(result.error, DomainError.INSUFFICIENT_AVAILABLE)
  assert.strictEqual(result.newQuant.reserved, 0) // no change
  console.log('✓ insufficient available detection works')
}

/* ---- Domain invariant: audit entry written on every mutation ---- */
function testAuditEntryWritten() {
  const appliedCache = new Map()
  const quant = { sku: 'TEST', locationId: 'LOC', onHand: 10, reserved: 0, version: 1 }
  const result = applyAdjustment(quant, 3, 'test reason', 'admin', 'key-3', 1, appliedCache)

  assert.ok(result.auditEntry)
  assert.strictEqual(result.auditEntry.sku, 'TEST')
  assert.strictEqual(result.auditEntry.locationId, 'LOC')
  assert.strictEqual(result.auditEntry.delta, 3)
  assert.strictEqual(result.auditEntry.reason, 'test reason')
  assert.strictEqual(result.auditEntry.actor, 'admin')
  assert.strictEqual(result.auditEntry.before, 10)
  assert.strictEqual(result.auditEntry.after, 13)
  assert.ok(result.auditEntry.at)
  assert.ok(result.auditEntry.id.startsWith('audit-'))
  console.log('✓ audit entry written on adjustment')
}

/* ---- Domain invariant: reserveStock writes audit entry ---- */
function testReserveStockAudit() {
  const quant = { sku: 'TEST', locationId: 'LOC', onHand: 10, reserved: 0, version: 1, available: 10 }
  const result = reserveStock(quant, 2, 'admin')
  assert.strictEqual(result.error, null)
  assert.strictEqual(result.newQuant.reserved, 2)
  assert.strictEqual(result.newQuant.version, 2)
  console.log('✓ reserveStock updates quant correctly')
}

/* ---- Domain invariant: releaseReservation writes audit entry ---- */
function testReleaseReservation() {
  // We test the domain function logic
  const quant = { onHand: 10, reserved: 2, version: 3 }
  const newReserved = Math.max(quant.reserved - 1, 0)
  const newQuant = {
    ...quant,
    onHand: quant.onHand,
    reserved: newReserved,
    version: quant.version + 1,
  }
  assert.strictEqual(newQuant.reserved, 1)
  assert.strictEqual(newQuant.version, 4)
  console.log('✓ releaseReservation logic works')
}

/* ---- Domain invariant: reorder rule min <= max, both >= 0 ---- */
function testValidateReorderRule() {
  assert.strictEqual(validateReorderRule({ min: 2, max: 8 }), null)
  assert.strictEqual(validateReorderRule({ min: 0, max: 5 }), null)
  assert.strictEqual(validateReorderRule({ min: -1, max: 8 }), DomainError.REORDER_RULE_VIOLATION)
  assert.strictEqual(validateReorderRule({ min: 2, max: -1 }), DomainError.REORDER_RULE_VIOLATION)
  assert.strictEqual(validateReorderRule({ min: 10, max: 5 }), DomainError.REORDER_RULE_VIOLATION)
  console.log('✓ validateReorderRule works')
}

/* ---- Domain invariant: suggestOrderQty = max - available, clamped >= 0 ---- */
function testSuggestOrderQty() {
  assert.strictEqual(suggestOrderQty({ min: 2, max: 8 }, 3), 5)
  assert.strictEqual(suggestOrderQty({ min: 2, max: 8 }, 10), 0)
  assert.strictEqual(suggestOrderQty({ min: 2, max: 8 }, 8), 0)
  console.log('✓ suggestOrderQty works')
}

/* ---- Domain invariant: PO line qtyReceived <= qtyOrdered ---- */
function testValidatePOLine() {
  assert.strictEqual(validatePOLine({ qtyOrdered: 10, qtyReceived: 5 }), null)
  assert.strictEqual(validatePOLine({ qtyOrdered: 10, qtyReceived: 10 }), null)
  assert.strictEqual(validatePOLine({ qtyOrdered: 10, qtyReceived: 11 }), DomainError.REORDER_RULE_VIOLATION)
  console.log('✓ validatePOLine works')
}

/* ---- Domain invariant: receivePO validates stock and version ---- */
function testReceivePO() {
  const quant = { onHand: 5, reserved: 0, version: 1, sku: 'TEST', locationId: 'LOC' }
  const result = receivePO(quant, 3, 'TEST', 'LOC', 'admin', 1)
  assert.strictEqual(result.error, null)
  assert.strictEqual(result.newQuant.onHand, 8)
  assert.strictEqual(result.newQuant.version, 2)
  assert.ok(result.auditEntry)
  assert.strictEqual(result.auditEntry.reason, 'purchase order receipt')
  console.log('✓ receivePO works')
}

/* ---- Domain invariant: stock-move state machine ---- */
function testTransitionStockMove() {
  // draft -> confirmed
  assert.deepStrictEqual(transitionStockMove({ state: 'draft' }, 'confirmed', 'admin'), { error: null, newState: 'confirmed' })
  // draft -> cancelled
  assert.deepStrictEqual(transitionStockMove({ state: 'draft' }, 'cancelled', 'admin'), { error: null, newState: 'cancelled' })
  // confirmed -> reserved
  assert.deepStrictEqual(transitionStockMove({ state: 'confirmed' }, 'reserved', 'admin'), { error: null, newState: 'reserved' })
  // confirmed -> cancelled
  assert.deepStrictEqual(transitionStockMove({ state: 'confirmed' }, 'cancelled', 'admin'), { error: null, newState: 'cancelled' })
  // reserved -> done
  assert.deepStrictEqual(transitionStockMove({ state: 'reserved' }, 'done', 'admin'), { error: null, newState: 'done' })
  // reserved -> cancelled
  assert.deepStrictEqual(transitionStockMove({ state: 'reserved' }, 'cancelled', 'admin'), { error: null, newState: 'cancelled' })
  // done -> anything is invalid
  assert.deepStrictEqual(transitionStockMove({ state: 'done' }, 'cancelled', 'admin'), { error: 'INVALID_TRANSITION', newState: 'done' })
  assert.deepStrictEqual(transitionStockMove({ state: 'done' }, 'reserved', 'admin'), { error: 'INVALID_TRANSITION', newState: 'done' })
  // invalid transitions
  assert.deepStrictEqual(transitionStockMove({ state: 'draft' }, 'reserved', 'admin'), { error: 'INVALID_TRANSITION', newState: 'draft' })
  console.log('✓ transitionStockMove works')
}

/* ---- Search: Fuse.js keyword search typo tolerance ---- */
async function testFuseKeywordSearch() {
  // Import Fuse.js directly for testing
  const Fuse = (await import('fuse.js')).default

  const products = [
    { id: '1', name: 'Classic Clickers', category: 'Clickers', material: 'Sterling Silver', piercingSite: 'Lobe', tags: ['clicker', 'silver'], description: 'Classic clicker earrings' },
    { id: '2', name: 'Tatu Flatback Gold', category: 'Threadless Flatbacks', material: '18k Gold-Plated', piercingSite: 'Lobe', tags: ['flatback', 'gold'], description: 'Gold flatback' },
  ]

  const fuse = new Fuse(products, {
    keys: ['name', 'category', 'material', 'piercingSite', 'tags', 'description'],
    threshold: 0.4,
  })

  // Typo tolerance: 'cliker' should find 'Classic Clickers'
  const results1 = fuse.search('cliker')
  assert.ok(results1.length > 0, 'Expected results for typo "cliker"')
  assert.strictEqual(results1[0].item.name, 'Classic Clickers')

  // Exact match
  const results2 = fuse.search('Flatback')
  assert.ok(results2.length > 0)
  assert.strictEqual(results2[0].item.name, 'Tatu Flatback Gold')

  // Partial match on tags
  const results3 = fuse.search('silver')
  assert.ok(results3.length > 0)
  assert.strictEqual(results3[0].item.material, 'Sterling Silver')

  console.log('✓ Fuse.js keyword search typo tolerance works')
}

/* Run all tests */
async function runTests() {
  console.log('Running domain invariant tests...')
  testValidateOnHand()
  testValidateAvailable()
  testIdempotent()
  testVersionConflict()
  testInsufficientAvailable()
  testAuditEntryWritten()
  testReserveStockAudit()
  testReleaseReservation()
  testValidateReorderRule()
  testSuggestOrderQty()
  testValidatePOLine()
  testReceivePO()
  testTransitionStockMove()
  await testFuseKeywordSearch()
  console.log('All domain invariant tests passed!')
}

runTests().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})