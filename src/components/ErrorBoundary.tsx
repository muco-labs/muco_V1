import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { routePaths } from '@/config/routes'
import { env } from '@/config/env'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (env.isDev) {
      console.error('Application error', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="shell" style={{ padding: 'var(--space-16) 0' }}>
          <h1 className="text-h1">Something went wrong</h1>
          <p style={{ color: 'var(--color-text-muted)', maxWidth: '36rem' }}>
            We could not load this view. Try returning home or refreshing the page.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)' }}>
            <Button to={routePaths.home}>Back to home</Button>
            <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
