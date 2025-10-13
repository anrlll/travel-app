# 旅行プランの作成と管理 - 要件定義

**ステータス**: ✅ 確定
**優先度**: 高
**最終更新日**: 2025-10-13

---

## 前提テーブル

このドキュメントは以下のテーブルが既に定義されていることを前提とします：

- **users**: ユーザー情報（詳細: [05-authentication.md](./05-authentication.md)）
  - 本機能では`users(id)`を外部キーとして参照

---

## 1. 旅行プランの構造

### 1.1 階層構造

旅行プランは以下の階層構造で管理する：

```
旅行プラン（Trip）
├─ 旅行プラン名: "新潟旅行A"
├─ ステータス: 計画中/確定済み/完了
├─ 旅行メンバー: [太郎, 花子, 次郎]
├─ 旅行期間: 開始日〜終了日
└─ 日程（Days）
    ├─ 1日目（Day 1）
    │   ├─ アクティビティ1: 10:00-12:00 観光地A訪問
    │   │   ├─ 種類: 観光地訪問
    │   │   ├─ 場所情報
    │   │   ├─ 料金
    │   │   ├─ メモ
    │   │   ├─ 参加メンバー
    │   │   ├─ 完了フラグ
    │   │   └─ 移動情報（次のアクティビティへの移動）
    │   │       ├─ 交通手段: 電車
    │   │       ├─ 移動時間: 30分
    │   │       └─ 移動費用
    │   ├─ アクティビティ2: 12:00-13:30 レストランBで昼食
    │   │   └─ 移動情報...
    │   └─ アクティビティ3: 14:00-16:00 観光地C訪問
    └─ 2日目（Day 2）
        └─ ...
```

### 1.2 重要な設計ポイント

- ✅ **移動情報はアクティビティの属性**として管理（独立したアイテムではない）
- ✅ **1日の定義**: 00:00〜23:59
- ✅ **時間指定はオプション**: 時間なしでもアクティビティ追加可能
- ✅ **柔軟な構造**: 後からの編集・並び替えが容易

---

## 2. アクティビティの種類

### 2.1 標準アクティビティタイプ

以下のアクティビティタイプを用意する：

| タイプ | 説明 | 予算カテゴリ（自動判定） |
|--------|------|-------------------------|
| 観光地訪問 | 観光地、名所の訪問 | 観光費・入場料 |
| 食事 | レストラン、カフェ等 | 食費 |
| 宿泊 | ホテル、旅館等 | 宿泊費 |
| 移動 | 交通手段による移動（アクティビティの属性） | 交通費 |
| キャンプ | キャンプ場での宿泊・アクティビティ | 宿泊費・アクティビティ費 |
| 釣り | 釣り体験 | アクティビティ費 |
| ショッピング | 買い物 | ショッピング費 |
| 体験 | 体験プログラム（陶芸、料理教室等） | アクティビティ費 |
| 自由時間 | 予定なし、自由行動 | - |
| カスタム | ユーザー定義の自由なアクティビティ | 手動設定 |

### 2.2 拡張性

- ✅ **将来的に追加可能な設計**にする
- ✅ アクティビティタイプはマスターデータとして管理
- ✅ ユーザーがカスタムタイプを追加可能

---

## 3. アクティビティの詳細情報

### 3.1 基本情報（すべてのアクティビティ共通）

| 項目 | 必須 | 説明 |
|------|------|------|
| アクティビティ名 | ✅ | 名称 |
| タイプ | ✅ | アクティビティの種類 |
| 日付 | ✅ | 何日目か |
| 開始時刻 | ❌ | オプション（未指定可） |
| 終了時刻 | ❌ | オプション（未指定可） |
| 場所情報 | ❌ | お気に入り/カスタムスポット/住所 |
| 料金 | ❌ | 費用（予算に自動反映） |
| メモ・備考 | ❌ | 「要予約」「現金のみ」等 |
| 参加メンバー | ❌ | 誰が参加するか |
| 完了フラグ | ✅ | 訪問済み/未訪問 |
| 並び順 | ✅ | 1日内での順序 |

### 3.2 移動情報（アクティビティの属性）

| 項目 | 必須 | 説明 |
|------|------|------|
| 交通手段 | ❌ | 電車、バス、徒歩、車等 |
| 移動時間 | ❌ | 手動入力または自動計算 |
| 移動距離 | ❌ | 自動計算（地図API） |
| 移動費用 | ❌ | 交通費 |
| ルート情報 | ❌ | 地図API経路情報 |

### 3.3 移動時間の算出方法

- ✅ **手動入力**: ユーザーが「30分」と入力
- ✅ **自動計算**: 2地点間の経路を地図APIから自動算出
- ✅ **両方可能**: 自動算出後に手動で調整可能

