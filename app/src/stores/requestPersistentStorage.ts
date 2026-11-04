type PersistableStorage = Pick<StorageManager, "persist" | "persisted">;

/** ホーム画面に追加したアプリ（スタンドアロン表示）として動いているか */
function isStandaloneDisplay(): boolean {
  return globalThis.matchMedia?.("(display-mode: standalone)").matches ?? false;
}

/**
 * ホーム画面に追加したアプリのお気に入り・プレイリスト等（localStorage）を
 * ブラウザの自動削除から守るよう要求する。
 * 通常のブラウザ利用では要求しない（Firefox は許可確認を出し、却下すると毎回聞かれるため）。
 * 結果は仕様どおり画面に出さない。未対応ブラウザでは何もしない。
 */
export async function requestPersistentStorage(
  storage: PersistableStorage | undefined = globalThis.navigator?.storage,
  isStandalone: () => boolean = isStandaloneDisplay
): Promise<void> {
  if (!isStandalone()) return;
  if (!storage?.persist || !storage.persisted) return;
  try {
    if (await storage.persisted()) return;
    await storage.persist();
  } catch {
    // 永続化は努力目標で、失敗しても起動を妨げない。結果は仕様上UIに出さないので握りつぶす
  }
}
