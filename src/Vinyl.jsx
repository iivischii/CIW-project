export default function Vinyl({ src, size = 'md', spin }) {
  return (
    <div className={`vinyl ${size} ${spin ? 'spin' : ''}`} aria-hidden="true">
      <div className="label" style={src ? { backgroundImage: `url(${src})` } : undefined} />
    </div>
  )
}
