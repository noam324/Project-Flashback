import { useEffect, useState } from "react";

import { getGameStatus } from "../../lib/api";
import { useLauncherStore } from "../../store/launcherStore";

import type { BuildStatus } from "../../types/build";

const DOWNLOAD_URL =
  "http://localhost:8080/Fortnite-12.50-CL-13137020.rar";

function formatPath(
  path: string | null
): string {
  if (!path) {
    return "";
  }

  return path
    .replace(/^\/mnt\/c/i, "C:")
    .replaceAll("/", "\\");
}

export default function LibraryPage() {
  const [build, setBuild] =
    useState<BuildStatus | null>(
      null
    );

  const [scanning, setScanning] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedBuild =
    useLauncherStore(
      (state) => state.selectedBuild
    );

  const setSelectedBuild =
    useLauncherStore(
      (state) =>
        state.setSelectedBuild
    );

  async function scanBuild() {
    try {
      setScanning(true);
      setError("");

      const result =
        await getGameStatus();

      setBuild(result);

      if (
        result.installed &&
        result.executablePath
      ) {
        setSelectedBuild({
          build: result.build,
          changelist:
            result.changelist,
          executablePath:
            result.executablePath,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Build scan failed."
      );
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    void scanBuild();
  }, []);

  const installed =
    build?.installed === true;

  return (
    <main className="route-page">

      <div className="route-header">
        <div>
          <div className="eyebrow">
            GAME LIBRARY
          </div>

          <h1>
            Library
          </h1>

          <p>
            Installed builds and available downloads.
          </p>
        </div>

        <button
          className="button ghost"
          onClick={scanBuild}
          disabled={scanning}
        >
          {scanning
            ? "SCANNING..."
            : "SCAN PC"}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <section className="library-grid">

        {/* LOCAL BUILD */}

        <article
          className={
            installed
              ? "library-card active-card"
              : "library-card"
          }
        >
          <div className="library-card-header">
            <div>
              <div className="eyebrow">
                LOCAL BUILD
              </div>

              <h2>
                Classic Build
              </h2>
            </div>

            <span
              className={
                installed
                  ? "build-badge found"
                  : "build-badge"
              }
            >
              {installed
                ? "FOUND"
                : "NOT FOUND"}
            </span>
          </div>

          <div className="library-version">
            {build?.build ?? "12.50"}
          </div>

          <div className="library-subversion">
            CL{" "}
            {build?.changelist ??
              "13137020"}
          </div>

          <div className="build-details">

            <div>
              <span>
                VERSION
              </span>

              <strong>
                {build?.build ?? "12.50"}
              </strong>
            </div>

            <div>
              <span>
                CHANGELIST
              </span>

              <strong>
                {build?.changelist ??
                  "13137020"}
              </strong>
            </div>

            <div>
              <span>
                STATUS
              </span>

              <strong>
                {installed
                  ? "READY"
                  : "MISSING"}
              </strong>
            </div>

          </div>

          {installed &&
            build?.executablePath && (
              <div className="path-panel">
                <span>
                  LOCAL EXECUTABLE
                </span>

                <code>
                  {formatPath(
                    build.executablePath
                  )}
                </code>
              </div>
            )}

          <div className="library-actions">

            <button
              className="button primary full"
              disabled={!installed}
              onClick={() => {
                if (
                  !build?.executablePath
                ) {
                  return;
                }

                setSelectedBuild({
                  build:
                    build.build,
                  changelist:
                    build.changelist,
                  executablePath:
                    build.executablePath,
                });
              }}
            >
              {selectedBuild
                ? "LOCAL BUILD SELECTED"
                : "USE LOCAL BUILD"}
            </button>

            <button
              className="button ghost full"
              onClick={scanBuild}
              disabled={scanning}
            >
              {scanning
                ? "SCANNING..."
                : "RESCAN"}
            </button>

          </div>
        </article>


        {/* DOWNLOAD BUILD */}

        <article className="library-card">

          <div className="library-card-header">
            <div>
              <div className="eyebrow">
                AVAILABLE
              </div>

              <h2>
                Game Build
              </h2>
            </div>

            <span className="build-badge">
              12.50
            </span>
          </div>

          <div className="library-version">
            12.50
          </div>

          <div className="library-subversion">
            CL 13137020
          </div>

          <p className="library-description">
            Download the classic build when
            it is not already installed.
          </p>

          <div className="build-details">

            <div>
              <span>
                VERSION
              </span>

              <strong>
                12.50
              </strong>
            </div>

            <div>
              <span>
                CHANGELIST
              </span>

              <strong>
                13137020
              </strong>
            </div>

            <div>
              <span>
                ARCHIVE
              </span>

              <strong>
                RAR
              </strong>
            </div>

          </div>

          <a
            className="button primary full download-link"
            href={DOWNLOAD_URL}
          >
            DOWNLOAD BUILD
          </a>

        </article>
      </section>


      {/* SELECTED BUILD */}

      <section className="selected-build-bar">

        <div>
          <div className="eyebrow">
            SELECTED BUILD
          </div>

          <strong>
            {selectedBuild
              ? `${selectedBuild.build} • CL ${selectedBuild.changelist}`
              : "No build selected"}
          </strong>
        </div>

        <div
          className={
            selectedBuild
              ? "selected-build-status ready"
              : "selected-build-status"
          }
        >
          {selectedBuild
            ? "READY"
            : "NONE"}
        </div>

      </section>

    </main>
  );
}