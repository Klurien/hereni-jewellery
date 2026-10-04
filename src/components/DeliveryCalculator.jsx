/**
 * NOVA-0102 — Delivery Calculator Component
 * Area picker with type-ahead over ALL_PRICED_AREAS grouped by zone.
 * Free-text fallback accepted.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  lookupDeliveryRate,
  DELIVERY_ZONES,
  QUOTE_ONLY_AREAS,
  TRANSFAST,
} from '../data/delivery'

export function DeliveryCalculator({ 
  value = '', 
  onChange, 
  onSelect,
  placeholder = 'Enter delivery area',
  className = '',
  showRate = true,
}) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // Group priced areas by zone for display
  const groupedAreas = useMemo(() => {
    const zones = [...DELIVERY_ZONES]
    return zones.map(zone => ({
      ...zone,
      areas: zone.areas.map(([area, rate]) => ({ area, rate }))
    }))
  }, [])

  // Filter areas based on query
  const filteredAreas = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const results = []
    for (const zone of groupedAreas) {
      const matches = zone.areas.filter(({ area }) => 
        area.toLowerCase().includes(q)
      )
      if (matches.length > 0) {
        results.push({ ...zone, areas: matches })
      }
    }
    return results
  }, [query, groupedAreas])

  // selectArea defined before effects that use it
  const selectArea = useCallback((area, zoneLabel, rate) => {
    setQuery(area)
    setOpen(false)
    setHighlightedIndex(-1)
    if (onChange) onChange(area)
    if (onSelect) onSelect({ area, zoneLabel, rate })
  }, [onChange, onSelect])

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      let totalOptions = 0
      for (const zone of filteredAreas) totalOptions += zone.areas.length
      
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex(prev => Math.min(prev + 1, totalOptions - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, -1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedIndex >= 0) {
          let idx = 0
          for (const zone of filteredAreas) {
            for (const area of zone.areas) {
              if (idx === highlightedIndex) {
                selectArea(area.area, zone.label, area.rate)
                return
              }
              idx++
            }
          }
        }
      } else if (e.key === 'Escape') {
        setOpen(false)
        setHighlightedIndex(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, filteredAreas, highlightedIndex, selectArea])

  // Reset highlight when filtered areas change - derived from render instead of effect
  // This avoids the setState-in-effect warning

  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    setHighlightedIndex(-1)
    if (onChange) onChange(val)
  }

  const handleBlur = () => {
    // Delay to allow click on dropdown
    setTimeout(() => setOpen(false), 150)
  }

  const handleFocus = () => {
    setOpen(true)
  }

  // Get current delivery status for the input value
  const deliveryStatus = useMemo(() => lookupDeliveryRate(query), [query])

  // Derive highlightedIndex reset when filteredAreas changes
  const effectiveHighlightedIndex = filteredAreas.length === 0 ? -1 : highlightedIndex

  return (
    <div className={`delivery-calculator ${className}`}>
      <div className="delivery-input-wrapper">
        <label htmlFor="delivery-area" className="delivery-label">
          Delivery area
        </label>
        <div className="delivery-input-group">
          <input
            id="delivery-area"
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            aria-expanded={open}
            aria-controls="delivery-dropdown"
            aria-autocomplete="list"
            className="delivery-input"
            autoComplete="off"
          />
          {deliveryStatus.status === 'priced' && showRate && (
            <span className="delivery-rate-badge" aria-live="polite">
              ≈ KES {deliveryStatus.rate.toLocaleString()}
            </span>
          )}
          {deliveryStatus.status === 'quote' && (
            <span className="delivery-rate-badge quote" aria-live="polite">
              Price on request
            </span>
          )}
          {deliveryStatus.status === 'unknown' && query && (
            <span className="delivery-rate-badge unknown" aria-live="polite">
              Not on card
            </span>
          )}
        </div>
      </div>

      {open && filteredAreas.length > 0 && (
        <ul id="delivery-dropdown" className="delivery-dropdown" role="listbox">
          {filteredAreas.map((zone, zoneIdx) => (
            <li key={zone.id} className="delivery-zone-group">
              <div className="delivery-zone-header">{zone.label}</div>
              {zone.areas.map(({ area, rate }, areaIdx) => {
                // Calculate global index
                let globalIdx = 0
                for (let i = 0; i < zoneIdx; i++) {
                  globalIdx += filteredAreas[i].areas.length
                }
                globalIdx += areaIdx
                
                const isHighlighted = globalIdx === effectiveHighlightedIndex
                return (
                  <button
                    key={area}
                    type="button"
                    role="option"
                    aria-selected={isHighlighted}
                    className={`delivery-area-option ${isHighlighted ? 'highlighted' : ''}`}
                    onClick={() => selectArea(area, zone.label, rate)}
                    onMouseEnter={() => setHighlightedIndex(globalIdx)}
                  >
                    <span className="delivery-area-name">{area}</span>
                    <span className="delivery-area-rate">KES {rate.toLocaleString()}</span>
                  </button>
                )
              })}
            </li>
          ))}
        </ul>
      )}

      {open && filteredAreas.length === 0 && query.trim() && (
        <div className="delivery-dropdown delivery-empty">
          <p>No matching areas found.</p>
          <p className="delivery-hint">
            Type any area name — we'll check the rate card and confirm on WhatsApp.
          </p>
        </div>
      )}

      {/* Status message for user feedback */}
      <DeliveryStatusMessage status={deliveryStatus} query={query} />
    </div>
  )
}

