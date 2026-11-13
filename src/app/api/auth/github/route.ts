import { type NextRequest, NextResponse } from "next/server";
import {
  callbackUrl,
  randomToken,
  readGithubConfig,
  setOauthStateCookie,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const config = readGithubConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL("/app?login=config", request.nextUrl.origin),
    );
  }

  const state = randomToken();
  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", config.clientId);
  authorize.searchParams.set(
    "redirect_uri",
    callbackUrl(request.nextUrl.origin),
  );
  authorize.searchParams.set("scope", "read:user");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(authorize);
  setOauthStateCookie(response, state);
  return response;
}
