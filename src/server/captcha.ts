import "server-only";
import { eq, lt } from "drizzle-orm";
import svgCaptcha from "svg-captcha";
import { captchas, db } from "@/db";
import { hashToken, tokensMatch } from "@/server/auth";

export const CAPTCHA_COOKIE = "yizhicv_captcha";
export const CAPTCHA_TTL_SECONDS = 120;

const MAX_ATTEMPTS = 5;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function createCaptchaImage() {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: "0oO1iIl",
    noise: 2,
    color: true,
    width: 128,
    height: 36,
    fontSize: 32,
  });
  return { code: captcha.text, svg: captcha.data };
}

export async function issueCaptcha(previousId: string | null) {
  const now = new Date();
  await db.delete(captchas).where(lt(captchas.expiresAt, now));
  if (previousId && UUID_PATTERN.test(previousId)) {
    await db.delete(captchas).where(eq(captchas.id, previousId));
  }

  const { code, svg } = createCaptchaImage();
  const [row] = await db
    .insert(captchas)
    .values({
      codeHash: hashToken(code.toLowerCase()),
      expiresAt: new Date(now.getTime() + CAPTCHA_TTL_SECONDS * 1000),
    })
    .returning({ id: captchas.id });
  if (!row) {
    throw new Error("图形验证码创建失败");
  }
  return { id: row.id, svg };
}

export async function verifyCaptcha(
  id: string | undefined,
  answer: string,
): Promise<{ ok: true } | { ok: false; message: string; refresh: boolean }> {
  const normalized = answer.trim().toLowerCase();
  if (!id || !UUID_PATTERN.test(id) || !/^[a-z0-9]{4}$/.test(normalized)) {
    return { ok: false, message: "请输入图形验证码", refresh: false };
  }

  const [row] = await db
    .select()
    .from(captchas)
    .where(eq(captchas.id, id))
    .limit(1);
  if (!row || row.expiresAt.getTime() <= Date.now()) {
    if (row) {
      await db.delete(captchas).where(eq(captchas.id, row.id));
    }
    return {
      ok: false,
      message: "图形验证码已过期，请换一张",
      refresh: true,
    };
  }

  if (!tokensMatch(hashToken(normalized), row.codeHash)) {
    const attempts = row.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await db.delete(captchas).where(eq(captchas.id, row.id));
      return { ok: false, message: "错误次数过多，请换一张", refresh: true };
    }
    await db.update(captchas).set({ attempts }).where(eq(captchas.id, row.id));
    return { ok: false, message: "图形验证码不正确", refresh: false };
  }

  await db.delete(captchas).where(eq(captchas.id, row.id));
  return { ok: true };
}
