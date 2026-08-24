import { toMediaUrl } from '../../utils/media'

interface Milestone {
  title: string
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
  date: string
  progress: number
  description: string
  images?: string[]
}

const DEFAULT_MILESTONES: Milestone[] = [
  {
    title: 'Site Preparation & Excavation',
    status: 'COMPLETED',
    date: 'Jan 2026',
    progress: 100,
    description: 'Ground clearance, soil testing, and excavation work completed successfully for all towers.'
  },
  {
    title: 'Foundation Pile & Basement Slab',
    status: 'COMPLETED',
    date: 'Mar 2026',
    progress: 100,
    description: 'Pile foundation casting and basement floor slab pouring completed and certified.'
  },
  {
    title: 'Superstructure Framework (RCC)',
    status: 'IN_PROGRESS',
    date: 'Active (Est. Dec 2026)',
    progress: 60,
    description: 'Structure framework completed up to 8th floor. Block casting is actively in progress.'
  },
  {
    title: 'Masonry & Internal Plastering',
    status: 'PENDING',
    date: 'Est. Mar 2027',
    progress: 0,
    description: 'Internal wall brickwork and cement plastering scheduled to begin next quarter.'
  },
  {
    title: 'Finishing & Handover',
    status: 'PENDING',
    date: 'Est. Sep 2027',
    progress: 0,
    description: 'Final interior painting, fixture installations, and project handover process.'
  }
]

export default function ConstructionTimelineModule({ config, projectId: _projectId }: { config: Record<string, any>; projectId: string }): JSX.Element {
  const milestones: Milestone[] = config.milestones || DEFAULT_MILESTONES

  // Calculate overall progress percentage
  const totalMilestones = milestones.length
  const completedCount = milestones.filter(m => m.status === 'COMPLETED').length
  const overallProgress = totalMilestones > 0 
    ? Math.round(milestones.reduce((acc, curr) => acc + curr.progress, 0) / totalMilestones)
    : 0

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'COMPLETED': return '#10b981' // Green
      case 'IN_PROGRESS': return '#f59e0b' // Amber
      default: return 'var(--color-text-disabled)' // Gray
    }
  }

  const getStatusLabel = (status: Milestone['status']) => {
    switch (status) {
      case 'COMPLETED': return 'Completed'
      case 'IN_PROGRESS': return 'In Progress'
      default: return 'Scheduled'
    }
  }

  return (
    <div data-testid="module-CONSTRUCTION_TIMELINE" style={{ animation: 'fadeInUp 0.4s var(--ease-out)' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Construction Milestones
          </h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 4 }}>
            Real-time structural progress and construction timeline updates.
          </p>
        </div>

        {/* Overall Completion Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG Progress Circle */}
            <svg style={{ position: 'absolute', transform: 'rotate(-90deg)', width: '100%', height: '100%' }} viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-accent)"
                strokeDasharray={`${overallProgress}, 100`}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-accent)' }}>
              {overallProgress}%
            </span>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overall Progress
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)', marginTop: 2, fontWeight: 500 }}>
              {completedCount} of {totalMilestones} Milestones Met
            </div>
          </div>
        </div>
      </div>



      {/* Timeline Layout */}
      <div style={{ position: 'relative', paddingLeft: 40, marginTop: 'var(--space-4)' }}>
        {/* Central Vertical Track Line */}
        <div style={{
          position: 'absolute',
          left: 17,
          top: 8,
          bottom: 8,
          width: 2,
          background: 'linear-gradient(to bottom, var(--color-accent) 0%, var(--color-border) 60%, var(--color-border-subtle) 100%)',
          zIndex: 0,
        }} />

        {/* Milestone Entries */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {milestones.map((m, idx) => {
            const statusColor = getStatusColor(m.status)
            return (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 12,
                  animation: `tileEntrance 0.4s ${idx * 0.08}s var(--ease-out) both`,
                }}
              >
                {/* Node Dot icon on Timeline track */}
                <div style={{
                  position: 'absolute',
                  left: -32,
                  top: 4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: m.status === 'PENDING' ? 'var(--color-bg)' : statusColor,
                  border: `3px solid ${statusColor}`,
                  boxShadow: m.status === 'IN_PROGRESS' ? `0 0 10px ${statusColor}a0` : 'none',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }} />

                {/* Milestone Detail Card */}
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-accent-border)'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                        {m.title}
                      </h3>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 500, display: 'inline-block', marginTop: 4 }}>
                        {String.fromCharCode(128197)} {m.date}
                      </span>
                    </div>

                    {/* Badge */}
                    <div style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: m.status === 'COMPLETED' ? 'rgba(16,185,129,0.08)' : m.status === 'IN_PROGRESS' ? 'rgba(245,158,11,0.08)' : 'var(--color-surface-raised)',
                      border: `1px solid ${m.status === 'COMPLETED' ? 'rgba(16,185,129,0.2)' : m.status === 'IN_PROGRESS' ? 'rgba(245,158,11,0.2)' : 'var(--color-border)'}`,
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: statusColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>
                      {getStatusLabel(m.status)}
                    </div>
                  </div>

                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-3)', lineHeight: 1.6 }}>
                    {m.description}
                  </p>

                  {/* Individual Milestone Progress bar */}
                  <div style={{ marginTop: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>
                      <span>PROGRESS</span>
                      <span>{m.progress}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--color-surface-raised)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${m.progress}%`,
                        background: statusColor,
                        borderRadius: 3,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  {/* Associated Images */}
                  {m.images && m.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-4)', flexWrap: 'wrap' }}>
                      {m.images.map((img, i) => (
                        <img
                          key={i}
                          src={toMediaUrl(img)}
                          alt={`${m.title} progress`}
                          style={{
                            width: 100, height: 75, objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
