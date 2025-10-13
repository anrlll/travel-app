# TravelApp 要件定義 - 旅行プランの作成と管理

**ステータス**: ✅ 確定
**最終更新**: 2025-10-13

---

## 旅行プランの作成方法（2つのモード）

### モード1: キャンバスベース作成（推奨）⭐ NEW

**詳細**: docs/requirements/02-1-canvas-planning.md

Miro風の無限キャンバス上でアイデアを自由に配置し、複数のプラン案を同時に検討できる方式。

**主要機能**:
- 無限キャンバス（アクティビティカード自由配置）
- ノード接続（矢印で順序を表現）
- プラン案の自動認識（プラン案A、B、C...）
- 複数プラン案の比較
- 正式プラン選択（他は下書き保存）
- 行きたい場所連携
- 予算自動計算

### モード2: 従来型フォーム入力（簡易作成）

シンプルな旅行プラン向けの従来方式（手動追加、登録場所から追加、ドラッグ&ドロップ）

---

## 旅行プランの構造

```
旅行プラン（Trip）
├─ 旅行プラン名
├─ ステータス: 計画中/確定済み/完了
├─ 旅行メンバー（権限管理: オーナー/編集者/閲覧者）
└─ 日程（Days）
    └─ 各日にアクティビティ
        ├─ 基本情報（名称、タイプ、時刻、場所、料金等）
        ├─ 参加メンバー（アクティビティごとに設定可能）
        ├─ 完了フラグ
        └─ 移動情報（アクティビティの属性）
            ├─ 交通手段、移動時間、費用
            └─ 手動入力/自動計算の両方対応
```

---

## アクティビティタイプ

- 観光地訪問、食事、宿泊、移動、キャンプ、釣り、ショッピング、体験、自由時間、カスタム
- 予算カテゴリの自動判定（食事→食費、宿泊→宿泊費等）
- 拡張可能な設計

---

## 主要機能

### 旅行プラン管理
- 複数旅行プランの作成・保存・削除
- ステータス管理（計画中/確定済み/完了）
- 旅行プランのコピー・複製

### アクティビティ管理
- 手動追加/登録場所から追加/ドラッグ&ドロップ
- ドラッグ&ドロップで並び替え
- 時間指定はオプション
- メモ・備考追加

### 行きたい場所の登録・管理機能

#### 場所の登録方法
1. **外部APIから検索して登録**
   - OpenTripMap API（観光地）
   - Foursquare Places API（レストラン）
   - 検索結果から「行きたい場所に追加」

2. **手動で登録**
   - カスタム場所の追加
   - 必須: 名称、カテゴリ
   - オプション: 住所、座標、URL、メモ、写真、営業時間、料金

3. **地図から登録**
   - 地図クリックでピンを立てる
   - 座標と住所を自動取得

#### 登録場所の検索・フィルタリング
- キーワード検索、カテゴリ検索、タグ検索、場所検索
- 料金帯・評価でフィルタ
- 登録日順、名前順、評価順で並び替え

#### 登録場所の表示
- リスト表示（カード形式）
- 地図表示（カテゴリ別に色分け）

#### 旅行プランへの追加
- 「旅行プランに追加」ボタンで追加
- ドラッグ&ドロップで追加
- 旅行プラン編集画面から選択して追加
- **NEW**: キャンバス上でカード作成時に選択

### メンバー管理
- システムユーザー選択/メール招待/名前のみ登録
- 権限管理（オーナー/編集者/閲覧者）
- アクティビティごとの参加メンバー設定
- **NEW**: キャンバス段階でメンバー設定可能

### テンプレート機能
- 旅行プラン全体/1日分/複数日のテンプレート保存
- テンプレートからの作成＆カスタマイズ
- 初期は個人用のみ

### 表示形式
- タイムライン/カレンダー/リスト形式の切り替え
- 詳細画面で地図表示（訪問順にルート表示）
- サマリー表示（期間、訪問地数、総予算等）

### 予算管理との連携
- アクティビティ追加時に料金を入力→予算に自動反映
- アクティビティタイプから予算カテゴリ自動判定
- 後から手動調整可能
- **NEW**: プラン案ごとの予算自動計算

### データ保存
- PostgreSQL + 独自バックエンド
- 自動保存機能（デバウンス処理）
- 保存ステータス表示

### 共有・出力
- URL共有（権限選択可能、特定ユーザーのみ）
- PDF出力（初期実装が難しい場合は後回し）

---

## 共同編集機能
- 基本機能作成後に追加実装（フェーズ2以降）

---

## データベース設計

### 新規テーブル（キャンバスベース作成）⭐ NEW

#### canvas_activity_cards（キャンバス上のアクティビティカード）
- id, trip_plan_id, position_x, position_y
- title, activity_type, saved_place_id, custom_location
- start_time, end_time, cost, budget_category, memo, participants
- is_collapsed, is_completed

#### card_connections（カード間の接続）
- id, trip_plan_id, from_card_id, to_card_id
- transport_type, duration_minutes, distance_km, cost, route_data
- proposal_id

#### trip_plan_proposals（旅行プラン案）
- id, trip_plan_id, name, color, is_official
- start_date, end_date
- total_budget, activity_count, total_distance_km

#### proposal_activities（プラン案のアクティビティ割り当て）
- id, proposal_id, card_id, day_number, order_in_day

### 既存テーブル（行きたい場所機能）

#### saved_places（行きたい場所）
- id, user_id, name, category, address, latitude, longitude, description, url, opening_hours, price_range, rating, external_api_source, external_api_id

#### saved_place_photos（場所の写真）
- id, saved_place_id, photo_url, is_primary

#### saved_place_tags（場所のタグ）
- id, saved_place_id, tag_name

### 既存テーブル（従来型）
- trip_plans（旅行プラン）
- trip_plan_members（メンバー）
- trip_plan_days（日程）
- trip_plan_activities（アクティビティ）
- trip_plan_activity_participants（参加者）
- trip_plan_activity_transport（移動情報）
- trip_plan_templates（テンプレート）

詳細は requirements ドキュメント参照