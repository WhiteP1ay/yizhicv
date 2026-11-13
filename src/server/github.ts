import "server-only";

export type GithubProfile = {
  providerUserId: string;
  name: string;
  avatarUrl: string | null;
};

function httpsUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function fetchGithubProfile(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<GithubProfile | null> {
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    },
  );
  const tokenPayload: { access_token?: string } = await tokenResponse.json();
  if (!tokenPayload.access_token) return null;

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenPayload.access_token}`,
      "User-Agent": "yizhicv",
    },
  });
  if (!userResponse.ok) return null;

  const user: {
    id?: number;
    login?: string;
    name?: string | null;
    avatar_url?: string | null;
  } = await userResponse.json();
  if (typeof user.id !== "number" || !user.login) return null;

  const name = user.name?.trim() || user.login;
  return {
    providerUserId: String(user.id),
    name,
    avatarUrl: httpsUrl(user.avatar_url),
  };
}
