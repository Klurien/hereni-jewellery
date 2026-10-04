/**
 * NOVA-0100 — Search Hook
 * Runs keyword search over the product catalogue using Fuse.js.
 * Typo-tolerant, case-insensitive, fast (<5 ms).
 * No AI, no workers, no model downloads.
 */

import { useState, useCallback } from 'react'
import { lexicalSearch } from './fuse.js'

/** State shape */
export const useSearch = (productCatalogue, initialQuery = '') => {
  const [results, setResults] = useState(() => {
    if (!initialQuery || initialQuery.trim().length === 0) {
      return productCatalogue.map(p => ({ product: p, score: 1 }))
    }
    return lexicalSearch(initialQuery, productCatalogue)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState(initialQuery)

  // Update query and trigger search
  const doSearch = useCallback((query) => {
    setSearchQuery(query)
    setLoading(true)
    setError(null)

    if (!query || query.trim().length === 0) {
      // Empty query returns all products
      setResults(productCatalogue.map(p => ({ product: p, score: 1 })))
      setLoading(false)
      return
    }

    const lexical = lexicalSearch(query, productCatalogue)
    setResults(lexical)
    setLoading(false)
  }, [productCatalogue])

  return {
    results,
    loading,
    error,
    searchQuery,
    setSearchQuery: doSearch,
  }
}