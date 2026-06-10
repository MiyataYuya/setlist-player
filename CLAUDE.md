# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 絶対原則

### 配信者の権利保護が最優先

このアプリは配信者のYouTubeコンテンツを扱う。配信者の権利を脅かす機能は一切実装しない。

- 動画のダウンロード、音声抽出、キャッシュ保存など、YouTube外でコンテンツを複製・保持する機能を作らない
- 再生は必ずYouTube IFrame Player APIを経由する（配信者の再生回数・収益に貢献する）
- 配信者が動画を削除・非公開にした場合、それを回避する手段を提供しない
- 判断に迷ったら「配信者が嫌がるか？」を基準にする。嫌がる可能性があるなら実装しない

### 次善の策をとらない

妥協や回避策で問題を「なんとなく動く」状態にしない。

- 根本原因を特定し、正しい解決策を実装する
- 型エラーを `as any` や `// @ts-ignore` で黙らせない
- テストが通らないときにテストを緩めない。実装を直す
- 「とりあえず動く」コードを書かない。設計意図を理解してから実装する

### TDD (テスト駆動開発)

すべての機能追加・バグ修正はTDDで行う。

1. **Red**: 失敗するテストを先に書く
2. **Green**: テストを通す最小限の実装を書く
3. **Refactor**: テストが通る状態を維持しつつリファクタリング

テストなしのコード変更は原則禁止。既存テストが不十分な箇所を修正する場合も、まずテストを追加してから修正する。

## Project Overview

セトリプレイヤー (Setlist Player) — YouTubeの配信アーカイブから楽曲をブラウズ・再生するモバイルファーストSPA。React 19 + TypeScript + Vite。

## リポジトリ構成

| ディレクトリ | 内容 |
|---|---|
| `app/` | フロントエンドSPA（React 19 + Vite）。開発は基本ここ |
| `scraper/` | データ生成パイプライン（Python + uv）。`uv run <script>` で実行 |
| `data/` | 生成されたCSV群。詳細は [`data/README.md`](data/README.md) |
| `docs/` | 設計判断・仕様（`decisions.md`, `spec.md`, `plans/`） |

データ生成は `scraper/build_from_sheet.py` 1本に集約（Googleスプレッドシート優先）。旧パイプライン (`fetch/parse/build/enrich`) はリポジトリに残置するが現在は不使用。詳細は [`data/README.md`](data/README.md)。
アプリが読むのは `app_songs_enriched.csv`, `app_performances.csv`, `app_videos.csv`。

## Commands

すべてのコマンドは `app/` ディレクトリで実行する。

```bash
cd app
npm run dev          # 開発サーバー (localhost:5173)
npm run build        # tsc型チェック + Viteビルド
npm run lint         # ESLint (flat config)
npm run test         # Vitest 全テスト実行
npm run test:watch   # Vitest ウォッチモード
npm run test:e2e     # Playwright E2Eテスト (dev serverを自動起動)
```

単一テストファイルの実行: `npx vitest run src/stores/__tests__/playerStore.test.ts`

### Scraper コマンド

```bash
cd scraper
uv sync                                              # 依存解決
export YOUTUBE_API_KEY="..."                         # 動画メタデータ取得に必要
curl -sL "https://docs.google.com/spreadsheets/d/1rZfXp7j8Qh_gAhWuIEgGBt9Z_Pbn0QXoCLExQc6OrNI/export?format=xlsx" -o sheet_source.xlsx
uv run build_from_sheet.py                           # data/app_*.csv と公開用CSVを再生成
```

`sheet_source.xlsx` は `.gitignore` 済み。シートが更新されたら再ダウンロード→再生成。

通常の更新は `/sync-db` カスタムコマンドを使う（シート取得→再生成→検証→バージョン採番→main/release push→デプロイ確認まで一括）。

`YOUTUBE_API_KEY` 未設定だと新規動画が title 未取得となり**演奏ごと黙って除外**される（不完全データ）。新規配信を含む再生成では必須。既存動画は `app_videos.csv` キャッシュ利用でキー不要。

## Architecture

### データパイプライン

CSVファイル → Viteカスタムプラグイン（ビルド時パース） → 仮想モジュール → アプリ

