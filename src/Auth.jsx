import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Pixel, { Seg } from './Pixel'
import DeckArt from './DeckArt2'
import vinylGif from './assets/vinyl.gif'

export default function Auth({ mode }) {
  const isLogin = mode === 'login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg({ type: '', text: '' })
    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) return setMsg({ type: 'error', text: error.message })
    if (isLogin) navigate('/admin')
    else setMsg({ type: 'ok', text: 'Account created! Check your email to confirm, then log in.' })
  }

  return (
    <main className="auth">
      <DeckArt src={vinylGif} alt="A pink record player covered in stickers" />
      <div className="term">
        <Pixel name="cat" size={4} className="term-cat" />
        <h1>{isLogin ? 'WELCOME' : 'JOIN THE CREW'}</h1>
        <form onSubmit={submit}>
          <label className="trow"><span>EMAIL:</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required /></label>
          <label className="trow"><span>PASSWORD:</span><input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="********" required /></label>
          {busy && <div className="connecting dark"><p>CONNECTING</p><Seg anim n={14} /></div>}
          {msg.text && <p className={msg.type === 'error' ? 'error' : 'ok'} role="alert">{msg.text}</p>}
          <button className="btn neon" disabled={busy}>{isLogin ? 'LOG IN' : 'SIGN UP'}</button>
        </form>
        <p className="term-foot">
          {isLogin ? <>New here? <Link to="/signup">Sign up</Link></> : <>Have an account? <Link to="/login">Log in</Link></>}
          {' · '}<Link to="/">Back to shop</Link>
        </p>
      </div>
    </main>
  )
}