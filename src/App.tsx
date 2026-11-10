import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { createContext, useContext } from 'react'
import { AuthProvider } from '@/hooks/useAuth'
import { Router } from '@/router'
import { queryClient } from '@/lib/queryClient'
import { ChunkErrorBoundary } from '@/components/shared/ChunkErrorBoundary'
import { useTheme } from '@/hooks/useTheme'
import './App.css'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
})

export function useAppTheme() {
  return useContext(ThemeContext)
}

function App() {
  const theme = useTheme()

  return (
    <ThemeContext.Provider value={theme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChunkErrorBoundary>
            <Router />
          </ChunkErrorBoundary>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeContext.Provider>
  )
}

export default App
