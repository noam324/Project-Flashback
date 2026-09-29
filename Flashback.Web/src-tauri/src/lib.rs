use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

const BUILD_VERSION: &str = "12.50";
const BUILD_CL: &str = "13137020";

const GAME_EXE: &str =
    "FortniteGame/Binaries/Win64/FortniteClient-Win64-Shipping.exe";

const BUILD_VERSION_FILE: &str =
    "FortniteGame/Build/Build.version";

#[derive(serde::Serialize)]
struct BuildInfo {
    installed: bool,
    build: String,
    changelist: String,
    root_path: Option<String>,
    executable_path: Option<String>,
}

fn default_build_root() -> Option<PathBuf> {
    let local_app_data =
        std::env::var_os("LOCALAPPDATA")?;

    Some(
        PathBuf::from(local_app_data)
            .join("ProjectFlashback")
            .join("Builds")
            .join(format!(
                "{}-CL-{}",
                BUILD_VERSION,
                BUILD_CL
            )),
    )
}

fn executable_from_root(
    root: &Path,
) -> PathBuf {
    root.join(
        GAME_EXE.replace(
            '/',
            std::path::MAIN_SEPARATOR_STR,
        ),
    )
}

fn build_version_path(
    root: &Path,
) -> PathBuf {
    root.join(
        BUILD_VERSION_FILE.replace(
            '/',
            std::path::MAIN_SEPARATOR_STR,
        ),
    )
}

fn read_build_metadata(
    root: &Path,
) -> Result<(String, String), String> {
    let version_path =
        build_version_path(root);

    let content =
        fs::read_to_string(&version_path)
            .map_err(|error| {
                format!(
                    "Could not read Build.version: {}",
                    error
                )
            })?;

    let json:
        serde_json::Value =
        serde_json::from_str(&content)
            .map_err(|error| {
                format!(
                    "Build.version is invalid JSON: {}",
                    error
                )
            })?;

    let detected_version =
        json.get("BuildVersion")
            .and_then(|value| value.as_str())
            .unwrap_or("")
            .to_string();

    let detected_cl =
        json.get("Changelist")
            .and_then(|value| value.as_i64())
            .map(|value| value.to_string())
            .or_else(|| {
                json.get("Changelist")
                    .and_then(|value| value.as_str())
                    .map(|value| value.to_string())
            })
            .unwrap_or_default();

    if detected_version.is_empty() {
        return Err(
            "Build.version does not contain BuildVersion."
                .to_string(),
        );
    }

    if detected_cl.is_empty() {
        return Err(
            "Build.version does not contain Changelist."
                .to_string(),
        );
    }

    Ok((
        detected_version,
        detected_cl,
    ))
}

fn compatible(
    version: &str,
    changelist: &str,
) -> bool {
    version.contains(BUILD_VERSION)
        && changelist == BUILD_CL
}

fn make_build_info(
    root: &Path,
) -> BuildInfo {
    let executable =
        executable_from_root(root);

    if !executable.is_file() {
        return BuildInfo {
            installed: false,
            build: BUILD_VERSION.to_string(),
            changelist: BUILD_CL.to_string(),
            root_path: Some(
                root.to_string_lossy()
                    .to_string(),
            ),
            executable_path: None,
        };
    }

    let metadata =
        read_build_metadata(root);

    match metadata {
        Ok((version, changelist))
            if compatible(
                &version,
                &changelist,
            ) =>
        {
            BuildInfo {
                installed: true,
                build: version,
                changelist,
                root_path: Some(
                    root.to_string_lossy()
                        .to_string(),
                ),
                executable_path: Some(
                    executable
                        .to_string_lossy()
                        .to_string(),
                ),
            }
        }

        Ok((_version, _changelist)) => {
            BuildInfo {
                installed: false,
                build: BUILD_VERSION.to_string(),
                changelist: BUILD_CL.to_string(),
                root_path: Some(
                    root.to_string_lossy()
                        .to_string(),
                ),
                executable_path: None,
            }
        }

        Err(_) => BuildInfo {
            installed: false,
            build: BUILD_VERSION.to_string(),
            changelist: BUILD_CL.to_string(),
            root_path: Some(
                root.to_string_lossy()
                    .to_string(),
            ),
            executable_path: None,
        },
    }
}

#[tauri::command]
fn detect_local_build() -> BuildInfo {
    let Some(root) =
        default_build_root()
    else {
        return BuildInfo {
            installed: false,
            build: BUILD_VERSION.to_string(),
            changelist: BUILD_CL.to_string(),
            root_path: None,
            executable_path: None,
        };
    };

    make_build_info(&root)
}

#[tauri::command]
fn validate_build_directory(
    path: String,
) -> Result<BuildInfo, String> {
    let root =
        PathBuf::from(path);

    if !root.is_dir() {
        return Err(
            "Selected path is not a directory."
                .to_string(),
        );
    }

    let executable =
        executable_from_root(&root);

    if !executable.is_file() {
        return Err(
            "Required game executable was not found in this folder."
                .to_string(),
        );
    }

    let (
        detected_version,
        detected_changelist,
    ) = read_build_metadata(&root)?;

    if !compatible(
        &detected_version,
        &detected_changelist,
    ) {
        return Err(format!(
            "Version not compatible. Detected {} / CL {}, expected {} / CL {}.",
            detected_version,
            detected_changelist,
            BUILD_VERSION,
            BUILD_CL
        ));
    }

    Ok(BuildInfo {
        installed: true,
        build: detected_version,
        changelist:
            detected_changelist,
        root_path: Some(
            root.to_string_lossy()
                .to_string(),
        ),
        executable_path: Some(
            executable
                .to_string_lossy()
                .to_string(),
        ),
    })
}

#[tauri::command]
fn launch_local_build(
    executable_path: String,
) -> Result<u32, String> {
    let executable =
        PathBuf::from(
            &executable_path,
        );

    if !executable.is_file() {
        return Err(
            "Selected build executable was not found."
                .to_string(),
        );
    }

    let Some(
        fortnite_game_dir,
    ) = executable
        .ancestors()
        .find(|path| {
            path.file_name()
                .and_then(|name| name.to_str())
                == Some("FortniteGame")
        })
    else {
        return Err(
            "Invalid build executable path."
                .to_string(),
        );
    };

    let Some(root) =
        fortnite_game_dir.parent()
    else {
        return Err(
            "Could not resolve build root."
                .to_string(),
        );
    };

    let (
        detected_version,
        detected_changelist,
    ) = read_build_metadata(root)?;

    if !compatible(
        &detected_version,
        &detected_changelist,
    ) {
        return Err(format!(
            "Version not compatible. Detected {} / CL {}.",
            detected_version,
            detected_changelist
        ));
    }

    let expected_executable =
        executable_from_root(root);

    if executable
        .canonicalize()
        .map_err(|error| error.to_string())?
        != expected_executable
            .canonicalize()
            .map_err(|error| error.to_string())?
    {
        return Err(
            "Selected executable does not match the expected build executable."
                .to_string(),
        );
    }

    let child =
        Command::new(&executable)
            .current_dir(root)
            .spawn()
            .map_err(|error| {
                format!(
                    "Failed to start game: {}",
                    error
                )
            })?;

    Ok(child.id())
}

#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_dialog::init(),
        )
        .invoke_handler(
            tauri::generate_handler![
                detect_local_build,
                validate_build_directory,
                launch_local_build
            ],
        )
        .run(
            tauri::generate_context!(),
        )
        .expect(
            "error while running Project Flashback",
        );
}