# 思い出の記録と共有 - 要件定義

**ステータス**: 📝 部分確定（Phase 1-2: 基本記録機能は確定、Phase 3: アルバム機能は後回し）
**優先度**: 低（アルバム機能が後回しのため）
**最終更新日**: 2025-10-13

---

## 1. 概要

旅行中・旅行後の思い出を記録する機能。写真、動画、テキスト、位置情報、評価などを記録可能。

### 実装段階

#### **Phase 1-2（実装する）** ✅
- 思い出の基本記録（写真・動画・テキスト・位置情報・評価）
- 旅行プランへの紐付け
- タグ機能
- 検索・フィルタリング
- 簡易一覧表示（旅行プランごと）

#### **Phase 3（後回し）** 🔜
- アルバム機能（自動作成・複数アルバム管理）
- 共有リンク生成
- プライバシー設定・パスワード保護
- 共有リンク管理・アクセスログ

---

## 2. 記録できるコンテンツ

### 2.1 コンテンツの種類

以下のすべての形式を記録可能：

| 種類 | 説明 | 必須 |
|------|------|------|
| 📷 写真 | 画像ファイル（JPEG, PNG等） | ❌ |
| 🎥 動画 | 動画ファイル（MP4等） | ❌ |
| 📝 テキスト | 日記、メモ、コメント | ❌ |
| 📍 位置情報 | GPS座標、住所 | ❌ |
| ⭐ 評価 | 星5段階評価 | ❌ |
| 🏷️ タグ | キーワードタグ | ❌ |

**注意**: すべてオプション（少なくとも1つのコンテンツが必要）

### 2.2 コンテンツの制限

#### **写真**
- ✅ **初期は制限なし**
- 🔜 **将来的に**: アカウントプランによって制限（例: 無料プラン 100枚/旅行）
- 対応形式: JPEG, PNG, GIF, WebP

#### **動画**
- ✅ **初期は制限なし**
- 🔜 **将来的に**: アカウントプランによって制限（例: 無料プラン 10本/旅行）
- 対応形式: MP4, MOV, AVI

#### **テキスト**
- ✅ **制限なし**
- リッチテキストではなくプレーンテキスト

### 2.3 コンテンツの保存先

#### **初期実装**
- ✅ **データベース（Base64エンコード）**
- メリット: 実装が簡単
- デメリット: DBサイズが大きくなる

#### **将来的な移行**
- 🔜 **クラウドストレージ（S3, Cloudinary等）**
- メリット: スケーラブル、画像最適化、CDN配信
- 移行時期: 基本機能完成後

---

## 3. アルバム機能 🔜 **Phase 3（後回し）**

**注意**: このセクションの機能は全てPhase 3で実装予定です。Phase 1-2では、旅行プランごとに思い出を簡易一覧表示する機能のみ実装します。

### 3.1 アルバムの作成

#### **自動作成**
- ✅ **旅行ごとに自動作成**
  - 旅行プラン「新潟旅行A」を作成 → 「新潟旅行Aのアルバム」を自動生成
  - 旅行プラン名の変更 → アルバム名も自動更新（オプション）

#### **手動作成（将来的に）**
- 🔜 ユーザーが任意のアルバムを追加作成可能

### 3.2 コンテンツの追加

#### **1つのコンテンツを複数のアルバムに追加**
- ✅ **可能**
  - 同じ写真を「新潟旅行A」と「2025年の思い出」の両方に追加可能
  - 実体は1つ、参照のみ複製（ストレージ節約）

### 3.3 アルバムの整理

#### **並び替え**
- ✅ **手動で順序指定**
  - ユーザーがコンテンツをドラッグ&ドロップで並び替え
  - 順序を数値で指定（1, 2, 3...）

#### **ソート機能**
- 日付順（昇順/降順）
- 追加順
- 評価順（高評価順）

---

## 4. 記録のタイミング

### 4.1 記録時期

