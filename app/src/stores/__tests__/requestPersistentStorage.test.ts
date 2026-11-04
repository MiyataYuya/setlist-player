import { describe, it, expect, vi } from "vitest";
import { requestPersistentStorage } from "../requestPersistentStorage";

const standalone = () => true;

describe("requestPersistentStorage", () => {
  // #1 まだ永続化されていなければ要求する
  it("requests persistence when not yet persisted", async () => {
    const storage = { persisted: vi.fn(async () => false), persist: vi.fn(async () => true) };
    await requestPersistentStorage(storage, standalone);
    expect(storage.persist).toHaveBeenCalledTimes(1);
  });

  // #2 既に永続化済みなら何もしない（ブラウザによっては毎回確認を出すため）
  it("does nothing when already persisted", async () => {
    const storage = { persisted: vi.fn(async () => true), persist: vi.fn(async () => true) };
    await requestPersistentStorage(storage, standalone);
    expect(storage.persist).not.toHaveBeenCalled();
  });

  // #3 未対応ブラウザ（navigator.storage なし）でも例外にしない
  // 注: jsdom は navigator.storage を提供しない（typeof === "undefined" を確認済み）ため、
  // 既定引数 globalThis.navigator?.storage が undefined になる未対応パスを実際に通る。
  it("does nothing when the Storage API is unavailable", async () => {
    await expect(requestPersistentStorage(undefined, standalone)).resolves.toBeUndefined();
  });

  // #4 ホーム画面に追加していない通常のブラウザ利用では要求しない（毎回の許可確認を避ける）
  it("does not ask when the app is not running standalone", async () => {
    const storage = { persisted: vi.fn(async () => false), persist: vi.fn(async () => true) };
    await requestPersistentStorage(storage, () => false);
    expect(storage.persisted).not.toHaveBeenCalled();
    expect(storage.persist).not.toHaveBeenCalled();
  });

  // #5 persist が失敗しても起動時に未処理の拒否を出さない
  it("resolves without throwing when persist rejects", async () => {
    const storage = {
      persisted: vi.fn(async () => false),
      persist: vi.fn(async () => {
        throw new Error("denied");
      }),
    };
    await expect(requestPersistentStorage(storage, standalone)).resolves.toBeUndefined();
  });

  // #6 persisted の確認が失敗しても同様
  it("resolves without throwing when persisted rejects", async () => {
    const storage = {
      persisted: vi.fn(async () => {
        throw new Error("unavailable");
      }),
      persist: vi.fn(async () => true),
    };
    await expect(requestPersistentStorage(storage, standalone)).resolves.toBeUndefined();
  });
});
