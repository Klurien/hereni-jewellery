/**
 * Delivery zones and prices — Transfast Logistics Service.
 *
 * SOURCE: the price list supplied by the founder as `hereni.jpeg`
 * (a photographed Transfast Logistics Service rate card, Nairobi).
 * Every price below is transcribed from that image. KES. Flat rate per drop.
 *
 * Two numbers must be verified with Transfast before launch:
 *   - the phone numbers on the card (0729727851 / 0717730112)
 *   - whether the rates have changed since the card was printed
 *
 * The card itself says: "NB: Prices may vary depending on parcel size & weight."
 * This site therefore shows the listed rate as an ESTIMATE and routes the final
 * arrangement to WhatsApp. It does not claim to charge anything.
 */

/** Flat rate for deliveries inside the CBD. */
export const CBD_RATE = 100

/** Group heading exactly as printed on the card. */
export const DELIVERY_ZONES = [
  {
    id: 'cbd',
    label: 'Within CBD / Parcel',
    hint: 'Central business district and parcel handover',
    rate: CBD_RATE,
    areas: [],
  },
  {
    id: 'thika-road',
    label: 'Thika Road',
    areas: [
      ['Ngara', 250], ['Pangani', 300], ['Muthaiga', 350], ['SOK', 350],
      ['All Soaps', 350], ['Roasters', 350], ['Garden City', 350],
      ['TRM / Roysambu', 400], ['Thome', 400], ['Marurui', 500],
      ['Githurai', 500], ['Mwihoko', 600], ['KJ', 600], ['Kamiti', 700],
      ['Kimbo', 700], ['Ruiru', 800], ['Tatu City', 900], ['Juja', 900],
      ['Thika', 1500],
    ],
  },
  {
    id: 'lower-kabete-road',
    label: 'Lower Kabete Road',
    areas: [
      ['Kitisuru', 500], ['Wangige', 700], ['Kikuyu', 700], ['Sigona', 700],
      ['Kanunga', 800], ['Kagonogo', 800], ['Gitaru', 900], ['Kambaa', 900],
      ['Kahawa Sukari', 900], ['Ithanga', 1000], ['Mutarakwa', 1000],
      ['Oloolua', 1100], ['Kihara', 1200], ['Kabaya', 1200], ['Loresho Ridge', 1300],
    ],
  },
  {
    id: 'wayback-way',
    label: 'Wayback Way',
    areas: [
      ['Museum Hill / CEA', 300], ['Westlands', 300], ['ABC', 350],
      ['Loresho', 500], ['Uthiru', 500], ['Spring Valley', 500], ['Peponi', 500],
      ['Kabete', 600], ['Ridgeways', 600], ['Runda Drive', 600],
      ['New Runda', 700], ['Old Runda', 700], ['Muthaiga North', 700],
    ],
  },
  {
    id: 'jogoo-road',
    label: 'Jogoo Road',
    areas: [
      ['Stadium', 300], ['Bama', 300], ['Shauri / Churcharmy', 300],
      ['Bellevue', 350], ['Moger / Hamza', 350], ['Donholm', 400],
      ['Nasra', 450], ['Bee Centre', 450], ['Kayole, Yote', 500],
    ],
  },
  {
    id: 'outering-road',
    label: 'Outering Road',
    areas: [
      ['Buruburu', 400], ['Babadogo', 400], ['Donholm', 400],
      ['Fadha', 500], ['Umoja', 500], ['Nyayo Estate', 500],
      ['Pipeline', 500], ['Tajmall', 500], ['Lucky Summer', 500],
    ],
  },
  {
    id: 'limuru-road',
    label: 'Limuru Road',
    areas: [
      ['Ojilo / Aga Khan', 300], ['Highridge', 400],
      ['(Mp)shaparklands', 400], ['Gigiri', 500], ['Ruaka', 500],
      ['Gitaru', 600], ['Nderenderu', 700], ['Banana', 700],
      ['Wangige Market', 800], ['Gachie', 900], ['Ngecha', 1000], ['Limuru', 1500],
    ],
  },
  {
    id: 'kangundo-road',
    label: 'Kangundo Road',
    areas: [
      ['Caltex', 400], ['Umoja 3', 400], ['Muthiga', 500], ['Mama Lucy', 500],
      ['Komarock', 500], ['Saika', 500], ['Junction', 500], ['Nijro', 600],
      ['Chokaa', 700], ['Mwiki', 700], ['Bypass', 800], ['Ruai', 900],
      ['Karmulu', 1000], ['Kikuyu', 1000], ['Joska', 1200],
    ],
  },
  {
    id: 'ngong-road',
    label: 'Ngong Road',
    areas: [
      ['Upperhill', 250], ['Traffic Area', 300],
      ['KNH / M. Hospital / Daystar / Coptic / Kilimani / Adams Area / Prestige', 300],
      ['Junction Mall', 350], ['Jamhuri Estate', 350], ['Woodleys', 350],
      ['Kibera', 400], ['Racecourse / Showground', 400],
      ['Nairobi Business Park', 450], ['Karen', 600], ['Bulbul', 800],
      ['Kawangware', 500], ['Ngong Town', 1000], ['Kiserian', 1000],
    ],
  },
  {
    id: 'langata-road',
    label: 'Langata Road',
    areas: [
      ['Highway Mall', 300], ['Nyayo', 300], ['Nairobi West', 300],
      ['Madaraka / Tmall', 350], ['Carnivore', 350], ['Wilson Airport', 350],
      ['Langata', 400], ['Galleria', 500], ['Catholic University', 500],
      ['Karan', 600], ['Rongai', 800], ['Oloolaiser', 1000],
    ],
  },
  {
    id: 'kiambu-road',
    label: 'Kiambu Road',
    areas: [
      ['Muthaiga', 300], ['AAR Hospital / DCI', 350], ['Ridgeway', 400],
      ['Thindiqua', 500], ['Bypass / Fourways', 500], ['Kirigiti', 500],
      ['Endeville 1 & 2', 500], ['Kiambu Town', 700],
      ['Tatu City Kiambu', 800], ['Kahawa Wendani', 800],
    ],
  },
  {
    id: 'juja-road',
    label: 'Juja Road',
    areas: [
      ['Countrybus', 250], ['Kamkijni', 250], ['Gikomba', 250],
      ['Kariokor', 300], ['Pumwani', 300], ['Pangani', 300], ['Eastleigh', 300],
      ['Makadara', 300], ['Runda', 400], ['Mukuru Kwa Reuben', 400],
      ['Huruma', 350], ['Industrial Area', 350],
    ],
  },
]

