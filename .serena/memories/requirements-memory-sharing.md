# 思い出の記録と共有 - 要件定義

## 概要
旅行中・旅行後の思い出を記録し、メンバーや許可されたユーザーと共有する機能。

## 主要機能

### 1. コンテンツタイプ
- **写真**: 圧縮あり、Base64でDB保存 → 将来的にクラウド移行
- **動画**: 圧縮あり、Base64でDB保存 → 将来的にクラウド移行
- **テキスト**: メモ・感想・レビュー
- **位置情報**: GPS座標 + 住所、手動選択 or アクティビティから自動取得
- **評価**: 5段階(0.5刻み)、場所・アクティビティ・旅行全体に対応
- **タグ**: ユーザー作成 + システム提案(#絶景 #グルメ #温泉など)

### 2. アルバム機能
- **自動作成**: 旅程ごとにアルバムを自動生成
- **並び順**: 手動ソート
- **複数アルバム**: 同じコンテンツを複数アルバムに参照可能
- **保存容量**: 初期制限なし、将来的にアカウントベース制限

### 3. 記録タイミング
- **旅行中**: リアルタイム記録
- **旅行後**: 後からまとめて記録

### 4. アクティビティ連携
- **直接リンク**: 旅程画面から直接思い出を記録
- **事後リンク**: 思い出画面から既存のアクティビティに紐付け
- **表示**: 思い出は旅程画面に表示しない(思い出セクションのみ)

### 5. 共有機能
- **共有方法**: URLのみ(SNSボタンなし)
- **プライバシー**: メンバー/許可ユーザーのみ(公開リンクなし)
- **設定**: パスワード任意、有効期限設定可能、プレビュー機能
- **管理**: 共有リンク一覧、取り消し、アクセスログ(ユーザー・タイムスタンプ・IP)

### 6. 編集・履歴
- **編集**: いつでも可能
- **履歴**: 誰が・いつ・何を変更したか記録

### 7. 検索・フィルター
- **検索**: キーワード・日付・場所・タグ
- **タグ検索**: AND/OR演算
- **フィルター**: 日付範囲・場所・タグ・旅行

## データベース設計

### albums テーブル
```sql
CREATE TABLE albums (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### memories テーブル
```sql
CREATE TABLE memories (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id),
  activity_id UUID REFERENCES activities(id),
  user_id UUID NOT NULL,
  title VARCHAR(255),
  description TEXT,
  recorded_at TIMESTAMP,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address VARCHAR(500),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### memory_media テーブル
```sql
CREATE TABLE memory_media (
  id UUID PRIMARY KEY,
  memory_id UUID REFERENCES memories(id),
  media_type ENUM('photo', 'video'),
  file_data TEXT, -- Base64
  thumbnail_data TEXT,
  file_size INTEGER,
  created_at TIMESTAMP
);
```

### memory_tags, album_memories, ratings, shared_links, shared_link_access, memory_history テーブルも定義

## 技術実装

### 状態管理(Zustand)
```typescript
interface MemoryState {
  albums: Album[];
  memories: Memory[];
  currentAlbum: Album | null;
  filters: MemoryFilter;
  searchQuery: string;
}
```

### 主要コンポーネント
- AlbumList, MemoryGrid, MemoryDetail, MemoryForm
- MediaUploader, LocationPicker, RatingInput, TagInput
- ShareDialog, ShareLinkManager, MemoryHistory
- SearchBar, FilterPanel

## 将来的な拡張
- クラウドストレージ移行(AWS S3 / Cloudinary)
- スライドショー機能
- コラージュ作成
- フォトブック生成

## 関連ファイル
- 詳細: docs/requirements/04-memory-sharing.md (685行)