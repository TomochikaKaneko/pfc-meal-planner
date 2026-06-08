import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App render failed', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="app-shell">
        <main className="error-screen">
          <h1>PFC献立サポート</h1>
          <p>新しいバージョンを読み込みました。再読み込みしてください。</p>
          <button type="button" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </main>
      </div>
    );
  }
}