### 3.4 アクティビティタイプ別のオプション項目

すべてオプションで入力可能（必須ではない）：

**宿泊の場合:**
- チェックイン時刻
- チェックアウト時刻
- 部屋タイプ
- 予約番号

**食事の場合:**
- 予約の有無
- 予約時刻
- 人数
- 予算（1人あたり/合計）

**体験の場合:**
- 予約の有無
- 定員
- 持ち物

---

## 4. 旅行プラン（Trip）の管理

### 4.1 旅行プランの基本情報

| 項目 | 必須 | 説明 |
|------|------|------|
| 旅行プラン名 | ✅ | 「新潟旅行A」等 |
| 開始日 | ✅ | 旅行開始日 |
| 終了日 | ✅ | 旅行終了日 |
| ステータス | ✅ | 計画中/確定済み/完了 |
| 旅行メンバー | ❌ | 参加者リスト |
| 説明 | ❌ | 旅行の概要 |
| サムネイル画像 | ❌ | 旅程のイメージ画像 |

### 4.2 ステータス管理

| ステータス | 説明 |
|-----------|------|
| 計画中 | 検討段階、変更が多い |
| 確定済み | 旅行プランが確定、予約完了 |
| 完了 | 旅行が終了 |

### 4.3 複数旅行プランの管理

- ✅ **1ユーザーが複数の旅行プランを作成・保存可能**
- ✅ **過去の旅行プランは保存され続ける**
- ✅ **削除機能あり**（誤削除防止の確認ダイアログ表示）
- ✅ **旅行プランをストックしておける**（いつか行きたい旅行プラン等）

---

## 5. 旅行メンバー管理

### 5.1 メンバーの追加方法

以下のすべての方法で追加可能：

1. ✅ **システム登録済みユーザーから選択**
   - ユーザー検索機能
   - 友達リストから選択

2. ✅ **メールアドレスで招待**
   - 招待メール送信
   - 招待リンクから参加

3. ✅ **名前だけ登録**
   - システムユーザーでなくてもOK
   - 参加者名簿として管理

### 5.2 メンバーの権限管理

| 権限 | 説明 | 可能な操作 |
|------|------|-----------|
| オーナー | 旅程の作成者 | すべての操作（削除含む） |
| 編集者 | 編集権限あり | 旅程の編集、アクティビティ追加・削除 |
| 閲覧者 | 閲覧のみ | 旅程の閲覧、コメント追加（将来的に） |

### 5.3 メンバーごとの参加情報

- ✅ **アクティビティごとに参加メンバーを指定可能**
  - 例: 「太郎と花子は観光地A訪問、次郎はホテルで休憩」
- ✅ **メンバーの個別スケジュールを管理**
- ✅ **メンバーごとの予算管理**（将来的に検討）

---

## 6. 行きたい場所の登録・管理機能

### 6.1 概要

ユーザーが**行きたいレストラン・観光地・ホテルなどを事前に登録**し、リスト管理・検索・旅行プランへの追加ができる機能。旅行計画前のリサーチや、候補地の管理に使用する。

### 6.2 場所の登録方法

以下のすべての方法で場所を登録可能：

#### **1. 外部APIから検索して登録**

- ✅ **観光地検索**: OpenTripMap APIで検索
  - キーワード検索（例: 「東京タワー」「清水寺」）
  - カテゴリ検索（文化施設、自然景観、歴史的建造物など）
  - 地図上から選択

- ✅ **レストラン検索**: Foursquare Places APIで検索
  - キーワード検索（例: 「築地寿司」「京都ラーメン」）
  - ジャンル検索（和食、イタリアン、カフェなど）
  - 料金帯・評価でフィルタリング

- ✅ **検索結果から「行きたい場所に追加」ボタンで登録**

#### **2. 手動で登録**

- ✅ **カスタム場所の追加**
  - フォームから手動入力
  - 必須項目: 名称、カテゴリ（観光地/レストラン/ホテル/その他）
  - オプション項目: 住所、座標、URL、メモ、写真、営業時間、料金

#### **3. 地図から登録**

- ✅ **地図上で場所を選択**
  - 地図をクリックしてピンを立てる
  - 座標と住所を自動取得
  - 場所情報を入力して登録

### 6.3 登録場所の情報

各登録場所に以下の情報を保存：

