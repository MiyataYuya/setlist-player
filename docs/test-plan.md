# テスト計画書

## 1. テスト方針

### テストフレームワーク
- **単体テスト / コンポーネントテスト**: Vitest + React Testing Library
- **E2Eテスト**: Playwright

### テストレベル

| レベル | 対象 | ツール |
|--------|------|--------|
| Unit | Store, Hook, データ変換 | Vitest |
| Component | UIコンポーネント単体 | Vitest + Testing Library |
| Integration | ページ単位のユーザー操作 | Vitest + Testing Library |
| E2E | 画面遷移を含む主要フロー | Playwright |

---

## 2. 単体テスト

### 2.1 playerStore (`stores/playerStore.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | playSong(song, queue) | queue/currentIndex/isPlayingが正しくセットされる |
| 2 | playSong(song) キューなし | queue=[song], currentIndex=0 |
| 3 | playNext() 通常 | currentIndex が +1 される |
| 4 | playNext() キュー末尾 + repeat=false | isPlaying=false になる |
| 5 | playNext() キュー末尾 + repeat=true | currentIndex=0 に戻る |
| 6 | playNext() shuffle=true | currentIndex がランダムに変わる |
| 7 | playNext() 空キュー | 何も起きない |
| 8 | playPrev() 通常 | currentIndex が -1 される |
| 9 | playPrev() 先頭 | キュー末尾に戻る |
| 10 | togglePlay() | isPlaying が反転する |
| 11 | toggleShuffle() | isShuffle が反転する |
| 12 | toggleRepeat() | isRepeat が反転する |
| 13 | useCurrentSong() | currentIndex>=0 なら該当曲、-1 なら undefined |

### 2.2 libraryStore (`stores/libraryStore.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | toggleFavorite(id) 追加 | favoriteIds に id が追加される |
| 2 | toggleFavorite(id) 解除 | favoriteIds から id が除去される |
| 3 | isFavorite(id) | 登録済みなら true、未登録なら false |
| 4 | setSearchQuery(q) | searchQuery が更新される |
| 5 | localStorage永続化 | favoriteIds が localStorage に保存・復元される |

### 2.3 useFilteredSongs (`hooks/useFilteredSongs.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 空クエリ | 全パフォーマンスを返す |
| 2 | タイトルで検索 | タイトルに一致する曲のみ返す |
| 3 | アーティストで検索 | アーティストに一致する曲のみ返す |
| 4 | 大文字小文字 | "bump" で "BUMP OF CHICKEN" がヒット |
| 5 | 一致なし | 空配列を返す |

### 2.4 データ変換 (`data/songs.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | songPerformances 結合 | Performance と Song が songId で正しく結合される |
| 2 | 存在しない songId | title/artist が空文字になる |
| 3 | thumbnailUrl 生成 | `https://img.youtube.com/vi/{videoId}/mqdefault.jpg` 形式 |
| 4 | getUniqueSongs() | playCount 降順でユニーク曲を返す |

### 2.5 Vite CSVプラグイン (`vite.config.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | songs CSV → camelCase変換 | song_id → songId に変換される |
| 2 | performances CSV → 数値変換 | startSeconds/endSeconds が number 型 |
| 3 | 空行フィルタ | performance_id が空の行は除外される |

---

## 3. コンポーネントテスト

### 3.1 SongCard (`components/songs/SongCard.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 曲名表示 | title が表示される |
| 2 | アーティスト+日付表示 | "アーティスト ・ YYYY/MM/DD" 形式 |
| 3 | アーティスト空 | 日付のみ表示 |
| 4 | クリックで再生 | playSong が song と queue で呼ばれる |
| 5 | お気に入りボタン | FavoriteButton が performanceId 付きで表示 |

### 3.2 SearchBar (`components/songs/SearchBar.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 入力 | setSearchQuery が呼ばれる |
| 2 | プレースホルダー | "曲名・アーティストで検索" が表示 |

### 3.3 FavoriteButton (`components/common/FavoriteButton.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 未お気に入り | 空のハートアイコン |
| 2 | お気に入り済み | 塗りつぶしハートアイコン |
| 3 | クリック | toggleFavorite が呼ばれる |

