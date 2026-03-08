# カラオケ配信アプリ 仕様書

## 1. Decision Records (ADR)

### ADR-001: YouTube動画のダウンロードは行わない

**Status:** Accepted

**Context:**
対象の音源はYouTubeカラオケ配信内の歌唱部分である。
音声ファイルのダウンロードや再配布は権利・規約上のリスクがある。

**Decision:**
音源は保存せず、YouTube動画を埋め込み再生する方式を採用する。

**Consequences:**

メリット:
- YouTube利用規約との衝突を避けやすい
- ストレージ不要
- 更新管理が不要

デメリット:
- オフライン再生不可
- 広告が表示される可能性
- YouTubeプレイヤー制約に依存

---

### ADR-002: 曲の単位は「動画」ではなく「動画内の区間」

**Status:** Accepted

**Context:**
1つの配信動画に複数の曲が含まれている。
YouTubeプレイリストは動画単位であり、今回の用途（曲単位管理）に適さない。

**Decision:**
データモデルを以下のように定義する。

```
Song = YouTubeVideo + TimeRange
```

**Consequences:**

メリット:
- 曲単位の検索
- 曲単位プレイリスト
- 歌唱回比較

デメリット:
- endTime管理が必要
- 動画再生制御が必要

---

### ADR-003: プレイリストはアプリ側で管理

**Status:** Accepted

**Context:**
YouTubeプレイリストは動画単位であり、動画内の特定区間を扱えない。

**Decision:**
プレイリストは以下として管理する。

```
Playlist
  id
  name
  songIds[]
```

**Consequences:**

メリット:
- 曲単位プレイリスト
- シャッフル
- お気に入り

デメリット:
- 自前DBが必要

---

### ADR-004: シャッフル再生はアプリ側で実装

**Status:** Accepted

**Context:**
YouTubeのシャッフルは動画単位。

**Decision:**
再生キューをアプリで生成する。

```
Queue
  songIds[]
  currentIndex
  shuffle
  repeat
```

**Consequences:**
Spotify型の再生体験を実現可能。

---

## 2. Requirements Specification

### 1. System Overview

YouTubeカラオケ配信の歌唱部分を音楽アプリ風UIで再生する個人用アプリ。
音源は保持せず、YouTube埋め込みプレイヤーを使用する。

### 2. Functional Requirements

#### 2.1 曲管理

CSVから曲情報を読み込む。

```
Song
  id
  title
  videoId
  startSeconds
  endSeconds
  streamTitle
  streamDate
  thumbnailUrl
  tags[]
  favorite
```

#### 2.2 曲一覧

機能:
- 曲一覧表示
- 曲検索
- ソート
- タグフィルタ

#### 2.3 再生

曲を選択すると

```
YouTube Player
start = startSeconds
```

で再生開始。

再生制御:
- Play
- Pause
- Next
- Previous
- Seek

#### 2.4 自動曲送り

```
if currentTime >= endSeconds
    play next song
```

#### 2.5 プレイリスト

ユーザーがプレイリストを作成できる。

```
Playlist
  id
  name
  songIds[]
```

機能:
- 作成
- 削除
- 並び替え
- 再生

#### 2.6 シャッフル再生

```
shuffle(songIds)
```

#### 2.7 お気に入り

```
Song.favorite = true
```

#### 2.8 再生履歴

```
History
  songId
  playedAt
```

### 3. Non Functional Requirements

**パフォーマンス:**
- 曲一覧表示 < 200ms
- 再生開始 < 1秒

**データ管理:**
- データソース: `songs.csv`
- 将来的に `SQLite` へ移行可能

**UI要件:**
- 音楽アプリ型UI
- 画面:
  - Home
  - Library
  - Playlist
  - Player
  - Search

## 3. Initial MVP

最初の実装範囲:
- CSV読み込み
- 曲一覧
- 曲再生
- Next / Prev
- お気に入り
- シャッフル

## 4. Future Extensions

可能な拡張:
- 曲タグ
- 歌唱ランキング
- 配信ごとの閲覧
- 同じ曲の歌い比べ
- AIによる自動タグ付け
