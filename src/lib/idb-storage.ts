import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

/**
 * 基于 IndexedDB (idb-keyval) 的异步安全存储适配器
 *
 * 核心特性：
 * 1. SSR / SSG 安全守护：在非浏览器环境中安全返回 null，杜绝 Next.js 服务端渲染构建报错；
 * 2. 平滑向下迁移：若 IndexedDB 中尚未写入数据，自动检测并拉取现有 localStorage 历史草稿回填，零丢失过渡；
 * 3. 异步非阻塞：大体积富文本与排版 Token 读写走底层数据库事务，杜绝主线程同步阻塞掉帧。
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      return null;
    }
    try {
      const value = await get<string>(name);
      if (value) return value;

      // 历史 LocalStorage 兜底平滑无缝迁移
      try {
        const localFallback = localStorage.getItem(name);
        if (localFallback) {
          await set(name, localFallback);
          return localFallback;
        }
      } catch {
        // ignore
      }

      return null;
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      return;
    }
    try {
      await set(name, value);
    } catch {
      // 容错处理（私密浏览模式或无配额权限）
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      return;
    }
    try {
      await del(name);
    } catch {
      // ignore
    }
  },
};