- ✅ **旅行中（リアルタイム記録）**
  - 現地で写真を撮影してすぐアップロード
  - モバイル対応必須

- ✅ **旅行後（まとめて記録）**
  - 旅行終了後にまとめて写真・メモを追加
  - PCからの一括アップロード

**両方に対応**

---

## 5. 旅行プランとの紐付け

### 5.1 紐付け方法

#### **アクティビティに直接紐付け**
- ✅ **旅行プラン画面から追加**
  - アクティビティ「10:00 観光地A訪問」に写真追加ボタン
  - その場で写真・動画・メモを追加

#### **独立して記録後、後から紐付け**
- ✅ **思い出画面から追加 → 後でアクティビティに紐付け**
  - 思い出一覧から「このコンテンツをアクティビティに紐付ける」
  - 旅行プランとアクティビティを選択

**両方可能**

### 5.2 旅行プラン画面での表示

- ❌ **アクティビティに紐付けた思い出は旅行プラン画面に表示しない**
- ✅ **思い出画面でのみ確認可能**
  - 理由: 旅行プラン画面をシンプルに保つため
  - 思い出画面で「アクティビティ: 観光地A訪問」と表示

---

## 6. 位置情報

### 6.1 取得方法

以下のすべての方法に対応：

#### **手動選択**
- ✅ **地図から選択**
  - 地図上でピンをドロップ
  - 住所検索から選択

#### **自動取得**
- ✅ **アクティビティの場所情報を自動取得**
  - アクティビティに紐付けた場合、その場所情報を自動設定
  - 手動で変更可能

#### **GPS情報（将来的に）**
- 🔜 **スマートフォンのGPS情報を取得**（PWA/ネイティブアプリの場合）
  - 写真撮影時の位置情報
  - バックグラウンド位置追跡

### 6.2 表示方法

- ✅ **地図上にピン表示**
  - アルバム内の全コンテンツを地図上に表示
  - ピンをクリックで詳細表示

- ✅ **住所テキスト表示**
  - 「東京都渋谷区〇〇」のようにテキスト表示

**両方に対応**

---

## 7. 評価・レーティング

### 7.1 評価対象

以下のすべてに対して評価可能：

#### **訪問した場所**
- ✅ 観光地、レストラン、ホテル等に対して評価

#### **アクティビティ全体**
- ✅ 「10:00 観光地A訪問」というアクティビティに対して評価

#### **旅行全体**
- ✅ 旅行プラン全体に対して総合評価

### 7.2 評価形式

- ✅ **星5段階評価**
  - ⭐⭐⭐⭐⭐ (5段階)
  - 0.5刻みも可能（例: 4.5星）

### 7.3 レビューコメント

- ✅ **評価と一緒にコメントを記録可能**
  - 例: 「景色が最高でした！混雑していましたが満足です。」
  - 文字数制限なし

---

## 8. タグ機能

### 8.1 タグの種類

#### **ユーザー作成タグ**
- ✅ **ユーザーが自由に作成**
  - 例: #家族旅行 #一人旅 #記念日

#### **システム推奨タグ**
- ✅ **システムが推奨タグを提供**
  - カテゴリ別タグ: #絶景 #グルメ #温泉 #アクティビティ #歴史 #自然 #夜景
  - 入力時にサジェスト表示

**両方に対応**

### 8.2 タグ検索

- ✅ **複数タグでAND/OR検索**
  - AND検索: 「#絶景 AND #温泉」→ 両方を含む
  - OR検索: 「#グルメ OR #レストラン」→ いずれかを含む
  - 検索UI: チェックボックスまたはタグクリック

---

## 9. 共有機能 🔜 **Phase 3（後回し）**

**注意**: このセクションの機能は全てPhase 3で実装予定です。

### 9.1 共有方法

- ✅ **URL共有（リンク生成）**
  - 共有リンクを生成してコピー
  - メール、メッセージアプリ等で送信

- ❌ **SNSシェアボタンは不要**
  - Twitter, Facebook等の直接投稿機能は実装しない
  - URL共有で十分

