import { type NextRequest, NextResponse } from "next/server";
import {
  callbackUrl,
  clearOauthStateCookie,
  createSession,
  readGithubConfig,
  readOauthState,
  setSessionCookie,
  tokensMatch,
  upsertGithubUser,
} from "@/server/auth";
import { fetchGithubProfile } from "@/server/github";

function failed(origin: string) {
  return NextResponse.redirect(new URL("/app?login=failed", origin));
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const config = readGithubConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = readOauthState(request);

  if (
    !config ||
    !code ||
    !state ||
    !savedState ||
    !tokensMatch(state, savedState) ||
    request.nextUrl.searchParams.get("error")
  ) {
    const response = failed(origin);
    clearOauthStateCookie(response);
    return response;
  }

  const profile = await fetchGithubProfile(
    code,
    callbackUrl(origin),
    config.clientId,
    config.clientSecret,
  );
  if (!profile) {
    const response = failed(origin);
    clearOauthStateCookie(response);
    return response;
  }

  const userId = await upsertGithubUser(profile);
  const token = await createSession(userId);
  const response = NextResponse.redirect(new URL("/app", origin));
  clearOauthStateCookie(response);
  setSessionCookie(response, token);
  return response;
}
