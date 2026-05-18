import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { I18nProvider } from "./lib/i18n/I18nContext";
import { CognitiveOsProvider } from "./lib/cognitive-os";
import { SignalFabricProvider } from "./lib/signal-fabric";
import { ExecutiveMemoryProvider } from "./lib/executive-memory";
import { SelfEvolvingStrategyProvider } from "./lib/self-evolving-strategy";
import { LiveStateProvider } from "./lib/live-state";
import { DailyOperatingProvider } from "./lib/daily-operating";
import { CognitiveDepthProvider } from "./lib/cognitive-depth";
import { OsErrorBoundary } from "./components/OsErrorBoundary";
import "./index.css";
import "./cognitive-os.css";
import "./cognitive-depth-modes.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <CognitiveOsProvider>
        <SignalFabricProvider>
          <ExecutiveMemoryProvider>
            <SelfEvolvingStrategyProvider>
              <LiveStateProvider>
                <DailyOperatingProvider>
                  <CognitiveDepthProvider>
                    <OsErrorBoundary>
                      <App />
                    </OsErrorBoundary>
                  </CognitiveDepthProvider>
                </DailyOperatingProvider>
              </LiveStateProvider>
            </SelfEvolvingStrategyProvider>
          </ExecutiveMemoryProvider>
        </SignalFabricProvider>
      </CognitiveOsProvider>
    </I18nProvider>
  </StrictMode>,
);
