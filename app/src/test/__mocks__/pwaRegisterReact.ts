import { vi } from "vitest";
import type { Dispatch, SetStateAction } from "react";

type BooleanState = [boolean, Dispatch<SetStateAction<boolean>>];

const noop: Dispatch<SetStateAction<boolean>> = () => {};
const idle: BooleanState = [false, noop];

/** 既定は「更新なし」。テストで mockReturnValue して状態を作る */
export const useRegisterSW = vi.fn(() => ({
  needRefresh: idle,
  offlineReady: idle,
  updateServiceWorker: vi.fn(async () => {}),
}));
