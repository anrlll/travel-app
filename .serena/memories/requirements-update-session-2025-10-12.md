# 要件定義更新セッション - 2025-10-12

## 作業概要

**日付**: 2025-10-12
**対象**: TravelApp 要件定義の修正
**トリガー**: 01-search-and-proposal.mdの内容変更に伴う影響範囲の修正

---

## 実施した変更

### 1. 01-search-and-proposal.mdの全面書き換え

#### 変更前
- **機能**: 旅行先の検索と提案（Web検索）
- **内容**: 
  - キーワード・地図からの検索
  - 観光地、ホテル、レストラン、天気情報の表示
  - お気に入り機能
  - 外部API使用（OpenTripMap、Foursquare、OpenWeatherMap）

#### 変更後
- **機能**: 旅程検索
- **内容**:
  - **作成済みの旅程を検索する機能**
  - 検索対象: タイトル、目的地名、日付範囲、タグ、ステータス
  - フィルタリング: 複数条件の組み合わせ（日付+ステータス、目的地+予算など）
  - 並び替え: 作成日順、出発日順、タイトル順、更新日順
  - 表示形式: リスト、カード（サムネイル付き）、地図
  - データベース設計: itineraries、tags、itinerary_tagsテーブル

**変更理由**: ユーザーからの指摘「検索というのは、作成した旅程を検索できるという意味で合っていますか？」により、01の本来の意図が「旅程検索」であることが判明

---

### 2. 00-overview.mdの更新

#### 修正箇所
**主要機能1の説明**:
```markdown
# 変更前
### 1. 旅行先の検索と提案 ✅
- キーワード・地図からの検索
- 観光地、ホテル、レストラン、天気情報の表示
- お気に入り機能

# 変更後
### 1. 旅程検索 ✅
- 作成済み旅程の検索（タイトル・目的地・日付・タグ・ステータス）
- 複数条件フィルタリング
- リスト/カード/地図形式での表示
```

**外部APIリストの更新**:
- 「確定済みAPI」→「確定済みAPI（6種）」に変更
- Cloudinary、Resendを追加記載

---

### 3. 02-itinerary-management.mdへの新機能追加

#### 追加内容: セクション6「行きたい場所の登録・管理機能」

**背景**: 
01の変更により「観光地・レストラン検索機能」が消失。この機能は旅行計画に必須のため、02（旅程管理）の一部として実装することに決定。

**機能概要**:
ユーザーが行きたいレストラン・観光地・ホテルなどを事前に登録し、リスト管理・検索・旅程への追加ができる機能。

#### 詳細仕様

##### 6.2 場所の登録方法

**1. 外部APIから検索して登録**
- **観光地検索**: OpenTripMap API
  - キーワード検索（例: 「東京タワー」）
  - カテゴリ検索（文化施設、自然景観、歴史的建造物）
  - 地図上から選択

- **レストラン検索**: Foursquare Places API
  - キーワード検索（例: 「築地寿司」）
  - ジャンル検索（和食、イタリアン、カフェ）
  - 料金帯・評価でフィルタリング

- 検索結果から「行きたい場所に追加」ボタンで登録

**2. 手動で登録**
- カスタム場所の追加
- 必須項目: 名称、カテゴリ（観光地/レストラン/ホテル/その他）
- オプション項目: 住所、座標、URL、メモ、写真、営業時間、料金

**3. 地図から登録**
- 地図をクリックしてピンを立てる
- 座標と住所を自動取得
- 場所情報を入力して登録

##### 6.3 登録場所の情報

保存する情報:
- 名称（必須）
- カテゴリ（必須）
- 住所、座標（緯度・経度）
- 説明、URL
- 写真（複数可）
- 営業時間、料金
- 評価（星5段階）
- タグ（カスタムタグ）
- 外部API情報（取得元とID）

##### 6.4 登録場所の検索・フィルタリング

**検索機能**:
- キーワード検索: 名称・住所・メモで検索
- カテゴリ検索: 観光地/レストラン/ホテル等で絞り込み
- タグ検索: 複数タグでAND/OR検索
- 場所検索: 地域・都市で絞り込み

**フィルタリング**:
- 料金帯
- 評価（星の数）
- カテゴリ（複数選択可能）

**並び替え**:
- 登録日順（新しい順/古い順）
- 名前順（あいうえお順/ABC順）
- 評価順（高評価順）

##### 6.5 登録場所の表示形式

- **リスト表示**: カード形式で一覧表示
- **地図表示**: 登録した場所を地図上にピン表示、カテゴリ別に色分け
- 表示切り替えボタン