| 項目 | 必須 | 説明 |
|------|------|------|
| 名称 | ✅ | 場所の名前 |
| カテゴリ | ✅ | 観光地/レストラン/ホテル/カフェ/ショップ/その他 |
| 住所 | ❌ | 所在地 |
| 座標（緯度・経度） | ❌ | GPS座標 |
| 説明 | ❌ | メモ・特徴 |
| URL | ❌ | 公式サイト・参考URL |
| 写真 | ❌ | 場所の画像（複数可） |
| 営業時間 | ❌ | 営業時間・定休日 |
| 料金 | ❌ | 入場料・予算 |
| 評価 | ❌ | 星5段階評価 |
| タグ | ❌ | カスタムタグ（例: #絶景 #グルメ） |
| 外部API情報 | ❌ | API取得元（OpenTripMap/Foursquare）とID |

### 6.4 登録場所の検索・フィルタリング

#### **検索機能**

- ✅ **キーワード検索**: 名称・住所・メモで検索
- ✅ **カテゴリ検索**: 観光地/レストラン/ホテル等で絞り込み
- ✅ **タグ検索**: 複数タグでAND/OR検索
- ✅ **場所検索**: 地域・都市で絞り込み（例: 「京都」）

#### **フィルタリング**

- ✅ **料金帯**: 価格範囲でフィルタ
- ✅ **評価**: 星の数でフィルタ（例: 4つ星以上）
- ✅ **カテゴリ**: 複数カテゴリ選択可能

#### **並び替え**

- 登録日順（新しい順/古い順）
- 名前順（あいうえお順/ABC順）
- 評価順（高評価順）

### 6.5 登録場所の表示形式

#### **リスト表示**
- カード形式で一覧表示
- 各カードに名称・カテゴリ・写真・評価・メモを表示

#### **地図表示**
- 登録した場所を地図上にピン表示
- ピンをクリックで詳細情報表示
- カテゴリ別に色分け

#### **切り替え**
- リスト/地図の表示切り替えボタン

### 6.6 旅行プランへの追加

登録した場所を旅行プランのアクティビティに追加する方法：

#### **方法1: 「旅行プランに追加」ボタン**
- ✅ 場所詳細画面から「旅行プランに追加」ボタンをクリック
- ✅ 旅行プラン選択（複数旅行プランがある場合）
- ✅ 日付・時刻指定
- ✅ 場所情報が自動的にアクティビティに反映

#### **方法2: ドラッグ&ドロップ**
- ✅ 登録場所リストから旅行プラン編集画面へドラッグ
- ✅ カレンダー上の日付にドロップ
- ✅ アクティビティとして追加

#### **方法3: 旅行プラン編集画面から選択**
- ✅ 旅行プラン編集中に「登録場所から追加」ボタン
- ✅ 登録場所リストが表示される
- ✅ 場所を選択してアクティビティ作成

### 6.7 登録場所の編集・削除

- ✅ **編集**: いつでも情報を編集可能
- ✅ **削除**: 場所を削除（旅行プランに追加済みの場合は警告表示）
- ✅ **一括削除**: 複数選択して削除

### 6.8 データベース設計

#### **saved_places（行きたい場所）**

```sql
CREATE TABLE saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 観光地/レストラン/ホテル/カフェ/ショップ/その他
  address VARCHAR(500),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  description TEXT,
  url VARCHAR(500),
  opening_hours TEXT,
  price_range VARCHAR(100),
  rating DECIMAL(2,1), -- 0.0〜5.0
  external_api_source VARCHAR(50), -- OpenTripMap/Foursquare/Manual
  external_api_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at)
);
```

#### **saved_place_photos（場所の写真）**

```sql
CREATE TABLE saved_place_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_place_id UUID NOT NULL REFERENCES saved_places(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL, -- Phase 1: Base64形式, Phase 2+: クラウドストレージURL
  storage_type VARCHAR(20) DEFAULT 'base64', -- 'base64' or 'cloudinary' or 'cloudflare_r2'
  is_primary BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_saved_place_id (saved_place_id)
);
```

**画像保存方法の移行計画**:

- **Phase 1（初期実装）**: Base64エンコードでDBに保存
  - `photo_url`: Base64文字列
  - `storage_type`: 'base64'

- **Phase 2（移行開始条件）**:
  - データベースサイズが10GB超過時
  - または Phase 2機能実装開始時点

- **移行方式（推奨: 段階的移行）**:
  - **新規アップロード**: クラウドストレージ（Cloudinary → Cloudflare R2）へ直接保存
  - **既存データ**: Base64のまま維持、バックグラウンドで段階的に移行

- **データベーススキーマ変更**:
  ```sql
  -- storage_type カラムで保存方式を識別
  -- 'base64': photo_urlにBase64文字列
  -- 'cloudinary': photo_urlにCloudinary URL
  -- 'cloudflare_r2': photo_urlにCloudflare R2 URL
  ```

