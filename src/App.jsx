import { useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'

const PHONE = '0116 047583'
const WHATSAPP = 'https://wa.me/254116047583'
const INSTAGRAM = 'https://www.instagram.com/hereni_jewellery/'
const TIKTOK = 'https://www.tiktok.com/@hereni_jewellery'

const collections = [
  { name: 'Flatbacks', note: 'A clean, comfortable start for a range of piercing placements.' },
  { name: 'Clickers', note: 'Statement hoops and subtle everyday clicker styles.' },
  { name: 'Studs', note: 'Easy layering essentials for a polished piercing look.' },
  { name: 'Threadless ends', note: 'A considered finish for compatible threadless jewellery.' },
  { name: 'Ear cuffs', note: 'No-piercing options to bring a little more jewellery to your look.' },
  { name: 'Body jewellery', note: 'Ask about septum, helix, lobe and other available pieces.' },
]

function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon"><path d="M20.5 3.5A11.6 11.6 0 0 0 3.4 17L2 22l5.2-1.4A11.6 11.6 0 1 0 20.5 3.5Z"/><path d="M8.4 7.5c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.3.1.5-.1.7l-.6.7c-.2.2-.2.4-.1.6.5 1 1.1 1.8 2.1 2.4.3.2.5.1.7-.1l.7-.8c.2-.2.4-.2.6-.1l2 1c.3.1.4.3.4.5v.6c-.1.7-.9 1.4-1.6 1.5-1.2.2-3.1-.2-5.1-1.7-2.1-1.6-3.5-3.6-3.8-4.8-.2-.6.1-1.3.3-1.7Z"/></svg>
}

function InstagramIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="icon"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r=".7" fill="currentColor" stroke="none"/></svg>
}

function Sparkle() {
  return <svg aria-hidden="true" viewBox="0 0 32 32" className="sparkle"><path d="M16 1c1 8 5 12 13 13-8 1-12 5-13 13-1-8-5-12-13-13C11 13 15 9 16 1Z"/><path d="M26 21c.4 3 1.7 4.3 4.7 4.7-3 .4-4.3 1.7-4.7 4.7-.4-3-1.7-4.3-4.7-4.7 3-.4 4.3-1.7 4.7-4.7Z"/></svg>
}

function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <div className="shell header-inner">
        <Link to="/" className="wordmark" aria-label="Hereni Jewellery home">
          <span className="wordmark-mark"><Sparkle /></span>
          <span>Hereni <b>Jewellery</b></span>
        </Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(!open)}>
          <span className="sr-only">Toggle navigation</span><i></i><i></i>
        </button>
        <nav id="site-nav" className={`site-nav ${open ? 'is-open' : ''}`} aria-label="Main navigation">
          <Link to="/collection">Collection</Link>
          <Link to="/about">Our story</Link>
          <Link to="/contact">Contact</Link>
          <a className="nav-whatsapp" href={WHATSAPP} target="_blank" rel="noreferrer"><WhatsAppIcon /> WhatsApp</a>
        </nav>
      </div>
    </header>
  </>
}

function Footer() {
  return <footer className="site-footer">
    <div className="shell footer-grid">
      <div>
        <Link to="/" className="wordmark footer-mark"><span className="wordmark-mark"><Sparkle /></span><span>Hereni <b>Jewellery</b></span></Link>
        <p>Piercing jewellery for your everyday story. Based in Nairobi, Kenya.</p>
      </div>
      <div><h2>Explore</h2><Link to="/collection">Collection</Link><Link to="/about">Our story</Link><Link to="/contact">Contact</Link></div>
      <div><h2>Say hello</h2><a href={WHATSAPP} target="_blank" rel="noreferrer">WhatsApp {PHONE}</a><a href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram @hereni_jewellery</a><a href={TIKTOK} target="_blank" rel="noreferrer">TikTok @hereni_jewellery</a></div>
    </div>
    <div className="shell footer-bottom"><span>© {new Date().getFullYear()} Hereni Jewellery</span><span>Piercing jewellery, Nairobi</span></div>
  </footer>
}

