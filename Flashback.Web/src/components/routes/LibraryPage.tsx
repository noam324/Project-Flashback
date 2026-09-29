import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

import { getGameStatus } from "../../lib/api";
import { useLauncherStore } from "../../store/launcherStore";
import type { BuildStatus } from "../../types/build";

const DOWNLOAD_URL =
  "http://localhost:8080/Fortnite-12.50-CL-13137020.rar";

async function detectNativeBuild(): Promise<BuildStatus | null> {
  try {
    return await invoke<BuildStatus>(
      "detect_local_build"
    );
  } catch {
    return null;
  }
}

function formatPath(path: string | null) {
  if (!path) {
    return "";
  }

  return path
    .replace(/^\/mnt\/c/i, "C:")
    .replaceAll("/", "\\");
}

export default function LibraryPage() {
  const [build, setBuild] =
    useState<BuildStatus | null>(null);

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
      (state) => state.setSelectedBuild
    );

  async function scanBuild() {
    setScanning(true);
    setError("");

    try {
      const native =
        await detectNativeBuild();

      const result =
        native ??
        await getGameStatus();

      setBuild(result);

      if (
        result.installed &&
        result.executablePath
      ) {
        setSelectedBuild({
          build: result.build,
          changelist: result.changelist,
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

  async function chooseLocation() {
    try {
      const selected =
        await open({
          directory: true,
          multiple: false,
          title:
            "Select your Project Flashback build folder",
        });

      if (
        typeof selected !== "string"
      ) {
        return;
      }

      const result =
        await invoke<BuildStatus>(
          "validate_build_directory",
          {
            path: selected,
          }
        );

      setBuild(result);

      setSelectedBuild({
        build: result.build,
        changelist:
          result.changelist,
        executablePath:
          result.executablePath,
      });

      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The selected folder is not a valid build."
      );
    }
  }

  useEffect(() => {
    void scanBuild();
  }, []);

  const installed =
    build?.installed === true;

  return (
    <main className="route-page">

      <div className="library-hero">

        <div>

          <span className="section-kicker">
            GAME LIBRARY
          </span>

          <h2>
            Classic Builds
          </h2>

          <p>
            Choose the build Project Flashback
            should launch. Scan your PC or select
            an existing authorized local build.
          </p>

        </div>

        <div className="build-hero-actions">

          <button
            className="button secondary"
            onClick={() =>
              void chooseLocation()
            }
          >
            CHANGE LOCATION
          </button>

          <button
            className="button ghost"
            onClick={() =>
              void scanBuild()
            }
            disabled={scanning}
          >
            {scanning
              ? "SCANNING..."
              : "SCAN PC"}
          </button>

        </div>

      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <section className="build-grid">

        {/* LOCAL BUILD */}

        <article
          className={
            installed
              ? "build-card-main ready"
              : "build-card-main"
          }
        >

          <div className="build-art-panel">

            <span className="build-art-label">
              CLASSIC ERA
            </span>

            <strong>
              12.50
            </strong>

            <small>
              CHAPTER 2 / SEASON 2
            </small>

            <div className="art-lines">
              <span />
              <span />
              <span />
            </div>

          </div>

          <div className="build-card-content">

            <div className="build-card-head">

              <div>

                <span className="section-kicker">
                  LOCAL INSTALLATION
                </span>

                <h3>
                  Fortnite 12.50
                </h3>

              </div>

              <span
                className={
                  installed
                    ? "status-pill ready"
                    : "status-pill"
                }
              >
                {installed
                  ? "READY"
                  : "NOT FOUND"}
              </span>

            </div>

            <div className="build-identifiers">

              <div>
                <span>
                  VERSION
                </span>

                <strong>
                  {build?.build ??
                    "12.50"}
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
                <div className="path-box">

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

            <div className="build-actions">

              <button
                className="button primary"
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
                  ? "BUILD SELECTED"
                  : "USE THIS BUILD"}
              </button>

              <button
                className="button ghost"
                onClick={() =>
                  void chooseLocation()
                }
              >
                CHANGE LOCATION
              </button>

            </div>

          </div>

        </article>

        {/* DOWNLOAD */}

        <article className="build-card-download">

          <div className="download-top">

            <span className="section-kicker">
              AVAILABLE
            </span>

            <span className="download-version">
              12.50
            </span>

          </div>

          <div className="download-icon">
            ↓
          </div>

          <h3>
            Install Classic Build
          </h3>

          <p>
            Download the build archive for
            your own local installation, then
            select the extracted build folder.
          </p>

          <div className="download-specs">

            <span>
              <small>
                VERSION
              </small>

              <strong>
                12.50
              </strong>
            </span>

            <span>
              <small>
                CHANGELIST
              </small>

              <strong>
                13137020
              </strong>
            </span>

            <span>
              <small>
                FORMAT
              </small>

              <strong>
                RAR
              </strong>
            </span>

          </div>

          <a
            className="button primary full"
            href={DOWNLOAD_URL}
          >
            DOWNLOAD BUILD
            <span>→</span>
          </a>

        </article>

      </section>

      {/* SELECTED */}

      <section className="selected-bar">

        <div>

          <span className="section-kicker">
            SELECTED TARGET
          </span>

          <strong>
            {selectedBuild
              ? selectedBuild.build +
                "  •  CL " +
                selectedBuild.changelist
              : "No build selected"}
          </strong>

        </div>

        <span
          className={
            selectedBuild
              ? "status-pill ready"
              : "status-pill"
          }
        >
          {selectedBuild
            ? "READY"
            : "NONE"}
        </span>

      </section>

    </main>
  );
}