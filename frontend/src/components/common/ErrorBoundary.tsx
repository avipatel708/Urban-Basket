import { Component, type ErrorInfo, type ReactNode } from "react"
import { Link } from "react-router"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
          <div className="glass rounded-3xl border border-surface-800/50 p-8 max-w-md text-center space-y-4">
            <h1 className="font-display font-bold text-xl text-surface-50">Something went wrong</h1>
            <p className="text-sm text-surface-400">
              The page hit an error. Try refreshing, or return home.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="py-2 px-5 gradient-primary text-white rounded-full text-sm font-semibold cursor-pointer"
            >
              Refresh page
            </button>
            <Link to="/" className="block text-sm text-primary-400 hover:text-primary-300">
              Go to homepage
            </Link>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
