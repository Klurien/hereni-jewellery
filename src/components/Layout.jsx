import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, ShoppingBag, User, Search, Heart, 
  MapPin, Phone, Mail, 
  ChevronDown, ChevronUp, Truck, Shield, RotateCcw, Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Layout.css';

export function Layout({ children }) {
  const location = useLocation();
  const { cartCount, isCartOpen, setIsCartOpen, cartItems, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  const navigation = [
    { label: 'Shop', href: '/shop', hasDropdown: true, dropdown: [
      { label: 'All Jewellery', href: '/shop' },
      { label: 'Flatbacks', href: '/shop?category=flatbacks' },
      { label: 'Clickers', href: '/shop?category=clickers' },
      { label: 'Studs', href: '/shop?category=studs' },
      { label: 'Seamless Rings', href: '/shop?category=seamless' },
      { label: 'Threadless Ends', href: '/shop?category=threadless' },
      { label: 'Ear Cuffs', href: '/shop?category=earcuffs' },
      { label: 'Septum', href: '/shop?category=septum' },
    ]},
    { label: 'Materials', href: '/shop?material=all', hasDropdown: true, dropdown: [
      { label: 'All Materials', href: '/shop' },
      { label: 'Implant-Grade Titanium', href: '/shop?material=titanium' },
      { label: '18K Gold Plated', href: '/shop?material=gold' },
      { label: '18K Rose Gold Plated', href: '/shop?material=rose-gold' },
      { label: 'Sterling Silver', href: '/shop?material=sterling' },
      { label: '14K Gold', href: '/shop?material=14k-gold' },
    ]},
    { label: 'New Arrivals', href: '/shop?sort=new' },
    { label: 'Bestsellers', href: '/shop?sort=bestseller' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <div className="layout">
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-top">
          <div className="container header-top-content">
            <span className="header-announcement">
              <Sparkles className="icon" /> Free delivery on orders over KSH 5,000 • Nairobi based • WhatsApp: 0116 047583
            </span>
          </div>
        </div>

        <nav className="header-main container" role="navigation" aria-label="Main navigation">
          <Link to="/" className="logo" aria-label="Hereni Jewellery Home">
            <span className="logo-icon">
              <Sparkles className="icon" />
            </span>
            <span className="logo-text">HERENI</span>
            <span className="logo-sub">JEWELLERY</span>
          </Link>

          <div className="nav-center">
            <ul className="nav-list desktop-nav" role="menubar">
              {navigation.map((item, index) => (
                <li key={index} className="nav-item" role="none">
                  {item.hasDropdown ? (
                    <div className="dropdown" role="menu">
                      <button 
                        className="nav-link dropdown-trigger" 
                        role="menuitem"
                        aria-haspopup="true"
                        aria-expanded={activeDropdown === index}
                        onMouseEnter={() => setActiveDropdown(index)}
                        onMouseLeave={() => setActiveDropdown(null)}
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveDropdown(activeDropdown === index ? null : index);
                        }}
                      >
                        {item.label}
                        <ChevronDown className="icon chevron" />
                      </button>
                      {activeDropdown === index && (
                        <div className="dropdown-menu" role="menu">
                          {item.dropdown.map((sub, si) => (
                            <Link 
                              key={si} 
                              to={sub.href} 
                              className="dropdown-link" 
                              role="menuitem"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to={item.href} className="nav-link" role="menuitem">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="nav-actions">
              <button 
                className="icon-btn" 
                aria-label="Search"
                onClick={() => {}}
              >
                <Search className="icon" />
              </button>
              <button 
                className="icon-btn" 
                aria-label="Wishlist"
                onClick={() => {}}
              >
                <Heart className="icon" />
              </button>
              <button 
                className="icon-btn cart-btn" 
                aria-label={`Shopping cart, ${cartCount} items`}
                onClick={() => setIsCartOpen(!isCartOpen)}
              >
                <ShoppingBag className="icon" />
                {cartCount > 0 && (
                  <span className="cart-badge" aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </button>
              <button 
                className="icon-btn mobile-only" 
                aria-label="Account"
                onClick={() => {}}
              >
                <User className="icon" />
              </button>
              <button 
                className="mobile-menu-btn" 
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="icon" /> : <Menu className="icon" />}
              </button>
            </div>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="mobile-menu" role="dialog" aria-label="Mobile navigation">
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">Menu</span>
              <button 
                className="icon-btn" 
                aria-label="Close menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="icon" />
              </button>
            </div>
            <nav className="mobile-nav">
              {navigation.map((item, index) => (
                <div key={index} className="mobile-nav-item">
                  {item.hasDropdown ? (
                    <div className="mobile-dropdown">
                      <button 
                        className="mobile-dropdown-trigger"
                        onClick={() => setActiveDropdown(activeDropdown === index ? null : index)}
                        aria-expanded={activeDropdown === index}
                      >
                        {item.label}
                        {activeDropdown === index ? <ChevronUp className="icon" /> : <ChevronDown className="icon" />}
                      </button>
                      {activeDropdown === index && (
                        <div className="mobile-dropdown-menu">
                          {item.dropdown.map((sub, si) => (
                            <Link 
                              key={si} 
                              to={sub.href} 
                              className="mobile-dropdown-link"
                              onClick={() => { setIsMobileMenuOpen(false); setActiveDropdown(null); }}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link 
                      to={item.href} 
                      className="mobile-nav-link"
                      onClick={() => { setIsMobileMenuOpen(false); setActiveDropdown(null); }}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="main" id="main-content">
        {children}
      </main>

      <footer className="footer" role="contentinfo">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="footer-logo" aria-label="Hereni Jewellery Home">
                <span className="logo-icon">
                  <Sparkles className="icon" />
                </span>
                <span className="logo-text">HERENI</span>
                <span className="logo-sub">JEWELLERY</span>
              </Link>
              <p className="footer-tagline">One-stop shop for all your piercing needs. Premium 18K gold plated, sterling silver & implant-grade titanium jewellery.</p>
              <div className="social-links">
                <a href="https://instagram.com/hereni_jewellery" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/><line x1="12" y1="3" x2="12.01" y2="3"/></svg>
                </a>
                <a href="https://tiktok.com/@hereni_jewellery" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="social-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 22 18 8 12 11 9 8 5 11 2 12 2"/></svg>
                </a>
                <a href="https://wa.me/254116047583" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="social-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2zM7 19a2 2 0 0 1-2-2H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2zM7 13a2 2 0 0 1-2-2H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z"/></svg>
                </a>
              </div>
            </div>

            <div className="footer-links">
              <h4 className="footer-heading">Shop</h4>
              <ul className="footer-list">
                <li><Link to="/shop" className="footer-link">All Jewellery</Link></li>
                <li><Link to="/shop?category=flatbacks" className="footer-link">Flatbacks</Link></li>
                <li><Link to="/shop?category=clickers" className="footer-link">Clickers</Link></li>
                <li><Link to="/shop?category=studs" className="footer-link">Studs</Link></li>
                <li><Link to="/shop?category=seamless" className="footer-link">Seamless Rings</Link></li>
                <li><Link to="/shop?category=threadless" className="footer-link">Threadless Ends</Link></li>
                <li><Link to="/shop?category=earcuffs" className="footer-link">Ear Cuffs</Link></li>
                <li><Link to="/shop?category=septum" className="footer-link">Septum</Link></li>
              </ul>
            </div>

            <div className="footer-links">
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-list">
                <li><Link to="/contact" className="footer-link">Contact Us</Link></li>
                <li><Link to="/about" className="footer-link">About Hereni</Link></li>
                <li><a href="#" className="footer-link">Shipping Info</a></li>
                <li><a href="#" className="footer-link">Returns & Exchanges</a></li>
                <li><a href="#" className="footer-link">Size Guide</a></li>
                <li><a href="#" className="footer-link">Piercing Aftercare</a></li>
                <li><a href="#" className="footer-link">FAQs</a></li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4 className="footer-heading">Contact Us</h4>
              <ul className="contact-list">
                <li className="contact-item">
                  <MapPin className="icon" />
                  <span>Online Based, Nairobi, Kenya</span>
                </li>
                <li className="contact-item">
                  <Phone className="icon" />
                  <a href="tel:+254116047583" className="contact-link">0116 047583</a>
                </li>
                <li className="contact-item">
                  <Mail className="icon" />
                  <a href="mailto:hello@hereni.co.ke" className="contact-link">hello@hereni.co.ke</a>
                </li>
                <li className="contact-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2zM7 19a2 2 0 0 1-2-2H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2zM7 13a2 2 0 0 1-2-2H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z"/></svg>
                  <a href="https://wa.me/254116047583" target="_blank" rel="noopener noreferrer" className="contact-link">WhatsApp Us</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-benefits">
            <div className="benefit">
              <Truck className="icon" />
              <div>
                <strong>Free Shipping</strong>
                <span>Orders over KSH 5,000</span>
              </div>
            </div>
            <div className="benefit">
              <Shield className="icon" />
              <div>
                <strong>Secure Payment</strong>
                <span>M-Pesa & Card accepted</span>
              </div>
            </div>
            <div className="benefit">
              <RotateCcw className="icon" />
              <div>
                <strong>Easy Returns</strong>
                <span>14-day return policy</span>
              </div>
            </div>
            <div className="benefit">
              <Sparkles className="icon" />
              <div>
                <strong>Quality Guaranteed</strong>
                <span>Hypoallergenic materials</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Hereni Jewellery. All rights reserved.</p>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {isCartOpen && (
        <div className="cart-overlay" onClick={() => setIsCartOpen(false)} aria-hidden="true" />
      )}

      <aside className={`cart-drawer ${isCartOpen ? 'open' : ''}`} role="dialog" aria-label="Shopping cart" aria-modal="true">
        <div className="cart-header">
          <h3>Your Cart (<span>{cartCount}</span>)</h3>
          <button className="icon-btn" aria-label="Close cart" onClick={() => setIsCartOpen(false)}>
            <X className="icon" />
          </button>
        </div>

        <div className="cart-content">
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <ShoppingBag className="icon large" />
              <p>Your cart is empty</p>
              <Link to="/shop" className="btn btn-primary" onClick={() => setIsCartOpen(false)}>
                Continue Shopping
              </Link>
            </div>
          ) : (
            <>
              <ul className="cart-items" role="list">
                {cartItems.map((item, index) => (
                  <li key={index} className="cart-item">
                    <img src={item.images[0]} alt={item.name} className="cart-item-image" loading="lazy" />
                    <div className="cart-item-details">
                      <h4 className="cart-item-name">{item.name}</h4>
                      <p className="cart-item-variant">
                        {item.selectedGauge && `Gauge: ${item.selectedGauge}`}
                        {item.selectedLength && ` • Length: ${item.selectedLength}`}
                        {item.selectedColor && ` • ${item.selectedColor}`}
                      </p>
                      <p className="cart-item-price">{item.currency} {item.price.toLocaleString()}</p>
                      <div className="cart-item-quantity">
                        <button 
                          className="qty-btn" 
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >−</button>
                        <span className="qty-value">{item.quantity}</span>
                        <button 
                          className="qty-btn" 
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                        >+</button>
                      </div>
                    </div>
                    <button 
                      className="cart-item-remove" 
                      aria-label={`Remove ${item.name} from cart`}
                      onClick={() => removeFromCart(index)}
                    >
                      <X className="icon small" />
                    </button>
                  </li>
                ))}
              </ul>

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{cartItems[0]?.currency || 'KSH'} {cartTotal.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{cartTotal >= 5000 ? 'Free' : 'Calculated at checkout'}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{cartItems[0]?.currency || 'KSH'} {cartTotal.toLocaleString()}</span>
                </div>
                <p className="shipping-note">
                  {cartTotal < 5000 ? `Add KSH ${(5000 - cartTotal).toLocaleString()} more for free shipping!` : 'You qualify for free shipping!'}
                </p>
                <Link to="/contact" className="btn btn-primary btn-full" onClick={() => setIsCartOpen(false)}>
                  Proceed to Checkout
                </Link>
                <button className="btn btn-secondary btn-full" onClick={clearCart}>
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}