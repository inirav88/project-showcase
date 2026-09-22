import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ShowcaseOS ErrorBoundary caught an unhandled error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '40px',
            margin: '20px',
            backgroundColor: '#1e1e2d',
            color: '#f87171',
            borderRadius: '12px',
            border: '1px solid #ef4444',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            maxWidth: '900px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
            <h2 style={{ margin: 0, color: '#ffffff', fontSize: '20px', fontWeight: 700 }}>
              {this.props.fallbackTitle || 'Component Render Error Detected'}
            </h2>
          </div>
          <p style={{ color: '#e2e8f0', fontSize: '14px', lineHeight: 1.5, marginBottom: '16px' }}>
            ShowcaseOS encountered an unexpected render issue. Don't worry — your underlying project database and files are safe.
          </p>

          <div
            style={{
              backgroundColor: '#0f0f17',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #334155',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#fca5a5',
              overflowX: 'auto',
              marginBottom: '20px',
              maxHeight: '200px'
            }}
          >
            <strong>Error:</strong> {this.state.error?.toString() || 'Unknown Error'}
            {this.state.errorInfo?.componentStack && (
              <pre style={{ marginTop: '10px', color: '#94a3b8', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 18px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Try Recovering Component
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '10px 18px',
                backgroundColor: '#334155',
                color: '#ffffff',
                border: '1px solid #475569',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