##### 6.6 旅程への追加

**方法1: 「旅程に追加」ボタン**
- 場所詳細画面から「旅程に追加」ボタンをクリック
- 旅程選択（複数旅程がある場合）
- 日付・時刻指定
- 場所情報が自動的にアクティビティに反映

**方法2: ドラッグ&ドロップ**
- 登録場所リストから旅程編集画面へドラッグ
- カレンダー上の日付にドロップ
- アクティビティとして追加

**方法3: 旅程編集画面から選択**
- 旅程編集中に「登録場所から追加」ボタン
- 登録場所リストが表示される
- 場所を選択してアクティビティ作成

##### 6.8 データベース設計

**saved_places（行きたい場所）**
```sql
CREATE TABLE saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  address VARCHAR(500),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  description TEXT,
  url VARCHAR(500),
  opening_hours TEXT,
  price_range VARCHAR(100),
  rating DECIMAL(2,1),
  external_api_source VARCHAR(50),
  external_api_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);
```

**saved_place_photos（場所の写真）**
```sql
CREATE TABLE saved_place_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_place_id UUID NOT NULL REFERENCES saved_places(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_saved_place_id (saved_place_id)
);
```

**saved_place_tags（場所のタグ）**
```sql
CREATE TABLE saved_place_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_place_id UUID NOT NULL REFERENCES saved_places(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,

  INDEX idx_saved_place_id (saved_place_id),
  INDEX idx_tag_name (tag_name)
);
```

#### セクション7の変更

**7.1 作成方法** を以下のように更新:

```markdown
1. ✅ **手動で1つずつ追加**
2. ✅ **登録場所から追加**（NEW）
   - 「行きたい場所」リストから選択
   - 「旅程に追加」ボタン
   - 旅程選択、日付・時刻指定
3. ✅ **ドラッグ&ドロップ**
   - 登録場所リストから旅程へドラッグ
```

#### セクション番号の再調整

変更により以下のセクション番号を修正:
- セクション7: 旅程の作成・編集方法
- セクション8: テンプレート機能
- セクション9: 旅程の表示形式
- セクション10: 他機能との連携
- セクション11: データの保存・同期
- セクション12: 旅程の出力・共有
- セクション13: 共同編集機能（将来実装）
- セクション14: データベース設計
- セクション15: フロントエンド実装
- セクション16: 受け入れ基準
- セクション17: 関連ドキュメント

#### フロントエンド実装の更新

**15.1 コンポーネント設計**に追加:

```typescript
// 行きたい場所管理
- SavedPlacesList: 登録場所一覧
- SavedPlaceCard: 場所カード
- SavedPlaceForm: 場所追加・編集フォーム
- PlaceSearch: 外部API検索（OpenTripMap/Foursquare）
- PlaceSearchResults: 検索結果表示
- SavedPlacesMap: 登録場所の地図表示
- SavedPlaceFilters: フィルター・並び替え
- AddToTripButton: 旅程に追加ボタン
```

**15.2 状態管理（Zustand）**に追加:

```typescript
interface TripState {
  // 既存
  trips: Trip[];
  currentTrip: Trip | null;
  // ... 省略

  // 新規追加
  savedPlaces: SavedPlace[];
  savedPlaceFilters: PlaceFilters;

  // Saved Places Actions
  fetchSavedPlaces: () => Promise<void>;
  addSavedPlace: (data: SavedPlaceData) => Promise<void>;
  updateSavedPlace: (id: string, data: SavedPlaceData) => Promise<void>;
  deleteSavedPlace: (id: string) => Promise<void>;
  searchPlaces: (query: string, source: 'opentripmap' | 'foursquare') => Promise<PlaceResult[]>;
  addPlaceToTrip: (placeId: string, tripId: string, dayId: string) => Promise<void>;
}
```

#### 受け入れ基準の更新

**16.1 機能要件**に追加:
- ✅ **行きたい場所の登録・編集・削除ができる**
- ✅ **外部API（OpenTripMap/Foursquare）で場所検索ができる**
- ✅ **登録場所を旅程に追加できる**
- ✅ **登録場所の検索・フィルタリングが動作する**

**16.3 テスト要件**に追加:
- ✅ E2Eテスト: 場所検索〜登録〜旅程追加までのフロー

#### リレーションシップの更新

**14.2 リレーションシップ**を更新:

