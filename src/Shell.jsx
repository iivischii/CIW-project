import Pixel from './Pixel'

/* The shared layout: hud (top-left) + deck (art, left) + panel with vertical tabs (right).
   The page itself never scrolls; only things inside the panel do. */
export default function Shell({ hud, deck, tabs, active, onTab, color, children }) {
  return (
    <div className="stage">
      <div className="hud">{hud}</div>
      <div className="deck">{deck}</div>
      <section className="panel" style={{ '--tab': color }}>
        <div className="panel-body">{children}</div>
        <nav className="vtabs" role="tablist" aria-orientation="vertical">
          {tabs.map(t => (
            <button key={t.id} role="tab" aria-selected={active === t.id} className={`${active === t.id ? 'on' : ''} ${t.end ? 'end' : ''}`} title={t.label}
              style={{ '--c': t.color }} onClick={() => onTab(t.id)}>
              <Pixel name={t.icon} size={3} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </section>
    </div>
  )
}