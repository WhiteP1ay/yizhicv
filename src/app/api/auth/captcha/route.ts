import { connection, type NextRequest, NextResponse } from "next/server";
import {
  CAPTCHA_COOKIE,
  CAPTCHA_TTL_SECONDS,
  issueCaptcha,
} from "@/server/captcha";

export async function GET(request: NextRequest) {
  await connection();
  const previousId = request.cookies.get(CAPTCHA_COOKIE)?.value ?? null;

  const { id, svg } = await issueCaptcha(previousId);
  const response = new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
  response.cookies.set(CAPTCHA_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CAPTCHA_TTL_SECONDS,
  });
  return response;
}
