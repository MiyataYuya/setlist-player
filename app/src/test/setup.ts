import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { useCatalogStore } from "../stores/catalogStore";
import { testCatalog } from "./catalogFixture";

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  private callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}

  // Helper to trigger intersection
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

// Mock matchMedia（デフォルトは「マッチしない」= モバイル幅扱い）
// テストごとに helpers の setMatchMedia() で上書きできるが、
// afterEach でこのモバイルデフォルトへ戻すことでテスト間の状態リークを防ぐ。
const mobileMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  dispatchEvent: () => false,
});

function applyMobileMatchMedia() {
  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: mobileMatchMedia,
  });
}

applyMobileMatchMedia();

afterEach(() => {
  applyMobileMatchMedia();
});

// jsdom は scrollIntoView を実装していないためスタブ
Element.prototype.scrollIntoView = () => {};

// 画面は CatalogGate 配下で読み込み完了後に描画される。各テストは
// 「読み込み済み」から始め、ゲート自体のテストだけ個別に状態を上書きする。
// load はゲートのテストで差し替えるため、毎回本物に戻す。
const realLoad = useCatalogStore.getState().load;
beforeEach(() => {
  useCatalogStore.setState({
    status: "ready",
    catalog: testCatalog,
    error: null,
    load: realLoad,
  });
});