### 9.2 共有プレビュー

- ✅ **共有前にプレビュー機能**
  - 共有リンク生成前に表示内容を確認
  - プレビュー画面で公開範囲・有効期限等を設定

---

## 10. プライバシー設定 🔜 **Phase 3（後回し）**

**注意**: このセクションの機能は全てPhase 3で実装予定です。

### 10.1 公開範囲

- ✅ **旅行メンバー/許可したユーザーのみ**
  - 旅行メンバーは自動的に閲覧可能
  - それ以外のユーザーは個別に許可（メールアドレスまたはユーザーID指定）

- ❌ **一般公開は不要**
  - 誰でも閲覧できる公開リンクは作成しない

### 10.2 設定単位

- ✅ **アルバム全体に対して一括設定**
  - アルバム単位で公開範囲を設定
  - 個別のコンテンツ（写真1枚ずつ）には設定しない

### 10.3 有効期限

- ✅ **共有リンクの有効期限設定**
  - 期限なし
  - 7日間
  - 30日間
  - カスタム（任意の日付を指定）

### 10.4 パスワード保護

- ✅ **パスワード設定（オプション）**
  - パスワードなし（メンバーのみ）
  - パスワードあり（リンク＋パスワードで閲覧可能）

**どちらも選択可能**

---

## 11. 共有リンクの管理 🔜 **Phase 3（後回し）**

**注意**: このセクションの機能は全てPhase 3で実装予定です。

### 11.1 管理機能

以下のすべてを実装：

#### **発行したリンク一覧**
- ✅ 発行した共有リンク一覧を表示
  - どのアルバムを誰と共有したか
  - 有効期限
  - パスワード設定の有無

#### **リンクの無効化**
- ✅ 共有リンクを削除（無効化）
  - リンクをクリックしても「このリンクは無効です」と表示

#### **アクセスログ**
- ✅ 誰がいつ閲覧したか確認
  - ユーザー（閲覧者）
  - 閲覧日時
  - IPアドレス（オプション）

---

## 12. 思い出の編集

### 12.1 編集可能性

- ✅ **いつでも編集可能**
  - 写真の追加・削除
  - テキストの編集
  - タグの追加・削除
  - 評価の変更

### 12.2 編集履歴

- ✅ **編集履歴を保存**
  - 誰が・いつ・何を編集したか記録
  - タイムライン形式で表示
  - 変更前の内容は保存しない（最新版のみ）

---

## 13. ストレージ管理

### 13.1 容量制限

- ✅ **ユーザーごとに無制限**
  - 初期は制限なし
  - 🔜 将来的にプランによって制限導入

### 13.2 容量超過時の対応

- ✅ **圧縮して保存**
  - 画像を自動的に圧縮（例: 元画像8MB → 2MBに圧縮）
  - 動画も圧縮（解像度・ビットレート調整）
  - 圧縮率はシステム側で自動調整

---

## 14. 検索・フィルタリング

### 14.1 検索機能

- ✅ **必要**

#### **検索対象**

以下のすべてで検索可能：

| 検索対象 | 説明 | 例 |
|----------|------|-----|
| キーワード | テキスト内容を検索 | 「美味しかった」を含む |
| 日付 | 記録日で検索 | 2025年10月の思い出 |
| 場所 | 位置情報で検索 | 「京都」の思い出 |
| タグ | タグで検索 | #絶景 のタグがついた思い出 |

#### **検索UI**
- 検索バー（キーワード入力）
- フィルター（日付範囲、場所、タグを選択）
- 複合検索可能（キーワード + タグ + 日付範囲）

### 14.2 フィルタリング機能

以下のすべてでフィルタリング可能：

- ✅ **日付範囲**: 「2025年10月1日〜10月7日」
- ✅ **場所**: 「京都」「大阪」等
- ✅ **タグ**: 「#絶景」「#グルメ」等（複数選択可）
- ✅ **旅行ごと**: 「新潟旅行A」「山口旅行B」等

