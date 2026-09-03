import React from 'react'

interface LogoProps {
  height?: number | string
  className?: string
  style?: React.CSSProperties
}

export const SalesStudioLogo: React.FC<LogoProps> = ({
  height = 48,
  className = '',
  style = {},
}) => {
  return (
    <svg
      viewBox="0 0 540 156"
      height={height}
      className={className}
      style={{ display: 'inline-block', height, width: 'auto', verticalAlign: 'middle', ...style }}
      aria-label="SalesStudio - Think Real Estate. Think Us."
      role="img"
    >
      <g id="salesstudio-icon">
        {/* Top Blue Chevron */}
        <polygon points="120,2 156,20 156,40 120,22 84,40 84,20" fill="#0099DE" />
        
        {/* Middle Green Chevron */}
        <polygon points="120,34 156,52 156,72 120,54 84,72 84,54" fill="#00A859" />

        {/* Bottom Pillar */}
        <polygon points="120,68 136,77 136,120 104,120 104,77" fill="var(--color-text-primary, #3D3D3D)" />
      </g>

      {/* Main Text: SalesStudio */}
      <g id="salesstudio-text" fill="var(--color-text-primary, #3D3D3D)">
        <text
          x="172"
          y="104"
          style={{
            fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
            fontSize: '92px',
            letterSpacing: '-2px',
          }}
        >
          <tspan fontWeight="800">Sales</tspan>
          <tspan fontWeight="400">Studio</tspan>
        </text>

        {/* Tagline: Think Real Estate. Think Us. */}
        <text
          x="4"
          y="148"
          style={{
            fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
            fontSize: '25px',
            fontWeight: 500,
            letterSpacing: '5.2px',
            textTransform: 'uppercase',
            opacity: 0.85
          }}
        >
          Think Real Estate. Think Us.
        </text>
      </g>
    </svg>
  )
}

export default SalesStudioLogo
