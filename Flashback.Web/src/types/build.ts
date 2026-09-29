export type BuildStatus = {
  installed: boolean;
  versionCompatible: boolean;
  build: string;
  changelist: string;
  detectedVersion: string | null;
  executablePath: string | null;
  rootPath: string | null;
  validationMessage: string | null;
};

export type SelectedBuild = {
  build: string;
  changelist: string;
  executablePath: string | null;
};