# アプリ化（PWA）と起動時CSV同期 設計

日付: 2026-11-04
背景: プレイリスト・お気に入り等が消えないようにしたい。主因は iOS Safari が一定期間使われないサイトの localStorage を自動削除すること（ITP）。ホーム画面に追加した Web アプリはこの自動削除の対象外になる。あわせて、曲データをビルド時埋め込みから起動時取得に切り替え、新しい配信がアプリ起動時に反映されるようにする。

## 決定事項（ユーザー承認済み）

- 形態は **PWA**（ネイティブ／デスクトップアプリにはしない。WebView では YouTube 埋め込みがオリジン制限で再生エラーになりやすいため）
- 「CSV同期」= **曲データを起動時に取得**する。ユーザーデータの書出し/読込は今回やらない
- 取得元は **公開中のサイトと同じ場所**（GitHub Pages の `/setlist-player/data/*.csv`）。アプリ本体と CSV のスキーマが常に揃い、更新は従来どおり `/sync-db` のデプロイで届く
  - Google スプレッドシートを直接読まない: video_id・開始秒はハイパーリンクに埋め込まれており CSV エクスポートで失われる / 動画メタデータは API キーが必要 / 安定採番は台帳依存 / 有志の方のシートへ閲覧者ごとにアクセスが飛ぶのを避ける
  - 公開されるデータの中身は現状（JSバンドルに同梱、`song_performances.csv` 公開済み）から変わらない。クレジットと削除要請対応は README のまま
- iPhone での Safari → ホーム画面アプリへの既存データ引き継ぎ手段は **今回用意しない**（iOS ではホーム画面アプリのストレージが Safari と別。Android Chrome は共有）
- 方式 A: PWA ＋ 起動時取得、取得失敗時は Service Worker が保持する前回取得分で表示

## 配信者の権利保護

- Service Worker がキャッシュするのは **アプリ本体（JS/CSS/HTML/アイコン）とセトリCSVのみ**
- YouTube 由来のリソース（IFrame 埋め込み、`img.youtube.com` サムネイル、IFrame API スクリプト）は **キャッシュしない**。ランタイムキャッシュのルートを `data/*.csv` に限定し、クロスオリジンは一切扱わない
- 再生は従来どおり YouTube IFrame Player API 経由

## 1. データ層

### ビルド・配信

`vite.config.ts` の `csvDataPlugin` を置き換える:

- dev: `configureServer` で `${base}data/<name>.csv` へのリクエストに `../data/<name>.csv` を返す（`Content-Type: text/csv; charset=utf-8`）
- build: `generateBundle` で 3 ファイル（`app_songs_enriched.csv`, `app_performances.csv`, `app_videos.csv`）を `dist/data/` に emit
- 仮想モジュール `virtual:songs` / `virtual:performances` / `virtual:videos`、`vite-env.d.ts` の宣言、`vitest.config.ts` の alias を削除

### 新規モジュール（`app/src/data/`）

| ファイル | 責務 |
|---|---|
| `parseCatalog.ts` | `parseSongsCsv` / `parsePerformancesCsv` / `parseVideosCsv`: CSV 文字列 → `Song[]` / `Performance[]` / `Video[]`。現 `csvDataPlugin` の変換ロジック（空行除外、数値化、`view_count` 等の `\|\| 0`）をそのまま移す |
| `buildCatalog.ts` | `buildCatalog({ songs, performances, videos }): Catalog`。現 `songs.ts` のモジュールトップレベル計算と `calendar.ts` の `streamsByDate` / `streamDateKeys` / `calendarMonths` を純関数化 |
| `loadCatalog.ts` | `loadCatalog(fetchFn = fetch): Promise<Catalog>`。`${import.meta.env.BASE_URL}data/<name>.csv` を `{ cache: "no-cache" }` で並列取得（ETag 再検証で古い HTTP キャッシュを掴まない）。いずれかが失敗（例外 or `!res.ok`）なら reject |

`Catalog` 型（`types.ts` に追加）:

```ts
interface Catalog {
  songs: Song[];
  performances: Performance[];
  videos: Video[];
  songPerformances: SongPerformance[];
  songPerformanceById: Map<string, SongPerformance>;
  streams: Stream[];               // 配信日時降順
  streamsByDate: Map<string, Stream[]>;
  streamDateKeys: string[];        // 昇順
  calendarMonths: string[];
}
```

- `songs.ts` は削除。`getUniqueSongs` はアプリ本体で未使用（テストのみ）のため移植せず削除
- `calendar.ts` は純関数（`groupStreamsByJstDate`, `monthRange`, `buildMonthWeeks`）を残し、`latestStreamDateInMonth(monthKey, streamDateKeys)` と引数化する。モジュールトップレベルの値は `buildCatalog` へ移す

### 新規ストア `catalogStore`（`app/src/stores/catalogStore.ts`、非永続）

```ts
type CatalogState =
  | { status: "loading"; catalog: null; error: null }
  | { status: "ready"; catalog: Catalog; error: null }
  | { status: "error"; catalog: null; error: Error };
// actions: load(fetchFn?) — loading にして loadCatalog を呼び、ready / error へ遷移
```

- `useCatalog(): Catalog` — `status !== "ready"` のとき throw（`CatalogGate` 配下でのみ使う契約を型と実行時の両方で守る）

### 表示 `CatalogGate`（`app/src/components/layout/CatalogGate.tsx`）

- マウント時に `status === "loading"` かつ未開始なら `load()`
- loading: 中央に `CircularProgress`
- error: 「曲データを読み込めませんでした」＋「再試行」ボタン（`load()` を再実行）
- ready: `children` を描画
- `App.tsx` で `AppContent` 全体を包む（ナビ・プレイヤーを含めデータ前提のため）

