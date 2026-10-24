import { useSyncExternalStore } from 'react'
import song from './assets/Joji - Gimme Love.mp3'

/* One shared player for the whole app, so the song keeps going when you hop between the shop, login and admin. */
let audio = null
const listeners = new Set()
const emit = () => listeners.forEach(l => l())

function getAudio() {
  if (!audio) {
    audio = new Audio(song)
    audio.loop = true
    audio.volume = 0.6
    audio.preload = 'none'
    audio.addEventListener('play', emit)
    audio.addEventListener('pause', emit)
  }
  return audio
}

const subscribe = cb => { listeners.add(cb); return () => listeners.delete(cb) }
const getSnapshot = () => !!audio && !audio.paused

function toggle() {
  const a = getAudio()
  if (a.paused) a.play().catch(() => { /* browser blocked it or the file failed to load */ })
  else a.pause()
}

/* The big picture on the left is the play / pause button. */
export default function DeckArt({ src, alt, small }) {
  const playing = useSyncExternalStore(subscribe, getSnapshot, () => false)
  return (
    <button type="button" className={`deck-btn ${playing ? 'is-playing' : ''}`} onClick={toggle}
      aria-pressed={playing} aria-label={playing ? 'Pause music' : 'Play music'} title={playing ? 'Pause' : 'Play'}>
      <img className={`deck-art ${small ? 'small' : ''}`} src={src} alt={alt} />
    </button>
  )
}