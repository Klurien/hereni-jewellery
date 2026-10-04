/**
 * NOVA-0100 — Semantic Search Maths
 * Pure cosine similarity, unit-testable, no React, no storage.
 * Used by the AI worker and fused with lexical ranks via RRF.
 */

/** Cosine similarity between two vectors (both assumed L2-normalized). */
export const cosineSimilarity = (a, b) => {
  if (a.length !== b.length) {
    throw new Error('Vector dimension mismatch')
  }
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

/** Cosine similarity allowing non-normalized vectors */
export const cosineSimilarityUnsafe = (a, b) => {
  const la = Math.sqrt(a.reduce((s, v) => s + v * v, 0))
  const lb = Math.sqrt(b.reduce((s, v) => s + v * v, 0))
  if (la === 0 || lb === 0) return 0
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot / (la * lb)
}

/** RRF (Reciprocal Rank Fusion) merge of lexical and semantic ranks.
 *  k=60 is the standard constant — zero tuning.
 *  Lower fused score = better rank.
 */
export const rrfMerge = (lexicalRanks, semanticRanks, k = 60) => {
  // lexicalRanks: Array of { id, rank } where rank is 1-based position
  // semanticRanks: Array of { id, rank } where rank is 1-based position
  const fused = {}
  // Add lexical contributions
  lexicalRanks.forEach((entry) => {
    const id = entry.id
    fused[id] = (fused[id] || 0) + 1 / (k + entry.rank)
  })
  // Add semantic contributions
  semanticRanks.forEach((entry) => {
    const id = entry.id
    fused[id] = (fused[id] || 0) + 1 / (k + entry.rank)
  })
  // Convert to sorted array
  const results = Object.entries(fused)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => a.score - b.score) // lower score = better
  return results
}