---

## 15. その他の機能

### 15.1 スライドショー

- ❌ **不要**
  - 自動再生機能は実装しない

### 15.2 コラージュ・レイアウト

- ❌ **不要**
  - 複数写真を1枚にまとめる機能は実装しない

### 15.3 フォトブック作成

- ❌ **初期は不要**
  - 🔜 将来的に検討（外部サービス連携）

---

## 16. データベース設計

### 16.1 テーブル構造

---

### **Phase 1-2 実装テーブル** ✅

以下のテーブルはPhase 1-2で実装します。

---

#### **memories（思い出コンテンツ）** ✅ Phase 1-2

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_id | UUID | ✅ | 旅行プランID（外部キー） |
| activity_id | UUID | ❌ | アクティビティID（外部キー、オプション） |
| content_type | ENUM | ✅ | photo/video/text/mixed |
| title | VARCHAR(255) | ❌ | タイトル |
| description | TEXT | ❌ | 説明・メモ |
| location_lat | DECIMAL(10,8) | ❌ | 緯度 |
| location_lng | DECIMAL(11,8) | ❌ | 経度 |
| location_address | VARCHAR(500) | ❌ | 住所 |
| rating | DECIMAL(2,1) | ❌ | 評価（0.0〜5.0） |
| recorded_at | TIMESTAMP | ✅ | 記録日時 |
| created_by | UUID | ✅ | 作成者ID |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| updated_at | TIMESTAMP | ✅ | 更新日時 |

**ENUM**: photo, video, text, mixed

**インデックス**: trip_id, activity_id, recorded_at, created_by

---

#### **memory_media（メディアファイル）** ✅ Phase 1-2

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| memory_id | UUID | ✅ | 思い出ID（外部キー） |
| media_type | ENUM | ✅ | photo/video |
| media_url | TEXT | ✅ | メディアファイル（Phase 1: Base64, Phase 2+: クラウドストレージURL） |
| storage_type | VARCHAR(20) | ✅ | 保存方式（'base64' / 'cloudinary' / 'cloudflare_r2'） |
| file_name | VARCHAR(255) | ✅ | ファイル名 |
| file_size | INTEGER | ✅ | ファイルサイズ（バイト） |
| mime_type | VARCHAR(100) | ✅ | MIMEタイプ |
| width | INTEGER | ❌ | 幅（px） |
| height | INTEGER | ❌ | 高さ（px） |
| duration | INTEGER | ❌ | 再生時間（秒、動画の場合） |
| thumbnail_url | TEXT | ❌ | サムネイル（Phase 1: Base64, Phase 2+: クラウドストレージURL） |
| order | INTEGER | ✅ | 表示順 |
| uploaded_at | TIMESTAMP | ✅ | アップロード日時 |

**ENUM**: photo, video

**インデックス**: memory_id, order

---

**画像・動画保存方法の移行計画**:

- **Phase 1（初期実装）**: Base64エンコードでDBに保存
  - `media_url`: Base64文字列
  - `thumbnail_url`: Base64文字列
  - `storage_type`: 'base64' (デフォルト値)

- **Phase 2（移行開始条件）**:
  - データベースサイズが10GB超過時
  - または Phase 2機能実装開始時点
  - ユーザー数の増加に応じて

- **移行方式（推奨: 段階的移行）**:
  - **新規アップロード**: クラウドストレージ（Cloudinary → Cloudflare R2）へ直接保存
  - **既存データ**: Base64のまま維持、バックグラウンドジョブで段階的に移行
  - **移行優先順位**: 大容量ファイル（動画・高解像度写真）から優先的に移行

- **データベーススキーマ変更**:
  ```sql
  -- storage_type カラムで保存方式を識別
  ALTER TABLE memory_media ADD COLUMN storage_type VARCHAR(20) DEFAULT 'base64';

  -- 'base64': media_urlにBase64文字列
  -- 'cloudinary': media_urlにCloudinary URL
  -- 'cloudflare_r2': media_urlにCloudflare R2 URL
  ```

