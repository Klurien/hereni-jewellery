import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, Heart, MapPin, Phone, Mail,
  Search, X, Check, Shield, Truck, RotateCcw
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Home.css';

export function Home() {
  const location = useLocation();
  const { cartCount, addToCart, cartItems, cartTotal } = useCart();
  const [showFeatured, setShowFeatured] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('hereni-show-featured');
    if (saved) setShowFeatured(JSON.parse(saved));
  }, []);
  useEffect(() => {
    localStorage.setItem('hereni-show-featured', JSON.stringify(showFeatured));
  }, [showFeatured]);

  const products = [
    { id: 1, name: 'Verta Threadless Flatback', price: 300, currency: 'KSH', category: 'Flatbacks', image: '/placeholder-400x400.png' },
    { id: 2, name: 'Aurum Clicker Ring', price: 1800, currency: 'KSH', category: 'Clickers', image: '/placeholder-400x400.png' },
    { id: 3, name: 'Celeste Stud Set', price: 1200, currency: 'KSH', category: 'Studs', image: '/placeholder-400x400.png' },
    { id: 4, name: 'Rose Clicker Heart', price: 1950, currency: 'KSH', category: 'Clickers', image: '/placeholder-400x400.png' },
    { id: 5, name: 'Titanium Seamless Ring', price: 950, currency: 'KSH', category: 'Seamless Rings', image: '/placeholder-400x400.png' },
  ];

  const featured = products.filter((_, i) => i < 3);

  const categories = [
    { id: 'all', name: 'All', count: products.length },
    { id: 'flatbacks', name: 'Flatbacks', count: 1 },
    { id: 'clickers', name: 'Clickers', count: 2 },
    { id: 'studs', name: 'Studs', count: 1 },
    { id: 'seamless', name: 'Seamless', count: 1 },
  ];

  return (
    <section className="home">
      <div className="container">
        {/* Hero Section */}
        <div className="home-hero">
          <div className="home-hero-content">
            <span className="home-hero-tag">HERENI JEWELLERY</span>
            <h1 className="home-hero-title">Premium Piercing Jewellery<br />for Every Piercing</h1>
            <p className="home-hero-desc">18K Gold Plated • Sterling Silver • Implant-Grade Titanium<br />Nairobi-based • Worldwide shipping</p>
            <div className="home-hero-actions">
              <Link to="/shop" className="btn btn-primary btn-large">
                Browse Collection
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <div className="home-hero-stats">
                <div>
                  <span className="stat-number" data-target="1500">{cartCount || 0}</span>
                  <span className="stat-label">Happy Piercings</span>
                </div>
                <div>
                  <span className="stat-number" data-target="{cartTotal || 0}">{cartTotal || 0}</span>
                  <span className="stat-label">KSH Free Shipping</span>
                </div>
              </div>
            </div>
          </div>
          <div className="home-hero-image">
            <div className="home-hero-img-wrapper">
              <img src="https://images.unsplash.com/photo-1599643478518-17488fbbcd72?w=500&h=600&fit=crop" alt="Hereni Jewellery showcase" loading="lazy" />
              <div className="home-hero-badge">New Arrivals</div>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        {showFeatured && featured.length > 0 && (
          <div className="home-featured">
            <span className="home-featured-tag">Featured</span>
            <div className="home-featured-grid">
              {featured.map((product) => (
                <Link key={product.id} to={`/shop/${product.id}`} className="home-featured-card">
                  <div className="home-featured-image">
                    <img src="https://images.unsplash.com/photo-1630019852942-f89202989a53?w=400&h=400&fit=crop" alt={product.name} loading="lazy" />
                    <span className="home-featured-badge">{product.category}</span>
                  </div>
                  <div className="home-featured-info">
                    <h4 className="home-featured-name">{product.name}</h4>
                    <p className="home-featured-price">{product.currency} {product.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="home-categories">
          <span className="home-categories-tag">Shop By Category</span>
          <div className="home-categories-grid">
            {categories.map((category) => (
              <Link key={category.id} to={category.href} className="home-category-card">
                <span className="home-category-icon">
                  {category.id === 'flatbacks' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/></svg> }
                  {category.id === 'clickers' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l4-5 8 7-4 5"/></svg> }
                  {category.id === 'studs' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l4-5 8 7-4 5"/></svg> }
                  {category.id === 'seamless' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l-2-8 14 2L22 8l-7 5-2-7z"/></svg> }
                </span>
                <span className="home-category-name">{category.name}</span>
                <span className="home-category-count">({category.count})</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Why Choose Hereni */}
        <div className="home-why">
          <span className="home-why-tag">Why Choose Hereni</span>
          <div className="home-why-grid">
            <div className="home-why-card">
              <Sparkles className="icon" />
              <h4>Quality Guaranteed</h4>
              <p>Hypoallergenic materials, implant-grade titanium, 18K gold plating</p>
            </div>
            <div className="home-why-card">
              <Truck className="icon" />
              <h4>Free Shipping</h4>
              <p>On orders over KSH 5,000 within Nairobi</p>
            </div>
            <div className="home-why-card">
              <Shield className="icon" />
              <h4>Secure Payment</h4>
              <p>M-Pesa, Card, PayPal accepted</p>
            </div>
            <div className="home-why-card">
              <Heart className="icon" />
              <h4>Easy Returns</h4>
              <p>14-day hassle-free returns</p>
            </div>
          </div>
        </div>

        {/* Instagram Feed Preview */}
        <div className="home-instagram">
          <span className="home-instagram-tag">Follow Us</span>
          <div className="home-instagram-grid">
            <div className="home-instagram-item">
              <img src="https://images.unsplash.com/photo-1574239163572-21b3be9e4545?w=200&h=200&fit=crop" alt="Instagram post" loading="lazy" />
            </div>
            <div className="home-instagram-item">
              <img src="https://images.unsplash.com/photo-1599643478518-17488fbbcd72?w=200&h=200&fit=crop" alt="Instagram post" loading="lazy" />
            </div>
            <div className="home-instagram-item">
              <img src="https://images.unsplash.com/photo-1630019852942-f89202989a53?w=200&h=200&fit=crop" alt="Instagram post" loading="lazy" />
            </div>
            <div className="home-instagram-item">
              <img src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=200&h=200&fit=crop" alt="Instagram post" loading="lazy" />
            </div>
          </div>
          <a href="https://instagram.com/hereni_jewellery" target="_blank" rel="noopener noreferrer" className="home-instagram-link">
            @hereni_jewellery on Instagram
          </a>
        </div>

        {/* Contact CTA */}
        <div className="home-cta">
          <div className="home-cta-content">
            <span className="home-cta-tag">Get in Touch</span>
            <h2>Have questions about your piercing?</h2>
            <p>Our piercing experts are here to help you find the perfect jewellery.</p>
            <div className="home-cta-details">
              <div className="home-cta-item">
                <Phone className="icon" />
                <span>0116 047583</span>
              </div>
              <div className="home-cta-item">
                <Mail className="icon" />
                <a href="mailto:hello@hereni.co.ke">hello@hereni.co.ke</a>
              </div>
            </div>
          </div>
          <div className="home-cta-image">
            <img src="https://images.unsplash.com/photo-1599643478518-17488fbbcd72?w=500&h=400&fit=crop" alt="Contact Hereni" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}