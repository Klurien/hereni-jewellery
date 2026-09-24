import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sparkles, Heart, Instagram, Tiktok, WhatsApp, MapPin, Phone, Mail,
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
                  <WhatsApp className="icon" />
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
            <Instagram className="icon" />
          </span>
          <p>Follow Us</p>
          <div className="social-links">
            <a href="https://instagram.com/hereni_jewellery" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="social-link">
              <Instagram className="icon" />
            </a>
            <a href="https://tiktok.com/@hereni_jewellery" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="social-link">
              <Tiktok className="icon" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}