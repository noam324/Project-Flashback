export type BuildStatus = {
  installed: boolean;
  build: string;
  changelist: string;
  executablePath: string | null;
};

export type SelectedBuild = {
  build: string;
  changelist: string;
  executablePath: string | null;
};