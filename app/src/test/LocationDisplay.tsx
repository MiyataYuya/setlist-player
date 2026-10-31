import { useLocation } from "react-router-dom";

/**
 * 遷移先URLを検証するための表示用コンポーネント。
 * helpers.tsx に置くと react-refresh/only-export-components に触れるため別ファイル。
 */
export default function LocationDisplay() {
  return <div data-testid="pathname">{useLocation().pathname}</div>;
}