- **下位互換性**:
  - 画像表示ロジックで `storage_type` を判定し両形式に対応
  - APIレスポンスに `storage_type` を含める
  - フロントエンドは `storage_type` に応じて適切に画像を表示

#### **saved_place_tags（場所のタグ）**

```sql
CREATE TABLE saved_place_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_place_id UUID NOT NULL REFERENCES saved_places(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,

  INDEX idx_saved_place_id (saved_place_id),
  INDEX idx_tag_name (tag_name)
);
```

---

## 7. 旅行プランの作成・編集方法

### 7.1 作成方法

旅行プラン作成には**2つのモード**があります：

#### モード1: キャンバスベース作成（推奨）⭐ NEW

**詳細**: [02-1-canvas-planning.md](./02-1-canvas-planning.md)

Miro風の無限キャンバス上でアイデアを自由に配置し、複数のプラン案を同時に検討できる方式：

- ✅ **無限キャンバス**: アクティビティカードを自由な位置に配置
- ✅ **ノード接続**: カードを矢印で繋いで順序を表現
- ✅ **複数プラン案**: プラン案A、B、Cを同時作成・比較
- ✅ **正式プラン選択**: 1つを正式プランとして確定、他は下書き保存
- ✅ **行きたい場所連携**: 登録場所からカードを作成
- ✅ **予算自動計算**: プラン案ごとの総予算を自動算出

**推奨理由**: 複数案を並行検討でき、自由な発想を妨げない

#### モード2: 従来型フォーム入力（簡易作成）

シンプルな旅行プラン向けの従来方式：

1. ✅ **手動で1つずつ追加**
   - フォームから情報入力
   - 新規アクティビティ作成

2. ✅ **登録場所から追加**
   - 「行きたい場所」リストから選択
   - 「旅行プランに追加」ボタン
   - 旅行プラン選択（複数旅行プランがある場合）
   - 日付・時刻指定

3. ✅ **ドラッグ&ドロップ**
   - 登録場所リストから旅行プランへドラッグ
   - カレンダー上へドラッグ

### 7.2 並び替え

- ✅ **ドラッグ&ドロップで順序変更**
  - 同一日内での並び替え
  - 異なる日への移動
  - リアルタイムでプレビュー表示

### 7.3 コピー・複製機能

- ✅ **必要**
- ✅ **日程のコピー**: 「3日目の旅行プランを4日目にコピー」
- ✅ **アクティビティのコピー**: 個別のアクティビティを複製
- ✅ **旅行プラン全体のコピー**: 別の旅行プランとして複製

---

## 8. テンプレート機能

### 8.1 テンプレート作成

**保存範囲（すべて可能）:**
- ✅ 旅程全体（全日程）
- ✅ 1日分のみ
- ✅ 複数日（例: 2日目〜3日目のみ）
- ✅ 特定のアクティビティセット

### 8.2 テンプレートの使用

- ✅ **テンプレートから旅行プラン作成**
- ✅ **日程や場所を自由に調整可能**
  - 例: 「京都2泊3日テンプレート」→「大阪2泊3日」に変更
- ✅ **カスタマイズ後に保存**

### 8.3 テンプレートの共有

- ✅ **初期は個人用のみ**
- 🔜 **将来的に他ユーザーと共有可能**（フェーズ2以降）

### 8.4 システムテンプレート

- ❌ **初期は不要**
- 🔜 **将来的に実装**（人気の観光ルート等）

---

## 9. 旅行プランの表示形式

### 9.1 表示切り替え

旅行プラン一覧・編集画面で以下の表示を切り替え可能：

#### **タイムライン形式**
- 時系列で縦に並べて表示
- 各アクティビティをカード表示
- 移動情報を矢印で表示

#### **カレンダー形式**
- カレンダー上に配置
- 日付ごとのアクティビティ一覧
- ドラッグ&ドロップで日程変更

#### **リスト形式**
- シンプルなリスト表示
- 編集・削除ボタン
- 折りたたみ可能

### 9.2 詳細画面の地図表示

旅行プラン詳細画面では以下を表示：

- ✅ **地図上に訪問地をピン表示**
- ✅ **訪問順にルート（線）を引く**
- ✅ **各ピンをクリックで詳細情報表示**
- ✅ **移動手段・時間も表示**

### 9.3 サマリー（概要）表示

- ✅ **必要**
- 表示項目:
  - 旅行期間（例: 3泊4日）
  - 訪問地数（例: 訪問地5箇所）
  - 総予算（例: 総予算10万円）
  - 参加メンバー数
  - 完了したアクティビティ数 / 全体数

---

## 10. 他機能との連携

### 10.1 予算管理との連携

