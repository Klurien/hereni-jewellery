import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { products as seedProducts } from '../data/products'
import '../admin.css'

const STORAGE_KEY = 'hereni-admin-products-v1'
const emptyProduct = { name: '', category: 'Threadless Flatbacks', price: '', stock: '', image: '', description: '', status: 'active' }

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) && saved.length ? saved : seedProducts
  } catch {
    return seedProducts
  }
}

function formatMoney(value) { return `KES ${Number(value || 0).toLocaleString()}` }

export function AdminPage() {
  const [items, setItems] = useState(loadProducts)
  const [tab, setTab] = useState('overview')
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')

  const persist = next => { setItems(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setNotice('Saved in this browser preview. Connect the API to sync globally.'); window.setTimeout(() => setNotice(''), 3500) }
  const filtered = useMemo(() => items.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [items, query])
  const active = items.filter(item => item.status !== 'hidden').length
  const lowStock = items.filter(item => Number(item.stock) > 0 && Number(item.stock) < 5).length
  const stockValue = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.stock || 0)), 0)

  const saveProduct = event => {
    event.preventDefault()
    const clean = { ...editing, name: editing.name.trim(), price: Number(editing.price) || 0, stock: Number(editing.stock) || 0 }
    if (!clean.name) return setNotice('Add a product name first.')
    const exists = items.some(item => item.id === clean.id)
    persist(exists ? items.map(item => item.id === clean.id ? clean : item) : [...items, { ...clean, id: `custom-${Date.now()}` }])
    setEditing(null)
  }

  const remove = id => { if (window.confirm('Remove this product from the preview catalogue?')) persist(items.filter(item => item.id !== id)) }

  return <div className="admin-shell">
    <aside className="admin-sidebar"><Link to="/" className="admin-brand"><span>✦</span> Hereni <b>admin</b></Link><div className="admin-profile"><span>AR</span><div><strong>Admin preview</strong><small>Local workspace</small></div></div><nav className="admin-nav"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Products <em>{items.length}</em></button><button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Settings</button></nav><Link to="/" className="admin-back">← Back to storefront</Link></aside>
    <main className="admin-main"><header className="admin-topbar"><div><span className="admin-kicker">Workspace / {tab}</span><h1>{tab === 'overview' ? 'Good morning, Hereni.' : tab === 'products' ? 'Product catalogue' : 'Workspace settings'}</h1></div><button className="admin-primary" onClick={() => { setEditing({ ...emptyProduct }); setTab('products') }}>+ Add product</button></header>{notice && <div className="admin-notice">{notice}</div>}{tab === 'overview' && <><section className="admin-metrics"><div><span>Live products</span><strong>{active}</strong><small>Visible in preview catalogue</small></div><div><span>Low stock</span><strong>{lowStock}</strong><small>Fewer than 5 units</small></div><div><span>Stock value</span><strong>{formatMoney(stockValue)}</strong><small>Based on preview stock</small></div><div><span>Orders</span><strong>—</strong><small>Connect order API next</small></div></section><section className="admin-panel"><div className="admin-panel-head"><div><span className="admin-kicker">Quick actions</span><h2>What would you like to do?</h2></div></div><div className="admin-actions"><button onClick={() => { setEditing({ ...emptyProduct }); setTab('products') }}><b>+</b><span>Add a product<small>Create a new catalogue item</small></span></button><button onClick={() => setTab('products')}><b>▦</b><span>Manage inventory<small>Update prices, stock and visibility</small></span></button><button onClick={() => setTab('settings')}><b>⚙</b><span>Connect your API<small>Add the backend when ready</small></span></button></div></section><section className="admin-panel"><div className="admin-panel-head"><div><span className="admin-kicker">Recently added</span><h2>Catalogue preview</h2></div><button className="admin-text-button" onClick={() => setTab('products')}>View all →</button></div><div className="admin-mini-list">{items.slice(-4).reverse().map(item => <div key={item.id}><span className="admin-mini-art">{item.name.slice(0, 1)}</span><span><b>{item.name}</b><small>{item.category}</small></span><strong>{formatMoney(item.price)}</strong></div>)}</div></section></>}{tab === 'products' && <section className="admin-panel"><div className="admin-toolbar"><div className="admin-search"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products" /></div><span className="admin-result-count">{filtered.length} products</span></div>{editing && <form className="admin-form" onSubmit={saveProduct}><div className="admin-form-head"><h2>{items.some(item => item.id === editing.id) ? 'Edit product' : 'New product'}</h2><button type="button" onClick={() => setEditing(null)}>×</button></div><div className="admin-fields"><label>Name<input required value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} placeholder="e.g. Tatu Flatback Gold" /></label><label>Category<select value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })}><option>Threadless Flatbacks</option><option>Clickers</option><option>Ballbacks</option><option>Ear Charms</option><option>Nose Jewellery</option></select></label><label>Price (KES)<input required type="number" min="0" value={editing.price} onChange={event => setEditing({ ...editing, price: event.target.value })} /></label><label>Stock<input type="number" min="0" value={editing.stock} onChange={event => setEditing({ ...editing, stock: event.target.value })} placeholder="0" /></label><label className="wide">Image URL<input value={editing.image} onChange={event => setEditing({ ...editing, image: event.target.value })} placeholder="https://… (optional until API upload is connected)" /></label><label className="wide">Description<textarea rows="3" value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} placeholder="Product details" /></label></div><div className="admin-form-actions"><button type="button" className="admin-secondary" onClick={() => setEditing(null)}>Cancel</button><button className="admin-primary" type="submit">Save product</button></div></form>}<div className="admin-table"><div className="admin-table-row admin-table-header"><span>Product</span><span>Category</span><span>Price</span><span>Stock</span><span>Status</span><span /></div>{filtered.map(item => <div className="admin-table-row" key={item.id}><span className="admin-product-cell"><span className="admin-mini-art">{item.name.slice(0, 1)}</span><b>{item.name}</b></span><span>{item.category}</span><span>{formatMoney(item.price)}</span><span>{item.stock || 0}</span><span><b className={`status-pill ${item.status}`}>{item.status}</b></span><span className="admin-row-actions"><button onClick={() => setEditing({ ...item })}>Edit</button><button onClick={() => remove(item.id)}>Delete</button></span></div>)}</div></section>}{tab === 'settings' && <section className="admin-panel settings-panel"><span className="admin-kicker">Backend connection</span><h2>Ready for your APIs.</h2><p>This dashboard is intentionally running in preview mode. Product changes are saved in this browser only. Connect your product, inventory, image-upload and order APIs when you’re ready; the UI is already structured for that handoff.</p><div className="settings-status"><span className="status-dot" /> Preview mode <small>No production data is being changed.</small></div><div className="settings-list"><div><b>Product API</b><span>Not connected</span></div><div><b>Image storage</b><span>Not connected</span></div><div><b>Orders</b><span>Not connected</span></div><div><b>Admin authentication</b><span>Connect before launch</span></div></div></section>}</main>
  </div>
}
