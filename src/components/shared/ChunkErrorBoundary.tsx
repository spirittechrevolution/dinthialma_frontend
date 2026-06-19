import { Component, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { crashed: boolean }

export class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(error: Error): State | null {
    if (
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed')
    ) {
      window.location.reload()
      return { crashed: true }
    }
    return null
  }

  render() {
    if (this.state.crashed) return null
    return this.props.children
  }
}
