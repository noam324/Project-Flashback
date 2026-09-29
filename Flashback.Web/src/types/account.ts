export type Account = {
  id: string;
  username: string;
  email: string;
  discordUserId: string;
  discordUsername: string;
  discordAvatarUrl: string | null;

  profile: {
    displayName: string;
    level: number;
    flashbackCredits: number;
  } | null;
};