- **下位互換性**:
  - メディア表示ロジックで `storage_type` を判定し両形式に対応
  - APIレスポンスに `storage_type` を含める
  - フロントエンドは `storage_type` に応じて適切にメディアを表示/再生
  - サムネイルも同様の方式で処理

- **バックグラウンド移行ジョブ**:
  ```typescript
  // 疑似コード: バックグラウンドで段階的にクラウド移行
  async function migrateMediaToCloud() {
    const batchSize = 100;
    const mediaToMigrate = await db.memory_media
      .where('storage_type', '=', 'base64')
      .orderBy('file_size', 'desc') // 大容量から優先
      .limit(batchSize)
      .get();

    for (const media of mediaToMigrate) {
      // Base64 → クラウドストレージへアップロード
      const cloudUrl = await uploadToCloud(media.media_url, media.mime_type);

      // DBを更新
      await db.memory_media.update(media.id, {
        media_url: cloudUrl,
        storage_type: 'cloudflare_r2',
      });
    }
  }
  ```

---

#### **memory_tags（タグ）** ✅ Phase 1-2

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| memory_id | UUID | ✅ | 思い出ID（外部キー） |
| tag_name | VARCHAR(100) | ✅ | タグ名 |
| is_system_tag | BOOLEAN | ✅ | システム推奨タグか |

**インデックス**: memory_id, tag_name

---

#### **ratings（評価・レビュー）** ✅ Phase 1-2

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| memory_id | UUID | ❌ | 思い出ID（外部キー、オプション） |
| trip_id | UUID | ❌ | 旅行プランID（旅行全体評価の場合） |
| activity_id | UUID | ❌ | アクティビティID（アクティビティ評価の場合） |
| rating | DECIMAL(2,1) | ✅ | 評価（0.0〜5.0） |
| review_text | TEXT | ❌ | レビューコメント |
| user_id | UUID | ✅ | 評価者ID |
| created_at | TIMESTAMP | ✅ | 作成日時 |

**インデックス**: memory_id, trip_id, activity_id, user_id

---

#### **memory_history（思い出編集履歴）** ✅ Phase 1-2

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| memory_id | UUID | ✅ | 思い出ID（外部キー） |
| user_id | UUID | ✅ | 編集者ID |
| action_type | VARCHAR(50) | ✅ | 編集種別（create/update/delete） |
| field_name | VARCHAR(100) | ❌ | 変更項目 |
| changed_at | TIMESTAMP | ✅ | 変更日時 |

**インデックス**: memory_id, changed_at

---

### **Phase 3 実装テーブル** 🔜

以下のテーブルはPhase 3（アルバム・共有機能）で実装します。

---

#### **albums（アルバム）** 🔜 Phase 3

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_id | UUID | ✅ | 旅行プランID（外部キー） |
| title | VARCHAR(255) | ✅ | アルバム名 |
| description | TEXT | ❌ | 説明 |
| cover_image_url | VARCHAR(500) | ❌ | カバー画像URL |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| updated_at | TIMESTAMP | ✅ | 更新日時 |

**インデックス**: trip_id

---

#### **album_memories（アルバムとメモリの関連）** 🔜 Phase 3

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| album_id | UUID | ✅ | アルバムID（外部キー） |
| memory_id | UUID | ✅ | 思い出ID（外部キー） |
| order | INTEGER | ✅ | アルバム内での順序 |
| added_at | TIMESTAMP | ✅ | 追加日時 |

**インデックス**: album_id, memory_id, order

---

