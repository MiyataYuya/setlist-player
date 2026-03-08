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

### 2.4 useDebouncedValue (`hooks/useDebouncedValue.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 初期値 | 即座に初期値を返す |
| 2 | 遅延反映 | delayMs後に新しい値が反映される |
| 3 | 連続更新 | 最後の値のみが反映される（中間値はスキップ） |

### 2.5 useInfiniteScroll (`hooks/useInfiniteScroll.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 初期表示 | 最初の50件のみ返す |
| 2 | hasMore | items数 > visibleCount なら true |
| 3 | items変更時リセット | visibleCount が PAGE_SIZE に戻る |

### 2.6 データ変換 (`data/songs.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | songPerformances 結合 | Performance と Song が songId で正しく結合される |
| 2 | 存在しない songId | title/artist が空文字になる |
| 3 | thumbnailUrl 生成 | `https://img.youtube.com/vi/{videoId}/mqdefault.jpg` 形式 |
| 4 | getUniqueSongs() | playCount 降順でユニーク曲を返す |
| 5 | streams グルーピング | videoId ごとに正しくグループ化される |
| 6 | streams ソート | 配信日時の降順でソートされる |
| 7 | streams.title | Video データから title が設定される |
| 8 | streams.songCount | グループ内のパフォーマンス数と一致する |
| 9 | streams.viewCount/likeCount | Video データから数値が設定される |

### 2.7 Vite CSVプラグイン (`vite.config.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | songs CSV → camelCase変換 | song_id → songId に変換される |
| 2 | performances CSV → 数値変換 | startSeconds/endSeconds が number 型 |
| 3 | videos CSV → camelCase変換 | video_id → videoId, view_count → viewCount (number) |
| 4 | 空行フィルタ | ID が空の行は除外される |

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

### 3.2 StreamCard (`components/songs/StreamCard.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | タイトル表示 | 配信タイトル（クリーニング済み）が表示される |
| 2 | タイトル空 | 日付にフォールバック |
| 3 | 日付と曲数 | "YYYY/MM/DD ・ N 曲" 形式で表示 |
| 4 | 展開/折りたたみ | クリックで曲一覧が表示/非表示 |
| 5 | 再生ボタン | 配信の最初の曲から再生開始、イベント伝播しない |
| 6 | タイトルクリーニング | 【...】、ハッシュタグ、定型句が除去される |

### 3.3 SearchBar (`components/songs/SearchBar.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 入力 | ローカルstateが即座に更新される |
| 2 | デバウンス | 300ms後にsetSearchQueryが呼ばれる |
| 3 | 連続入力 | 最終値のみstoreに反映される |
| 4 | プレースホルダー | "曲名・アーティストで検索" が表示 |

### 3.4 SongList (`components/songs/SongList.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 空配列 | "曲が見つかりません" 表示 |
| 2 | 通常表示 | 無限スクロール（初期50件） |
| 3 | nested=true | 全件表示、インデント付き背景色 |

### 3.5 FavoriteButton (`components/common/FavoriteButton.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 未お気に入り | 空のハートアイコン |
| 2 | お気に入り済み | 塗りつぶしハートアイコン |
| 3 | クリック | toggleFavorite が呼ばれる |

### 3.6 MiniPlayer (`components/layout/MiniPlayer.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 曲未選択 | 非表示 |
| 2 | /player ページ | 非表示 |
| 3 | 曲再生中 | 曲名・アーティスト・一時停止ボタン表示 |
| 4 | 一時停止中 | 再生ボタン表示 |
| 5 | クリック | /player に遷移 |
| 6 | 再生/一時停止ボタン | togglePlay 呼出、イベント伝播しない |
| 7 | 次へボタン | playNext 呼出、イベント伝播しない |

### 3.7 PlayerControls (`components/player/PlayerControls.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 再生/一時停止ボタン | togglePlay が呼ばれる |
| 2 | 次へ/前へボタン | playNext/playPrev が呼ばれる |
| 3 | シャッフルボタン | toggleShuffle が呼ばれる |
| 4 | リピートボタン | toggleRepeat が呼ばれる |