/**
 * Areas printed under "OTHER AREAS WE COVER" with NO rate on the card.
 * These must not be quoted a price. They route to a WhatsApp quote instead.
 * Several also appear in a priced zone above (Kahawa Sukari, Wangige, Mwiki,
 * Muthiga, Kahawa Wendani, Gikambura, Ruai Shopping Centre, Komarock Phase 2);
 * the priced entry wins and this list is only a fallback.
 */
export const QUOTE_ONLY_AREAS = [
  'Acacia', 'Buru Buru Phase 2', 'Clay City', 'Dandora', 'Dandora KCC',
  'Garden Estate', 'Gichie', 'Gikambura', 'Githunguri', 'Kahawa Barracks',
  'Kahawa Sukari', 'Kahawa West', 'Kangemi', 'Karai', 'Kasarani',
  'Kayole Junction', 'Kibera Drive', 'Kibiku', 'Komarock Phase 2',
  'Kware', 'Madi Mazuri', 'Mbwota', 'Mitaboni', 'Muthiga', 'Mwiki',
  'Ruai Shopping Centre', 'Uchuru Shopping Centre', 'Waithaka', 'Wangige',
  'Zimmerman',
]

/** Phone numbers printed on the card. UNVERIFIED — confirm with Transfast. */
export const TRANSFAST = {
  name: 'Transfast Logistics Service',
  phones: ['0729727851', '0717730112'],
  disclaimer: 'Prices may vary depending on parcel size & weight.',
}

/** Flat lookup of every priced area, lower-cased area name -> { zoneId, rate }. */
const PRICED_INDEX = DELIVERY_ZONES.reduce((index, zone) => {
  for (const [area, rate] of zone.areas) index.set(area.toLowerCase(), { zoneId: zone.id, rate })
  return index
}, new Map())

/** Normalise user input: trim, collapse spaces, lowercase, drop punctuation. */
const normalise = value =>
  String(value || '').toLowerCase().replace(/[^\p{L}\p{N}\s/]/gu, ' ').replace(/\s+/g, ' ').trim()

/**
 * Look up a delivery rate.
 * @returns {{status:'priced', rate:number, zoneId:string, label:string, area:string}
 *          |{status:'cbd', rate:number, zoneId:'cbd', label:string}
 *          |{status:'quote', rate:null, zoneId:null, label:string}
 *          |{status:'unknown', rate:null, zoneId:null, label:string}}
 */
export function lookupDeliveryRate(input) {
  const query = normalise(input)
  if (!query) return { status: 'unknown', rate: null, zoneId: null, label: 'No area entered' }

  if (PRICED_INDEX.has(query)) {
    const hit = PRICED_INDEX.get(query)
    const zone = DELIVERY_ZONES.find(z => z.id === hit.zoneId)
    return { status: 'priced', rate: hit.rate, zoneId: hit.zoneId, label: zone.label, area: input }
  }

  if (QUOTE_ONLY_AREAS.some(area => normalise(area) === query)) {
    return { status: 'quote', rate: null, zoneId: null, label: 'Covered area — price on request' }
  }

  return { status: 'unknown', rate: null, zoneId: null, label: 'Area not on the rate card' }
}

/** Every priced area, de-duplicated, for building a searchable picker. */
export const ALL_PRICED_AREAS = [...PRICED_INDEX.keys()]
  .map(area => {
    const hit = PRICED_INDEX.get(area)
    return { area, rate: hit.rate, zoneId: hit.zoneId }
  })
  .sort((a, b) => a.zoneId.localeCompare(b.zoneId) || a.area.localeCompare(b.area))