import type { BuildStatus } from "../types/build";

const API = "/api";

export async function apiRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${API}${path}`,
    init
  );

  const text = await response.text();

  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      throw new Error(data.error);
    }

    throw new Error(
      `Request failed with HTTP ${response.status}.`
    );
  }

  return data as T;
}

export async function getGameStatus(): Promise<BuildStatus> {
  return apiRequest<BuildStatus>(
    "/game/status"
  );
}

export async function getHealth() {
  return apiRequest<{
    status: string;
    version: string;
  }>("/health");
}