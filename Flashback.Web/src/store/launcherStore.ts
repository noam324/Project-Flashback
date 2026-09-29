import { create } from "zustand";

import type { SelectedBuild } from "../types/build";

const STORAGE_KEY =
  "project-flashback-selected-build";

type LauncherState = {
  selectedBuild: SelectedBuild | null;

  setSelectedBuild: (
    build: SelectedBuild
  ) => void;

  clearSelectedBuild: () => void;
};

function loadBuild(): SelectedBuild | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw
    ) as SelectedBuild;
  } catch {
    return null;
  }
}

export const useLauncherStore =
  create<LauncherState>((set) => ({
    selectedBuild: loadBuild(),

    setSelectedBuild: (build) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(build)
      );

      set({
        selectedBuild: build,
      });
    },

    clearSelectedBuild: () => {
      localStorage.removeItem(
        STORAGE_KEY
      );

      set({
        selectedBuild: null,
      });
    },
  }));