### 利用側の置換

`../data/songs` / `../data/calendar` の値 import を `useCatalog()` に置き換える:
`HomePage`, `LibraryPage`, `PlaylistPage`, `CalendarPage`, `PlaylistTile`, `useFilteredSongs`, `useRecentSongs`（`MonthGrid` は純関数 `buildMonthWeeks` のみで変更なし）

ユーザーデータ（お気に入り・プレイリスト・履歴・タグ）は `performanceId` 参照で、安定採番により再生成で変わらないため影響なし。

## 2. PWA・オフライン

### 依存

- `vite-plugin-pwa@^2`（peer: vite ^7 対応）＋ peer の `workbox-build` / `workbox-window`
- `@vite-pwa/assets-generator`（dev）: SVG からアイコン PNG を生成

### マニフェスト

- `name` / `short_name`: セトリプレイヤー
- `start_url` / `scope`: `/setlist-player/`、`display: standalone`
- `theme_color` / `background_color`: `theme.ts` のダーク背景色
- アイコン: `public/icon.svg`（暗い背景に音符）から 192 / 512 / maskable 512 / `apple-touch-icon` 180 を生成。`index.html` に `apple-touch-icon` と `theme-color` meta を追加

### Service Worker（`generateSW`）

| 対象 | 戦略 |
|---|---|
| アプリ本体（`**/*.{js,css,html,svg,png}`） | precache |
| ナビゲーション | `navigateFallback: index.html`（`/setlist-player/` 配下のみ、`data/` は除外） |
| `data/*.csv`（同一オリジン） | `NetworkFirst`、`networkTimeoutSeconds: 5`、キャッシュ名 `catalog-csv` |
| それ以外（YouTube 含むクロスオリジン） | ルートなし＝キャッシュしない |

- CSV は precache しない（precache はリビジョン固定で NetworkFirst より優先されるため）
- 初回オンライン起動で `catalog-csv` に保存され、以後オフライン／タイムアウト時はそれを返す

### 更新

- `registerType: "prompt"`。新 SW が待機状態になったら Snackbar「新しいバージョンがあります」＋「更新」ボタン
- 「更新」で `updateSW(true)`（skipWaiting → リロード）。自動リロードはしない（再生を中断しない）
- 無視した場合も次回起動（全タブ終了後）で新版に切り替わる
- `UpdatePrompt` コンポーネントは `virtual:pwa-register/react` の `useRegisterSW` を使う。テストでは同モジュールを `vi.mock` で差し替える

### ストレージ永続化

- 起動時（`main.tsx`）に `navigator.storage?.persist?.()` を呼ぶ。未対応ブラウザは何もしない。結果は UI に出さない

### 既存の GitHub Pages SPA 対応

- `public/404.html` のリダイレクトと `index.html` の復元スクリプトは残す（SW 未登録の初回アクセスで必要）

## 3. テスト

### ユニット（TDD で先行）

| 対象 | 主なケース |
|---|---|
| `parseCatalog` | 型変換 / 空行除外 / 数値化 / 欠損数値は 0 |
| `buildCatalog` | 現 `songs.test.ts` と `calendar.test.ts` のモジュール値に対するケースを移植（結合・降順・日付グルーピング・月範囲）|
| `loadCatalog` | 3 URL を `BASE_URL` 付きで取得 / `cache: "no-cache"` / 1 つでも `!ok` や例外なら reject |
| `catalogStore` | loading → ready / loading → error / error から再試行で ready |
| `CatalogGate` | loading 表示 / エラー＋再試行 / ready で子を描画 |
| `UpdatePrompt` | `needRefresh` で Snackbar 表示 / 「更新」で `updateServiceWorker(true)` |

### 既存テストの調整

- `src/test/__mocks__/virtual*.ts` → `src/test/fixtures/catalog.ts`（生データ＋`buildCatalog` 済みの `testCatalog`）
- `src/test/setup.ts` の `beforeEach` で `catalogStore` を `ready(testCatalog)` にする。既存コンポーネントテストはほぼ無改修。ゲート自体のテストは個別に loading/error へ上書き
- テストのTZは従来どおり `America/Los_Angeles`

### E2E

- dev サーバーが `/setlist-player/data/*.csv` を返すため既存 Playwright はそのまま。main で既に赤い 7 件以外に新規失敗がないことを確認

### 手動確認（ビルド成果物を `vite preview` で開く）

- マニフェストと SW が登録される / インストール可能
- オフライン（DevTools の Network offline）で再読込しても起動し曲一覧が出る
- Cache Storage に YouTube 由来のエントリがない
- 新ビルド後に更新 Snackbar が出て、「更新」で切り替わる

## リリース

- 機能追加のため `1.2.2` → `1.3.0`（`app/package.json` と `package-lock.json` 先頭2箇所）
- `CLAUDE.md` の「データパイプライン」節（仮想モジュール → 起動時取得）とテスト節（モック → fixtures）を更新

## 影響範囲

- 追加: `src/data/{parseCatalog,buildCatalog,loadCatalog}.ts`, `src/stores/catalogStore.ts`, `src/components/layout/{CatalogGate,UpdatePrompt}.tsx`, `src/test/fixtures/catalog.ts`, `public/icon.svg` と生成アイコン, 各テスト
- 変更: `vite.config.ts`, `vitest.config.ts`, `vite-env.d.ts`, `index.html`, `main.tsx`, `App.tsx`, `data/calendar.ts`, `data/types.ts`, 利用側 7 ファイル, `test/setup.ts`, `package.json`, `CLAUDE.md`
- 削除: `src/data/songs.ts`, `src/test/__mocks__/virtual*.ts`