#### **shared_links（共有リンク）** 🔜 Phase 3

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| album_id | UUID | ✅ | アルバムID（外部キー） |
| token | VARCHAR(100) | ✅ | 共有トークン（ランダム生成） |
| password_hash | VARCHAR(255) | ❌ | パスワードハッシュ |
| expires_at | TIMESTAMP | ❌ | 有効期限 |
| is_active | BOOLEAN | ✅ | 有効/無効 |
| created_by | UUID | ✅ | 作成者ID |
| created_at | TIMESTAMP | ✅ | 作成日時 |

**インデックス**: album_id, token, is_active

---

#### **shared_link_access（共有リンクアクセスログ）** 🔜 Phase 3

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| shared_link_id | UUID | ✅ | 共有リンクID（外部キー） |
| viewer_user_id | UUID | ❌ | 閲覧者ユーザーID（ログインユーザーの場合） |
| viewer_ip | VARCHAR(45) | ❌ | 閲覧者IPアドレス |
| accessed_at | TIMESTAMP | ✅ | アクセス日時 |

**インデックス**: shared_link_id, accessed_at

---

### 16.2 リレーションシップ

#### **Phase 1-2 リレーションシップ** ✅
```
trips (1) ─── (N) memories
activities (1) ─── (N) memories

memories (1) ─── (N) memory_media
memories (1) ─── (N) memory_tags
memories (1) ─── (N) ratings
memories (1) ─── (N) memory_history
```

#### **Phase 3 リレーションシップ** 🔜
```
trips (1) ─── (N) albums
albums (N) ─── (N) memories (through album_memories)
albums (1) ─── (N) shared_links
shared_links (1) ─── (N) shared_link_access
```

---

### 16.3 リレーションシップ（統合版）

```
trips (1) ─── (N) albums
trips (1) ─── (N) memories
activities (1) ─── (N) memories

albums (N) ─── (N) memories (through album_memories)
memories (1) ─── (N) memory_media
memories (1) ─── (N) memory_tags
memories (1) ─── (N) ratings

albums (1) ─── (N) shared_links
shared_links (1) ─── (N) shared_link_access

memories (1) ─── (N) memory_history
```

---

## 17. フロントエンド実装

### 17.1 コンポーネント設計

---

### **Phase 1-2 実装コンポーネント** ✅

#### **思い出記録**
- `MemoryForm`: 思い出追加フォーム
- `MemoryCard`: 思い出カード
- `MemoryDetail`: 思い出詳細表示
- `MediaUpload`: 写真・動画アップロード
- `LocationPicker`: 位置情報選択

#### **評価・タグ**
- `RatingInput`: 星評価入力
- `ReviewForm`: レビュー入力フォーム
- `TagInput`: タグ入力（オートコンプリート）
- `TagCloud`: タグクラウド表示

#### **検索・フィルター**
- `MemorySearch`: 検索バー
- `MemoryFilter`: フィルター設定
- `FilterChips`: 選択中のフィルター表示

#### **一覧表示**
- `MemoryList`: 旅行プランごとの思い出一覧
- `MemoryGrid`: グリッド表示

#### **地図表示**
- `MemoryMap`: 思い出の地図表示
- `MemoryPin`: 地図上のピン

---

### **Phase 3 実装コンポーネント** 🔜

#### **アルバム管理**
- `AlbumList`: アルバム一覧
- `AlbumCard`: アルバムカード
- `AlbumDetail`: アルバム詳細画面
- `AlbumSettings`: アルバム設定

#### **共有**
- `ShareDialog`: 共有設定ダイアログ
- `SharePreview`: 共有プレビュー
- `ShareLinkManager`: 共有リンク管理
- `AccessLogViewer`: アクセスログ表示

---

### 17.2 状態管理（Zustand）

#### **Phase 1-2 状態管理** ✅

```typescript
interface MemoryState {
  memories: Memory[];
  filters: MemoryFilters;
  searchQuery: string;

  // Actions
  fetchMemories: (tripId: string) => Promise<void>;
  addMemory: (data: MemoryData) => Promise<void>;
  updateMemory: (id: string, data: MemoryData) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;

  uploadMedia: (memoryId: string, files: File[]) => Promise<void>;

  addTag: (memoryId: string, tag: string) => Promise<void>;
  removeTag: (memoryId: string, tag: string) => Promise<void>;

  addRating: (data: RatingData) => Promise<void>;

  searchMemories: (query: string, filters: MemoryFilters) => Promise<void>;
}
```