function Layout({ children }) {
  return <><Header /><main id="main">{children}</main><Footer /></>
}

function HomePage() {
  return <Layout>
    <section className="hero shell">
      <div className="hero-copy">
        <p className="eyebrow">Hereni Jewellery · Nairobi</p>
        <h1>Your piercing.<br /><em>Your signature.</em></h1>
        <p className="hero-lede">Discover a considered collection of 18K gold-plated and sterling silver piercing jewellery. Find your piece, ask a question, and make it yours.</p>
        <div className="actions"><Link className="button button-primary" to="/collection">Explore the collection <span>↗</span></Link><a className="button button-quiet" href={WHATSAPP} target="_blank" rel="noreferrer">Chat on WhatsApp</a></div>
        <p className="hero-note">Product availability, sizing and pricing are shared directly on WhatsApp.</p>
      </div>
      <div className="hero-art" aria-label="Abstract gold jewellery illustration" role="img">
        <div className="orb orb-one"></div><div className="orb orb-two"></div><div className="ring ring-one"></div><div className="ring ring-two"></div><div className="gem"></div>
        <span className="art-label">18K gold-plated<br />Sterling silver</span>
      </div>
    </section>
    <section className="intro shell"><p className="eyebrow">A little more you</p><h2>Details that make the difference.</h2><div className="values"><article><span>01</span><h3>Made to layer</h3><p>Explore clean profiles and statement pieces to suit your own piercing routine.</p></article><article><span>02</span><h3>Ask before you choose</h3><p>Not sure about a placement, finish or size? Message Hereni for personal guidance.</p></article><article><span>03</span><h3>Shop your way</h3><p>Browse the collection here, then complete your enquiry directly on WhatsApp.</p></article></div></section>
    <section className="collection-teaser"><div className="shell"><div className="section-heading"><div><p className="eyebrow">The collection</p><h2>Find your next favourite.</h2></div><Link className="text-link" to="/collection">View all collections →</Link></div><div className="collection-preview">{collections.slice(0, 3).map((item, index) => <Link to="/collection" className={`preview-card preview-${index + 1}`} key={item.name}><span className="preview-shape"></span><div><p>{item.name}</p><span>Explore <b>↗</b></span></div></Link>)}</div></div></section>
    <section className="contact-ribbon shell"><div><p className="eyebrow">Need a hand?</p><h2>Let’s find the right piece together.</h2><p>Ask about availability, finishes or how to style an existing piercing.</p></div><a className="button button-light" href={WHATSAPP} target="_blank" rel="noreferrer">Message {PHONE} <span>↗</span></a></section>
  </Layout>
}

function CollectionPage() {
  const [selected, setSelected] = useState('')
  const enquiry = selected ? `Hi Hereni Jewellery, I'm interested in ${selected}. Could you help me with availability and pricing?` : `Hi Hereni Jewellery, I'd like to ask about your piercing jewellery.`
  const whatsappUrl = `${WHATSAPP}?text=${encodeURIComponent(enquiry)}`

  return <Layout>
    <section className="page-hero shell"><p className="eyebrow">The collection</p><h1>A piece for every piercing story.</h1><p>Explore our collection themes below. Select a category to start a WhatsApp enquiry, or send a general message.</p></section>
    <section className="shell collection-layout"><div className="collection-list">{collections.map((item, index) => <button className={`collection-row ${selected === item.name ? 'selected' : ''}`} key={item.name} onClick={() => setSelected(item.name === selected ? '' : item.name)} aria-pressed={selected === item.name}><span className="row-number">0{index + 1}</span><span><strong>{item.name}</strong><small>{item.note}</small></span><span className="row-arrow">↗</span></button>)}</div><aside className="enquiry-card"><p className="eyebrow">Your enquiry</p><h2>{selected || 'Start a conversation'}</h2><p>No checkout is completed on this site. Send your questions and Hereni will share the details you need on WhatsApp.</p><a className="button button-primary full-button" href={whatsappUrl} target="_blank" rel="noreferrer">Open WhatsApp enquiry <span>↗</span></a>{selected && <button className="clear-selection" onClick={() => setSelected('')}>Clear selection</button>}</aside></section>
    <section className="material-band"><div className="shell material-inner"><p className="eyebrow">The finish</p><h2>Gold-plated. Sterling silver. Your choice.</h2><p>Hereni’s public collection features 18K gold-plated and sterling silver jewellery. Message us for the finish options currently available.</p><a className="text-link" href={`${WHATSAPP}?text=${encodeURIComponent('Hi Hereni Jewellery, which finishes are currently available?')}`} target="_blank" rel="noreferrer">Ask about finishes →</a></div></section>
  </Layout>
}

