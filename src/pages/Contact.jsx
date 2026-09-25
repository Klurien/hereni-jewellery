import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, Heart, MapPin, Phone, Mail,
  Shield, Truck, RotateCcw
} from 'lucide-react';
import './Contact.css';

export function Contact() {
  const location = useLocation();
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send the form data to an API
    alert('Thank you for your message! We will get back to you within 24 hours.');
    e.target.reset();
  };

  return (
    <section className="contact">
      <div className="container">
        {/* Header */}
        <div className="contact-header">
          <span className="contact-header-tag">CONTACT US</span>
          <h1>Get in Touch</h1>
        </div>

        {/* Contact Form */}
        <div className="contact-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone (Optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="+254 7XXXXXXXX"
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select id="subject" name="subject" required>
                <option value="general">General Inquiry</option>
                <option value="product">Product Question</option>
                <option value="order">Order Status</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                required
                placeholder="Tell us about your piercing needs..."
                autoComplete="text"
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">
              Send Message
              <Sparkles className="icon" />
            </button>
          </form>
        </div>

        {/* Contact Info Sidebar */}
        <div className="contact-info">
          <span className="contact-info-icon">
            <MapPin className="icon" />
          </span>
          <h2>Location & Details</h2>
          <ul className="contact-details-list">
            <li>
              <span className="contact-detail-icon">
                <Phone className="icon" />
              </span>
              <div>
                <strong>Phone:</strong> 0116 047583
                <a href="tel:+254116047583" className="contact-detail-link">Call Now</a>
              </div>
            </li>
            <li>
              <span className="contact-detail-icon">
                <Mail className="icon" />
              </span>
              <div>
                <strong>Email:</strong> hello@hereni.co.ke
                <a href="mailto:hello@hereni.co.ke" className="contact-detail-link">Send Email</a>
              </div>
            </li>
            <li>
              <span className="contact-detail-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2zM7 19a2 2 0 0 1-2-2H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2zM7 13a2 2 0 0 1-2-2H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z"/></svg>
              </span>
              <div>
                <strong>WhatsApp:</strong> <a href="https://wa.me/254116047583" target="_blank" rel="noopener noreferrer" className="contact-detail-link">Message Us</a>
              </div>
            </li>
            <li>
              <span className="contact-detail-icon">
                <Truck className="icon" />
              </span>
              <div>
                <strong>Online Based</strong>
                <span>Nairobi, Kenya</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Map */}
        <div className="contact-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!4v1683898989123!6i16!4i32!15sChIJJV1xacULi0CRN6RQgjA9pYo!6m8!1m7!1s Kenya!2m2!1d -0.0235!2d 37.9062!3m1!1s0x182f23868fcedcab:0x11f0b4a4c0b3e3d1!2zVHJlY292ZXJlZCBQYWxhdGVzdCBkYXRldGVfc2F5!"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: '28px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            aria-label="Location map of Hereni Jewellery in Nairobi"
          />
        </div>

        {/* Social Links */}
        <div className="contact-social">
          <span className="contact-social-icon">
            <Instagram className="icon" />
          </span>
          <p>Follow Us</p>
          <div className="social-links">
            <a href="https://instagram.com/hereni_jewellery" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
              <Instagram className="icon" />
            </a>
            <a href="https://tiktok.com/@hereni_jewellery" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="social-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 22 18 8 12 11 9 8 5 11 2 12 2"/></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}