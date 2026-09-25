import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, Heart, MapPin, Phone, Mail,
  Shield, Truck, RotateCcw
} from 'lucide-react';
import './About.css';

export function About() {
  const location = useLocation();
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScroll(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="about">
      <div className="container">
        {/* Header */}
        <div className="about-header">
          <span className="about-header-tag">ABOUT HERENI</span>
          <h1>Premium Piercing Jewellery<br />Crafted with Care</h1>
        </div>

        {/* Mission Statement */}
        <div className="about-mission">
          <span className="about-mission-icon">
            <Sparkles className="icon" />
          </span>
          <div>
            <h2>Our Mission</h2>
            <p>
              At Hereni Jewellery, we're dedicated to providing premium piercing 
              jewellery that combines style, safety, and comfort. Based in Nairobi, 
              we specialize in 18K gold plated, sterling silver, and implant-grade 
              titanium pieces that are hypoallergenic and built to last.
            </p>
          </div>
        </div>

        {/* Why Choose Hereni */}
        <div className="about-why">
          <span className="about-why-icon">
            <Shield className="icon" />
          </span>
          <div>
            <h2>Why Choose Hereni</h2>
            <ul>
              <li>
                <strong>Quality Materials</strong>
                Implant-grade titanium (ASTM F136), 18K gold plating, 925 Sterling Silver
              </li>
              <li>
                <strong>Hypoallergenic</strong>
                Nickel-free and suitable for sensitive skin and fresh piercings
              </li>
              <li>
                <strong>Local Expertise</strong>
                Nairobi-based with years of piercing jewellery experience
              </li>
              <li>
                <strong>Customer First</strong>
                We're here to help you find the perfect piece for your piercing
              </li>
            </ul>
          </div>
        </div>

        {/* Our Story */}
        <div className="about-story">
          <span className="about-story-icon">
            <Truck className="icon" />
          </span>
          <div>
            <h2>Our Story</h2>
            <p>
              Hereni Jewellery was founded with a simple vision: to create a one-stop 
              shop for all piercing needs in Nairobi. What started as a small online 
              operation has grown into a trusted brand for piercing enthusiasts across 
              Kenya. We're committed to providing high-quality jewellery, excellent 
              customer service, and a seamless shopping experience for every piercing 
              lover.
            </p>
            <blockquote>
              <p>"Jewellery should enhance your piercing, not compromise your comfort."</p>
              <cite>— Hereni Jewellery</cite>
            </blockquote>
          </div>
        </div>

        {/* Contact Info */}
        <div className="about-contact">
          <span className="about-contact-icon">
            <MapPin className="icon" />
          </span>
          <div>
            <h2>Get in Touch</h2>
            <p>We're online-based and serving customers across Nairobi and beyond.</p>
            <ul className="contact-info-list">
              <li>
                <span className="contact-info-icon">
                  <Phone className="icon" />
                </span>
                <div>
                  <strong>Phone:</strong> 0116 047583
                  <a href="tel:+254116047583" className="contact-link">Call Now</a>
                </div>
              </li>
              <li>
                <span className="contact-info-icon">
                  <Mail className="icon" />
                </span>
                <div>
                  <strong>Email:</strong> hello@hereni.co.ke
                  <a href="mailto:hello@hereni.co.ke" className="contact-link">Send Email</a>
                </div>
              </li>
              <li>
                <span className="contact-info-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2zM7 19a2 2 0 0 1-2-2H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2zM7 13a2 2 0 0 1-2-2H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h2a2 2 0 0 1 2 2z"/></svg>
                </span>
                <div>
                  <strong>WhatsApp:</strong> <a href="https://wa.me/254116047583" target="_blank" rel="noopener noreferrer" className="contact-link">Message Us</a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="about-social">
          <span className="about-social-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/><line x1="12" y1="3" x2="12.01" y2="3"/></svg>
          </span>
          <p>Follow Us</p>
          <div className="social-links">
            <a href="https://instagram.com/hereni_jewellery" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/><line x1="12" y1="3" x2="12.01" y2="3"/></svg>
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