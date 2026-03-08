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
| 1 | playSong(song, queue) | queue/currentIndex/isPlaying/isPlayerOpenが正しくセットされる |
| 2 | playSong(song) キューなし | queue=[song], currentIndex=0, isPlayerOpen=true |
| 3 | playSong() 履歴追加 | historyStore.addToHistory が呼ばれる |
| 4 | playNext() 通常 | currentIndex が +1 される |
| 5 | playNext() キュー末尾 + repeat=false | isPlaying=false になる |
| 6 | playNext() キュー末尾 + repeat=true | currentIndex=0 に戻る |
| 7 | playNext() 空キュー | 何も起きない |
| 8 | playPrev() 通常 | currentIndex が -1 される |
| 9 | playPrev() 先頭 | キュー末尾に戻る |
| 10 | togglePlay() | isPlaying が反転する |
| 11 | toggleRepeat() | isRepeat が反転・復元する |
| 12 | shuffleQueue() | キューがシャッフルされ、現在の曲が先頭(index=0)に来る。全曲が含まれる |
| 13 | shuffleQueue() 連続 | 何度押しても現在の曲が先頭、全曲が含まれる |
| 14 | shuffleQueue() 空キュー | 何も起きない |
| 15 | shuffleQueue() 1曲 | キューが変わらない |
| 16 | openPlayer() | isPlayerOpen=true になる |
| 17 | openPlayer() 空キュー | isPlayerOpen=false のまま |
| 18 | closePlayer() | isPlayerOpen=false になる |
| 19 | playSong() プレイヤーオープン | isPlayerOpen=true になる |
| 20 | useCurrentSong() | currentIndex>=0 なら該当曲、-1 なら undefined |
| 21 | getPlayerRef() / setPlayerRef() | モジュールスコープでYouTube Player参照を管理 |

### 2.2 libraryStore (`stores/libraryStore.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | toggleFavorite(id) 追加 | favoriteIds に id が追加される |
| 2 | toggleFavorite(id) 解除 | favoriteIds から id が除去される |
| 3 | isFavorite(id) | 登録済みなら true、未登録なら false |
| 4 | setSearchQuery(q) | searchQuery が更新される |
| 5 | localStorage永続化 | favoriteIds が localStorage に保存・復元される |

### 2.3 historyStore (`stores/historyStore.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | addToHistory(id) | 先頭に追加される |
| 2 | addToHistory() 上限 | MAX_HISTORY(200)件を超えると古いものが削除される |
| 3 | clearHistory() | 履歴が空になる |
| 4 | localStorage永続化 | history が localStorage に保存・復元される |

### 2.4 tagStore (`stores/tagStore.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | addTag(tag) | tags に追加される |
| 2 | addTag() 重複 | 同じタグは追加されない |
| 3 | removeTag(tag) | tags から削除、全songTagsからも削除される |
| 4 | assignTag(performanceId, tag) | songTags[id] にタグが追加される |
| 5 | unassignTag(performanceId, tag) | songTags[id] からタグが除去される |
| 6 | localStorage永続化 | tags/songTags が localStorage に保存・復元される |

### 2.5 playlistStore (`stores/playlistStore.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | createPlaylist(name) | 新しいプレイリストが作成される |
| 2 | deletePlaylist(id) | プレイリストが削除される |
| 3 | addToPlaylist(id, perfId) | 曲が追加される |
| 4 | removeFromPlaylist(id, perfId) | 曲が除去される |
| 5 | localStorage永続化 | プレイリストが localStorage に保存・復元される |

### 2.6 useFilteredSongs (`hooks/useFilteredSongs.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 空クエリ | 全パフォーマンスを返す |
| 2 | タイトルで検索 | タイトルに一致する曲のみ返す |
| 3 | アーティストで検索 | アーティストに一致する曲のみ返す |
| 4 | 大文字小文字 | "bump" で "BUMP OF CHICKEN" がヒット |
| 5 | 一致なし | 空配列を返す |

### 2.7 useDebouncedValue (`hooks/useDebouncedValue.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 初期値 | 即座に初期値を返す |
| 2 | 遅延反映 | delayMs後に新しい値が反映される |
| 3 | 連続更新 | 最後の値のみが反映される（中間値はスキップ） |

### 2.8 useInfiniteScroll (`hooks/useInfiniteScroll.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 初期表示 | 最初の50件のみ返す |
| 2 | hasMore | items数 > visibleCount なら true |
| 3 | items変更時リセット | visibleCount が PAGE_SIZE に戻る |

### 2.9 useAutoAdvance (`hooks/useAutoAdvance.ts`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | endSeconds到達 | playNext() が呼ばれる |
| 2 | 再生中のみ | isPlaying=false ではポーリングしない |
| 3 | playerRef未設定 | エラーにならない |

