import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPC_CHANNELS } from '../../../../main/ipc/channels'

interface Project {
  id: string
  name: string
  developer: string
  location: string
  priceRangeMin: number
  priceRangeMax: number
  possessionStatus: string
  status: string
  themeAccentColor: string
  thumbnailPath?: string
}

function formatPrice(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} Cr`
  return `₹${(n / 100000).toFixed(0)} L`
}

export default function ProjectLauncher(): JSX.Element {
  const [projects, setProjects] = useState<Project[]>([])
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    window.api
      .invoke(IPC_CHANNELS.PROJECT_LIST)
      .then((data) => setProjects(data as Project[]))
      .catch(console.error)
  }, [])

  const filtered = projects.filter((p) =>
    [p.name, p.developer, p.location].some((s) =>
      s.toLowerCase().includes(query.toLowerCase())
    )
  )

  return (
    <div className="launcher">
      <input
        role="searchbox"
        type="search"
        placeholder="Search projects…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="project-grid">
        {filtered.map((p) => (
          <button
            key={p.id}
            className="project-tile"
            style={{ '--project-accent': p.themeAccentColor } as React.CSSProperties}
            onClick={() => navigate(`project/${p.id}`)}
          >
            {p.thumbnailPath && (
              <img src={`file://${p.thumbnailPath}`} alt={p.name} />
            )}
            <div className="tile-body">
              <h2>{p.name}</h2>
              <p>{p.developer} · {p.location}</p>
              <span className="price-badge">
                {formatPrice(p.priceRangeMin)} – {formatPrice(p.priceRangeMax)}
              </span>
              <span className={`possession-badge ${p.possessionStatus}`}>
                {p.possessionStatus === 'READY' ? 'Ready to Move' : 'Under Construction'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
