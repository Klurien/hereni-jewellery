/**
 * NOVA-0100 — Shared Embedding Recipe
 * ONE shared recipe used by BOTH the build script and the browser worker.
 * Identical prefix, pooling, and normalize settings must be used in both places
 * so the vector spaces do not diverge.
 *
 * BGE requirement: query prefix `"Represent this sentence for searching relevant passages: "`
 * and **CLS pooling**. Phase 0 (build-time) and Phase 2 (runtime) MUST use the identical
 * recipe or the vector spaces silently diverge.
 */

export const EMBEDDING_RECIPE = {
  /** Query prefix required by BGE small English model */
  queryPrefix: 'Represent this sentence for searching relevant passages: ',
  /** Pooling strategy: CLS token (classification token) */
  pooling: 'cls',
  /** Normalize vectors to L2 norm = 1.0 */
  normalize: true,
}

/**
 * Embedding dimension after BGE small encoding.
 * Confirmed: 384 dimensions with L2 norm 1.0000 on this machine.
 */
export const EMBEDDING_DIM = 384

/**
 * Model identifier — MUST be `Xenova/bge-small-en-v1.5` (not `BAAI/...` which has no
 * quantized ONNX and 404s). MIT licensed, 34 MB quantized ONNX.
 */
export const MODEL_ID = 'Xenova/bge-small-en-v1.5'