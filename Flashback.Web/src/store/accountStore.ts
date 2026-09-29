import { create } from "zustand";

import type { Account } from "../types/account";

const TOKEN_KEY =
  "flashback_session";

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

function saveToken(token: string) {
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

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function getAccount(
  token: string
): Promise<Account> {
  const response = await fetch(
    "/api/auth/session",
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
    await response.json();

  return (
    data.account ?? data
  ) as Account;
}

export const useAccountStore =
  create<AccountState>((set, get) => ({
    account: null,
    sessionToken:
      getStoredToken(),
    loading: false,
    loginStatus: "",

    hydrate: async () => {
      const token =
        getStoredToken();

      if (!token) {
        return;
      }

      try {
        set({
          loading: true,
        });

        const account =
          await getAccount(token);

        set({
          account,
          sessionToken: token,
          loading: false,
        });
      } catch {
        removeToken();

        set({
          account: null,
          sessionToken: null,
          loading: false,
        });
      }
    },

    loginWithDiscord: async () => {
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
          await response.json();

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
            "Waiting for Discord...",
        });

        for (
          let attempt = 0;
          attempt < 120;
          attempt++
        ) {
          await sleep(1000);

          const statusResponse =
            await fetch(
              `/api/auth/discord/status/${start.ticket}`
            );

          if (!statusResponse.ok) {
            continue;
          }

          const status =
            await statusResponse.json();

          if (
            status.completed ||
            status.authenticated
          ) {
            const token =
              status.sessionToken ??
              status.token;

            if (!token) {
              throw new Error(
                "Discord login completed without a session token."
              );
            }

            saveToken(token);

            const account =
              await getAccount(token);

            set({
              account,
              sessionToken: token,
              loading: false,
              loginStatus:
                "Logged in.",
            });

            return;
          }
        }

        throw new Error(
          "Discord login timed out."
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
            "/api/auth/logout",
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
        // Ignore network errors.
      }

      removeToken();

      set({
        account: null,
        sessionToken: null,
        loginStatus: "",
      });
    },
  }));