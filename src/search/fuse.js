/**
 * NOVA-0100 — Fuse.js Wrapper + RRF
 * Wraps Fuse.js lexical search and provides RRF (Reciprocal Rank Fusion) merge.
 * Fuse.js is added as a dependency.
 */

import Fuse from 'fuse.js'
import { rrfMerge } from './semantic.js'

/** Default Fuse.js configuration for product corpus */
const defaultFuseOptions = {
  keys: [
    'name',
    'category',
    'material',
    'piercingSite',
    'tags',
    'description',
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

/** Default Fuse.js options exported for use by other modules */
export { defaultFuseOptions }

/**
 * Perform fused search: lexical (Fuse.js) + semantic (cosine) via RRF(k=60).
 * @param {string} query - The search query
 * @param {Array} products - Product corpus
 * @param {number[]|null} semanticVector - Optional precomputed query vector (384 dim)
 * @returns {Array} Fused results with { product, lexicalScore, semanticScore }
 */
export const hybridSearch = (query, products, semanticVector) => {
  // 1. Lexical search via Fuse.js
  const lexicalResults = lexicalSearch(query, products)

  // 2. If we have a semantic vector, compute cosine similarity for each product
  let semanticScores = {}
  if (semanticVector && semanticVector.length === 384) {
    products.forEach((p) => {
      // In production, each product would have a precomputed vector
      // For now, we'll use a placeholder - the UI will show lexical only
      semanticScores[p.id] = 0
    })
  }

  // 3. RRF merge - combine lexical ranks with semantic scores
  const lexicalRanks = lexicalResults.map((p, i) => ({ id: p.product.id, rank: i + 1 }))
  const semanticRanks = Object.keys(semanticScores).map((id, i) => ({
    id,
    rank: i + 1,
    score: semanticScores[id]
  }))

  const fused = rrfMerge(lexicalRanks, semanticRanks, 60)

  // Return fused results joined with product data and scores
  return fused.map(f => {
    const product = products.find(p => p.id === f.id)
    const lexical = lexicalResults.find(lr => lr.product.id === f.id)
    return product ? {
      product,
      lexicalScore: lexical ? lexical.score : 0,
      semanticScore: semanticScores[f.id] || 0,
      fusedScore: f.score
    } : null
  }).filter(Boolean)
}