#### **自動反映**
- ✅ **アクティビティ追加時に料金を入力**
- ✅ **その金額が予算管理に自動追加**
- ✅ **アクティビティタイプから予算カテゴリを自動判定**
  - 例: 「食事」→「食費」
  - 例: 「宿泊」→「宿泊費」

#### **手動調整**
- ✅ **後から予算カテゴリを変更可能**
- ✅ **料金の手動編集可能**
- ✅ **予算管理画面から直接編集**

### 10.2 メモ・備考機能

- ✅ **各アクティビティにメモ・備考を追加可能**
- 例:
  - 「要予約」
  - 「現金のみ」
  - 「定休日: 月曜」
  - 「持ち物: 水着」

### 10.3 チェックリスト機能

- ✅ **各アクティビティに完了フラグ**
- ✅ **訪問済み/未訪問のチェック**
- ✅ **旅程全体の進捗率表示**
  - 例: 「5/10 完了（50%）」

---

## 11. データの保存・同期

### 11.1 保存先

- ✅ **PostgreSQLデータベース**（クラウドDB）
- ✅ **独自バックエンド経由**でアクセス
- ❌ ローカルストレージは使用しない（WebアプリのためDB管理）

### 11.2 保存方法

- ✅ **自動保存機能**
  - 変更のたびに自動的に保存
  - デバウンス処理（連続入力時は一定時間後に保存）
  - 保存中インジケーター表示

- ✅ **保存ステータス表示**
  - 「保存中...」
  - 「保存済み」
  - 「エラー発生」

### 11.3 オフライン対応

- 🔜 **将来的に検討**（フェーズ2以降）
- Service Workerでのキャッシング
- オフライン時の編集をキューに保存

---

## 12. 旅行プランの出力・共有

### 12.1 エクスポート機能

#### **PDF出力**
- ✅ **実装予定**（初期実装が難しい場合は後回し）
- 含める情報:
  - 旅行プラン全体のスケジュール
  - 地図（訪問地のルート）
  - 予算サマリー
  - メンバー情報
- 印刷用にも最適化

#### **その他の出力形式**
- ❌ カレンダーアプリへのエクスポート（.ics形式）は初期は不要
- 🔜 将来的に検討

### 12.2 URL共有機能

- ✅ **必要**
- **共有方法**:
  - 共有リンク生成
  - 権限選択可能（閲覧のみ/編集可能）
  - 特定のユーザーのみアクセス可能

- **セキュリティ**:
  - トークンベースの認証
  - 有効期限設定（オプション）
  - アクセスログ記録

### 12.3 SNSシェア・メール送信

- ❌ **初期は不要**
- 🔜 将来的に検討（フェーズ2以降）

---

## 13. 共同編集機能（将来実装）

### 13.1 実装時期

- ❌ **基本機能作成後に追加実装**
- 🔜 フェーズ2以降で検討

### 13.2 検討事項（実装時に再検討）

- リアルタイム同期の必要性
- 編集権限の詳細管理
- コメント機能
- 編集履歴・バージョン管理
- 競合解決メカニズム

---

## 14. データベース設計

### 14.1 テーブル構造

#### **trip_plans（旅行プラン）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| user_id | UUID | ✅ | 作成者のユーザーID |
| title | VARCHAR(255) | ✅ | 旅行プラン名 |
| description | TEXT | ❌ | 説明 |
| destinations | JSONB | ❌ | 目的地リスト（例: ["東京", "大阪", "京都"]） |
| start_date | DATE | ✅ | 開始日 |
| end_date | DATE | ✅ | 終了日 |
| status | ENUM | ✅ | planning/confirmed/completed |
| thumbnail_url | VARCHAR(500) | ❌ | サムネイル画像URL |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| updated_at | TIMESTAMP | ✅ | 更新日時 |

**インデックス**: user_id, status, created_at

**destinations カラムの詳細**:
- **型**: JSONB配列
- **デフォルト値**: `'[]'::jsonb`（空配列）
- **用途**: 複数の目的地を保存（例: `["東京", "大阪", "京都"]`）
- **検索用インデックス**: `CREATE INDEX idx_destinations ON trip_plans USING GIN (destinations);`
- **クエリ例**:
  ```sql
  -- "東京"を含む旅行プランを検索
  SELECT * FROM trip_plans WHERE destinations @> '["東京"]'::jsonb;

  -- 複数目的地のいずれかを含む旅行プランを検索
  SELECT * FROM trip_plans WHERE destinations ?| array['東京', '大阪'];
  ```

---