function AboutPage() {
  return <Layout><section className="page-hero shell"><p className="eyebrow">Hereni Jewellery</p><h1>Piercing jewellery with a personal touch.</h1><p>Hereni Jewellery is an online-based piercing jewellery brand based in Nairobi, Kenya.</p></section><section className="shell about-layout"><div className="about-art" role="img" aria-label="Abstract gold jewellery detail"><div className="about-ring"></div><div className="about-gem"></div></div><div className="about-copy"><p className="eyebrow">The short version</p><h2>A personal way to discover your next piece.</h2><p>Hereni shares 18K gold-plated and sterling silver jewellery for different piercing styles. Rather than pretending to offer a full online checkout, this site gives you a simple way to explore the collection and speak directly to the person behind it.</p><p>Have a question about a style, finish or placement? Reach Hereni on WhatsApp or Instagram and start there.</p><a className="button button-primary" href={WHATSAPP} target="_blank" rel="noreferrer">Start a conversation <span>↗</span></a></div></section></Layout>
}

function ContactPage() {
  const [form, setForm] = useState({ name: '', message: '' })
  const url = `${WHATSAPP}?text=${encodeURIComponent(`Hi Hereni Jewellery${form.name ? `, this is ${form.name}` : ''}. ${form.message || 'I would like to ask about your jewellery.'}`)}`
  return <Layout><section className="page-hero shell"><p className="eyebrow">Contact</p><h1>Let’s talk jewellery.</h1><p>Use this form to prepare a WhatsApp message. It opens WhatsApp with your details ready to send — nothing is submitted to this website.</p></section><section className="shell contact-layout"><form className="enquiry-form" onSubmit={e => e.preventDefault()}><label htmlFor="name">Your name (optional)</label><input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="How should Hereni address you?" /><label htmlFor="message">Your message</label><textarea id="message" rows="6" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Ask about a style, finish or placement…" /><a className="button button-primary" href={url} target="_blank" rel="noreferrer">Continue on WhatsApp <span>↗</span></a></form><aside className="contact-details"><p className="eyebrow">Reach Hereni</p><h2>Simple, direct, personal.</h2><p>Phone / WhatsApp</p><a href={WHATSAPP} target="_blank" rel="noreferrer">{PHONE}</a><p>Instagram</p><a href={INSTAGRAM} target="_blank" rel="noreferrer">@hereni_jewellery</a><p>TikTok</p><a href={TIKTOK} target="_blank" rel="noreferrer">@hereni_jewellery</a><p>Based in</p><span>Nairobi, Kenya</span></aside></section></Layout>
}

function NotFoundPage() {
  return <Layout><section className="not-found shell"><p className="eyebrow">404</p><h1>That page slipped away.</h1><p>Let’s take you back to the collection.</p><Link className="button button-primary" to="/collection">Explore the collection →</Link></section></Layout>
}

export default function App() {
  return <Routes><Route path="/" element={<HomePage />} /><Route path="/collection" element={<CollectionPage />} /><Route path="/about" element={<AboutPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="*" element={<NotFoundPage />} /></Routes>
}
