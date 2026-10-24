import { useEffect, useState } from 'react'
import { Link, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Shell from './Shell'
import Pixel, { Seg } from './Pixel'
import DeckArt from './DeckArt'
import adminImg from './assets/admin.png'

/* ---------- Covers bucket helpers ---------- */
const BUCKET = 'Covers' // bucket names are case-sensitive

const coverUrl = (name) => supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl

async function uploadCover(file) {
  const name = `${Date.now()}_${file.name.replace(/[^\w.-]+/g, '_')}`
  const { error } = await supabase.storage.from(BUCKET).upload(name, file, { contentType: file.type })
  if (error) throw error
  return coverUrl(name)
}

async function listCovers() {
  const { data, error } = await supabase.storage.from(BUCKET)
    .list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  return { data: (data || []).filter(f => f.id && !f.name.startsWith('.')), error }
}

/* click-or-drop area, used by the product form and the Covers tab */
function DropZone({ onFiles, multiple, children }) {
  const [over, setOver] = useState(false)
  const take = (list) => { const files = [...list].filter(f => f.type.startsWith('image/')); if (files.length) onFiles(files) }
  return (
    <label className={`drop ${over ? 'over' : ''}`}
      onDragOver={e => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); take(e.dataTransfer.files) }}>
      <input type="file" accept="image/*" multiple={multiple} hidden onChange={e => { take(e.target.files); e.target.value = '' }} />
      {children}
    </label>
  )
}

/* image adder inside the product form: upload a new file OR pick one that's already in the Covers bucket */
function ImagePicker({ value, onChange }) {
  const [preview, setPreview] = useState(typeof value === 'string' ? value : null)
  const [gallery, setGallery] = useState(null)
  const [err, setErr] = useState('')

  const pick = ([file]) => {
    const r = new FileReader()
    r.onload = () => setPreview(r.result)
    r.readAsDataURL(file)
    onChange(file) // uploaded to Covers when the form is saved
  }
  const browse = async () => {
    if (gallery) return setGallery(null)
    const { data, error } = await listCovers()
    if (error) setErr(error.message); else { setErr(''); setGallery(data) }
  }
  const choose = (f) => { const u = coverUrl(f.name); setPreview(u); onChange(u); setGallery(null) }

  return (
    <div className="picker">
      {preview && <img className="pick-prev" src={preview} alt="Cover preview" />}
      <DropZone onFiles={pick}><Pixel name="image" size={3} /><span>{preview ? 'Swap cover' : 'Drop a cover or click'}</span></DropZone>
      <div className="row-gap">
        <button type="button" className="mini" onClick={browse}>{gallery ? 'Hide bucket' : 'Browse Covers'}</button>
        {preview && <button type="button" className="mini danger" onClick={() => { setPreview(null); onChange(null) }}>Remove</button>}
      </div>
      {err && <p className="error">{err}</p>}
      {gallery && (
        <div className="pick-grid">
          {gallery.length === 0 && <p className="muted">The Covers bucket is empty.</p>}
          {gallery.map(f => <button type="button" key={f.name} onClick={() => choose(f)} aria-label={f.name}><img src={coverUrl(f.name)} alt="" /></button>)}
        </div>
      )}
    </div>
  )
}

/* the Covers tab: upload many, copy links, delete */
function Covers() {
  const [files, setFiles] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState('')
  const [tick, setTick] = useState(0)
  const reload = () => setTick(t => t + 1)

  useEffect(() => {
    listCovers().then(({ data, error }) => { if (error) setErr(error.message); else setFiles(data) })
  }, [tick])

  const add = async (list) => {
    setBusy(true); setErr('')
    try { for (const f of list) await uploadCover(f) } catch (ex) { setErr(ex.message) }
    setBusy(false); reload()
  }
  const del = async (f) => {
    if (!window.confirm('Delete this cover from the bucket?')) return
    const { error } = await supabase.storage.from(BUCKET).remove([f.name])
    if (error) setErr(error.message); else reload()
  }
  const copy = async (f) => {
    try { await navigator.clipboard.writeText(coverUrl(f.name)); setCopied(f.name); setTimeout(() => setCopied(''), 1200) } catch { setErr('Couldn’t copy, your browser blocked it.') }
  }

  return (
    <>
      <div className="row"><h1>Covers</h1><span className="pixlabel">{files.length} in bucket</span></div>
      <DropZone onFiles={add} multiple>
        <Pixel name="image" size={4} />
        <span>{busy ? 'Uploading…' : 'Drop covers here or click to add'}</span>
      </DropZone>
      {busy && <div className="connecting"><p>UPLOADING</p><Seg anim n={12} /></div>}
      {err && <p className="error">{err}</p>}
      <div className="scroll">
        <div className="covers">
          {files.map(f => (
            <figure key={f.name} className="cover">
              <img src={coverUrl(f.name)} alt="" loading="lazy" />
              <figcaption>
                <button className="mini" onClick={() => copy(f)}>{copied === f.name ? 'Copied!' : 'Copy link'}</button>
                <button className="mini danger" onClick={() => del(f)}>Delete</button>
              </figcaption>
            </figure>
          ))}
        </div>
        {files.length === 0 && !err && <div className="empty"><Pixel name="cat" size={5} /><p>No covers yet.</p></div>}
      </div>
    </>
  )
}

