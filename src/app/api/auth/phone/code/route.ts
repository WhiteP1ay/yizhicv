import { connection, type NextRequest, NextResponse } from "next/server";
import { CAPTCHA_COOKIE, verifyCaptcha } from "@/lib/captcha";
import {
  rememberSmsRequest,
  SMS_COOLDOWN_SECONDS,
  smsRetryAfter,
} from "@/lib/phone-code";

const phonePattern = /^1\d{10}$/;

export async function POST(request: NextRequest) {
  await connection();
  const body: { phone?: unknown; captcha?: unknown } = await request
    .json()
    .catch(() => ({}));
  const phone = typeof body.phone === "string" ? body.phone : "";
  const captcha = typeof body.captcha === "string" ? body.captcha : "";

  if (!phonePattern.test(phone)) {
    return NextResponse.json(
      { message: "请输入 11 位手机号", refresh: false },
      { status: 400 },
    );
  }

  const retryAfter = await smsRetryAfter(phone);
  if (retryAfter > 0) {
    return NextResponse.json(
      {
        message: `请 ${retryAfter} 秒后再获取`,
        refresh: false,
        retryAfter,
      },
      { status: 429 },
    );
  }

  const result = await verifyCaptcha(
    request.cookies.get(CAPTCHA_COOKIE)?.value,
    captcha,
  );
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  await rememberSmsRequest(phone);
  return NextResponse.json(
    {
      message: "手机验证码还没接上",
      refresh: true,
      retryAfter: SMS_COOLDOWN_SECONDS,
    },
    { status: 503 },
  );
}
