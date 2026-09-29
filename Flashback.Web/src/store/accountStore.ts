import { create } from "zustand";

import type { Account } from "../types/account";

const TOKEN_KEY =
  "flashback_session";

type DiscordStartResponse = {
  ticket: string;
  authorizationUrl: string;
};

type DiscordStatusResponse = {
  status:
    | "pending"
    | "complete"
    | "not_found";

  sessionToken?: string | null;

  account?: Account | null;
};

type SessionResponse = {
  account: Account;
};

type AccountState = {
  account: Account | null;
  sessionToken: string | null;
  loading: boolean;
  loginStatus: string;

  hydrate: () => Promise<void>;
  loginWithDiscord: () => Promise<void>;
  logout: () => Promise<void>;
};

function getStoredToken(): string | null {
  return localStorage.getItem(
    TOKEN_KEY
  );
}

function saveToken(
  token: string
) {
  localStorage.setItem(
    TOKEN_KEY,
    token
  );
}

function removeToken() {
  localStorage.removeItem(
    TOKEN_KEY
  );
}

function sleep(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}

async function getAccount(
  token: string
): Promise<Account> {
  const response =
    await fetch(
      "/api/auth/session/validate",
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      "Session is no longer valid."
    );
  }

  const data =
    (await response.json()) as SessionResponse;

  if (!data.account) {
    throw new Error(
      "Account information was not returned."
    );
  }

  return data.account;
}

export const useAccountStore =
  create<AccountState>(
    (set, get) => ({
      account: null,

      sessionToken:
        getStoredToken(),

      loading: false,

      loginStatus: "",

      hydrate: async () => {
        const token =
          getStoredToken();

        if (!token) {
          set({
            account: null,
            sessionToken: null,
            loading: false,
          });

          return;
        }

        try {
          set({
            loading: true,
            loginStatus:
              "Checking session...",
          });

          const account =
            await getAccount(
              token
            );

          set({
            account,
            sessionToken: token,
            loading: false,
            loginStatus: "",
          });
        } catch {
          removeToken();

          set({
            account: null,
            sessionToken: null,
            loading: false,
            loginStatus: "",
          });
        }
      },

      loginWithDiscord:
        async () => {
          try {
            set({
              loading: true,
              loginStatus:
                "Opening Discord...",
            });

            const response =
              await fetch(
                "/api/auth/discord/start"
              );

            if (!response.ok) {
              throw new Error(
                "Could not start Discord login."
              );
            }

            const start =
              (await response.json()) as DiscordStartResponse;

            if (
              !start.ticket ||
              !start.authorizationUrl
            ) {
              throw new Error(
                "Discord login information was not returned."
              );
            }

            window.open(
              start.authorizationUrl,
              "_blank",
              "noopener,noreferrer"
            );

            set({
              loginStatus:
                "Waiting for Discord authorization...",
            });

            for (
              let attempt = 0;
              attempt < 120;
              attempt++
            ) {
              await sleep(1000);

              let statusResponse:
                Response;

              try {
                statusResponse =
                  await fetch(
                    `/api/auth/discord/status/${encodeURIComponent(
                      start.ticket
                    )}`
                  );
              } catch {
                continue;
              }

              if (
                !statusResponse.ok
              ) {
                continue;
              }

              const status =
                (await statusResponse.json()) as DiscordStatusResponse;

              if (
                status.status !==
                "complete"
              ) {
                continue;
              }

              const token =
                status.sessionToken ??
                null;

              if (!token) {
                throw new Error(
                  "Discord login completed without a session token."
                );
              }

              saveToken(token);

              let account =
                status.account ??
                null;

              if (!account) {
                account =
                  await getAccount(
                    token
                  );
              }

              set({
                account,
                sessionToken: token,
                loading: false,
                loginStatus:
                  "Logged in.",
              });

              return;
            }

            throw new Error(
              "Discord login timed out. Please try again."
            );
          } catch (error) {
            set({
              loading: false,
              loginStatus:
                error instanceof Error
                  ? error.message
                  : "Discord login failed.",
            });
          }
        },

      logout: async () => {
        const token =
          get().sessionToken;

        try {
          if (token) {
            await fetch(
              "/api/auth/session/logout",
              {
                method: "POST",

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );
          }
        } catch {
          // Local logout still happens.
        }

        removeToken();

        set({
          account: null,
          sessionToken: null,
          loading: false,
          loginStatus: "",
        });
      },
    })
  );