import { describe, it, expect, vi } from "vitest";
import { requestPersistentStorage } from "../requestPersistentStorage";

describe("requestPersistentStorage", () => {
  // #1 まだ永続化されていなければ要求する
  it("requests persistence when not yet persisted", async () => {
    const storage = { persisted: vi.fn(async () => false), persist: vi.fn(async () => true) };
    await requestPersistentStorage(storage);
    expect(storage.persist).toHaveBeenCalledTimes(1);
  });

  // #2 既に永続化済みなら何もしない（ブラウザによっては毎回確認を出すため）
  it("does nothing when already persisted", async () => {
    const storage = { persisted: vi.fn(async () => true), persist: vi.fn(async () => true) };
    await requestPersistentStorage(storage);
    expect(storage.persist).not.toHaveBeenCalled();
  });

  // #3 未対応ブラウザ（navigator.storage なし）でも例外にしない
  // 注: jsdom は navigator.storage を提供しない（typeof === "undefined" を確認済み）ため、
  // 既定引数 globalThis.navigator?.storage が undefined になる未対応パスを実際に通る。
  it("does nothing when the Storage API is unavailable", async () => {
    await expect(requestPersistentStorage(undefined)).resolves.toBeUndefined();
  });
});
