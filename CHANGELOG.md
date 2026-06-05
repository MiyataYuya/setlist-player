# 変更履歴

このプロジェクトの注目すべき変更はこのファイルに記録されます。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づき、バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [Unreleased]

### Changed
- データパイプラインを Google スプレッドシートを「正」とする方式に移行 (`scraper/build_from_sheet.py`)
  - 曲名・アーティスト・タイムスタンプは手動管理されたシートのハイパーリンクから取得
  - シートの URL 列に埋め込まれた `youtube.com/watch?v=...&t=Ns` 形式のリンクから `video_id` と `start_seconds` を抽出
  - 削除/非公開動画（YouTube API でタイトル取得不可）は関連 performance ごと自動除外
  - データ件数: 動画 118 → 243、曲 1099 → 720、演奏 2380 → 3974
- 旧パイプライン (`fetch_setlists.py` → `parse_setlists.py` → `build_app_data.py` → `enrich_songs.py`) は当面残置するが、アプリ用 CSV の生成元としては不使用

[Unreleased]: https://github.com/miyatayuya/setlist-player/compare/main...HEAD
