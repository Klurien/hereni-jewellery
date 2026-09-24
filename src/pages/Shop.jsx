import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { 
  Sparkles, Heart, Search, X, Check, Shield, Truck, RotateCcw,
  Filter, Zap, Eye, ArrowUpDown, Loader2, Sun, Moon
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { products, categories, materials } from '../data/products';
import './Shop.css';

export function Shop() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setIsCartOpen } = useCart();

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'new' | 'bestseller'>('new');
  const [searchTerm, setSearchTerm] = useState<string>(searchParams.get('q') || '');
  const [minPrice, setMinPrice] = useState<number>(searchParams.get('min') ? parseInt(searchParams.get('min')) : 0);
  const [maxPrice, setMaxPrice] = useState<number>(searchParams.get('max') ? parseInt(searchParams.get('max')) : Infinity);

  // Filtered products
  let filtered = [...products];

  if (selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategory);
  }

  if (selectedMaterial !== 'all') {
    filtered = filtered.filter(p => p.material === selectedMaterial);
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );
  }

  if (minPrice > 0 || maxPrice < Infinity) {
    filtered = filtered.filter(p => {
      const priceNum = parseInt(p.price);
      return (minPrice === 0 || priceNum >= minPrice) && (maxPrice === Infinity || priceNum <= maxPrice);
    });
  }

  // Sort
  if (sortBy === 'new') {
    filtered.sort((a, b) => (b.isNew ? 1 : -1) - (a.isNew ? 1 : -1));
  } else {
    filtered.sort((a, b) => (b.isBestseller ? 1 : -1) - (a.isBestseller ? 1 : -1));
  }

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedMaterial !== 'all') params.set('material', selectedMaterial);
    if (searchTerm) params.set('q', searchTerm);
    if (minPrice > 0) params.set('min', minPrice);
    if (maxPrice < Infinity) params.set('max', maxPrice);
    if (sortBy === 'bestseller') params.set('sort', 'bestseller');
    
    const newPathname = `${location.pathname}?${params.toString()}`;
    // Don't update if only page changed
    if (newPathname !== `${location.pathname}${location.search}`) {
      window.history.pushState({ path: newPathname }, '', newPathname);
    }
  }, [selectedCategory, selectedMaterial, searchTerm, minPrice, maxPrice, sortBy, location]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedMaterial, searchTerm, minPrice, maxPrice]);

  return (
    <section className="shop">
      <div className="container">
        {/* Header */}
        <div className="shop-header">
          <div className="shop-header-left">
            <h1>HERENI JEWELLERY COLLECTION</h1>
            <p className="shop-header-sub">Premium piercing jewellery for every piercing type</p>
          </div>
          <div className="shop-header-right">
            <div className="price-range">
              <label>Price Range</label>
              <input
                type="range"
                min="0"
                max="5000"
                value={Math.max(minPrice, 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setMinPrice(val);
                  setMaxPrice(Math.max(val + 100, val));
                }}
                className="price-range-input"
              />
              <span className="price-range-value" id="min-price">{minPrice > 0 ? `KSH ${minPrice.toLocaleString()}` : 'Any'}</span>
              <span className="price-range-separator"> - </span>
              <span className="price-range-value" id="max-price">{maxPrice < Infinity ? `KSH ${maxPrice.toLocaleString()}` : '∞'}</span>
            </div>
            
            <div className="sort-select">
              <label>Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="new">New Arrivals</option>
                <option value="bestseller">Bestsellers</option>
              </select>
            </div>
            
            <button
              className="icon-btn cart-btn"
              onClick={() => setIsCartOpen(!false)}
              aria-label="View cart"
            >
              <ShoppingBag className="icon" />
              {cartItems?.length > 0 && (
                <span className="cart-badge">{cartItems.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Filters Sidebar */}
        <div className="shop-filters">
          <div className="filters-section">
            <h3>Category</h3>
            <ul className="filters-list">
              <li>
                <label>
                  <input
                    type="radio"
                    name="category"
                    value="all"
                    checked={selectedCategory === 'all'}
                    onChange={() => {
                      setSelectedCategory('all');
                      setPage(1);
                    }}
                  />
                  <span>All Jewellery</span>
                </label>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <label>
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={selectedCategory === cat.id}
                      onChange={() => {
                        setSelectedCategory(cat.id);
                        setPage(1);
                      }}
                    />
                    <span>{cat.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="filters-section">
            <h3>Material</h3>
            <ul className="filters-list">
              <li>
                <label>
                  <input
                    type="radio"
                    name="material"
                    value="all"
                    checked={selectedMaterial === 'all'}
                    onChange={() => {
                      setSelectedMaterial('all');
                      setPage(1);
                    }}
                  />
                  <span>All Materials</span>
                </label>
              </li>
              {materials.map((mat) => (
                <li key={mat.id}>
                  <label>
                    <input
                      type="radio"
                      name="material"
                      value={mat.id}
                      checked={selectedMaterial === mat.id}
                      onChange={() => {
                        setSelectedMaterial(mat.id);
                        setPage(1);
                      }}
                    />
                    <span>{mat.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="filters-section">
            <h3>Price Range</h3>
            <p className="filters-price-desc">
              KSH {minPrice.toLocaleString()} - KSH {Math.min(maxPrice, 5000).toLocaleString()}
            </p>
            <div className="price-filters">
              {Array.from({ length: 6 }, (_, i) => {
                const price = i * 500;
                return (
                  <button
                    key={price}
                    className={`price-filter-btn ${minPrice > 0 && minPrice <= price ? 'active' : ''}`}
                    onClick={() => {
                      const newMin = price;
                      const newMax = Math.min(price + 500, 5000);
                      setMinPrice(newMin);
                      setMaxPrice(newMax);
                    }}
                  >
                    KSH {price.toLocaleString()}+
                  </button>
                );
              })}
            </div>
          </div>

          <div className="filters-section">
            <h3>New Arrivals</h3>
            <label>
              <input
                type="checkbox"
                checked={sortBy === 'new'}
                onChange={() => setSortBy(sortBy === 'new' ? 'bestseller' : 'new')}
              />
              Show new first
            </label>
          </div>
        </div>

        {/* Products Grid */}
        <div className="shop-products">
          {paginated.length === 0 ? (
            <div className="shop-no-results">
              <Sparkles className="icon" />
              <p>No jewellery found matching your criteria</p>
              <Link to="/shop" className="btn btn-primary">Clear All Filters</Link>
            </div>
          ) : (
            <div className="shop-products-grid">
              {paginated.map((product) => (
                <Link key={product.id} to={`/shop/${product.id}`} className="shop-product-card" onClick={() => setIsCartOpen(true)}>
                  <div className="shop-product-image">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/placeholder-400x400.png'; }}
                    />
                    {product.isNew && <span className="shop-product-badge">New</span>}
                    {product.isBestseller && <span className="shop-product-badge bestseller">Best</span>}
                  </div>
                  <div className="shop-product-info">
                    <h4 className="shop-product-name">{product.name}</h4>
                    <p className="shop-product-category">{product.category}</p>
                    <p className="shop-product-price">{product.currency} {product.price.toLocaleString()}</p>
                  </div>
                  <div className="shop-product-actions">
                    <span className="shop-product-stars">
                      {Array(5).fill(0).map((_, i) => (
                        <svg
                          key={i}
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2c1.1 0 2 .9 2 2v18l-2-1.15L5 22l2-1.15L12 2z"/>
                        </svg>
                      ))}
                    </span>
                    <button
                      className="icon-btn shop-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      <Sparkles className="icon" />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="shop-pagination">
            <button
              className={`pagination-btn ${page === 1 ? 'disabled' : ''}`}
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Prev
            </button>
            <span className="pagination-info">
              Showing {((page - 1) * pageSize) + 1} - Math.min({page * pageSize}, filtered.length) of {filtered.length} results
            </span>
            <button
              className={`pagination-btn ${page === totalPages ? 'disabled' : ''}`}
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* Count */}
        <div className="shop-count">
          Showing {filtered.length} results
        </div>
      </div>
    </section>
  );
}