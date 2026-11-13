declare module "svg-captcha" {
  interface CaptchaOptions {
    size?: number;
    ignoreChars?: string;
    noise?: number;
    color?: boolean;
    background?: string;
    width?: number;
    height?: number;
    fontSize?: number;
  }

  interface Captcha {
    text: string;
    data: string;
  }

  interface SvgCaptcha {
    create(options?: CaptchaOptions): Captcha;
  }

  const svgCaptcha: SvgCaptcha;
  export default svgCaptcha;
}
