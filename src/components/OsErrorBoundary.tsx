import { Component, type ErrorInfo, type ReactNode } from "react";
import { enterSafeModeFromError } from "../lib/safe-mode";
import { ErrorRecoveryPanel } from "./ErrorRecoveryPanel";

type Props = { children: ReactNode };

type State = {
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export class OsErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[OsErrorBoundary] Uncaught render error", error);
    if (errorInfo.componentStack) {
      console.error("[OsErrorBoundary] Component stack\n", errorInfo.componentStack);
    }
    enterSafeModeFromError(error, errorInfo, "uncaught_error_boundary");
    this.setState({ errorInfo });
  }

  private clearBoundary = (): void => {
    this.setState({ error: null, errorInfo: null });
  };

  render(): ReactNode {
    const { error, errorInfo } = this.state;
    if (error) {
      return (
        <ErrorRecoveryPanel
          error={error}
          componentStack={errorInfo?.componentStack ?? null}
          onContinueInSafeMode={this.clearBoundary}
        />
      );
    }
    return this.props.children;
  }
}
