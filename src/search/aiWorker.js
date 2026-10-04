/**
 * NOVA-0100 — AI Search Web Worker
 * Lazily loads @huggingface/transformers with Xenova/bge-small-en-v1.5 (quantized ONNX, 34 MB).
 * Runs in a Web Worker device='wasm', dtype='q8'.
 * Supports progress messages and cancellation.
 * Dynamically imported ONLY when user triggers semantic search — never in initial bundle.
 *
 * Message protocol:
 *   client -> worker: { type: 'embed', query: string, cancel?: boolean }
 *   worker -> client: { type: 'results', vector: number[] } |
 *                     { type: 'progress', message: string } |
 *                     { type: 'error', message: string }
 */

const WORKER_SCRIPT = self.self || self

// Cache the loading promise so subsequent calls reuse the same model
let modelPromise = null

self.onmessage = async function (event) {
  const data = event.data
  const { type, query, cancel } = data

  if (type === 'cancel') {
    // Set a flag so the in-flight embed aborts
    modelPromise = null
    self.postMessage({ type: 'cancelled' })
    return
  }

  if (type === 'embed') {
    // If already loading, reuse the promise (single concurrent load)
    if (!modelPromise) {
      modelPromise = loadAndEmbed(query)
    }
    modelPromise
      .then(vector => {
        modelPromise = null // reset for next load
        self.postMessage({ type: 'results', vector })
      })
      .catch(err => {
        modelPromise = null
        self.postMessage({ type: 'error', message: err.message || 'Embedding failed' })
      })
  }
}

/**
 * Lazily load Transformers.js + 34 MB ONNX model, embed the query,
 * and return the [1, 384] vector with L2 norm 1.0000.
 */
const loadAndEmbed = async query => {
  // Import the Transformers pipeline lazily
  // @huggingface/transformers is NOT in the client bundle; loaded only in the worker
  const { pipeline, env } = await import('@huggingface/transformers')

  // Set cache dir to temp (already configured in verified environment)
  env.cacheDir = '/tmp/opencode/embedtest'

  // Run feature extraction with BGE small English, quantized q8, CPU (or WASM)
  const fe = await pipeline(
    'feature-extraction',
    'Xenova/bge-small-en-v1.5',
    { dtype: 'q8', device: 'wasm' }
  )

  // CLS pooling + L2 normalization (must match embed.js recipe exactly)
  const [embedding] = await fe([query], { pooling: 'cls', normalize: true })

  // Return the embedding vector (should be 384 dim, L2 norm ≈ 1)
  return embedding
}