#### **trip_plan_members（旅行メンバー）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_plan_id | UUID | ✅ | 旅行プランID（外部キー） |
| user_id | UUID | ❌ | ユーザーID（システムユーザーの場合） |
| name | VARCHAR(100) | ✅ | 名前（システム外ユーザーの場合） |
| email | VARCHAR(255) | ❌ | メールアドレス |
| role | ENUM | ✅ | owner/editor/viewer |
| joined_at | TIMESTAMP | ✅ | 参加日時 |

**インデックス**: trip_plan_id, user_id

**UNIQUE制約**:
```sql
-- システム登録ユーザーの重複防止
-- 同じ旅行プランに同じユーザーを複数回追加できない
ALTER TABLE trip_plan_members
ADD CONSTRAINT unique_trip_plan_user
UNIQUE (trip_plan_id, user_id)
WHERE user_id IS NOT NULL;

-- メールアドレスの重複防止
-- 同じ旅行プランに同じメールアドレスを複数回追加できない
ALTER TABLE trip_plan_members
ADD CONSTRAINT unique_trip_plan_email
UNIQUE (trip_plan_id, email)
WHERE email IS NOT NULL;
```

**制約の目的**:
- **unique_trip_plan_user**: 同じシステムユーザーが同じ旅行プランに重複して登録されることを防ぐ
- **unique_trip_plan_email**: 同じメールアドレスが同じ旅行プランに重複して招待されることを防ぐ
- **部分UNIQUE制約**: `WHERE` 句により、NULL値は制約対象外（複数のゲストメンバー追加が可能）

**使用例**:
```sql
-- ✅ OK: 異なるユーザーを追加
INSERT INTO trip_plan_members (trip_plan_id, user_id, name, role)
VALUES ('trip-1', 'user-1', '太郎', 'editor');
INSERT INTO trip_plan_members (trip_plan_id, user_id, name, role)
VALUES ('trip-1', 'user-2', '花子', 'viewer');

-- ❌ エラー: 同じユーザーを重複追加
INSERT INTO trip_plan_members (trip_plan_id, user_id, name, role)
VALUES ('trip-1', 'user-1', '太郎', 'viewer'); -- unique_trip_plan_user 違反

-- ✅ OK: user_idなしのゲストメンバーは複数追加可能
INSERT INTO trip_plan_members (trip_plan_id, name, role)
VALUES ('trip-1', 'ゲスト1', 'viewer');
INSERT INTO trip_plan_members (trip_plan_id, name, role)
VALUES ('trip-1', 'ゲスト2', 'viewer');

-- ❌ エラー: 同じメールアドレスで重複招待
INSERT INTO trip_plan_members (trip_plan_id, email, name, role)
VALUES ('trip-1', 'guest@example.com', 'ゲスト', 'viewer');
INSERT INTO trip_plan_members (trip_plan_id, email, name, role)
VALUES ('trip-1', 'guest@example.com', 'ゲスト', 'editor'); -- unique_trip_plan_email 違反
```

---

#### **trip_plan_days（日程）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_plan_id | UUID | ✅ | 旅行プランID（外部キー） |
| day_number | INTEGER | ✅ | 何日目か（1, 2, 3...） |
| date | DATE | ✅ | 日付 |
| notes | TEXT | ❌ | その日のメモ |

**インデックス**: trip_plan_id, day_number

---

#### **trip_plan_activities（アクティビティ）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_plan_day_id | UUID | ✅ | 日程ID（外部キー） |
| type | VARCHAR(50) | ✅ | アクティビティタイプ |
| title | VARCHAR(255) | ✅ | タイトル |
| saved_place_id | UUID | ❌ | 登録場所ID（外部キー） |
| custom_location | JSONB | ❌ | カスタム場所情報（下記のJSON形式） |
| start_time | TIME | ❌ | 開始時刻 |
| end_time | TIME | ❌ | 終了時刻 |
| cost | DECIMAL(10,2) | ❌ | 費用 |
| budget_category | VARCHAR(50) | ❌ | 予算カテゴリ |
| memo | TEXT | ❌ | メモ・備考 |
| is_completed | BOOLEAN | ✅ | 完了フラグ |
| order | INTEGER | ✅ | 並び順 |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| updated_at | TIMESTAMP | ✅ | 更新日時 |

**インデックス**: trip_plan_day_id, order

**custom_location カラムの詳細**:

`custom_location`は、ユーザーが手動で入力したカスタム場所情報を保存するJSONBカラムです。`saved_place_id`が指定されていない場合に使用します。

**TypeScript 型定義**:
```typescript
interface CustomLocation {
  name: string;              // 必須: 場所の名称（例: "地元のカフェ"）
  address?: string;          // オプション: 住所
  latitude?: number;         // オプション: 緯度（-90 〜 90）
  longitude?: number;        // オプション: 経度（-180 〜 180）
  notes?: string;            // オプション: メモ・補足情報
  url?: string;              // オプション: 公式サイト等のURL
}
```

