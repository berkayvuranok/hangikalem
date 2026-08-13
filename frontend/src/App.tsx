import { refreshSession } from '@/services/api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
})

function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void refreshSession()
  }, [])
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </MotionConfig>
    </QueryClientProvider>
  )
}