### 2.10 データ変換 (`data/songs.ts`)

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
| 2 | プレイヤーオープン中 | 非表示（isPlayerOpen=true） |
| 3 | 曲再生中 | 曲名・アーティスト・一時停止ボタン表示 |
| 4 | 一時停止中 | 再生ボタン表示 |
| 5 | クリック | openPlayer() が呼ばれる |
| 6 | 再生/一時停止ボタン | togglePlay 呼出、イベント伝播しない |
| 7 | 次へボタン | playNext 呼出、イベント伝播しない |

### 3.7 PlayerControls (`components/player/PlayerControls.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 再生/一時停止ボタン | togglePlay が呼ばれる |
| 2 | 次へ/前へボタン | playNext/playPrev が呼ばれる |
| 3 | シャッフルボタン | shuffleQueue が呼ばれる（トグルではなく毎回並び替え） |
| 4 | リピートボタン | toggleRepeat が呼ばれる |

### 3.8 SeekBar (`components/player/SeekBar.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 曲未選択 | 非表示 |
| 2 | 時間表示 | 現在位置と曲の長さが "m:ss" 形式 |
| 3 | スライダー操作 | ドラッグ中はポーリング停止、離すとseekTo呼び出し |
| 4 | 曲変更時 | position が 0 にリセットされる |

### 3.9 PlayerScreen (`components/player/PlayerScreen.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 曲未選択 | "曲を選択してください" 表示 |
| 2 | 曲情報表示 | 曲名・アーティスト・日付が表示される |
| 3 | 閉じるボタン | KeyboardArrowDownIcon が表示される |
| 4 | お気に入り/タグボタン | 表示される |
| 5 | キュー表示 | 次に再生される曲がリスト表示される |
| 6 | キュー内の曲タップ | playSong が呼ばれてその曲にジャンプ |
| 7 | キュー空 | キューセクションが非表示 |

### 3.10 TagManager (`components/songs/TagManager.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | タグ一覧表示 | 全タグがChipで表示される |
| 2 | タグ割当済み | filled variant で表示 |
| 3 | タグ未割当 | outlined variant で表示 |
| 4 | タグクリック | assign/unassign が切り替わる |
| 5 | 新しいタグ追加 | addTag + assignTag が呼ばれる |

### 3.11 BottomNav (`components/layout/BottomNav.tsx`)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 3タブ表示 | ホーム、検索、ライブラリ |
| 2 | タブクリック | 対応ルートに遷移 |
| 3 | アクティブ状態 | 現在のルートに対応するタブがアクティブ |
| 4 | プレイヤーオープン中にタブクリック | closePlayer() が呼ばれてから遷移 |

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
| 6 | シャッフル再生 | ランダムな曲が再生開始、キューがシャッフルされる |
| 7 | カウント切替 | 曲モード: "N 曲"、配信モード: "N 配信" |
| 8 | ソート | ソートメニューで並び順を変更できる |

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
| 3 | 再生履歴表示 | 最近再生した曲が表示される |
| 4 | プレイリスト表示 | 作成したプレイリストが表示される |

### 4.4 PlayerScreen (ページレベル)

| # | テストケース | 確認内容 |
|---|-------------|---------|
| 1 | 曲再生中の表示 | 動画・曲情報・シークバー・コントロール・キューが表示 |
| 2 | キューからの曲選択 | タップで再生曲が切り替わる |
| 3 | 閉じるボタンで戻る | オーバーレイがスライドダウン、再生は継続 |

---

## 5. E2Eテスト (Playwright)

### 5.1 曲の閲覧と再生

```
1. ホーム画面を開く
2. 「曲」チップがアクティブ、曲一覧が配信日時降順で表示されることを確認
3. 曲名・アーティスト・日付が表示されることを確認
4. 曲をクリック
5. 再生画面オーバーレイがスライドアップで表示されることを確認
6. YouTube埋め込みプレイヤーが表示されることを確認
7. 曲名・アーティスト・日付が表示されることを確認
8. シークバーが表示され、時間が更新されることを確認
9. キュー（次に再生）が表示されることを確認
10. BottomNav（ホーム・検索・ライブラリ）が常に表示されていることを確認
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
2. 再生画面オーバーレイが開き、曲が表示されることを確認
3. 次へボタンをクリック
4. 別の曲に切り替わることを確認
5. シャッフルボタンを再度押す → キューが再シャッフルされることを確認
```

### 5.7 画面遷移アニメーションと再生維持