**JSON 例**:
```json
{
  "name": "地元のカフェ",
  "address": "東京都渋谷区神宮前1-2-3",
  "latitude": 35.670479,
  "longitude": 139.702768,
  "notes": "隠れ家的なカフェ。Wi-Fi完備",
  "url": "https://example.com/cafe"
}
```

**バリデーション**:
- `name`: 1〜255文字の文字列（必須）
- `address`: 500文字以内の文字列
- `latitude`: -90 〜 90 の数値
- `longitude`: -180 〜 180 の数値
- `notes`: 1000文字以内の文字列
- `url`: 500文字以内の有効なURL形式

**データベース制約**:
```sql
-- custom_locationのバリデーションチェック（PostgreSQL）
ALTER TABLE trip_plan_activities
ADD CONSTRAINT check_custom_location_name
CHECK (
  custom_location IS NULL OR
  (custom_location->>'name' IS NOT NULL AND
   LENGTH(custom_location->>'name') BETWEEN 1 AND 255)
);
```

---

#### **trip_plan_activity_participants（アクティビティ参加者）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_plan_activity_id | UUID | ✅ | アクティビティID（外部キー） |
| trip_plan_member_id | UUID | ✅ | メンバーID（外部キー） |

**インデックス**: trip_plan_activity_id, trip_plan_member_id

---

#### **trip_plan_activity_transport（移動情報）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_plan_activity_id | UUID | ✅ | アクティビティID（外部キー） |
| transport_type | VARCHAR(50) | ❌ | 交通手段（電車、バス等） |
| duration_minutes | INTEGER | ❌ | 移動時間（分） |
| distance_km | DECIMAL(8,2) | ❌ | 移動距離（km） |
| cost | DECIMAL(10,2) | ❌ | 移動費用 |
| route_data | JSON | ❌ | ルート情報（地図API） |
| is_auto_calculated | BOOLEAN | ✅ | 自動計算かどうか |

**インデックス**: trip_plan_activity_id

---

#### **trip_plan_templates（旅行プランテンプレート）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| user_id | UUID | ✅ | 作成者ID |
| title | VARCHAR(255) | ✅ | テンプレート名 |
| description | TEXT | ❌ | 説明 |
| template_data | JSON | ✅ | テンプレートデータ |
| is_public | BOOLEAN | ✅ | 公開/非公開 |
| created_at | TIMESTAMP | ✅ | 作成日時 |

**インデックス**: user_id, is_public

---

### 14.2 リレーションシップ

```
users (1) ─── (N) trip_plans
users (1) ─── (N) saved_places
trip_plans (1) ─── (N) trip_plan_members
trip_plans (1) ─── (N) trip_plan_days
trip_plan_days (1) ─── (N) trip_plan_activities
trip_plan_activities (1) ─── (1) trip_plan_activity_transport
trip_plan_activities (N) ─── (N) trip_plan_members (through trip_plan_activity_participants)
saved_places (1) ─── (N) saved_place_photos
saved_places (1) ─── (N) saved_place_tags
saved_places (1) ─── (N) trip_plan_activities (参照として使用)
```

---

## 15. フロントエンド実装

### 15.1 コンポーネント設計

#### **旅行プラン一覧・管理**
- `TripPlanList`: 旅行プラン一覧
- `TripPlanCard`: 旅行プランカード（サマリー表示）
- `TripPlanFilters`: フィルター（ステータス、期間等）
- `CreateTripPlanButton`: 新規旅行プラン作成ボタン

#### **旅行プラン編集**
- `TripPlanEditor`: 旅行プラン編集メイン画面
- `TripPlanHeader`: 旅行プランヘッダー（タイトル、日程、メンバー等）
- `ViewToggle`: 表示形式切り替え
- `TripPlanSummary`: サマリー表示

#### **日程・アクティビティ**
- `DayPlanner`: 1日の旅行プラン編集
- `ActivityCard`: アクティビティカード
- `ActivityForm`: アクティビティ追加・編集フォーム
- `TransportInfo`: 移動情報コンポーネント
- `ActivityTypeSelector`: アクティビティタイプ選択

#### **表示形式**
- `TripPlanTimeline`: タイムライン表示
- `TripPlanCalendar`: カレンダー表示
- `TripPlanList`: リスト表示
- `TripPlanMap`: 地図表示（詳細画面）

#### **メンバー管理**
- `MemberList`: メンバー一覧
- `MemberInviteForm`: メンバー招待フォーム
- `MemberPermissionSelector`: 権限選択