function DeliveryStatusMessage({ status, query }) {
  if (!query.trim()) return null

  const disclaimer = 'Prices may vary depending on parcel size & weight.'

  switch (status.status) {
    case 'priced':
      return (
        <div className="delivery-status priced" role="status" aria-live="polite">
          <span className="status-indicator">✓</span>
          <span>
            Covered by Transfast — <strong>≈ KES {status.rate.toLocaleString()}</strong> estimate.
            <br /><small>{disclaimer}</small>
          </span>
        </div>
      )
    case 'quote':
      return (
        <div className="delivery-status quote" role="status" aria-live="polite">
          <span className="status-indicator">✎</span>
          <span>
            This area is covered but has no fixed rate on the card.
            <br />We'll send a <strong>WhatsApp quote</strong> with the exact price.
          </span>
        </div>
      )
    case 'unknown':
      return (
        <div className="delivery-status unknown" role="status" aria-live="polite">
          <span className="status-indicator">?</span>
          <span>
            This area isn't on the Transfast rate card.
            <br />We'll check with them and reply on <strong>WhatsApp</strong>.
          </span>
        </div>
      )
    case 'cbd':
      return (
        <div className="delivery-status priced" role="status" aria-live="polite">
          <span className="status-indicator">✓</span>
          <span>
            Within CBD — <strong>KES {status.rate.toLocaleString()}</strong>.
            <br /><small>{disclaimer}</small>
          </span>
        </div>
      )
    default:
      return null
  }
}

/**
 * Admin-only delivery rates panel
 * Shows zones and rates read-only with disclaimer about photographed card.
 */
export function DeliveryAdminPanel({ showUnverifiedNumbers = false }) {
  return (
    <section className="admin-panel delivery-admin-panel">
      <div className="admin-panel-head">
        <div>
          <span className="admin-kicker">Delivery</span>
          <h2>Transfast rate card (read-only)</h2>
        </div>
      </div>
      
      <div className="delivery-disclaimer">
        <strong>Source:</strong> Photographed Transfast Logistics Service rate card (Nairobi).
        <br />
        <strong>Status:</strong> Prices transcribed from image — <em>not yet confirmed with Transfast.</em>
        <br />
        <strong>Card disclaimer:</strong> "{TRANSFAST.disclaimer}"
      </div>

      {showUnverifiedNumbers && (
        <div className="delivery-unverified-numbers">
          <strong>Unverified contact numbers (admin only):</strong>
          <ul>
            {TRANSFAST.phones.map((phone, i) => (
              <li key={i}>{phone}</li>
            ))}
          </ul>
          <p className="admin-notice">
            Do not display these publicly until verified with Transfast.
          </p>
        </div>
      )}

      <div className="delivery-zones-table">
        {DELIVERY_ZONES.map(zone => (
          <div key={zone.id} className="delivery-zone-panel">
            <h3>{zone.label} {zone.rate && <span className="zone-rate">KES {zone.rate.toLocaleString()}</span>}</h3>
            {zone.areas.length > 0 && (
              <table className="delivery-rates-table">
                <thead>
                  <tr><th>Area</th><th>Rate (KES)</th></tr>
                </thead>
                <tbody>
                  {zone.areas.map(([area, rate]) => (
                    <tr key={area}>
                      <td>{area}</td>
                      <td>{rate.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {zone.areas.length === 0 && (
              <p className="delivery-cbd-note">Flat rate: KES {zone.rate.toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>

      <div className="delivery-quote-areas">
        <h3>Quote-only areas (covered, no fixed rate on card)</h3>
        <p className="delivery-quote-note">
          These areas appear on the card under "OTHER AREAS WE COVER" but have no price listed.
          They route to a WhatsApp quote. Several also appear in priced zones above; the priced entry wins.
        </p>
        <ul className="delivery-quote-list">
          {QUOTE_ONLY_AREAS.map((area, i) => (
            <li key={i}>{area}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * Compact delivery display for cart drawer
 */
export function DeliverySummary({ area, onChange }) {
  if (!area) {
    return (
      <div className="delivery-summary empty">
        <label htmlFor="cart-delivery-area" className="delivery-label">Delivery area</label>
        <DeliveryCalculator
          id="cart-delivery-area"
          placeholder="Enter area for delivery estimate"
          onSelect={onChange}
          showRate={false}
        />
      </div>
    )
  }

  const status = lookupDeliveryRate(area)

  return (
    <div className="delivery-summary">
      <label className="delivery-label">Delivery area</label>
      <div className="delivery-chosen">
        <span className="delivery-area-name">{area}</span>
        <button type="button" className="delivery-change" onClick={() => onChange(null)}>
          Change
        </button>
      </div>
      <div className={`delivery-estimate ${status.status}`}>
        {status.status === 'priced' && (
          <>
            <span className="estimate-amount">≈ KES {status.rate.toLocaleString()}</span>
            <span className="estimate-disclaimer">Prices may vary depending on parcel size & weight.</span>
          </>
        )}
        {status.status === 'quote' && (
          <span className="estimate-quote">Covered — price on request (WhatsApp quote)</span>
        )}
        {status.status === 'unknown' && (
          <span className="estimate-unknown">Not on rate card — we'll check on WhatsApp</span>
        )}
        {status.status === 'cbd' && (
          <>
            <span className="estimate-amount">KES {status.rate.toLocaleString()}</span>
            <span className="estimate-disclaimer">Prices may vary depending on parcel size & weight.</span>
          </>
        )}
      </div>
    </div>
  )
}