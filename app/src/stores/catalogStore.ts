import { create } from "zustand";
import { loadCatalog } from "../data/loadCatalog";
import type { Catalog } from "../data/types";

type CatalogState =
  | { status: "idle"; catalog: null; error: null }
  | { status: "loading"; catalog: null; error: null }
  | { status: "ready"; catalog: Catalog; error: null }
  | { status: "error"; catalog: null; error: Error };

type CatalogStore = CatalogState & {
  /** 曲データを取得する。失敗しても throw せず status=error にする */
  load: (fetchFn?: typeof fetch) => Promise<void>;
};

export const useCatalogStore = create<CatalogStore>()((set) => ({
  status: "idle",
  catalog: null,
  error: null,
  load: async (fetchFn) => {
    set({ status: "loading", catalog: null, error: null });
    try {
      const catalog = await loadCatalog(fetchFn);
      set({ status: "ready", catalog, error: null });
    } catch (e) {
      set({
        status: "error",
        catalog: null,
        error: e instanceof Error ? e : new Error(String(e)),
      });
    }
  },
}));

/** 読み込み済みでなければ throw（CatalogGate 配下でのみ使う契約を実行時にも守る） */
export function requireCatalog(catalog: Catalog | null): Catalog {
  if (!catalog) {
    throw new Error("useCatalog は CatalogGate の配下で使ってください");
  }
  return catalog;
}

/** 曲データ。CatalogGate の配下（＝読み込み完了後）でのみ使う */
export function useCatalog(): Catalog {
  return requireCatalog(useCatalogStore((s) => s.catalog));
}
