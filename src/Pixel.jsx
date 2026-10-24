/* Tiny pixel-art sprites drawn as SVG rects. Each row is a string, one char = one pixel.
   o = outline  k = dark  w = white  p = lilac  n = hot pink  c = blush  y = butter  b = sky  m = mint  . = empty */
const PAL = { o: '#4b2a45', k: '#2d1b3d', w: '#fffdfd', p: '#d8c2ff', n: '#ff4fd8', c: '#ffb3d1', y: '#ffe08a', b: '#a9e4ff', m: '#a8f0d0' }

const SPRITES = {
  cat: { rows: [
    '.oo......oo.',
    '.opo....opo.',
    '.oppppppppo.',
    'oppppppppppo',
    'oppkppppkppo',
    'oppkppppkppo',
    'ocpppnnpppco',
    '.oppppppppo.',
    '..oooooooo..',
  ] },
  cd: { rows: [
    '..ooooo..',
    '.owwbbwo.',
    'owbbbbbwo',
    'obbboobbo',
    'obbo.obbo',
    'obbboobbo',
    'owbbbbbwo',
    '.owwbbwo.',
    '..ooooo..',
  ] },
  vinyl: { rows: [
    '..ooooo..',
    '.okkkkko.',
    'okkkkkkko',
    'okkccckko',
    'okkc.ckko',
    'okkccckko',
    'okkkkkkko',
    '.okkkkko.',
    '..ooooo..',
  ] },
  cassette: { rows: [
    'ooooooooo',
    'owwwwwwwo',
    'owowwwowo',
    'owwwwwwwo',
    'oowwwwwoo',
    'ooooooooo',
  ], pal: { w: '#e9d9ff' } },
  gear: { rows: [
    '....o....',
    '.o.ooo.o.',
    '..ooyoo..',
    '.ooyyyoo.',
    'ooyy.yyoo',
    '.ooyyyoo.',
    '..ooyoo..',
    '.o.ooo.o.',
    '....o....',
  ] },
  box: { rows: [
    'ooooooooo',
    'oyyyoyyyo',
    'ooooooooo',
    'oyyyyyyyo',
    'oyyoooyyo',
    'oyyyyyyyo',
    'ooooooooo',
  ] },
  tag: { rows: [
    '..oooooooo',
    '.oyyyyyyyo',
    'oyyoyyyyyo',
    '.oyyyyyyyo',
    '..oooooooo',
  ], pal: { y: '#a8f0d0' } },
  truck: { rows: [
    'ooooooo....',
    'owwwwwoooo.',
    'owwwwwoyyoo',
    'owwwwwoyyyo',
    'ooooooooooo',
    '.oo....oo..',
  ], pal: { w: '#a9e4ff' } },
  image: { rows: [
    'ooooooooo',
    'owwwwwywo',
    'owwwwwwwo',
    'owwwmwwwo',
    'owwmmmwwo',
    'ommmmmmmo',
    'ooooooooo',
  ] },
  door: { rows: [
    '.ooooo.',
    '.opppo.',
    '.opppo.',
    '.oppko.',
    '.opppo.',
    '.opppo.',
    'ooooooo',
  ] },
  heart: { rows: [
    '.oo.oo.',
    'ocwocco',
    'occccco',
    '.occco.',
    '..oco..',
    '...o...',
  ] },
  sun: { rows: [
    'o...o...o',
    '.o..o..o.',
    '..ooooo..',
    '.oyyyyyo.',
    'ooyyyyyoo',
    '.oyyyyyo.',
    '..ooooo..',
    '.o..o..o.',
    'o...o...o',
  ] },
  moon: { rows: [
    '...oooo..',
    '..oyyyo..',
    '.oyyoo...',
    '.oyyo....',
    '.oyyo....',
    '.oyyoo...',
    '..oyyyo..',
    '...oooo..',
  ] },
  lock: { rows: [
    '..ooo..',
    '.o...o.',
    '.o...o.',
    'ooooooo',
    'oyyyyyo',
    'oyykyyo',
    'oyykyyo',
    'ooooooo',
  ] },
  star: { rows: [
    '...o...',
    '..oyo..',
    'ooyyyoo',
    '.oyyyo.',
    '.oyyyo.',
    'oyyoyyo',
    'oo...oo',
  ] },
  play: { rows: [
    'oo.......',
    'oyoo.....',
    'oyyyoo...',
    'oyyyyyoo.',
    'oyyyyyyoo',
    'oyyyyyoo.',
    'oyyyoo...',
    'oyoo.....',
    'oo.......',
  ] },
  pause: { rows: [
    'ooo.ooo',
    'oyo.oyo',
    'oyo.oyo',
    'oyo.oyo',
    'oyo.oyo',
    'oyo.oyo',
    'oyo.oyo',
    'ooo.ooo',
  ] },
  pencil: { rows: [
    '......oo.',
    '.....occo',
    '....oyyoo',
    '...oyyoo.',
    '..oyyoo..',
    '.owyoo...',
    'owwoo....',
    'okoo.....',
    'oo.......',
  ] },
  trash: { rows: [
    '...ooo...',
    'ooooooooo',
    '.owwwwwo.',
    '.owowowo.',
    '.owowowo.',
    '.owowowo.',
    '.owowowo.',
    '.owwwwwo.',
    '..ooooo..',
  ] },
  search: { rows: [
    '.oooo...',
    'owwwwo..',
    'owwwwo..',
    'owwwwo..',
    '.oooo.o.',
    '.......o',
  ] },
}

export default function Pixel({ name, size = 3, pal, className = '' }) {
  const s = SPRITES[name]
  if (!s) return null
  const colors = { ...PAL, ...s.pal, ...pal }
  const w = s.rows[0].length
  const h = s.rows.length
  return (
    <svg className={`pix ${className}`} width={w * size} height={h * size} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" aria-hidden="true">
      {s.rows.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" style={{ fill: ch === 'o' ? 'var(--px-o, #4b2a45)' : colors[ch] }} />)))}
    </svg>
  )
}

/* segmented neon progress bar (the little CONNECTING bar vibe). anim = looping loader */
export function Seg({ value = 0, max = 1, n = 10, anim }) {
  const on = value <= 0 ? 0 : Math.max(1, Math.round(Math.min(1, value / max) * n))
  return (
    <div className={`seg ${anim ? 'anim' : ''}`} role="img" aria-label={anim ? 'Loading' : `${on} of ${n}`}>
      {Array.from({ length: n }, (_, i) => <i key={i} className={anim || i < on ? 'on' : ''} style={{ '--i': i }} />)}
    </div>
  )
}