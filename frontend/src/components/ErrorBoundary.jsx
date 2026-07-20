import { Component } from 'react';

// Without this, any render error blanks the entire app with no explanation.
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28 }}>Something broke on this page</h1>
        <p style={{ margin: '10px 0 18px', color: '#8b5e3c' }}>{String(this.state.error?.message || this.state.error)}</p>
        <button className="btn gold" onClick={() => window.location.assign('/')}>Back to start</button>
      </div>
    );
  }
}