#### **Phase 3 状態管理** 🔜

```typescript
interface AlbumState {
  albums: Album[];
  currentAlbum: Album | null;

  // Actions
  fetchAlbums: (tripId: string) => Promise<void>;
  createAlbum: (data: AlbumData) => Promise<void>;

  createShareLink: (albumId: string, options: ShareOptions) => Promise<string>;
  revokeShareLink: (linkId: string) => Promise<void>;
}
```

---

### 17.3 状態管理（統合版）

```typescript
interface MemoryState {
  albums: Album[];
  memories: Memory[];
  currentAlbum: Album | null;
  filters: MemoryFilters;
  searchQuery: string;

  // Actions
  fetchAlbums: (tripId: string) => Promise<void>;
  fetchMemories: (albumId: string) => Promise<void>;

  addMemory: (data: MemoryData) => Promise<void>;
  updateMemory: (id: string, data: MemoryData) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;

  uploadMedia: (memoryId: string, files: File[]) => Promise<void>;

  addTag: (memoryId: string, tag: string) => Promise<void>;
  removeTag: (memoryId: string, tag: string) => Promise<void>;

  addRating: (data: RatingData) => Promise<void>;

  createShareLink: (albumId: string, options: ShareOptions) => Promise<string>;
  revokeShareLink: (linkId: string) => Promise<void>;

  searchMemories: (query: string, filters: MemoryFilters) => Promise<void>;
}
```

---

## 18. 受け入れ基準

### 18.1 Phase 1-2 機能要件 ✅

- ✅ 写真・動画・テキスト・位置情報・評価・タグを記録できる
- ✅ アクティビティに紐付けて記録できる
- ✅ 独立して記録後、アクティビティに紐付けられる
- ✅ 位置情報を地図とテキストで表示できる
- ✅ 星5段階評価＋レビューコメントを記録できる
- ✅ タグ機能が動作する（ユーザー作成＋システム推奨）
- ✅ 思い出を編集できる
- ✅ 編集履歴が記録される
- ✅ 検索機能が動作する（キーワード・日付・場所・タグ）
- ✅ フィルタリング機能が動作する
- ✅ 旅行プランごとに思い出を一覧表示できる

### 18.2 Phase 3 機能要件 🔜

- 🔜 アルバムが旅行ごとに自動作成される
- 🔜 アルバムの並び替えができる
- 🔜 共有リンクを生成できる
- 🔜 共有時にプレビュー表示される
- 🔜 パスワード保護を設定できる
- 🔜 有効期限を設定できる
- 🔜 共有リンクを管理できる（一覧・無効化・アクセスログ）

### 18.3 非機能要件

- ✅ レスポンシブデザイン（モバイル対応）
- ✅ 画像・動画の自動圧縮
- ✅ 大容量ファイルのアップロード対応
- ✅ 適切なエラーハンドリング

### 18.4 テスト要件

#### **Phase 1-2** ✅
- ✅ ユニットテスト: カバレッジ80%以上
- ✅ E2Eテスト: 思い出記録〜検索までのフロー
- ✅ ファイルアップロードのテスト
- ✅ 検索・フィルタリングのテスト

#### **Phase 3** 🔜
- 🔜 E2Eテスト: アルバム作成〜共有までのフロー
- 🔜 共有リンクのセキュリティテスト

---

## 19. 関連ドキュメント

- [要件概要](./00-overview.md)
- [旅行プランの作成と管理](./02-itinerary-management.md)
- [キャンバスベース旅行プラン作成](./02-1-canvas-planning.md)
- [予算管理](./03-budget-management.md)
- [CLAUDE.md](../../CLAUDE.md) - 実装ルール
