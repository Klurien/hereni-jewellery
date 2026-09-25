export const PRODUCT_STORAGE_KEY = 'hereni-jewellery-products-v1'

export function readCatalogue() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY))
    return Array.isArray(saved) && saved.length ? saved : null
  } catch {
    return null
  }
}

export function saveCatalogue(items) {
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('hereni-catalogue-updated'))
}
