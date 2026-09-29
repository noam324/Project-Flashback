import {
  useEffect,
  useRef,
  useState,
} from "react";

import { getGameStatus } from "../../lib/api";
import { useLauncherStore } from "../../store/launcherStore";

import type { BuildStatus } from "../../types/build";

const DOWNLOAD_URL =
  "http://localhost:8080/Fortnite-12.50-CL-13137020.rar";

const EXPECTED_VERSION = "12.50";
const EXPECTED_CL = "13137020";

function isTauriRuntime(): boolean {
  const tauri = (
    window as Window & {
      __TAURI_INTERNALS__?: unknown;
    }
  ).__TAURI_INTERNALS__;

  return Boolean(tauri);
}

async function tauriInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error(
      "Desktop launcher required."
    );
  }

  const module = await import(
    "@tauri-apps/api/core"
  );

  if (
    !module ||
    typeof module.invoke !== "function"
  ) {
    throw new Error(
      "Tauri invoke is unavailable."
    );
  }

  return module.invoke<T>(
    command,
    args
  );
}

async function openTauriDirectory() {
  if (!isTauriRuntime()) {
    return null;
  }

  const dialog = await import(
    "@tauri-apps/plugin-dialog"
  );

  if (
    !dialog ||
    typeof dialog.open !==
      "function"
  ) {
    throw new Error(
      "Tauri directory picker is unavailable."
    );
  }

  return dialog.open({
    directory: true,
    multiple: false,
    title:
      "Select your Project Flashback build folder",
  });
}

async function detectNativeBuild(): Promise<BuildStatus | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  try {
    return await tauriInvoke<BuildStatus>(
      "detect_local_build"
    );
  } catch {
    return null;
  }
}

function formatPath(
  path: string | null
) {
  if (!path) {
    return "";
  }

  return path
    .replace(/^\/mnt\/c/i, "C:")
    .replaceAll("/", "\\");
}

function getRelativePath(
  file: File
) {
  return (
    (
      file as File & {
        webkitRelativePath?: string;
      }
    ).webkitRelativePath ??
    file.name
  );
}

