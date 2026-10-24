import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Vinyl from './Vinyl'
import Shell from './Shell'
import Pixel, { Seg } from './Pixel'
import DeckArt from './DeckArt'
import vinylGif from './assets/vinyl.gif'

const money = n => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* each tab has its own colour. The panel takes a tint of the active tab's colour. */
const TABS = [
  { id: 'cds', label: 'CDs', icon: 'cd', color: '#a9e4ff' },
  { id: 'vinyl', label: 'Vinyl', icon: 'vinyl', color: '#ffb3d1' },
  { id: 'walkman', label: 'Walkman', icon: 'cassette', color: '#d8c2ff' },
]

/* which tab a product lives in, based on its category name. Anything that isn't a CD or a tape lands in Vinyl. */
const kindOf = (i) => {
  const c = i.product_categories?.category || ''
  if (/\bcds?\b|compact/i.test(c)) return 'cds'
  if (/cassette|walkman|tape/i.test(c)) return 'walkman'
  return 'vinyl'
}

export default function Store({ session, theme, toggleTheme }) {
  const nav = useNavigate()
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('vinyl')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const [hov, setHov] = useState(null)
  const [crate, setCrate] = useState([])
  const [crateOpen, setCrateOpen] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('product_list')
      .select('id, product_name, artist, product_price, product_quantity, image_url, product_categories(category), product_suppliers(supplier)')
      .order('id', { ascending: false })
      .then(({ data, error }) => {
        if (error) setErr(error.message)
        setItems(data || [])
        setLoading(false)
      })
  }, [])

  const shown = useMemo(() => items.filter(i =>
    kindOf(i) === tab && `${i.product_name} ${i.artist || ''}`.toLowerCase().includes(q.toLowerCase())), [items, tab, q])

  const add = (p) => setCrate(c => c.some(x => x.id === p.id)
    ? c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x)
    : [...c, { ...p, qty: 1 }])
  const setQty = (id, d) => setCrate(c => c.map(x => x.id === id ? { ...x, qty: x.qty + d } : x).filter(x => x.qty > 0))
  const count = crate.reduce((s, x) => s + x.qty, 0)
  const total = crate.reduce((s, x) => s + x.qty * x.product_price, 0)
  const closeCrate = () => { setCrateOpen(false); setDone(false) }
  const playing = hov || sel
  const cur = TABS.find(t => t.id === tab)
  const dark = theme === 'dark'

  /* the two bottom tabs are actions, not pages: light/dark mode, and the discreet way into admin */
  const tabs = [
    ...TABS,
    { id: 'mode', label: dark ? 'Light' : 'Dark', icon: dark ? 'sun' : 'moon', color: dark ? '#ffe08a' : '#c9b8ff', end: true },
    { id: 'admin', label: 'Admin', icon: 'lock', color: '#e6dcf2', end: true },
  ]
  const onTab = (id) => {
    if (id === 'mode') toggleTheme()
    else if (id === 'admin') nav(session ? '/admin' : '/login')
    else setTab(id)
  }

  const hud = (
    <>
      <Link to="/" className="pill brand"><Pixel name="cat" size={3} /> Sweet Spin</Link>
      <button className="pill crate-pill" onClick={() => { setCrateOpen(true); setDone(false) }}>
        <Pixel name="heart" size={3} /> Crate <b>{count}</b><span>{money(total)}</span>
      </button>
      <div className="pill meter"><span>Shelf</span><Seg value={shown.length} max={Math.max(items.length, 1)} n={10} /></div>
    </>
  )

  const deck = (
    <>
      <DeckArt src={vinylGif} alt="A pink record player covered in stickers" />
      <div className="now"><Pixel name="star" size={3} /><span>Now spinning: <b>{playing ? `${playing.product_name}${playing.artist ? ` – ${playing.artist}` : ''}` : '...'}</b></span></div>
    </>
  )

  return (
    <>
      <Shell hud={hud} deck={deck} tabs={tabs} active={tab} onTab={onTab} color={cur.color}>
        <>
            <label className="searchbar">
              <Pixel name="search" size={3} />
              <input type="search" placeholder={`Search title or artist…`} value={q} onChange={e => setQ(e.target.value)} aria-label="Search records" />
            </label>

            <div className="scroll">
              {err && <p className="error">Couldn’t load the shop: {err}</p>}
              {loading && <div className="connecting"><p>CONNECTING</p><Seg anim n={12} /></div>}
              {!loading && !err && shown.length === 0 && <div className="empty"><Pixel name="cat" size={5} /><p>Nothing here yet.</p></div>}
              <div className="grid">
                {shown.map(p => (
                  <button key={p.id} className="item" onClick={() => setSel(p)}
                    onMouseEnter={() => setHov(p)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(p)} onBlur={() => setHov(null)}>
                    <Vinyl src={p.image_url} />
                    <span className="name">{p.product_name}</span>
                    {p.artist && <span className="artist">{p.artist}</span>}
                    <span className="price">{money(p.product_price)}</span>
                    <Seg value={p.product_quantity} max={10} n={5} />
                    {p.product_quantity === 0 && <span className="sold">SOLD OUT</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
      </Shell>

      {sel && (
        <div className="overlay" onClick={() => setSel(null)}>
          <div className="modal card" role="dialog" aria-modal="true" aria-label={sel.product_name} onClick={e => e.stopPropagation()}>
            <button className="x" onClick={() => setSel(null)} aria-label="Close">✕</button>
            <Vinyl size="lg" spin src={sel.image_url} />
            <h2>{sel.product_name}</h2>
            {sel.artist && <p className="artist-big">{sel.artist}</p>}
            <p className="muted">{sel.product_categories?.category || 'Uncategorised'}{sel.product_suppliers?.supplier && ` · from ${sel.product_suppliers.supplier}`}</p>
            {sel.product_quantity > 0 && sel.product_quantity <= 5 && <p className="badge">Only {sel.product_quantity} left</p>}
            <p className="price big">{money(sel.product_price)}</p>
            <button className="btn" disabled={sel.product_quantity === 0} onClick={() => { add(sel); setSel(null); setCrateOpen(true) }}>
              {sel.product_quantity === 0 ? 'Sold out' : 'Add to crate'}
            </button>
          </div>
        </div>
      )}

      {(crateOpen || done) && (
        <div className="overlay" onClick={closeCrate}>
          <aside className="drawer card" onClick={e => e.stopPropagation()}>
            <button className="x" onClick={closeCrate} aria-label="Close">✕</button>
            <h2>Check out</h2>
            {done ? <p className="ok">Thank you! (This is a demo checkout, so no payment was taken.)</p> : crate.length === 0 ? <p className="muted">Your crate is empty.</p> : (
              <>
                <ul className="lines">
                  {crate.map(x => (
                    <li key={x.id}>
                      <span>{x.product_name}</span>
                      <span className="qty">
                        <button onClick={() => setQty(x.id, -1)} aria-label="Fewer">−</button>{x.qty}<button onClick={() => setQty(x.id, 1)} aria-label="More">+</button>
                      </span>
                      <span>{money(x.qty * x.product_price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="subtotal"><span>Subtotal</span><b>{money(total)}</b></p>
                <button className="btn" onClick={() => { setCrate([]); setDone(true); setCrateOpen(false) }}>Continue to payment</button>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  )
}