### 3.8 BottomNav (`components/layout/BottomNav.tsx`)

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
| 1 | 初期表示 | 曲数とシャッフルボタンが表示、「曲」チップがアクティブ |
| 2 | 曲モード | 配信日時降順で曲一覧表示、無限スクロール対応 |
| 3 | 配信モード | 「配信」チップで切り替え、配信タイトル・日付・曲数が表示 |
| 4 | 配信展開 | 配信カードクリックで曲一覧が展開/折りたたみ |
| 5 | 配信再生 | ▶ボタンで配信の最初の曲から再生開始 |
| 6 | シャッフル再生 | shuffle=true になり、ランダムな曲が再生開始 |
| 7 | カウント切替 | 曲モード: "N 曲"、配信モード: "N 配信" |

### 4.2 SearchPage

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 初期表示 | 検索バーと「曲が見つかりません」表示 |
| 2 | 検索入力 | デバウンス後に件数と結果リストが表示される |
| 3 | 検索結果の無限スクロール | 結果が50件超の場合、スクロールで追加読み込み |
| 4 | 検索結果から再生 | 曲クリックで再生開始 |

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
2. 「曲」チップがアクティブ、曲一覧が配信日時降順で表示されることを確認
3. 曲名・アーティスト・日付が表示されることを確認
4. 曲をクリック
5. MiniPlayer に曲名が表示されることを確認
6. MiniPlayer をクリック → プレイヤー画面に遷移
7. YouTube埋め込みプレイヤーが表示されることを確認
8. 曲名・アーティスト・日付が表示されることを確認
```

### 5.2 配信モードの閲覧と再生

```
1. ホーム画面で「配信」チップをクリック
2. "N 配信" のカウントに切り替わることを確認
3. 配信タイトル・日付・曲数が表示されることを確認
4. 配信カードをクリック → 曲一覧が展開
5. 展開内の曲をクリック → 再生開始
6. ▶ボタンをクリック → 配信の最初の曲から再生開始
7. 再度クリック → 折りたたみ
```

### 5.3 無限スクロール

```
1. ホーム画面で曲一覧を下にスクロール
2. 50件目を超えたあたりで追加の曲が読み込まれることを確認
3. スクロールを繰り返し、100件以上表示されることを確認
```

### 5.4 検索して再生

```
1. 検索タブをクリック
2. 検索バーに "BUMP" と入力
3. 300ms のデバウンス後に結果が表示されることを確認
4. 件数表示が正しいことを確認
5. 結果の曲をクリック → 再生開始
```

### 5.5 お気に入り操作

```
1. ホーム画面で曲のハートボタンをクリック
2. ライブラリタブに遷移
3. お気に入り曲が表示されることを確認
4. ハートボタンを再クリック → お気に入り解除
5. 「お気に入りに追加された曲がありません」表示を確認
```

### 5.6 シャッフル再生

```
1. ホーム画面の「シャッフル再生」ボタンをクリック
2. MiniPlayer に曲が表示されることを確認
3. 次へボタンをクリック
4. 別の曲に切り替わることを確認
```

### 5.7 画面遷移と再生維持

```
1. ホーム画面で曲をクリック → 再生開始
2. ホーム → 検索 → ライブラリ → ホーム とタブ遷移
3. 各ページが正しく表示されることを確認
4. 再生中にページ遷移しても MiniPlayer が維持されることを確認
5. /player 画面では MiniPlayer が非表示であることを確認
6. /player 以外のページでも音声再生が継続することを確認
```

---

## 6. テスト優先度

### P0 (必須 — コア機能)
- playerStore の playSong / playNext / playPrev
- libraryStore の toggleFavorite + localStorage永続化
- データ結合ロジック（songs.ts の songPerformances, streams）
- E2E: 曲の閲覧と再生
- E2E: 画面遷移と再生維持

### P1 (重要 — 主要ユーザーフロー)
- useFilteredSongs の検索フィルタ
- useDebouncedValue のデバウンス動作
- useInfiniteScroll の無限スクロール
- MiniPlayer の表示/非表示制御
- StreamCard の展開/折りたたみ・タイトルクリーニング
- E2E: 配信モード、検索して再生、お気に入り操作

### P2 (推奨 — 品質向上)
- 各コンポーネントの表示テスト
- シャッフル/リピートの境界ケース
- BottomNav のルーティング
- Vite CSVプラグインの変換（songs, performances, videos）
- SearchBar のデバウンス統合テスト
