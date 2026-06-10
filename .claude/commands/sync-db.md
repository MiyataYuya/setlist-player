---
description: シート最新版を取得しdata CSVを再生成、更新があればバージョン採番してmain/releaseへpush・デプロイ
argument-hint: "[--dry-run]"
---

# DB更新 → プッシュ ルーチン

有志公開の Google スプレッドシート（セトリ情報）の最新版を取り込み、`data/` の CSV を再生成し、
更新があればバージョンを採番して `main` / `release/v1.0` に反映・デプロイする一連の作業を実行する。

参考メモリ: `sheet-sync-workflow.md`（手順の根拠）。プロジェクト方針は `CLAUDE.md`（**次善の策をとらない / TDD / 配信者の権利保護**）を厳守する。

引数 `$ARGUMENTS`:
- `--dry-run` が含まれる場合は、再生成と差分確認・検証までを行い、**commit/push/マージはしない**（差分を報告して停止）。

## 前提チェック

1. クリーンな起点か確認: `git status -s` で `data/` `app/package*.json` に未コミット変更が無いこと。あれば停止して報告。
2. `YOUTUBE_API_KEY` が設定されているか確認（新規動画のメタデータ取得に必須）。未設定なら停止し、ユーザーに `! export YOUTUBE_API_KEY=...` を促す。
3. 作業ブランチを決める。`main` 上で直接行うか、`git switch -c data/sync-sheet-YYYY-MM-DD main` で切るかは状況に応じて判断（既定は `main` 上で進め、最後に release へ ff 伝播）。

## 手順

### 1. 最新シート取得 → 再生成
```bash
cd scraper
curl -sL "https://docs.google.com/spreadsheets/d/1rZfXp7j8Qh_gAhWuIEgGBt9Z_Pbn0QXoCLExQc6OrNI/export?format=xlsx" -o sheet_source.xlsx
uv run python build_from_sheet.py
```
- `sheet_source.xlsx` は `.gitignore` 済み。既存動画は `app_videos.csv` をキャッシュ利用し、新動画のみ API 取得。削除/非公開・title未取得動画は自動除外される。

### 2. 更新有無の判定（安定採番の検証込み）
```bash
cd <repo root>
git diff --stat -- data/
```
- **差分ゼロ** → 更新なし。再生成物に実差分が無いことを確認のうえ「更新なし」を報告して**終了**（バージョン採番もしない）。
- **差分あり** → 次へ。安定採番が効いていれば **insertions のみ・deletions=0** の純追加になるのが正常。
  - 念のため新規 song_id が末尾採番（既存最大+1〜）になっているか `git diff -- data/app_songs.csv | grep '^+song_'` で確認。
  - **既存 song_id がシフト（deletions が発生）していたら異常**。安定採番の回帰を疑い、`scraper/build_from_sheet.py` を調査する。差分を握りつぶして進めない（次善の策をとらない）。

`--dry-run` の場合はここで差分・新規曲・新規動画を報告して停止。

### 3. 検証（すべてグリーン必須・緩めない）
```bash
cd scraper && uv run pytest -q          # 11 tests
cd app && npm run build && npm run test  # build成功 + 112 tests 目安
```
- いずれか失敗したら停止して原因を報告。テストを緩めたり差分を捨てたりしない。

### 4. バージョン採番（DB更新ごとにパッチ末尾 +1）
- `app/package.json` の `version` を現在値からパッチ +1（例 `1.0.1` → `1.0.2`。初期 `0.0.0` の場合はベースライン `1.0.0` から開始）。
- `app/package-lock.json` の **2箇所**（root `"version"` と `packages."".version`）も同じ値に揃える。

### 5. コミット
- データ更新とバージョン更新を 2 コミットに分ける（追跡しやすい）:
  - `git add data/ && git commit -m "data: 最新シートから再生成（安定採番・<配信日範囲> 配信反映）"`
  - `git add app/package.json app/package-lock.json && git commit -m "chore: アプリバージョンを <new> に更新（DB更新に伴う採番）"`
- コミットメッセージ末尾に必ず:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```

### 6. main へ反映 → push
```bash
git fetch origin
git rev-list --left-right --count main...origin/main   # 0 0 を確認
git switch main && git merge --ff-only <作業ブランチ>     # mainで直接作業した場合は不要
git push origin main
```

### 7. release/v1.0 へ ff 伝播 → push（＝デプロイ）
```bash
git switch release/v1.0 && git merge --ff-only main
git push origin release/v1.0     # push が GitHub Actions → Pages デプロイをトリガー
git switch main
```

### 8. デプロイ確認
```bash
gh run list --branch release/v1.0 --limit 1 --json databaseId,status,conclusion
```
- 完了まで待ち、`conclusion: success` を確認。最新デプロイ SHA が HEAD と一致することを確認。
- **`actions/deploy-pages` の 401 "Requires authentication" は GitHub Pages 側の一過性障害**のことがある（過去事例あり）。その場合は**設定を変えず**、`release/v1.0` に空コミット（`git commit --allow-empty` → main 経由で ff 伝播）を1回入れてクリーンな新規 run で再試行する。
  - 注意: **失敗ジョブのみの再実行（`gh run rerun --failed`）はアーティファクト重複で別エラーになるため使わない**。必ず新規 run を起こす。
  - 1回の再試行でも失敗が続く場合は、リポジトリ設定（Settings→Pages のソース、Settings→Actions→General の Workflow permissions）をユーザーに確認してもらう。リポジトリ設定の変更は勝手に行わずユーザーの判断を仰ぐ。

## 完了報告
- 反映した配信日範囲・新規曲数・新規動画数
- `data/` 差分（insertions/deletions、shifted song_id 数=0 であること）
- 各検証結果（pytest / build / test）
- 新バージョン番号
- main / release の push 結果とデプロイ conclusion・公開URL（https://miyatayuya.github.io/setlist-player/ ）
