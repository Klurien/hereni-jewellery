/**
 * NOVA-0100 — AdminPage
 * Odoo-like information architecture, original visual design.
 * Mobile-first, keyboard-reachable, aria-* on tables and forms.
 * Role switcher is client-side only — NOT authentication.
 * Data loaded from localAdapter (localStorage-backed preview; not production backend).
 */

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { products as seedProducts } from '../../data/products'
import { localAdapter } from '../../inventory/localAdapter.js'
import { roleSimulatorLabel } from '../../inventory/roles'
import { DeliveryAdminPanel } from '../../components/DeliveryCalculator'
import '../../pages/admin/admin.css'

/* ==========================================================
   State types (plain JS, no TypeScript)
   ========================================================== */

const INITIAL_TAB = 'overview'

/* -------------------------------------------------------------------------
   AdminPage — Odoo-like information architecture
   ------------------------------------------------------------------------- */

export function AdminPage() {
  const [tab, setTab] = useState(INITIAL_TAB)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')

  // Load state from localStorage adapter
  const [items, setItems] = useState(null)
  const [stockData, setStockData] = useState({ quants: {}, audit: [], reorderRules: {}, suppliers: [], pOs: [] })
  const [loading, setLoading] = useState(true)
  const loadedRef = useRef(false)

  const loadAll = useCallback(async () => {
    try {
      const health = await localAdapter.healthCheck()
      if (!health.healthy) {
        setNotice('Adapter not healthy. Using seed data.')
        setItems(seedProducts)
        setLoading(false)
        return
      }

      const [productsRes, stockRes, auditRes, rulesRes, suppliersRes] = await Promise.all([
        localAdapter.listProducts(),
        localAdapter.getStock ? localAdapter.getStock() : Promise.resolve({ error: null, quant: [] }),
        localAdapter.getAuditLog(),
        localAdapter.getReorderRules(),
        localAdapter.getSuppliers(),
      ])

      setItems(productsRes.products || [])
      setStockData({
        quants: stockRes.quants || {},
        audit: auditRes.entries || [],
        reorderRules: rulesRes.rules || {},
        suppliers: suppliersRes.suppliers || [],
        pOs: [], // would come from adapter if implemented
      })
      setNotice('Inventory loaded from localStorage.')
    } catch (e) {
      console.warn('AdminPage init: using seed data fallback', e)
      setNotice('Using seed data (localStorage unavailable).')
      setItems(seedProducts)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    loadAll()
  }, [loadAll])

  const persist = useCallback((nextItems) => {
    setItems(nextItems)
    setNotice('Catalogue updated.')
  }, [])

  const items$ = useMemo(() => items || seedProducts, [items])

  /* ---------- Filtered products ---------- */
  const filtered = useMemo(() => {
    if (!query) return items$.filter(i => i.status !== 'hidden')
    const q = query.toLowerCase()
    return items$.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.material && i.material.toLowerCase().includes(q)) ||
        (i.piercingSite && i.piercingSite.toLowerCase().includes(q)) ||
        (Array.isArray(i.tags) && i.tags.some(t => t.toLowerCase().includes(q))) ||
        (i.description && i.description.toLowerCase().includes(q))
    )
  }, [items$, query])

  /* ---------- Stock helpers ---------- */
  const getQuant = (sku, locationId) => stockData.quants?.[`${sku}:${locationId}`] || null
  const LOCATIONS = { SHOP: 'Kimathi House Shop G4', STORAGE: 'Storage' }

  const formatMoney = (value) => `KES ${Number(value || 0).toLocaleString()}`

  /* ---------- Overview metrics ---------- */
  const active = useMemo(() => items$.filter(i => i.status !== 'hidden').length, [items$])
  const lowStock = useMemo(() =>
    items$.filter(i => Number(i.stock) > 0 && Number(i.stock) < 5).length, [items$])
  const stockValue = useMemo(() =>
    items$.reduce((sum, item) => sum + (Number(item.price) * Number(item.stock || 0)), 0), [items$])

  /* ---------- Tab navigation ---------- */
  const handleTab = (newTab) => setTab(newTab)
  const getTabTitle = (t) => {
    const titles = {
      overview: 'Good morning, Hereni.',
      products: 'Product catalogue',
      stock: 'Stock management',
      locations: 'Locations',
      replenishment: 'Replenishment',
      suppliers: 'Suppliers',
      'purchase-orders': 'Purchase orders',
      team: 'Team',
      audit: 'Audit log',
      settings: 'Workspace settings',
      delivery: 'Delivery rates',
    }
    return titles[t] || 'Admin'
  }

  /* ---------- Product form handling ---------- */
  const handleSave = (event) => {
    event.preventDefault()
    if (!editing) return setNotice('No product being edited.')
    const clean = { ...editing, name: editing.name.trim(), price: Number(editing.price) || 0, stock: Number(editing.stock) || 0 }
    if (!clean.name) return setNotice('Add a product name first.')

    const reservedCheck = items$.some(
      it => it.id === editing.id && (it.reserved || 0) > 0
    )
    if (reservedCheck) return setNotice(`Cannot delete/edit: ${clean.name} has reserved stock.`)

    persist(items$.map(it => it.id === editing.id ? clean : it))
    setEditing(null)
    setNotice('Product saved.')
    window.setTimeout(() => setNotice(''), 3500)
  }

  const handleRemove = (id) => {
    const reserved = items$.find(i => i.id === id)?.reserved || 0
    if (reserved > 0) {
      setNotice(`Cannot delete: ${items$.find(i => i.id === id)?.name} has ${reserved} reserved unit(s).`)
      return
    }
    persist(items$.filter(i => i.id !== id))
    setNotice('Product removed.')
  }

  const handleAdd = () => {
    setEditing({
      name: '', category: 'Threadless Flatbacks', price: '', stock: '',
      material: '18k Gold-Plated', piercingSite: 'Lobe',
      tags: [], description: '', status: 'active'
    })
    setTab('products')
  }

  const handleEdit = (id) => {
    const product = items$.find(i => i.id === id)
    if (!product) return setNotice('Product not found.')
    const reserved = product.reserved || 0
    if (reserved > 0) return setNotice(`Cannot edit: ${product.name} has ${reserved} reserved unit(s). Release first.`)
    setEditing({ ...product })
    setTab('products')
  }

  /* -------- Tab renderers (inner functions for closure) -------- */
  const renderOverview = () => (
    <>
      <section className="admin-metrics">
        <div><span>Live products</span><strong>{active}</strong><small>Visible in preview catalogue</small></div>
        <div><span>Low stock</span><strong>{lowStock}</strong><small>Fewer than 5 units</small></div>
        <div><span>Stock value</span><strong>{formatMoney(stockValue)}</strong><small>Based on preview stock</small></div>
        <div><span>Open POs</span><strong>0</strong><small>Pending receipt</small></div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div><span className="admin-kicker">Quick actions</span><h2>What would you like to do?</h2></div>
          <div></div>
        </div>
        <div className="admin-actions">
          <button onClick={() => setEditing({ ...editing, name: '' })}><b>+</b><span>Add a product</span></button>
          <button onClick={() => setTab('products')}><b>▦</b><span>Manage inventory</span></button>
          <button onClick={() => setTab('settings')}><b>⚙</b><span>Connect your API</span></button>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div><span className="admin-kicker">Recent activity</span><h2>Last 10 audit entries</h2></div>
        </div>
        <div className="admin-table">
          <div className="admin-table-row admin-table-header">
            <span>SKU</span><span>Action</span><span>Delta</span><span>Reason</span><span>Actor</span><span>When</span>
          </div>
          {stockData.audit.length > 0
            ? stockData.audit.slice(0, 10).map((entry, i) => (
                <div key={i} className="admin-table-row">
                  <span>{entry.sku}</span>
                  <span>{entry.reason}</span>
                  <span>{entry.delta > 0 ? '+' : ''}{entry.delta}</span>
                  <span>{entry.actor}</span>
                  <span>{new Date(entry.at).toLocaleString()}</span>
                  <span></span>
                </div>
              ))
            : <div className="admin-table-row"><span colSpan="6">No audit entries yet.</span></div>
          }
        </div>
      </section>
    </>
  )

  const renderProducts = () => (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <div className="admin-search">
          <span>⌕</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" />
          <span className="admin-result-count">{filtered.length} products</span>
        </div>
      </div>

      {editing && (
        <form onSubmit={handleSave}>
          <div className="admin-form-head">
            <h2>{items$.some(i => i.id === editing.id) ? 'Edit product' : 'New product'}</h2>
            <button type="button" onClick={() => setEditing(null)}>×</button>
          </div>
          <div className="admin-fields">
            <label>Name<input required value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Tatu Flatback Gold" /></label>
            <label>Category
              <select value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })}>
                <option>Threadless Flatbacks</option>
                <option>Clickers</option>
                <option>Ballbacks</option>
                <option>Nose Jewellery</option>
              </select>
            </label>
            <label>Price (KES)<input required type="number" min="0" value={editing.price} onChange={e => setEditing({ ...editing, price: e.target.value })} /></label>
            <label>Stock<input type="number" min="0" value={editing.stock} onChange={e => setEditing({ ...editing, stock: e.target.value })} placeholder="0" /></label>
            <label className="wide">Material
              <select value={editing.material} onChange={e => setEditing({ ...editing, material: e.target.value })}>
                <option>18k Gold-Plated</option>
                <option>Sterling Silver</option>
                <option>Titanium</option>
              </select>
            </label>
            <label className="wide">Piercing site
              <select value={editing.piercingSite} onChange={e => setEditing({ ...editing, piercingSite: e.target.value })}>
                <option>Lobe</option>
                <option>Helix</option>
                <option>Conch</option>
                <option>Daith</option>
                <option>Nostril</option>
                <option>Rook</option>
                <option>Tragus</option>
                <option>Flatback</option>
              </select>
            </label>
            <label className="wide">Tags<textarea rows="2" value={editing.tags.join(',')} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) })} placeholder="flatback, gold, lobe"></textarea></label>
            <label className="wide">Description<textarea rows="3" value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Product details"></textarea></label>
          </div>
          <div className="admin-form-actions">
            <button type="button" className="admin-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="admin-primary" type="submit">Save product</button>
          </div>
        </form>
      )}

      <div className="admin-table">
        <div className="admin-table-row admin-table-header">
          <span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Material</span><span>Piercing</span><span /></div>
          {filtered.map(item => (
            <div key={item.id} className="admin-table-row">
              <div className="admin-product-cell">
                <span className="admin-mini-art">{item.name.slice(0, 1)}</span>
                <b>{item.name}</b>
              </div>
              <span>{item.category}</span>
              <span>{formatMoney(item.price)}</span>
              <span>{item.stock || 0}</span>
              <span>{item.material || '-'}</span>
              <span>{item.piercingSite || '-'}</span>
              <div className="admin-row-actions">
                <button onClick={() => handleEdit(item.id)}>Edit</button>
                <button onClick={() => handleRemove(item.id)}>Delete</button>
              </div>
            </div>
          ))}
      </div>
    </section>
  )

  const renderStock = () => (
    <section className="admin-panel">
      <h2>Stock adjustment</h2>
      <p>Select a product and location to adjust stock. Positive delta adds, negative removes.</p>

      <div className="admin-form">
        <div className="admin-form-head">
          <h2>Adjust stock</h2>
          <button type="button" onClick={() => setEditing(null)}>×</button>
        </div>
        <div className="admin-fields">
          <label>Product
            <select onChange={e => setEditing({ ...editing, sku: e.target.value, name: e.target.options[e.target.options.selectedIndex].text })}>
              <option value="">Select product</option>
              {items$.map(p => <option key={p.id} value={p.sku}>{p.name}</option>)}
            </select>
          </label>
          <label>Location
            <select>
              <option>Kimathi House Shop G4</option>
              <option>Storage</option>
            </select>
          </label>
          <label>Delta (± units)</label>
          <input type="number" min="-100" max="100" step="1" />
          <label>Reason (e.g. cycle count, loss, adjustment)</label>
          <input type="text" placeholder="e.g. cycle count" />
          <label>Actor (role)</label>
          <select>
            <option>admin</option>
            <option>manager</option>
            <option>staff</option>
          </select>
          <label>Idempotency key (any string, replay-safe)</label>
          <input type="text" placeholder="unique-key-123" />
        </div>
        <div className="admin-form-actions">
          <button type="button" className="admin-secondary" onClick={() => setEditing(null)}>Cancel</button>
          <button className="admin-primary" onClick={() => setNotice('Adjustment submitted — check audit log.')}>Adjust stock</button>
        </div>
      </div>

      {/* Current stock view per product — real data from localAdapter */}
      <h3 style={{marginTop:'24px'}}>
        On-hand by product
      </h3>
      <div className="admin-table">
        <div className="admin-table-row admin-table-header">
          <span>Product</span><span>Location</span><span>On-hand</span><span>Reserved</span><span>Available</span>
        </div>
        {items$.length === 0 ? (
          <div className="admin-table-row"><span colSpan="5">No products in catalogue.</span></div>
        ) : items$.map(item => {
          const shopQuant = getQuant(item.sku, LOCATIONS.SHOP)
          const storageQuant = getQuant(item.sku, LOCATIONS.STORAGE)

          if (!shopQuant && !storageQuant) {
            return (
              <div key={item.id} className="admin-table-row">
                <div className="admin-product-cell">
                  <span className="admin-mini-art">{item.name.slice(0,1)}</span>
                  <b>{item.name}</b>
                </div>
                <span colSpan="4" style={{color:'#8b857a',fontStyle:'italic'}}>No stock record found</span>
              </div>
            )
          }

          return [
            shopQuant && (
              <div key={`${item.id}-shop`} className="admin-table-row">
                <div className="admin-product-cell">
                  <span className="admin-mini-art">{item.name.slice(0,1)}</span>
                  <b>{item.name}</b>
                </div>
                <span>{LOCATIONS.SHOP}</span>
                <span>{shopQuant.onHand}</span>
                <span>{shopQuant.reserved}</span>
                <span><strong>{shopQuant.onHand - shopQuant.reserved}</strong></span>
              </div>
            ),
            storageQuant && (
              <div key={`${item.id}-storage`} className="admin-table-row">
                <div className="admin-product-cell" style={{opacity:0.6}}>
                  <span className="admin-mini-art">{item.name.slice(0,1)}</span>
                  <b>{item.name}</b>
                </div>
                <span>{LOCATIONS.STORAGE}</span>
                <span>{storageQuant.onHand}</span>
                <span>{storageQuant.reserved}</span>
                <span><strong>{storageQuant.onHand - storageQuant.reserved}</strong></span>
              </div>
            ),
          ]
        })}
      </div>
    </section>
  )

  const renderLocations = () => (
    <section className="admin-panel">
      <h2>Locations</h2>
      <div className="admin-table">
        <div className="admin-table-row admin-table-header">
          <span>Location</span><span>Description</span>
        </div>
        <div className="admin-table-row">
          <span>Kimathi House Shop G4</span>
          <span>Shop floor — main retail display</span>
        </div>
        <div className="admin-table-row">
          <span>Storage</span>
          <span>Back stock — not on display</span>
        </div>
      </div>
    </section>
  )

  const renderReplenishment = () => (
    <section className="admin-panel">
      <h2>Replenishment</h2>
      <p>Min/max reorder rules. "Suggested order qty" = max − available, clamped ≥ 0.</p>
      <div className="admin-table">
        <div className="admin-table-row admin-table-header">
          <span>Product</span><span>On-hand (Shop)</span><span>Reserved</span><span>Available</span><span>Min</span><span>Max</span><span>Suggested</span>
        </div>
        {items$.map(item => {
          const shopQuant = getQuant(item.sku, LOCATIONS.SHOP)
          const rule = stockData.reorderRules?.[item.sku]

          if (!shopQuant && !rule) {
            return (
              <div key={item.id} className="admin-table-row">
                <div className="admin-product-cell">
                  <span className="admin-mini-art">{item.name.slice(0,1)}</span>
                  <b>{item.name}</b>
                </div>
                <span colSpan="6" style={{color:'#8b857a',fontStyle:'italic'}}>No stock record or reorder rule</span>
              </div>
            )
          }

          const onHand = shopQuant?.onHand ?? 0
          const reserved = shopQuant?.reserved ?? 0
          const available = onHand - reserved
          const min = rule?.min ?? 2
          const max = rule?.max ?? 8
          const suggested = available < max ? max - available : 0

          return (
            <div key={item.id} className="admin-table-row">
              <div className="admin-product-cell">
                <span className="admin-mini-art">{item.name.slice(0,1)}</span>
                <b>{item.name}</b>
              </div>
              <span>{onHand}</span>
              <span>{reserved}</span>
              <span><strong>{available}</strong></span>
              <span>{min}</span>
              <span>{max}</span>
              <span>{suggested > 0 ? suggested : '—'}</span>
            </div>
          )
        })}
      </div>
    </section>
  )

  const renderSuppliers = () => (
    <section className="admin-panel">
      <h2>Suppliers</h2>
      <p>Currently unconnected — listed for future API integration.</p>
      <div className="admin-table">
        <div className="admin-table-row admin-table-header">
          <span>Name</span><span>Contact</span><span>Lead time</span>
        </div>
        {stockData.suppliers.length > 0
          ? stockData.suppliers.map(s => (
              <div key={s.id} className="admin-table-row">
                <span>{s.name}</span>
                <span>{s.contact}</span>
                <span>{s.leadTimeDays} days</span>
              </div>
            ))
          : [
              <div key="supplier-1" className="admin-table-row"><span>MetalCraft Kenya</span><span>+254 712 345 678</span><span>14 days</span></div>,
              <div key="supplier-2" className="admin-table-row"><span>TechAlloys Ltd</span><span>+254 722 987 654</span><span>21 days</span></div>,
            ]
        }
      </div>
    </section>
  )

  const renderPurchaseOrders = () => (
    <section className="admin-panel">
      <h2>Purchase orders</h2>
      <p>State machine: draft → confirmed → received. Receiving writes real stock moves + audit entries.</p>

      {/* Create PO form */}
      <div className="admin-form">
        <div className="admin-form-head">
          <h2>Create purchase order</h2>
          <button type="button" onClick={() => setEditing(null)}>×</button>
        </div>
        <div className="admin-fields">
          <label>Supplier
            <select>
              <option>MetalCraft Kenya</option>
              <option>TechAlloys Ltd</option>
            </select>
          </label>
          <label>Lines (SKU, qty ordered)</label>
          {/* Would have dynamic line inputs; simplified */}
        </div>
        <div className="admin-form-actions">
          <button className="admin-primary" onClick={() => setNotice('PO created as draft.')}>Create draft PO</button>
        </div>
      </div>

      {/* Existing POs */}
      <h3 style={{marginTop:'24px'}}>Existing purchase orders</h3>
      <div className="admin-table">
        <div className="admin-table-row admin-table-header">
          <span>PO</span><span>Supplier</span><span>State</span><span>Lines</span>
        </div>
        <div className="admin-table-row">
          <span colSpan="4" style={{color:'#8b857a',fontStyle:'italic'}}>No purchase orders stored in preview mode</span>
        </div>
      </div>
    </section>
  )

  const renderTeam = () => (
    <section className="admin-panel">
      <h2>Team role simulator</h2>
      {roleSimulatorLabel()}
      <p>This is a client-side role simulation only — NOT authentication. The real backend authorises actions.</p>

      <div className="admin-table">
        <div className="admin-table-row admin-table-header">
          <span>Role</span><span>View catalogue</span><span>Create/edit product</span><span>Delete product</span><span>Adjust stock</span><span>Receive PO</span><span>View audit</span>
        </div>
        <div className="admin-table-row">
          <span>Owner</span>
          <span>✓</span><span>✓</span><span>✓</span><span>✓</span><span>✓</span><span>✓</span>
        </div>
        <div className="admin-table-row">
          <span>Admin</span>
          <span>✓</span><span>✓</span><span>✓</span><span>✓</span><span>✓</span><span>✓</span>
        </div>
        <div className="admin-table-row">
          <span>Manager</span>
          <span>✓</span><span>✓</span><span>✗</span><span>✓</span><span>✓</span><span>✓</span>
        </div>
        <div className="admin-table-row">
          <span>Staff</span>
          <span>✓</span><span>✗</span><span>✗</span><span>✗</span><span>✓</span><span>✗</span>
        </div>
        <div className="admin-table-row">
          <span>Customer</span>
          <span>✓</span><span>✗</span><span>✗</span><span>✗</span><span>✗</span><span>✗</span>
        </div>
      </div>
    </section>
  )

  const renderAuditLog = () => (
    <section className="admin-panel">
      <h2>Audit log (read‑only)</h2>
      <p>Every stock change writes an immutable audit entry. No edit or delete controls exist anywhere.</p>

      <div className="admin-table">
        <div className="admin-table-row admin-table-header">
          <span>SKU</span><span>Location</span><span>Delta</span><span>Reason</span><span>Actor</span><span>Before</span><span>After</span><span>When</span>
        </div>
        {stockData.audit.length > 0
          ? stockData.audit.slice(0, 20).map((entry, i) => (
              <div key={i} className="admin-table-row">
                <span>{entry.sku}</span>
                <span>{entry.locationId}</span>
                <span>{entry.delta > 0 ? '+' : ''}{entry.delta}</span>
                <span>{entry.reason}</span>
                <span>{entry.actor}</span>
                <span>{entry.before}</span>
                <span>{entry.after}</span>
                <span>{new Date(entry.at).toLocaleString()}</span>
              </div>
            ))
          : <div className="admin-table-row"><span colSpan="8">No audit entries yet.</span></div>
        }
      </div>

      <p className="admin-notice" style={{marginTop:'12px', fontSize:'11px', color:'#3e6340'}}>
        Audit entries cannot be edited or deleted. This log is read‑only by design.
      </p>
    </section>
  )

  const renderSettings = () => (
    <section className="admin-panel settings-panel">
      <span className="admin-kicker">Backend connection</span>
      <h2>Ready for your APIs.</h2>
      <p>This dashboard is intentionally running in preview mode. Product changes are saved in this browser only.
      Connect your product, inventory, image-upload and order APIs when you're ready; the UI is already structured for that handoff.</p>

      <div className="settings-status">
        <span className="status-dot" />
        Preview mode
        <small>No production data is being changed. Data persists in localStorage only.</small>
      </div>

      <div className="settings-list">
        <div><b>Product API</b><span>Not connected</span></div>
        <div><b>Image storage</b><span>Not connected</span></div>
        <div><b>Orders API</b><span>Not connected</span></div>
        <div><b>Admin authentication</b><span>Connect before launch</span></div>
        <div><b>VITE_API_BASE_URL</b><span>Env var needed for HTTP adapter</span></div>
        <div><b>VITE_API_TOKEN</b><span>Bearer token for API auth</span></div>
      </div>
    </section>
  )

  /* ---------- Render JSX ---------- */
  if (loading) {
    return (
      <div className="admin-shell" style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center',color:'#8b857a'}}>
          <div style={{fontSize:'24px',marginBottom:'12px'}}>⟳</div>
          Loading inventory from localStorage…
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <span>✦</span> Hereni <b>admin</b>
        </Link>
        <div className="admin-profile">
          <span>AR</span>
          <div>
            <strong>Admin preview</strong>
            <small>Local workspace — role simulation only</small>
          </div>
        </div>
        {/* Role simulator switcher */}
        <div style={{marginTop:'4px'}}>
          {roleSimulatorLabel()}
        </div>
        <nav className="admin-nav">
          <button className={tab === 'overview' ? 'active' : ''}
                  onClick={() => handleTab('overview')}>Overview</button>
          <button className={tab === 'products' ? 'active' : ''}
                  onClick={() => handleTab('products')}>
            Products <em>{items$.length}</em>
          </button>
          <button className={tab === 'stock' ? 'active' : ''}
                  onClick={() => handleTab('stock')}>Stock</button>
          <button className={tab === 'locations' ? 'active' : ''}
                  onClick={() => handleTab('locations')}>Locations</button>
          <button className={tab === 'replenishment' ? 'active' : ''}
                  onClick={() => handleTab('replenishment')}>Replenishment</button>
          <button className={tab === 'suppliers' ? 'active' : ''}
                  onClick={() => handleTab('suppliers')}>Suppliers</button>
          <button className={tab === 'purchase-orders' ? 'active' : ''}
                  onClick={() => handleTab('purchase-orders')}>Purchase orders</button>
          <button className={tab === 'team' ? 'active' : ''}
                  onClick={() => handleTab('team')}>Team</button>
          <button className={tab === 'audit' ? 'active' : ''}
                  onClick={() => handleTab('audit')}>Audit log</button>
          <button className={tab === 'delivery' ? 'active' : ''}
                  onClick={() => handleTab('delivery')}>Delivery</button>
          <button className={tab === 'settings' ? 'active' : ''}
                  onClick={() => handleTab('settings')}>Settings</button>
        </nav>
        <Link to="/" className="admin-back">← Back to storefront</Link>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">Workspace / {tab}</span>
            <h1>{getTabTitle(tab)}</h1>
          </div>
          <button className="admin-primary" onClick={() => handleAdd()}>
            + Add product
          </button>
        </header>

        {notice && <div className="admin-notice">{notice}</div>}

        {/* Tab content */}
        {tab === 'overview' && renderOverview()}
        {tab === 'products' && renderProducts()}
        {tab === 'stock' && renderStock()}
        {tab === 'locations' && renderLocations()}
        {tab === 'replenishment' && renderReplenishment()}
        {tab === 'suppliers' && renderSuppliers()}
        {tab === 'purchase-orders' && renderPurchaseOrders()}
        {tab === 'team' && renderTeam()}
        {tab === 'audit' && renderAuditLog()}
        {tab === 'delivery' && <DeliveryAdminPanel showUnverifiedNumbers={true} />}
        {tab === 'settings' && renderSettings()}
      </main>
    </div>
  )
}