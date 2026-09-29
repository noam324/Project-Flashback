import type { ReactNode } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

type Props = {
  children: ReactNode;
};

async function minimizeWindow() {
  try {
    await getCurrentWindow().minimize();
  } catch {}
}

async function toggleMaximize() {
  try {
    const window =
      getCurrentWindow();

    if (
      await window.isMaximized()
    ) {
      await window.unmaximize();
    } else {
      await window.maximize();
    }
  } catch {}
}

async function closeWindow() {
  try {
    await getCurrentWindow().close();
  } catch {}
}

export default function AppFrame({
  children,
}: Props) {
  return (
    <div className="app-frame">
      <header
        className="titlebar"
        data-tauri-drag-region
      >
        <div
          className="titlebar-brand"
          data-tauri-drag-region
        >
          <div className="titlebar-logo">
            PF
          </div>

          <div>
            <strong>
              PROJECT FLASHBACK
            </strong>

            <span>
              DESKTOP LAUNCHER
            </span>
          </div>
        </div>

        <div className="window-controls">
          <button
            type="button"
            aria-label="Minimize"
            onClick={() =>
              void minimizeWindow()
            }
          >
            −
          </button>

          <button
            type="button"
            aria-label="Maximize"
            onClick={() =>
              void toggleMaximize()
            }
          >
            □
          </button>

          <button
            type="button"
            className="window-close"
            aria-label="Close"
            onClick={() =>
              void closeWindow()
            }
          >
            ×
          </button>
        </div>
      </header>

      <div className="app-content">
        {children}
      </div>
    </div>
  );
}