function normalizePath(
  path: string
) {
  return path
    .replaceAll("\\", "/")
    .replace(/^\.?\//, "")
    .toLowerCase();
}

function getRootFolder(
  path: string
) {
  return path.split("/")[0] ?? "";
}

function createBrowserStatus({
  installed,
  build,
  changelist,
  detectedVersion,
  rootPath,
  executablePath,
  versionCompatible,
  validationMessage,
}: {
  installed: boolean;
  build: string;
  changelist: string;
  detectedVersion: string;
  rootPath: string | null;
  executablePath: string | null;
  versionCompatible: boolean;
  validationMessage: string;
}): BuildStatus {
  return {
    installed,
    build,
    changelist,
    detectedVersion,
    rootPath,
    executablePath,
    versionCompatible,
    validationMessage,
  };
}

export default function LibraryPage() {
  const [build, setBuild] =
    useState<BuildStatus | null>(null);

  const [scanning, setScanning] =
    useState(false);

  const [folderName, setFolderName] =
    useState("");

  const [browserValidated, setBrowserValidated] =
    useState(false);

  const [error, setError] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const selectedBuild =
    useLauncherStore(
      (state) =>
        state.selectedBuild
    );

  const setSelectedBuild =
    useLauncherStore(
      (state) =>
        state.setSelectedBuild
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
          build:
            result.build,
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

  async function chooseNativeLocation() {
    try {
      const selected =
        await openTauriDirectory();

      if (
        typeof selected !==
        "string"
      ) {
        return;
      }

      const result =
        await tauriInvoke<BuildStatus>(
          "validate_build_directory",
          {
            path: selected,
          }
        );

      setBuild(result);
      setFolderName("");
      setBrowserValidated(false);
      setError("");

      if (
        result.executablePath
      ) {
        setSelectedBuild({
          build:
            result.build,
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
          : "The selected folder is not compatible."
      );
    }
  }

  async function handleBrowserFolder(
    files: FileList | null
  ) {
    if (
      !files ||
      files.length === 0
    ) {
      return;
    }

    setError("");
    setBrowserValidated(false);

    let executableFound = false;
    let buildVersion = "";
    let changelist = "";
    let metadataFound = false;

    const root =
      getRootFolder(
        getRelativePath(files[0])
      );

    setFolderName(
      root || "Selected folder"
    );

    for (
      let index = 0;
      index < files.length;
      index++
    ) {
      const file =
        files[index];

      const relativePath =
        normalizePath(
          getRelativePath(file)
        );

      const fileName =
        file.name.toLowerCase();

      if (
        fileName ===
        "fortniteclient-win64-shipping.exe"
      ) {
        executableFound = true;
      }

      if (
        fileName ===
        "build.version" ||
        relativePath.endsWith(
          "/build.version"
        )
      ) {
        metadataFound = true;

        try {
          const text =
            await file.text();

          const json =
            JSON.parse(text) as {
              BuildVersion?: unknown;
              Changelist?: unknown;
            };

          if (
            typeof json.BuildVersion ===
            "string"
          ) {
            buildVersion =
              json.BuildVersion;
          }

          if (
            typeof json.Changelist ===
              "number" ||
            typeof json.Changelist ===
              "string"
          ) {
            changelist =
              String(
                json.Changelist
              );
          }
        } catch {
          // Ignore unreadable metadata.
        }
      }
    }

    if (!executableFound) {
      setBuild(
        createBrowserStatus({
          installed: false,
          build:
            buildVersion ||
            "UNKNOWN",
          changelist:
            changelist ||
            "UNKNOWN",
          detectedVersion:
            buildVersion,
          rootPath:
            root || null,
          executablePath: null,
          versionCompatible: false,
          validationMessage:
            "Required executable was not found.",
        })
      );

      setError(
        "The selected folder does not contain FortniteClient-Win64-Shipping.exe."
      );

      return;
    }

    if (metadataFound) {
      const compatible =
        buildVersion.includes(
          EXPECTED_VERSION
        ) &&
        changelist ===
          EXPECTED_CL;

      if (!compatible) {
        setBuild(
          createBrowserStatus({
            installed: false,
            build:
              buildVersion ||
              "UNKNOWN",
            changelist:
              changelist ||
              "UNKNOWN",
            detectedVersion:
              buildVersion,
            rootPath:
              root || null,
            executablePath: null,
            versionCompatible: false,
            validationMessage:
              "Detected build is not compatible.",
          })
        );

        setError(
          `Version not compatible. Detected ${
            buildVersion || "unknown"
          } / CL ${
            changelist || "unknown"
          }, expected ${
            EXPECTED_VERSION
          } / CL ${
            EXPECTED_CL
          }.`
        );

        return;
      }

      setBuild(
        createBrowserStatus({
          installed: true,
          build:
            buildVersion ||
            EXPECTED_VERSION,
          changelist:
            changelist ||
            EXPECTED_CL,
          detectedVersion:
            buildVersion,
          rootPath:
            root || null,
          executablePath: null,
          versionCompatible: true,
          validationMessage:
            "Build version verified.",
        })
      );

      setBrowserValidated(true);
      setError("");

      return;
    }

    /*
     * The browser found the executable,
     * but cannot reliably expose the
     * real Windows path.
     *
     * Do not call this incompatible.
     */

    setBuild(
      createBrowserStatus({
        installed: true,
        build:
          EXPECTED_VERSION,
        changelist:
          EXPECTED_CL,
        detectedVersion: "",
        rootPath:
          root || null,
        executablePath: null,
        versionCompatible: true,
        validationMessage:
          "Build detected. Final validation will occur in the desktop launcher.",
      })
    );

    setBrowserValidated(true);

    setError("");
  }

  async function chooseLocation() {
    if (isTauriRuntime()) {
      await chooseNativeLocation();
      return;
    }

    fileInputRef.current?.click();
  }

  function selectBrowserBuild() {
    if (!browserValidated) {
      return;
    }

    setError(
      "Build detected. Open the desktop launcher and choose this same folder there to save the Windows executable path."
    );
  }

  useEffect(() => {
    void scanBuild();
  }, []);

  const installed =
    build?.installed === true;

  const selected =
    Boolean(selectedBuild);

  return (
    <main className="route-page">

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={(event) => {
          void handleBrowserFolder(
            event.target.files
          );

          event.currentTarget.value =
            "";
        }}
        {...({
          webkitdirectory: "",
          directory: "",
        } as Record<
          string,
          string
        >)}
      />

      <div className="library-hero">

        <div>
          <span className="section-kicker">
            PLAY / BUILD SELECTOR
          </span>

          <h2>
            Choose Your Build
          </h2>

          <p>
            Select the classic installation
            Project Flashback should use.
            The launcher checks the version
            and changelist before launch.
          </p>
        </div>

        <div className="build-hero-actions">

          <button
            type="button"
            className="button primary"
            onClick={() =>
              void chooseLocation()
            }
          >
            CHOOSE BUILD
          </button>

          <button
            type="button"
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
        <div
          className={
            error.startsWith(
              "Version not compatible"
            )
              ? "error-banner"
              : "launch-info"
          }
        >
          {error}
        </div>
      )}

      {folderName && (
        <div className="selected-bar">

          <div>
            <span className="section-kicker">
              SELECTED FOLDER
            </span>

            <strong>
              {folderName}
            </strong>
          </div>

          <span
            className={
              browserValidated
                ? "status-pill ready"
                : "status-pill"
            }
          >
            {browserValidated
              ? "VERIFIED"
              : "CHECKING"}
          </span>

        </div>
      )}

      <section className="build-grid">

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
                    EXPECTED_VERSION}
                </strong>
              </div>

              <div>
                <span>
                  CHANGELIST
                </span>

                <strong>
                  {build?.changelist ??
                    EXPECTED_CL}
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
                type="button"
                className="button primary"
                disabled={
                  !installed &&
                  !browserValidated
                }
                onClick={() => {
                  if (
                    build?.executablePath
                  ) {
                    setSelectedBuild({
                      build:
                        build.build,
                      changelist:
                        build.changelist,
                      executablePath:
                        build.executablePath,
                    });

                    setError("");
                    return;
                  }

                  if (
                    browserValidated
                  ) {
                    selectBrowserBuild();
                  }
                }}
              >
                {selected
                  ? "BUILD SELECTED"
                  : "USE THIS BUILD"}
              </button>

              <button
                type="button"
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

        <article className="build-card-download">

          <div className="download-top">

            <span className="section-kicker">
              AVAILABLE BUILD
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
            Download the archive for your
            local installation, extract it,
            then select the build folder.
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

            <span>
              →
            </span>
          </a>

        </article>

      </section>

      <section className="selected-bar">

        <div>
          <span className="section-kicker">
            SELECTED TARGET
          </span>

          <strong>
            {selectedBuild
              ? `${selectedBuild.build}  •  CL ${selectedBuild.changelist}`
              : installed
                ? `${build?.build}  •  CL ${build?.changelist}`
                : "No build selected"}
          </strong>
        </div>

        <span
          className={
            selectedBuild ||
            installed
              ? "status-pill ready"
              : "status-pill"
          }
        >
          {selectedBuild ||
          installed
            ? "READY"
            : "NONE"}
        </span>

      </section>

    </main>
  );
}