use std::path::{Path, PathBuf};
use std::process::Command;

const BUILD_VERSION: &str = "12.50";
const BUILD_CL: &str = "13137020";
const GAME_EXE: &str =
    "FortniteGame/Binaries/Win64/FortniteClient-Win64-Shipping.exe";

#[derive(serde::Serialize)]
struct BuildInfo {
    installed: bool,
    build: String,
    changelist: String,
    root_path: Option<String>,
    executable_path: Option<String>,
}

fn build_root() -> Option<PathBuf> {
    let local_app_data = std::env::var_os("LOCALAPPDATA")?;

    Some(
        PathBuf::from(local_app_data)
            .join("ProjectFlashback")
            .join("Builds")
            .join(format!("{}-CL-{}", BUILD_VERSION, BUILD_CL)),
    )
}

fn executable_from_root(root: &Path) -> PathBuf {
    root.join(
        GAME_EXE.replace(
            '/',
            std::path::MAIN_SEPARATOR_STR,
        ),
    )
}

#[tauri::command]
fn detect_local_build() -> BuildInfo {
    let Some(root) = build_root() else {
        return BuildInfo {
            installed: false,
            build: BUILD_VERSION.to_string(),
            changelist: BUILD_CL.to_string(),
            root_path: None,
            executable_path: None,
        };
    };

    let executable =
        executable_from_root(&root);

    let installed =
        executable.is_file();

    BuildInfo {
        installed,
        build: BUILD_VERSION.to_string(),
        changelist: BUILD_CL.to_string(),
        root_path: Some(
            root.to_string_lossy()
                .to_string(),
        ),
        executable_path: if installed {
            Some(
                executable
                    .to_string_lossy()
                    .to_string(),
            )
        } else {
            None
        },
    }
}

#[tauri::command]
fn validate_build_directory(
    path: String,
) -> Result<BuildInfo, String> {
    let root = PathBuf::from(path);

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

    Ok(BuildInfo {
        installed: true,
        build: BUILD_VERSION.to_string(),
        changelist: BUILD_CL.to_string(),
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
fn launch_local_build() -> Result<u32, String> {
    let info =
        detect_local_build();

    let Some(executable) =
        info.executable_path
    else {
        return Err(
            "Local build was not found."
                .to_string(),
        );
    };

    let child =
        Command::new(&executable)
            .spawn()
            .map_err(|error| {
                format!(
                    "Failed to start game: {}",
                    error
                )
            })?;

    Ok(child.id())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
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