/* ---------- Generic CRUD table + modal form ---------- */
function Crud({ table, title, singular, select = '*', fields, columns, onChange }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  const [tick, setTick] = useState(0)
  const load = () => { setTick(t => t + 1); onChange?.() }
  useEffect(() => {
    supabase.from(table).select(select).order('id', { ascending: false })
      .then(({ data, error }) => { if (error) setErr(error.message); else setRows(data || []) })
  }, [table, select, tick])

  const save = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const payload = {}
      for (const f of fields) {
        let v = form[f.key]
        if (f.type === 'image') v = v instanceof File ? await uploadCover(v) : (v ?? null)
        else if (f.type === 'number') v = v === '' || v == null ? null : Number(v)
        else if (f.type === 'select') v = v || null
        payload[f.key] = v
      }
      if (!form.id && table === 'product_list') {
        const { data: { session } } = await supabase.auth.getSession()
        payload.user_id = session.user.id
      }
      const { error } = form.id
        ? await supabase.from(table).update(payload).eq('id', form.id)
        : await supabase.from(table).insert(payload)
      if (error) throw error
      setForm(null); load()
    } catch (ex) { setErr(ex.message) }
    setBusy(false)
  }

  const remove = async (r) => {
    if (!window.confirm('Delete this item?')) return
    const { error } = await supabase.from(table).delete().eq('id', r.id)
    if (error) setErr(error.message); else load()
  }

  const shown = rows.filter(r => JSON.stringify(Object.values(r)).toLowerCase().includes(q.toLowerCase()))

  return (
    <>
      <div className="row">
        <h1>{title}</h1>
        <button className="btn sm" onClick={() => { setErr(''); setForm({}) }}>Add new</button>
      </div>
      <label className="searchbar">
        <Pixel name="search" size={3} />
        <input type="search" placeholder={`Search ${title.toLowerCase()}…`} value={q} onChange={e => setQ(e.target.value)} aria-label={`Search ${title}`} />
      </label>
      {err && !form && <p className="error">{err}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr>{columns.map(c => <th key={c.label}>{c.label}</th>)}<th /></tr></thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.id}>
                {columns.map(c => <td key={c.label} data-label={c.label}>{c.render(r)}</td>)}
                <td className="acts"><div className="act-btns">
                  <button className="mini icon" title="Edit" aria-label="Edit" onClick={() => { setErr(''); setForm(r) }}><Pixel name="pencil" size={3} /></button>
                  <button className="mini icon danger" title="Delete" aria-label="Delete" onClick={() => remove(r)}><Pixel name="trash" size={3} /></button>
                </div></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={columns.length + 1} className="muted center">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="overlay" onClick={() => setForm(null)}>
          <form className="modal card" onSubmit={save} onClick={e => e.stopPropagation()}>
            <button type="button" className="x" onClick={() => setForm(null)} aria-label="Close">✕</button>
            <h2>{form.id ? 'Edit' : 'Add'} {singular}</h2>
            {fields.map(f => f.type === 'image' ? (
              <div key={f.key} className="field"><span>{f.label}</span>
                <ImagePicker value={form[f.key]} onChange={v => setForm(cur => ({ ...cur, [f.key]: v }))} />
              </div>
            ) : (
              <label key={f.key}>{f.label}
                {f.type === 'select' ? (
                  <select value={form[f.key] ?? ''} required={f.required} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                    <option value="">{f.required ? 'Choose…' : 'None'}</option>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : (
                  <input type={f.type || 'text'} step={f.type === 'number' ? '0.01' : undefined} value={form[f.key] ?? ''} required={f.required} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                )}
              </label>
            ))}
            {err && <p className="error">{err}</p>}
            <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </form>
        </div>
      )}
    </>
  )
}

/* the shop only sells three kinds of thing, so the dropdown is locked to them */
const KINDS = [
  { label: 'Vinyl', test: /vinyl|\blp\b/i },
  { label: 'CD', test: /^cds?$|compact/i },
  { label: 'Walkman', test: /walkman|cassette|tape/i },
]

