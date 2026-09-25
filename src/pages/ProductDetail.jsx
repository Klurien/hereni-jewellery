import { useState, useEffect, useParams } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, Heart, Search, X, Check, Shield, Truck, RotateCcw,
  MapPin, Phone, Mail,
  Minus, Plus, Delete, CheckCircle, ShoppingCart
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { products } from '../data/products';
import './ProductDetail.css';

export function ProductDetail() {
  const { id } = useParams();
  const product = products.find(p => p.id.toString() === id);
  const location = useLocation();
  const { cartItems, addToCart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const [selectedGauge, setSelectedGauge] = useState<string>('');
  const [selectedLength, setSelectedLength] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [showImages, setShowImages] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [showColorOptions, setShowColorOptions] = useState(false);
  const [colorOptions, setColorOptions] = useState([]);
  const [isMobile, isMobileFn] = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (!product) {
    return (
      <div className="product-not-found">
        <Sparkles className="icon" />
        <h2>Product Not Found</h2>
        <Link to="/shop" className="btn btn-primary">Back to Shop</Link>
      </div>
    );
  }

  // Determine color options based on material
  useEffect(() => {
    const materialMap = {
      titanium: ['Silver', 'Gold', 'Rose Gold', 'Blue', 'Purple'],
      gold: ['Gold'],
      'rose-gold': ['Rose Gold'],
      sterling: ['Silver'],
      '14k-gold': ['Gold'],
    };
    const options = materialMap[product.material] || ['Silver'];
    setColorOptions(options);
    // Set default selection
    if (!selectedColor) setSelectedColor(options[0]);
  }, [product.material, selectedColor]);

  // Update gauges based on product
  useEffect(() => {
    const gaugeMap = {
      'Verta Threadless Flatback': ['16G (1.2mm)', '18G (1.0mm)'],
      'Aurum Clicker Ring': ['16G (1.2mm)'],
      'Celeste Stud Set': ['20G (0.8mm)'],
      'Rose Clicker Heart': ['16G (1.2mm)'],
      'Titanium Seamless Ring': ['16G (1.2mm), 18G (1.0mm)'],
      'Opal Threadless Ends': ['3mm, 4mm, 5mm'],
      'Sterling Ear Cuff Set': ['Adjustable'],
      'Gold Beaded Septum Ring': ['16G (1.2mm)'],
    };
    const options = gaugeMap[product.name] || [];
    setSelectedLength(options[0] || '');
  }, [product.name]);

  const gaugeOptions = selectedLength ? selectedLength.split(',').map(s => s.trim()) : [];

  const handleGaugeChange = (gauge) => {
    setSelectedGauge(gauge);
    // Update color selection based on gauge
    if (gaugeOptions.length > 0) {
      const defaultColor = colorOptions[0];
      setSelectedColor(defaultColor);
    }
  };

  const handleLengthChange = (length) => {
    setSelectedLength(length);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
  };

  // Add to cart with variant
  const addToCartWithVariant = () => {
    addToCart(product, {
      gauge: selectedGauge,
      length: selectedLength,
      color: selectedColor,
      quantity,
    });
  };

  // Remove from cart if already in cart
  useEffect(() => {
    if (cartItems.some(item => item.id === product.id)) {
      // Optionally focus cart
    }
  }, [cartItems, product.id]);

  return (
    <section className="product-detail">
      <div className="container">
        {/* Breadcrumbs */}
        <nav className="product-breadcrumbs" aria-label="Breadcrumb">
          <a href="/" className="breadcrumb-link">Home</a>
          <span className="breadcrumb-separator">/</span>
          <a href="/shop" className="breadcrumb-link">Shop</a>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product?.name || 'Product'}</span>
        </nav>

        {/* Product Gallery */}
        <div className="product-gallery">
          <div className="product-gallery-main">
            <div className="product-gallery-main-image">
              <img
                src={product.images[0]}
                alt={product.name}
                loading="lazy"
                onError={(e) => { e.target.src = '/placeholder-600x600.png'; }}
              />
              {product.images.length > 1 && (
                <button
                  className="product-gallery-prev"
                  onClick={() => setImageIndex(prev => Math.max(0, prev - 1))}
                  aria-label="Previous image"
                >
                  <X className="icon" />
                </button>
              )}
              {product.images.length > 1 && (
                <button
                  className="product-gallery-next"
                  onClick={() => setImageIndex(prev => Math.min(product.images.length - 1, prev + 1))}
                  aria-label="Next image"
                >
                  <Sparkles className="icon" />
                </button>
              )}
            </div>
          </div>

          {product.images.length > 1 && (
            <div className="product-gallery-thumbnails">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  className={`product-gallery-thumbnail ${imageIndex === i ? 'active' : ''}`}
                  onClick={() => setImageIndex(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <img
                    src={img}
                    alt={`${product.name} - image ${i + 1}`}
                    loading="lazy"
                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-info-header">
            <h1 className="product-name">{product.name}</h1>
            <div className="product-rating">
              {Array(5).fill(0).map((_, i) => (
                <svg
                  key={i}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2c1.1 0 2 .9 2 2v18l-2-1.15L5 22l2-1.15L12 2z"/>
                </svg>
              ))}
              <span className="rating-count">({Math.floor(Math.random() * 100 + 10)} reviews)</span>
            </div>
          </div>

          {/* Product Tags */}
          <div className="product-tags">
            {product.isNew && <span className="product-tag product-tag-new">New</span>}
            {product.isBestseller && <span className="product-tag product-tag-bestseller">Best Seller</span>}
            {product.category && <span className="product-tag">{product.category}</span>}
          </div>

          {/* Price */}
          <div className="product-price">
            <span className="product-price-amount">{product.currency} {product.price.toLocaleString()}</span>
            {product.currency === 'KSH' && (
              <small className="product-price-note">Free delivery on orders over KSH 5,000</small>
            )}
          </div>

          {/* Variant Selector */}
          {product.gaugeOptions && gaugeOptions.length > 0 && (
            <div className="product-variant-selector">
              <h3 className="product-variant-title">Select Options</h3>
              
              <div className="product-variant-gauge">
                <label className="product-variant-label">Gauge</label>
                <div className="product-variant-gauge-options">
                  {gaugeOptions.map((gauge) => (
                    <button
                      key={gauge}
                      className={`product-variant-gauge-option ${selectedGauge === gauge ? 'selected' : ''}`}
                      onClick={() => handleGaugeChange(gauge)}
                      aria-selected={selectedGauge === gauge}
                    >
                      {gauge}
                    </button>
                  ))}
                </div>
              </div>

              {product.lengthOptions && gaugeOptions.length > 0 && (
                <div className="product-variant-length">
                  <label className="product-variant-label">Length</label>
                  <div className="product-variant-length-options">
                    {gaugeOptions.map((length) => (
                      <button
                        key={length}
                        className={`product-variant-length-option ${selectedLength === length ? 'selected' : ''}`}
                        onClick={() => handleLengthChange(length)}
                        aria-selected={selectedLength === length}
                      >
                        {length}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {colorOptions.length > 0 && (
                <div className="product-variant-color">
                  <label className="product-variant-label">Color</label>
                  <div className="product-variant-color-options">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        className={`product-variant-color-option ${selectedColor === color ? 'selected' : ''}`}
                        onClick={() => handleColorChange(color)}
                        aria-selected={selectedColor === color}
                        style={{ backgroundColor: color.toLowerCase() === 'gold' ? '#D4AF37' : color.toLowerCase() === 'rose gold' ? '#E8B4B8' : '#C0C0C0' }}
                      >
                        <span />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          <div className="product-quantity-selector">
            <label className="product-quantity-label">Quantity</label>
            <div className="product-quantity-controls">
              <button
                className="product-quantity-btn"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="product-quantity-value">{quantity}</span>
              <button
                className="product-quantity-btn"
                onClick={() => setQuantity(prev => prev + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="product-action-buttons">
            <button
              className="btn btn-primary product-add-to-cart"
              onClick={addToCartWithVariant}
              aria-label="Add to cart"
            >
              Add to Cart
              <ShoppingCart className="icon" />
            </button>
            
            {cartItems.some(item => item.id === product.id) ? (
              <button
                className="btn btn-secondary product-cart-notice"
              >
                <CheckCircle className="icon" /> In Cart
              </button>
            ) : (
              <button
                className="btn btn-outline product-cart-notice"
                onClick={() => setIsCartOpen(true)}
                aria-label="View cart"
              >
                View Cart
                <ShoppingBag className="icon" />
              </button>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Features */}
          {product.features && product.features.length > 0 && (
            <div className="product-features">
              <h3>Features</h3>
              <ul>
                {product.features.map((feature, i) => (
                  <li key={i}>
                    <span className="feature-icon">
                      <Sparkles className="icon" width={12} height={12} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="product-specifications">
              <h3>Specifications</h3>
              <div className="specifications-grid">
                {Object.entries(product.specifications).map(([key, value], i) => (
                  <div key={i} className="specification-item">
                    <span className="specification-key">{key}:</span>
                    <span className="specification-value">{Array.isArray(value) ? value.join(', ') : value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}