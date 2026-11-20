/**
 * 价格来源（2026-11-20）：
 * https://api-docs.deepseek.com/quick_start/pricing/
 * 页面已不再单列 deepseek-chat。当天实测该模型名由 deepseek-flash 承接，
 * 因此按页面上 deepseek-flash 的标价计费：
 *   cache hit  每百万 token 离峰 $0.003 / 高峰 $0.006
 *   cache miss 每百万 token 离峰 $0.15  / 高峰 $0.30
 *   output     每百万 token 离峰 $0.60  / 高峰 $1.20
 * 高峰为周一至周五 UTC 01:00–04:00 与 06:00–10:00。周末全天离峰。
 * 中国法定节假日官方为全天离峰；这里没有节假日日历，落在高峰窗口的节假日
 * 仍按高峰扣，平台不会少扣。
 * 汇率用 2026-11-20 人民币兑美元中间价 1 USD = 6.7131 CNY
 * （中国人民银行授权中国外汇交易中心公布，中国新闻网同日报道）。
 * 换算只说明购买力，扣费按当次 usage 的实际 token 构成，不按固定配比。
 * 离峰、cache miss 与输出 1:1 时，0.5 元够 99,308 输入 token + 99,308 输出 token。
 * 高峰价格是离峰的 2 倍，同样配比约为一半。
 */
const FX_CNY_NUMERATOR = BigInt(67131);
const FX_CNY_DENOMINATOR = BigInt(10000);

/** USD per 1M tokens, in micro-USD (1 USD = 1_000_000). */
const OFF_PEAK_MICRO_USD_PER_MILLION = {
  hit: BigInt(3000),
  miss: BigInt(150000),
  output: BigInt(600000),
} as const;

const PEAK_MICRO_USD_PER_MILLION = {
  hit: BigInt(6000),
  miss: BigInt(300000),
  output: BigInt(1200000),
} as const;

export const MIN_OUTPUT_TOKENS = 16;
export const MAX_OUTPUT_TOKENS = 1024;

export type TokenPrices = {
  hit: bigint;
  miss: bigint;
  output: bigint;
};

export type TokenUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
};

function picoPerToken(microUsdPerMillion: bigint): bigint {
  return (
    (microUsdPerMillion * FX_CNY_NUMERATOR + FX_CNY_DENOMINATOR / BigInt(2)) /
    FX_CNY_DENOMINATOR
  );
}

function pricesFrom(table: TokenPrices): TokenPrices {
  return {
    hit: picoPerToken(table.hit),
    miss: picoPerToken(table.miss),
    output: picoPerToken(table.output),
  };
}

/** Peak hours are 01:00–04:00 and 06:00–10:00 UTC, Monday through Friday. */
export function isDeepSeekPeak(at: Date): boolean {
  const day = at.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minute = at.getUTCHours() * 60 + at.getUTCMinutes();
  const inWindow = (start: number, end: number) =>
    minute >= start && minute < end;
  return inWindow(1 * 60, 4 * 60) || inWindow(6 * 60, 10 * 60);
}

export function tokenPrices(at: Date): TokenPrices {
  return pricesFrom(
    isDeepSeekPeak(at)
      ? PEAK_MICRO_USD_PER_MILLION
      : OFF_PEAK_MICRO_USD_PER_MILLION,
  );
}

function wholeTokens(value: number | undefined): bigint {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return BigInt(0);
  }
  return BigInt(Math.floor(value));
}

/**
 * Bill cache hit and cache miss separately. If the API omits the split,
 * treat the whole prompt as a cache miss so the debit is not too small.
 */
export function usageCostPico(usage: TokenUsage, prices: TokenPrices): bigint {
  const completion = wholeTokens(usage.completion_tokens);
  const split =
    usage.prompt_cache_hit_tokens != null ||
    usage.prompt_cache_miss_tokens != null;
  const hit = split ? wholeTokens(usage.prompt_cache_hit_tokens) : BigInt(0);
  let miss = split
    ? wholeTokens(usage.prompt_cache_miss_tokens)
    : wholeTokens(usage.prompt_tokens);
  if (split) {
    const prompt = wholeTokens(usage.prompt_tokens);
    const covered = hit + miss;
    if (prompt > covered) miss += prompt - covered;
  }
  return hit * prices.hit + miss * prices.miss + completion * prices.output;
}

/** Conservative prompt size so max_tokens is set before the real usage arrives. */
export function estimatePromptTokens(messages: { content: string }[]): number {
  let tokens = 16;
  for (const message of messages) {
    tokens += 8;
    let ascii = 0;
    for (const char of message.content) {
      const code = char.codePointAt(0) ?? 0;
      if (code > 0x7f) tokens += 1;
      else ascii += 1;
    }
    tokens += Math.ceil(ascii / 4);
  }
  return Math.ceil(tokens * 1.2);
}

export type TurnPlan =
  | { ok: false }
  | { ok: true; maxTokens: number; reservePicoCny: bigint };

/**
 * Refuse when the balance cannot pay this prompt at cache-miss rates plus
 * a 16-token reply. Otherwise cap max_tokens so the reserved completion
 * fits in what is left, and never above 1024.
 */
export function planTurn(
  balancePicoCny: bigint,
  estimatedInputTokens: number,
  prices: TokenPrices,
): TurnPlan {
  const inputTokens =
    estimatedInputTokens > 0 ? BigInt(estimatedInputTokens) : BigInt(1);
  const inputCost = inputTokens * prices.miss;
  const minOutputCost = BigInt(MIN_OUTPUT_TOKENS) * prices.output;
  if (balancePicoCny < inputCost + minOutputCost) return { ok: false };

  const room = balancePicoCny - inputCost;
  let maxTokens = room / prices.output;
  const cap = BigInt(MAX_OUTPUT_TOKENS);
  if (maxTokens > cap) maxTokens = cap;
  if (maxTokens < BigInt(MIN_OUTPUT_TOKENS)) return { ok: false };

  return {
    ok: true,
    maxTokens: Number(maxTokens),
    reservePicoCny: inputCost + maxTokens * prices.output,
  };
}