#### **行きたい場所管理**
- `SavedPlacesList`: 登録場所一覧
- `SavedPlaceCard`: 場所カード
- `SavedPlaceForm`: 場所追加・編集フォーム
- `PlaceSearch`: 外部API検索（OpenTripMap/Foursquare）
- `PlaceSearchResults`: 検索結果表示
- `SavedPlacesMap`: 登録場所の地図表示
- `SavedPlaceFilters`: フィルター・並び替え
- `AddToTripButton`: 旅程に追加ボタン

#### **テンプレート**
- `TemplateList`: テンプレート一覧
- `TemplateSelector`: テンプレート選択
- `TemplateSaveDialog`: テンプレート保存ダイアログ

#### **共有・出力**
- `ShareDialog`: 共有設定ダイアログ
- `ExportPDFButton`: PDF出力ボタン

### 15.2 状態管理（Zustand）

```typescript
interface TripPlanState {
  tripPlans: TripPlan[];
  currentTripPlan: TripPlan | null;
  viewMode: 'timeline' | 'calendar' | 'list';
  selectedDay: TripPlanDay | null;
  isAutoSaving: boolean;
  savedPlaces: SavedPlace[];
  savedPlaceFilters: PlaceFilters;

  // TripPlan Actions
  fetchTripPlans: () => Promise<void>;
  createTripPlan: (data: CreateTripPlanData) => Promise<TripPlan>;
  updateTripPlan: (id: string, data: UpdateTripPlanData) => Promise<void>;
  deleteTripPlan: (id: string) => Promise<void>;

  // Activity Actions
  addActivity: (dayId: string, data: ActivityData) => Promise<void>;
  updateActivity: (id: string, data: ActivityData) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  reorderActivities: (dayId: string, newOrder: string[]) => Promise<void>;

  // Saved Places Actions
  fetchSavedPlaces: () => Promise<void>;
  addSavedPlace: (data: SavedPlaceData) => Promise<void>;
  updateSavedPlace: (id: string, data: SavedPlaceData) => Promise<void>;
  deleteSavedPlace: (id: string) => Promise<void>;
  searchPlaces: (query: string, source: 'opentripmap' | 'foursquare') => Promise<PlaceResult[]>;
  addPlaceToTripPlan: (placeId: string, tripPlanId: string, dayId: string) => Promise<void>;

  toggleViewMode: (mode: ViewMode) => void;
  setCurrentTripPlan: (tripPlan: TripPlan) => void;
}
```

---

## 16. 受け入れ基準

### 16.1 機能要件

- ✅ 旅行プランの作成・編集・削除が動作する
- ✅ 複数の旅行プランを管理できる
- ✅ ステータス管理が動作する
- ✅ アクティビティの追加・編集・削除が動作する
- ✅ アクティビティの並び替えができる
- ✅ 移動情報を登録できる（手動/自動）
- ✅ メンバー管理が動作する（追加・権限設定）
- ✅ アクティビティごとの参加メンバー設定ができる
- ✅ **行きたい場所の登録・編集・削除ができる**
- ✅ **外部API（OpenTripMap/Foursquare）で場所検索ができる**
- ✅ **登録場所を旅行プランに追加できる**
- ✅ **登録場所の検索・フィルタリングが動作する**
- ✅ テンプレート機能が動作する
- ✅ 表示形式を切り替えられる（タイムライン/カレンダー/リスト）
- ✅ 地図上にルート表示ができる
- ✅ サマリー表示が正しく動作する
- ✅ 予算管理に自動反映される
- ✅ 自動保存が動作する
- ✅ URL共有機能が動作する

### 16.2 非機能要件

- ✅ レスポンシブデザイン（モバイル対応）
- ✅ ドラッグ&ドロップがスムーズ
- ✅ 自動保存のインジケーター表示
- ✅ エラー時の適切なフィードバック

### 16.3 テスト要件

- ✅ ユニットテスト: カバレッジ80%以上
- ✅ E2Eテスト: 旅行プラン作成〜アクティビティ追加〜共有までのフロー
- ✅ E2Eテスト: 場所検索〜登録〜旅行プラン追加までのフロー
- ✅ 権限管理のテスト

---

## 17. 関連ドキュメント

- [要件概要](./00-overview.md)
- [旅行プラン検索](./01-search-and-proposal.md)
- **[キャンバスベース作成画面](./02-1-canvas-planning.md)** - 詳細仕様 ⭐NEW
- [予算管理](./03-budget-management.md)
- [外部サービス連携](./07-external-services.md)
- [CLAUDE.md](../../CLAUDE.md) - 実装ルール
