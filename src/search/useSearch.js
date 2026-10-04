/**
 * NOVA-0100 — Search Hook
 * Consumed by the UI: runs lexical search immediately and always.
 * Upgrades to hybrid (semantic) when the vector is available.
 * Exposes { results, mode, loading, error, canUseAi }.
 *
 * Degradation is mandatory: if the worker fails, the model 404s,
 * the network is down, or the user declines the 34 MB download =>
 * lexical results render with an honest inline note.
 * Search must NEVER throw into the UI and NEVER block the storefront.
 */

import { useState, useEffect, useCallback } from 'react'

/** Import search modules */
import { hybridSearch, lexicalSearch } from './fuse.js'

/** State shape */
export const useSearch = (productCatalogue, initialQuery = '') => {
  const [results, setResults] = useState([])
  const [mode, setMode] = useState('lexical') // 'lexical' | 'hybrid' | 'error'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [canUseAi, setCanUseAi] = useState(false)

  const [searchQuery, setSearchQuery] = useState(initialQuery)

  // Update query and trigger search
  const doSearch = useCallback(async (query) => {
    setSearchQuery(query)
    setLoading(true)
    setError(null)
    setResults([])
    setMode('lexical')
    setCanUseAi(false)

    if (!query || query.trim().length === 0) {
      // Empty query returns all products
      setResults(productCatalogue.map(p => ({ product: p, score: 1 })))
      setLoading(false)
      return
    }

    // 1. Always run lexical first (fast, <5ms)
    const lexical = lexicalSearch(query, productCatalogue)
    setResults(lexical)

    // 2. If user has opted in to AI search, upgrade to hybrid
    if (canUseAi) {
      try {
        // Create worker for semantic embedding
        const worker = new Worker(new URL('../search/aiWorker.js', import.meta.url), {
          type: 'module',
          name: 'ai-search-worker',
        })

        worker.onmessage = (e) => {
          const { type, vector } = e.data
          if (type === 'results') {
            // Hybrid search: fuse lexical + semantic via RRF
            const fused = hybridSearch(query, productCatalogue, vector)
            // Only keep top results; merge with lexical scores
            setResults(fused.filter(r => r !== null))
            setMode('hybrid')
          } else if (type === 'error') {
            // Model failed — fall back to lexical with honest note
            setError('AI search unavailable — showing keyword results')
            setMode('lexical')
          }
        }

        worker.onerror = (_e) => {
          setError('AI search worker error — showing keyword results')
          setMode('lexical')
        }

        // Send embed message
        worker.postMessage({ type: 'embed', query })

        // Upgrade mode to hybrid while waiting
        setMode('hybrid')
      } catch (err) {
        // Worker creation or model load failed — stay lexical, show honest note
        setError('AI search unavailable — showing keyword results')
        setMode('lexical')
      }
    }

    setLoading(false)
  }, [productCatalogue, canUseAi])

  // Initial run on mount
  useEffect(() => {
    doSearch(initialQuery)
  }, [initialQuery, doSearch])

  // Expose AI toggle
  const toggleAiSearch = () => {
    setCanUseAi(prev => !prev)
    return canUseAi
  }

  return {
    results,
    mode,
    loading,
    error,
    canUseAi,
    searchQuery,
    setSearchQuery,
    toggleAiSearch,
  }
}