function Products({ onChange }) {
  const [sup, setSup] = useState([])
  const [cat, setCat] = useState([])
  useEffect(() => {
    supabase.from('product_suppliers').select('id, supplier').then(({ data }) => setSup((data || []).map(d => ({ value: d.id, label: d.supplier }))))
    supabase.from('product_categories').select('id, category').then(({ data }) => {
      setCat(KINDS.flatMap(k => { const m = (data || []).find(d => k.test.test(d.category)); return m ? [{ value: m.id, label: k.label }] : [] }))
    })
  }, [])
  return (
    <Crud table="product_list" title="Products" singular="product" onChange={onChange}
      select="id, product_name, artist, product_price, product_quantity, image_url, supplier_id, category_id, product_suppliers(supplier), product_categories(category)"
      fields={[
        { key: 'product_name', label: 'Title', required: true },
        { key: 'artist', label: 'Artist', required: true },
        { key: 'category_id', label: 'Category', type: 'select', options: cat, required: true },
        { key: 'product_price', label: 'Price (₱)', type: 'number', required: true },
        { key: 'product_quantity', label: 'Stock', type: 'number' },
        { key: 'supplier_id', label: 'Supplier', type: 'select', options: sup },
        { key: 'image_url', label: 'Cover image', type: 'image' },
      ]}
      columns={[
        { label: 'Cover', render: r => r.image_url ? <img className="thumb" src={r.image_url} alt="" /> : '–' },
        { label: 'Title', render: r => r.product_name },
        { label: 'Artist', render: r => r.artist || '–' },
        { label: 'Price', render: r => `₱${Number(r.product_price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'Stock', render: r => r.product_quantity ?? 0 },
        { label: 'Category', render: r => r.product_categories?.category || '–' },
      ]} />
  )
}

const Categories = () => (
  <Crud table="product_categories" title="Categories" singular="category"
    fields={[{ key: 'category', label: 'Category name', required: true }]}
    columns={[
      { label: 'Category', render: r => r.category },
      { label: 'Created', render: r => new Date(r.created_at).toLocaleDateString() },
    ]} />
)

const Suppliers = () => (
  <Crud table="product_suppliers" title="Suppliers" singular="supplier"
    fields={[
      { key: 'supplier', label: 'Supplier', required: true },
      { key: 'address', label: 'Address' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'contact_number', label: 'Contact number', type: 'tel' },
    ]}
    columns={[
      { label: 'Supplier', render: r => r.supplier },
      { label: 'Email', render: r => r.email || '–' },
      { label: 'Phone', render: r => r.contact_number || '–' },
      { label: 'Address', render: r => r.address || '–' },
    ]} />
)

/* admin tabs (different from the shop's) */
const TABS = [
  { id: 'products', route: 'products', label: 'Items', icon: 'box', color: '#ffb3d1' },
  { id: 'covers', route: 'covers', label: 'Covers', icon: 'image', color: '#a8f0d0' },
  { id: 'categories', route: 'categories', label: 'Tags', icon: 'tag', color: '#a9e4ff' },
  { id: 'suppliers', route: 'suppliers', label: 'Vendors', icon: 'truck', color: '#ffe08a' },
]

export default function Admin({ theme, toggleTheme }) {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const cur = TABS.find(t => t.route && pathname.startsWith(`/admin/${t.route}`)) || TABS[0]

  const [stats, setStats] = useState({ items: 0, units: 0, low: 0 })
  const [sTick, setSTick] = useState(0)
  useEffect(() => {
    supabase.from('product_list').select('product_quantity').then(({ data }) => {
      const d = data || []
      setStats({ items: d.length, units: d.reduce((s, x) => s + (x.product_quantity || 0), 0), low: d.filter(x => (x.product_quantity || 0) <= 5).length })
    })
  }, [sTick])
  const refreshStats = () => setSTick(t => t + 1)

  const dark = theme === 'dark'
  const tabs = [
    ...TABS,
    { id: 'mode', label: dark ? 'Light' : 'Dark', icon: dark ? 'sun' : 'moon', color: dark ? '#ffe08a' : '#c9b8ff', end: true },
    { id: 'exit', label: 'Exit', icon: 'door', color: '#d8c2ff', end: true },
  ]
  const go = (id) => {
    if (id === 'mode') toggleTheme()
    else if (id === 'exit') nav('/')
    else nav(`/admin/${TABS.find(t => t.id === id).route}`)
  }
  const logout = async () => { await supabase.auth.signOut(); nav('/') }

  const hud = (
    <>
      <Link to="/" className="pill brand"><Pixel name="cat" size={3} /> Sweet Spin</Link>
      <div className="pill"><Pixel name="gear" size={3} /> Admin mode</div>
      <button className="pill" onClick={logout}><Pixel name="door" size={3} /> Log out</button>
    </>
  )

  const deck = (
    <>
      <DeckArt small src={adminImg} alt="Admin" />
      <div className="stats">
        <div className="pill"><span>Items</span><b>{stats.items}</b></div>
        <div className="pill"><span>Units</span><b>{stats.units}</b></div>
        <div className="pill"><span>Low</span><Seg value={stats.low} max={Math.max(stats.items, 1)} n={8} /></div>
      </div>
    </>
  )

  return (
    <Shell hud={hud} deck={deck} tabs={tabs} active={cur.id} onTab={go} color={cur.color}>
      <Routes>
        <Route path="products" element={<Products onChange={refreshStats} />} />
        <Route path="covers" element={<Covers />} />
        <Route path="categories" element={<Categories />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="*" element={<Navigate to="products" replace />} />
      </Routes>
    </Shell>
  )
}