import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingState } from '@/components/ui/LoadingState'

import { AuthProvider } from '@/contexts/AuthProvider'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense
          fallback={
            <div style={{ padding: 'var(--space-8)' }}>
              <LoadingState label="Loading page" />
            </div>
          }
        >
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}