```
1. ホーム画面で曲をクリック → 再生画面がスライドアップ
2. 再生画面で BottomNav が表示されていることを確認
3. 検索タブをクリック → 再生画面がスライドダウン、検索画面がフェードイン
4. MiniPlayer が表示され再生中であることを確認
5. ライブラリタブをクリック → フェード遷移
6. ホームタブをクリック → フェード遷移
7. 各遷移で再生が途切れないことを確認
8. MiniPlayer をタップ → 再生画面がスライドアップ
9. 閉じるボタン（↓）をタップ → スライドダウン
10. ブラウザバックボタン → 再生画面が閉じることを確認
```

### 5.8 再生画面のナビゲーション

```
1. 曲を再生して再生画面を表示
2. 閉じるボタンをタップ → ホームに戻ることを確認
3. 再生が継続していることを確認（MiniPlayerに曲名表示）
4. MiniPlayerをタップ → 再度再生画面がスライドアップ
5. キュー内の曲をタップ → その曲に切り替わることを確認
6. BottomNavの検索タブをタップ → 再生画面が閉じ検索画面に遷移
```

### 5.9 自動曲送り（autoAdvance）

```
ケース1: 同一動画内の連続曲（gap=0）
1. 曲Aを再生開始（例: 手紙 拝啓 十五の君へ, index=0）
2. endSeconds - 5 にシーク
3. 5〜8秒待つ
4. 次の曲B（欲望に満ちた青年団, index=1）に自動遷移することを確認
5. isPlaying=true であることを確認

ケース2: 動画の最後の曲→別動画への遷移
1. 動画の最後の曲を再生（例: 諦めることを諦めたい, index=7, videoId=O8yf9_l-Imc）
2. endSeconds - 5 にシーク
3. 8〜12秒待つ
4. 別動画の曲（Flare, index=8, videoId=EwczGARgoVc）に遷移することを確認
5. YouTube Player が新しい動画を読み込んでいることを確認
6. isPlaying=true であることを確認

ケース3: 同一動画内の最後から2番目→最後の曲
1. 動画内の最後から2番目の曲を再生（例: アイロニー, index=6）
2. endSeconds - 5 にシーク
3. 5〜8秒待つ
4. 同一動画内の次の曲（諦めることを諦めたい, index=7）に遷移することを確認
5. isPlaying=true であることを確認

ケース4: 遷移中のstate=2(paused)無視
1. 曲を再生中に endSeconds - 3 にシーク
2. 自動遷移後、isPlaying が false にならないことを確認
3. onStateChange(2) が遷移中は無視され、再生が途切れないことを確認
```

### 5.10 タグ操作

```
1. プレイヤー画面でタグボタンをタップ
2. タグ管理ダイアログが表示されることを確認
3. 新しいタグを入力して追加
4. タグが曲に割り当てられることを確認
5. タグをタップで解除できることを確認
```

### 5.11 GitHub Pages SPA対応

```
1. 再生画面表示中にページをリロード
2. ホーム画面が表示されることを確認（再生画面はオーバーレイのため、リロードでリセットされる）
3. ホーム画面に直接アクセスできることを確認
```

---

## 6. テスト優先度

### P0 (必須 — コア機能)
- playerStore の playSong / playNext / playPrev / openPlayer / closePlayer
- **シャッフル: shuffleQueue（押すたびにキューをランダムに並べ替え、現在の曲を先頭に維持）**
- **リピート: キュー末尾での挙動（repeat ON/OFF）**
- **自動曲送り: 同一動画内の連続遷移、動画境界を跨ぐ遷移、遷移中のstate=2無視**
- playerRef のモジュールスコープ管理（getPlayerRef/setPlayerRef）
- libraryStore の toggleFavorite + localStorage永続化
- データ結合ロジック（songs.ts の songPerformances, streams）
- E2E: 曲の閲覧と再生
- E2E: 画面遷移アニメーションと再生維持
- E2E: 自動曲送り（全ケース）

### P1 (重要 — 主要ユーザーフロー)
- useFilteredSongs の検索フィルタ
- useDebouncedValue のデバウンス動作
- useInfiniteScroll の無限スクロール
- useAutoAdvance の自動曲送り
- SeekBar の再生位置表示・シーク操作
- PlayerScreen のキュー表示・閉じるボタンナビゲーション
- MiniPlayer の表示/非表示制御（isPlayerOpen連動）
- BottomNav のプレイヤーオープン中タブ切り替え
- StreamCard の展開/折りたたみ・タイトルクリーニング
- E2E: 配信モード、検索して再生、お気に入り操作、再生画面ナビゲーション

### P2 (推奨 — 品質向上)
- historyStore / tagStore / playlistStore の CRUD操作
- TagManager のUI操作
- 各コンポーネントの表示テスト
- BottomNav のルーティング
- Vite CSVプラグインの変換（songs, performances, videos）
- SearchBar のデバウンス統合テスト
- E2E: タグ操作、GitHub Pages SPA対応
