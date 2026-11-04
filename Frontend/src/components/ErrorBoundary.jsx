import { Component } from 'react';

// Shows a friendly page instead of a blank screen when something crashes.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) {
      return this.props.children;
    }
    return (
      <div className="notfound">
        <p className="nf-code">Oops</p>
        <h1>Something went wrong</h1>
        <p>The page could not be shown. Reloading usually fixes it.</p>
        <div className="nf-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a className="btn btn-ghost" href="/">
            Go to home
          </a>
        </div>
      </div>
    );
  }
}
