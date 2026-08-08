import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/app/router'
import { LoadingState } from '@/components/ui/LoadingState'

export default function App() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 'var(--space-8)' }}>
          <LoadingState label="Loading page" />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  )
}
