import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main>
        <h1>Something went wrong</h1>
        <a href="tel:108">Call 108</a>
        <button onClick={() => location.reload()}>Start again</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
