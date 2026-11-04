import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useRegisterSW } from "virtual:pwa-register/react";
import { warmCatalogCache } from "../../data/warmCatalogCache";

/**
 * 新しい版の Service Worker が待機中なら知らせる。
 * 再生を中断しないよう自動では切り替えず、「更新」を押したときだけ再読み込みする。
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    // 初回訪問は未制御で曲データCSVがキャッシュに入らないため、SW 有効化後に入れさせる
    onRegisteredSW() {
      void warmCatalogCache();
    },
  });

  return (
    <Snackbar
      open={needRefresh}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      message="新しいバージョンがあります"
      action={
        <Button color="primary" size="small" onClick={() => void updateServiceWorker(true)}>
          更新
        </Button>
      }
    />
  );
}
