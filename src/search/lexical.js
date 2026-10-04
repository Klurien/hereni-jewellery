/**
 * NOVA-0100 — Lexical Search
 * Fuse.js over product corpus: name, category, material, piercingSite, tags, description.
 * Usage: import { lexicalSearch } from '../search/lexical'
 * Returns ranked results with relevance scores.
 */

import Fuse from 'fuse.js'

/** Fuse.js options — typo-tolerant, case-insensitive */
const fuseOptions = {
  keys: {
    name: 0.5,
    category: 0.3,
    material: 0.2,
    piercingSite: 0.2,
    tags: 0.3,
    description: 0.3,
  },
  threshold: 0.4,
  includeMatches: false,
}

/**
 * Perform lexical search over the product catalogue.
 * @param {string} query - The search query string
 * @param {Array} products - Product array from the catalogue
 * @returns {Array} Ranked results with { product, score }
 */
export const lexicalSearch = (query, products) => {
  if (!query || query.trim().length === 0) {
    // Return all products for empty query
    return products.map(p => ({ product: p, score: 1 }))
  }

  const fuse = new Fuse(products, fuseOptions)
  const results = fuse.search(query)
  return results.map(r => ({ product: r.item, score: r.score }))
}

/** Default product corpus — passed from UI layer */
export default function useLexicalSearch(query, products) {
  return lexicalSearch(query, products)
}