/**
 * NOVA-0102 — Delivery Calculator Tests
 * Run with: node --test tests/delivery.test.js
 */

import { strict as assert } from 'node:assert'
import {
  CBD_RATE,
  TRANSFAST,
  lookupDeliveryRate,
  ALL_PRICED_AREAS,
} from '../src/data/delivery.js'

/* ---- Baseline lookups ---- */
function testNgara() {
  const result = lookupDeliveryRate('Ngara')
  assert.strictEqual(result.status, 'priced')
  assert.strictEqual(result.rate, 250)
  assert.strictEqual(result.zoneId, 'thika-road')
  console.log('✓ Ngara → 250')
}

function testThika() {
  const result = lookupDeliveryRate('Thika')
  assert.strictEqual(result.status, 'priced')
  assert.strictEqual(result.rate, 1500)
  assert.strictEqual(result.zoneId, 'thika-road')
  console.log('✓ Thika → 1500')
}

function testLimuru() {
  const result = lookupDeliveryRate('Limuru')
  assert.strictEqual(result.status, 'priced')
  assert.strictEqual(result.rate, 1500)
  assert.strictEqual(result.zoneId, 'limuru-road')
  console.log('✓ Limuru → 1500')
}

function testKawangware() {
  const result = lookupDeliveryRate('Kawangware')
  assert.strictEqual(result.status, 'priced')
  assert.strictEqual(result.rate, 500)
  assert.strictEqual(result.zoneId, 'ngong-road')
  console.log('✓ Kawangware → 500')
}

/* ---- Unknown area ---- */
function testUnknownArea() {
  const result = lookupDeliveryRate('Marsabit')
  assert.strictEqual(result.status, 'unknown')
  assert.strictEqual(result.rate, null)
  console.log('✓ Unknown area → unknown')
}

/* ---- Quote-only area ---- */
function testQuoteOnlyArea() {
  const result = lookupDeliveryRate('Dandora')
  assert.strictEqual(result.status, 'quote')
  assert.strictEqual(result.rate, null)
  console.log('✓ Quote-only area → quote')
}

/* ---- Empty input ---- */
function testEmptyInput() {
  const result = lookupDeliveryRate('')
  assert.strictEqual(result.status, 'unknown')
  assert.strictEqual(result.rate, null)
  console.log('✓ Empty input → unknown')
}

/* ---- Case/punctuation insensitivity ---- */
function testCaseInsensitive() {
  const result = lookupDeliveryRate('  NGARA  ')
  assert.strictEqual(result.status, 'priced')
  assert.strictEqual(result.rate, 250)
  console.log('✓ Case/punctuation insensitive (NGARA)')
}

function testLowercase() {
  const result = lookupDeliveryRate('ngara')
  assert.strictEqual(result.status, 'priced')
  assert.strictEqual(result.rate, 250)
  console.log('✓ Lowercase (ngara)')
}

function testWithPunctuation() {
  // Punctuation is replaced with spaces, so "N.g.a.r.a" becomes "n g a r a" (no match)
  // Test with a realistic punctuation case: "Ngara," or "Ngara."
  const result = lookupDeliveryRate('Ngara,')
  assert.strictEqual(result.status, 'priced')
  assert.strictEqual(result.rate, 250)
  console.log('✓ With trailing punctuation (Ngara,)')
}

/* ---- Cart total integration ---- */
function testCartTotalWithDelivery() {
  // Simulate cart items total
  const itemsTotal = 2500 // e.g., 2 items at 1250 each
  const delivery = lookupDeliveryRate('Ngara')
  
  if (delivery.status === 'priced') {
    const combined = itemsTotal + delivery.rate
    assert.strictEqual(combined, 2750)
    console.log('✓ Cart total = items (2500) + delivery (250) = 2750')
  } else {
    throw new Error('Expected priced status for Ngara')
  }
}

/* ---- ALL_PRICED_AREAS structure ---- */
function testAllPricedAreasStructure() {
  assert.ok(Array.isArray(ALL_PRICED_AREAS))
  assert.ok(ALL_PRICED_AREAS.length > 0)
  // Each entry should have area, rate, zoneId
  for (const entry of ALL_PRICED_AREAS) {
    assert.ok(typeof entry.area === 'string')
    assert.ok(typeof entry.rate === 'number')
    assert.ok(typeof entry.zoneId === 'string')
  }
  console.log('✓ ALL_PRICED_AREAS structure valid, count:', ALL_PRICED_AREAS.length)
}

/* ---- Quote-only areas that also appear in priced zones win ---- */
function testPricedWinsOverQuote() {
  // Kahawa Sukari appears in both QUOTE_ONLY_AREAS and priced zone (Lower Kabete Road, 900)
  const result = lookupDeliveryRate('Kahawa Sukari')
  assert.strictEqual(result.status, 'priced')
  assert.strictEqual(result.rate, 900)
  console.log('✓ Priced entry wins over quote-only (Kahawa Sukari → 900)')
}

/* ---- CBD rate ---- */
function testCbdRate() {
  assert.strictEqual(CBD_RATE, 100)
  console.log('✓ CBD_RATE = 100')
}

/* ---- Transfast numbers exist but are UNVERIFIED ---- */
function testTransfastUnverified() {
  assert.ok(TRANSFAST.phones.includes('0729727851'))
  assert.ok(TRANSFAST.phones.includes('0717730112'))
  assert.ok(TRANSFAST.disclaimer.includes('parcel size & weight'))
  console.log('✓ TRANSFAST numbers present with disclaimer')
}

/* ---- Run all tests ---- */
async function runTests() {
  console.log('Running delivery calculator tests...\n')
  
  testNgara()
  testThika()
  testLimuru()
  testKawangware()
  testUnknownArea()
  testQuoteOnlyArea()
  testEmptyInput()
  testCaseInsensitive()
  testLowercase()
  testWithPunctuation()
  testCartTotalWithDelivery()
  testAllPricedAreasStructure()
  testPricedWinsOverQuote()
  testCbdRate()
  testTransfastUnverified()
  
  console.log('\nAll delivery calculator tests passed!')
}

runTests().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})