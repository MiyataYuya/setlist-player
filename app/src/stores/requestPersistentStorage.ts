type PersistableStorage = Pick<StorageManager, "persist" | "persisted">;

/**
 * お気に入り・プレイリスト等（localStorage）をブラウザの自動削除から守るよう要求する。
 * 結果は画面に出さない。未対応ブラウザでは何もしない。
 */
export async function requestPersistentStorage(
  storage: PersistableStorage | undefined = globalThis.navigator?.storage
): Promise<void> {
  if (!storage?.persist || !storage.persisted) return;
  if (await storage.persisted()) return;
  await storage.persist();
}
