export default [
  { videoId: "v1", publishedAt: "2024-01-15T19:00:00Z", title: "【歌枠】新年歌配信！", channelTitle: "テスト", duration: "PT1H", viewCount: 10000, likeCount: 500 },
  { videoId: "v2", publishedAt: "2024-02-10T19:00:00Z", title: "singing stream #歌枠 #karaoke", channelTitle: "テスト", duration: "PT1H30M", viewCount: 20000, likeCount: 1000 },
  { videoId: "v3", publishedAt: "2024-03-05T19:00:00Z", title: "歌配信 - ミナミイズミ ch", channelTitle: "テスト", duration: "PT2H", viewCount: 30000, likeCount: 1500 },
  // v4 は v3 と同じJST日（2024-03-06）＝「同じ日に2配信」のケース
  { videoId: "v4", publishedAt: "2024-03-05T22:00:00Z", title: "【コラボ】二人で歌枠", channelTitle: "テスト", duration: "PT1H", viewCount: 5000, likeCount: 300 },
  // v5 は同月の別日＝「1か月に複数の配信日」のケース
  { videoId: "v5", publishedAt: "2024-03-20T19:00:00Z", title: "【歌枠】春の歌配信", channelTitle: "テスト", duration: "PT1H", viewCount: 8000, likeCount: 400 },
];