```
users (1) ─── (N) trips
users (1) ─── (N) saved_places（NEW）
trips (1) ─── (N) trip_members
trips (1) ─── (N) days
days (1) ─── (N) activities
activities (1) ─── (1) activity_transport
activities (N) ─── (N) trip_members (through activity_participants)
saved_places (1) ─── (N) saved_place_photos（NEW）
saved_places (1) ─── (N) saved_place_tags（NEW）
saved_places (1) ─── (N) activities (参照として使用)（NEW）
```

---

### 4. メモリファイルの更新

#### requirements-search-and-proposal
- 全面的に書き換え
- 「旅程検索」機能の概要を記載
- 検索機能、フィルタリング、並び替え、表示形式、データベース設計、API設計を簡潔にまとめ

#### requirements-overview
- 主要機能1を「旅程検索」に更新
- 主要機能2に「行きたい場所の登録・管理機能（NEW）」を追記
- 外部API情報を最新化

#### requirements-itinerary-management
- 「行きたい場所の登録・管理機能」の詳細を追加
- 新規データベーステーブル（saved_places、saved_place_photos、saved_place_tags）を記載

---

## 変更の影響範囲

### 影響を受けたファイル
1. ✅ docs/requirements/00-overview.md
2. ✅ docs/requirements/01-search-and-proposal.md（全面書き換え）
3. ✅ docs/requirements/02-itinerary-management.md（新機能追加）
4. ❌ docs/requirements/03-budget-management.md（影響なし）
5. ❌ docs/requirements/04-memory-sharing.md（影響なし）
6. ❌ docs/requirements/05-i18n.md（影響なし）
7. ❌ docs/requirements/06-non-functional.md（影響なし）
8. ❌ docs/requirements/07-external-services.md（影響なし、OpenTripMapとFoursquareは02で使用）

### 影響を受けたメモリ
1. ✅ requirements-search-and-proposal
2. ✅ requirements-overview
3. ✅ requirements-itinerary-management
4. ❌ requirements-budget-management（影響なし）
5. ❌ requirements-memory-sharing（影響なし）
6. ❌ requirements-completion-status（今回は更新不要）

---

## 重要な設計決定

### 決定1: 観光地・レストラン検索機能の配置

**問題**: 01を「旅程検索」に変更したことで、観光地・レストラン検索機能が消失

**検討したオプション**:
- オプションA: 02（旅程管理）に統合
- オプションB: 新規要件として独立（08-place-search.md）

**決定**: **オプションA**（02に統合）

**理由**:
- 場所検索は旅程作成のサブ機能として自然
- 実装も02内で完結し、シンプル
- 「行きたい場所」という概念で、検索→保存→旅程追加の流れが明確

### 決定2: 機能名称

**採用した名称**: 「行きたい場所の登録・管理機能」

**理由**:
- ユーザーの意図を明確に表現
- 「お気に入り」や「候補地」より具体的
- 旅行計画の事前リサーチ段階での使用を想定

---

## 今後の注意事項

### データベース設計
- saved_placesテーブルはusersテーブルと1:Nの関係
- activitiesテーブルからsaved_placesを参照する場合、外部キー制約ではなく「参照としての利用」（saved_place_idを保存するが、削除時にCASCADEしない設計も検討）

### 外部API使用
- OpenTripMap: 観光地検索に使用（制限なし）
- Foursquare Places API: レストラン検索に使用（999回/日）
- 両APIは07-external-services.mdで定義済み

### フロントエンド実装
- 「行きたい場所」画面と「旅程編集」画面の連携を考慮
- ドラッグ&ドロップの実装を考慮した設計

### 次回セッションでの確認事項
- requirements-completion-statusメモリの更新が必要かどうか
- 他の要件定義ファイルとの整合性確認

---

## 参考: ユーザーとの対話履歴

1. ユーザー: 「検索というのは、作成した旅程を検索できるという意味で合っていますか？」
   → 01が「旅程検索」であることが判明

2. ユーザー: 「こちらは作成された旅程を検索する機能です。web検索を行う機能ではないです。再度要件を定義しなおしてください。」
   → 01の全面書き換えを実施

3. ユーザー: 「1. 00-overview.md - 概要ファイル 修正して問題ありません」
   → 00の修正を承認

4. ユーザー: 「2. 02-itinerary-management.md - 旅程管理 行きたいレストラン・観光地を登録しておけるようにしましょう 登録されたものから検索ができるようにしましょう」
   → 02に「行きたい場所の登録・管理機能」を追加

5. ユーザー: 「続けてください」
   → セクション番号の修正、メモリファイルの更新を完了

6. ユーザー: 「ここまでの作業内容をserenaで記憶してください」
   → このメモリを作成