- `vite.config.ts` の `csvDataPlugin` が `app_songs_enriched.csv`, `app_performances.csv`, `app_videos.csv` をビルド時に読み込み、`virtual:songs`, `virtual:performances`, `virtual:videos` として提供
- `src/data/songs.ts` が仮想モジュールからデータを結合し、`songPerformances[]`, `streams[]`, lookup mapをエクスポート
- テスト時は `src/test/__mocks__/` のモックデータが仮想モジュールを置き換え（`vitest.config.ts` のalias設定）
- `song_id` は台帳方式の安定採番: 既存IDは `app_songs.csv` を台帳に固定、新曲のみ `max+1` を末尾採番（欠番許容）。配信追加時の `data/` 差分は**純追加（deletions=0）が正常**で、既存IDシフトが出たら回帰

### 状態管理 (Zustand v5)

5つのストアがあり、player以外はLocalStorageに永続化:

| Store | キー | 役割 |
|-------|------|------|
| `playerStore` | (非永続) | 再生キュー、再生状態、シャッフル、リピート |
| `libraryStore` | `karaoke-library` | お気に入り |
| `playlistStore` | `karaoke-playlists` | カスタムプレイリスト CRUD |
| `historyStore` | `karaoke-history` | 再生履歴 (上限200件) |
| `tagStore` | `karaoke-tags` | ユーザータグ |

`playerStore` にはモジュールレベルの `_playerRef` でYouTubeプレイヤーインスタンスを保持。

### ルーティング (React Router v7)

ルートは4つ: `/` (Home), `/search`, `/library`, `/playlist/:id` (`App.tsx`)

再生画面の中身は `PlayerBody`（`variant: "overlay" | "panel"`）。**ルートではない**。モバイルでは `playerStore.isPlayerOpen` で制御するフルスクリーンオーバーレイ（`translateY` でスライド、`variant="overlay"`）、PCでは右カラムに常設（`variant="panel"`）。

モバイルのレイアウト: `BottomNav` + `MiniPlayer`(再生中バー。`currentSong` が無い or `isPlayerOpen` のとき非表示)。どちらも PC では非表示。

### レスポンシブ

`useIsDesktop()`（`lg` ≈ 1200px以上）で PC 幅を判定。PCでは `App.tsx` が `SideNav`（左）＋一覧（中央スクロール）＋プレイヤーペイン（右常設）の2ペインを表示し、`BottomNav`/`MiniPlayer` は非表示。モバイルは下部ナビ＋スライド式オーバーレイ。`isPlayerOpen` とブラウザバックで閉じる挙動はモバイル専用。`YouTubeEmbed` は `App.tsx` 内に**単一マウント**（兄弟要素の配置を `sx` で出し分けるだけ）で、幅がしきい値をまたいでも再生が途切れない。E2E はモバイルレイアウト前提のため Playwright は 414px 固定（`playwright.config.ts`）。

### UIスタイリング

MUI v7 ダークテーマ。テーマ定義は `src/theme.ts`。日本語フォントスタック使用。

## Testing Patterns

- **テストヘルパー**: `src/test/helpers.tsx` — `renderWithProviders()` (ThemeProvider + MemoryRouter), `renderWithRoute()`
- **ストアテスト**: `getState()` で直接状態操作、`act()` でラップ
- **コンポーネントテスト**: @testing-library/react + userEvent
- **テスト配置**: `src/components/__tests__/`, `src/stores/__tests__/`, `src/hooks/__tests__/`, `src/data/__tests__/`

## Key Conventions

- 言語: UIテキストとコメントは日本語
- コンポーネント: 関数コンポーネントのみ、PascalCase
- ストア: `use*Store` 命名、Zustandセレクタで購読を最小化
- ベースURL: `/setlist-player/` (GitHub Pages デプロイ)
- デプロイ: `release/*` ブランチへのpushで GitHub Actions → GitHub Pages
- DB更新ごとに `app/package.json` の `version` パッチを +1（`package-lock.json` の2箇所も揃える）。ベースライン `1.0.0`
- 無限スクロール: `useInfiniteScroll` フック + IntersectionObserver
- 検索デバウンス: `useDebouncedValue` (500ms)
- 楽曲自動送り: `useAutoAdvance` フック (endSeconds到達で次曲へ)
