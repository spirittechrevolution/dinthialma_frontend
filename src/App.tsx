import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/hooks/useAuth'
import { Router } from '@/router'
import { queryClient } from '@/lib/queryClient'
import { ChunkErrorBoundary } from '@/components/shared/ChunkErrorBoundary'
import './App.css'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChunkErrorBoundary>
          <Router />
        </ChunkErrorBoundary>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