### 3.4 MiniPlayer (`components/layout/MiniPlayer.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 曲未選択 | 非表示 |
| 2 | /player ページ | 非表示 |
| 3 | 曲再生中 | 曲名・アーティスト・一時停止ボタン表示 |
| 4 | 一時停止中 | 再生ボタン表示 |
| 5 | クリック | /player に遷移 |
| 6 | 再生/一時停止ボタン | togglePlay 呼出、イベント伝播しない |
| 7 | 次へボタン | playNext 呼出、イベント伝播しない |

### 3.5 PlayerControls (`components/player/PlayerControls.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 再生/一時停止ボタン | togglePlay が呼ばれる |
| 2 | 次へ/前へボタン | playNext/playPrev が呼ばれる |
| 3 | シャッフルボタン | toggleShuffle が呼ばれる |
| 4 | リピートボタン | toggleRepeat が呼ばれる |

### 3.6 BottomNav (`components/layout/BottomNav.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 3タブ表示 | ホーム、検索、ライブラリ |
| 2 | タブクリック | 対応ルートに遷移 |
| 3 | アクティブ状態 | 現在のルートに対応するタブがアクティブ |

---

## 4. 統合テスト (ページレベル)

### 4.1 HomePage

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 初期表示 | パフォーマンス数とシャッフルボタンが表示 |
| 2 | 曲一覧 | 最大50件の曲が表示される |
| 3 | シャッフル再生 | shuffle=true になり、ランダムな曲が再生開始 |

### 4.2 SearchPage

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 初期表示 | 検索バーと「曲が見つかりません」表示 |
| 2 | 検索入力 | 件数と結果リストが表示される |
| 3 | 検索結果から再生 | 曲クリックで再生開始 |

### 4.3 LibraryPage

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | お気に入り0件 | 空状態メッセージ表示 |
| 2 | お気に入りあり | お気に入り曲のみ表示 |

---

## 5. E2Eテスト (Playwright)

### 5.1 曲の閲覧と再生

```
1. ホーム画面を開く
2. 曲一覧が表示されることを確認（曲名・アーティスト・日付）
3. 曲をクリック
4. MiniPlayer に曲名が表示されることを確認
5. MiniPlayer をクリック → プレイヤー画面に遷移
6. YouTube埋め込みプレイヤーが表示されることを確認
7. 曲名・アーティスト・日付が表示されることを確認
```

### 5.2 検索して再生

```
1. 検索タブをクリック
2. 検索バーに "BUMP" と入力
3. 結果が1件以上表示されることを確認
4. 件数表示が正しいことを確認
5. 結果の曲をクリック → 再生開始
```

### 5.3 お気に入り操作

```
1. ホーム画面で曲のハートボタンをクリック
2. ライブラリタブに遷移
3. お気に入り曲が表示されることを確認
4. ハートボタンを再クリック → お気に入り解除
5. 「お気に入りに追加された曲がありません」表示を確認
```

### 5.4 シャッフル再生

```
1. ホーム画面の「シャッフル再生」ボタンをクリック
2. MiniPlayer に曲が表示されることを確認
3. 次へボタンをクリック
4. 別の曲に切り替わることを確認
```

### 5.5 画面遷移

```
1. ホーム → 検索 → ライブラリ → ホーム とタブ遷移
2. 各ページが正しく表示されることを確認
3. 再生中にページ遷移しても MiniPlayer が維持されることを確認
4. /player 画面では MiniPlayer が非表示であることを確認
```

---

## 6. テスト優先度

### P0 (必須 — コア機能)
- playerStore の playSong / playNext / playPrev
- libraryStore の toggleFavorite + localStorage永続化
- データ結合ロジック（songs.ts の songPerformances）
- E2E: 曲の閲覧と再生

### P1 (重要 — 主要ユーザーフロー)
- useFilteredSongs の検索フィルタ
- MiniPlayer の表示/非表示制御
- E2E: 検索して再生、お気に入り操作

### P2 (推奨 — 品質向上)
- 各コンポーネントの表示テスト
- シャッフル/リピートの境界ケース
- BottomNav のルーティング
- Vite CSVプラグインの変換
