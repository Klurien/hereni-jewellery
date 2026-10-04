/**
 * NOVA-0100 — Fuse.js Wrapper
 * Wraps Fuse.js lexical search over the product catalogue.
 * Typo-tolerant, case-insensitive, fast (<5 ms).
 */

import Fuse from 'fuse.js'

/** Default Fuse.js configuration for product corpus */
const defaultFuseOptions = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'category', weight: 0.3 },
    { name: 'material', weight: 0.2 },
    { name: 'piercingSite', weight: 0.2 },
    { name: 'tags', weight: 0.3 },
    { name: 'description', weight: 0.3 },
  ],
  threshold: 0.4,
  includeMatches: false,
}

/**
 * Perform lexical search over the product corpus using Fuse.js.
 * @param {string} query - The search query string
 * @param {Array} products - Product array from the catalogue
 * @returns {Array} Ranked results with { product, score }
 */
export const lexicalSearch = (query, products) => {
  if (!query || query.trim().length === 0) {
    return products.map(p => ({ product: p, score: 1 }))
  }

  const fuse = new Fuse(products, defaultFuseOptions)
  const results = fuse.search(query)
  return results.map(r => ({ product: r.item, score: r.score }))
}