import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Job Tracker UI error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="error-boundary">
        <div className="error-boundary-mark">!</div>
        <h1>Something went off track</h1>
        <p>Your data is safe. Reload the workspace to continue where you left off.</p>
        <button type="button" onClick={() => window.location.reload()}>Reload workspace</button>
      </main>
    )
  }
}
