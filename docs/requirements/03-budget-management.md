# 予算管理 - 要件定義

**ステータス**: ✅ 確定
**優先度**: 高
**最終更新日**: 2025-10-13

---

## 前提テーブル

このドキュメントは以下のテーブルが既に定義されていることを前提とします：

- **users**: ユーザー情報（詳細: [05-authentication.md](./05-authentication.md)）
- **trip_plans**: 旅行プラン（詳細: [02-itinerary-management.md](./02-itinerary-management.md)）
- **trip_plan_members**: 旅行メンバー（詳細: [02-itinerary-management.md](./02-itinerary-management.md)）
- **trip_plan_activities**: アクティビティ（詳細: [02-itinerary-management.md](./02-itinerary-management.md)）

---

## 1. 概要

旅行の予算を管理し、計画段階での予算設定、実費の記録、予算と実費の比較を行う機能。旅行プランのアクティビティと自動連携し、メンバーごとの支出管理・割り勘計算も対応する。

---

## 2. 費目（カテゴリ）管理

### 2.1 標準費目

以下の費目を標準で用意する：

| 費目 | 説明 |
|------|------|
| 交通費 | 電車、バス、タクシー、飛行機等 |
| 宿泊費 | ホテル、旅館、民泊等 |
| 食費 | レストラン、カフェ、食材等 |
| 観光費・入場料 | 観光地の入場料、チケット等 |
| アクティビティ費 | 体験プログラム、ツアー等 |
| ショッピング費 | お土産、買い物等 |
| その他 | その他の支出 |

### 2.2 カスタマイズ機能

- ✅ **費目の追加**: ユーザーが独自の費目を追加可能
- ✅ **費目の削除**: 不要な費目を削除可能（標準費目も削除可）
- ✅ **費目の名前変更**: 費目名をカスタマイズ可能

### 2.3 費目の自動判定

旅行プランのアクティビティから自動的に費目を判定：
- アクティビティタイプ「食事」→ 費目「食費」
- アクティビティタイプ「宿泊」→ 費目「宿泊費」
- アクティビティタイプ「観光地訪問」→ 費目「観光費・入場料」
- 移動情報 → 費目「交通費」

**注意**: 自動判定後、ユーザーが手動で変更可能

---

## 3. 通貨対応

### 3.1 対応通貨

- ✅ **日本円（JPY）のみ対応**
- すべての予算・支出は日本円で管理
- 通貨記号: ¥

### 3.2 制約事項

- ❌ 複数通貨での入力は非対応
- ❌ 為替レート換算機能なし
- **理由**: 実装のシンプル化、為替レートAPI不要

### 3.3 将来的な拡張

Phase 2以降で以下の機能を検討：
- 手動での通貨換算機能
- 複数通貨対応（ユーザーが為替レートを手動入力）

---

## 4. 予算の設定

### 4.1 予算設定の単位

以下のすべての単位で予算設定が可能：

#### **旅行全体の総予算**
- 旅行全体の上限金額を設定
- 例：「この旅行の総予算は10万円」

#### **費目ごとの予算**
- 各費目に個別の予算を設定
- 例：「交通費 2万円、宿泊費 3万円、食費 2万円...」

#### **日ごとの予算**
- 各日に予算を設定
- 例：「1日目 2万円、2日目 3万円...」

#### **メンバーごとの予算（オプション）**
- 各メンバーに個別の予算を設定可能（必須ではない）
- 例：「太郎の予算 5万円、花子の予算 4万円」

### 4.2 予算の自動分配

- ✅ 総予算を設定した場合、費目ごとに自動分配（オプション）
- ✅ 過去の旅行や標準的な割合から推奨配分を提案

---

## 5. 実費の記録

### 5.1 自動記録（旅行プランとの連携）

- ✅ **旅行プランのアクティビティから自動反映**
  - アクティビティに料金を入力 → 予算管理に自動追加
  - 費目は自動判定（手動変更可能）
  - リアルタイム同期

### 5.2 手動記録

#### **入力項目**

| 項目 | 必須 | 説明 |
|------|------|------|
| 金額 | ✅ | 支出額（日本円） |
| 費目 | ✅ | 支出のカテゴリ |
| 日付 | ✅ | 支出日 |
| メモ・説明 | ❌ | 詳細情報（オプション） |
| 領収書画像 | ❌ | 領収書の写真（オプション） |
| 支払い方法 | ❌ | 現金/カード等（オプション） - **不要** |

#### **支払い方法**
- ❌ **支払い方法の記録は不要**
- 将来的に必要になった場合に追加検討

### 5.3 領収書画像

#### **アップロード**
- ✅ **画像アップロード機能**: 領収書の写真を保存
- ✅ **保存先**: データベース（Base64エンコード）
  - 🔜 **将来的に**: クラウドストレージ（S3, Cloudinary等）に移行

#### **容量制限**
- ✅ **初期は無制限**
- 🔜 **実装完了後**: 適切な制限を設定（例: 1枚5MB、旅行全体100MB等）

#### **OCR機能**
- ❌ **自動テキスト抽出は不要**

#### **画像保存方法の移行計画**

- **Phase 1（初期実装）**: Base64エンコードでDBに保存
  - `receipt_url`: Base64文字列
  - `storage_type`: 'base64' (デフォルト値)

- **Phase 2（移行開始条件）**:
  - データベースサイズが10GB超過時
  - または Phase 2機能実装開始時点
  - 領収書画像の累積サイズがしきい値超過時

- **移行方式（推奨: 段階的移行）**:
  - **新規アップロード**: クラウドストレージ（Cloudinary → Cloudflare R2）へ直接保存
  - **既存データ**: Base64のまま維持、バックグラウンドで段階的に移行
  - **移行優先順位**: 大容量ファイルから優先的に移行

- **データベーススキーマ変更**:
  ```sql
  -- expensesテーブルにstorage_typeカラムを追加
  ALTER TABLE expenses ADD COLUMN storage_type VARCHAR(20) DEFAULT 'base64';

  -- 'base64': receipt_urlにBase64文字列
  -- 'cloudinary': receipt_urlにCloudinary URL
  -- 'cloudflare_r2': receipt_urlにCloudflare R2 URL
  ```

- **下位互換性**:
  - 領収書表示ロジックで `storage_type` を判定し両形式に対応
  - APIレスポンスに `storage_type` を含める
  - フロントエンドは `storage_type` に応じて適切に画像を表示

### 5.4 定期的な支出（日割り計算）

- ✅ **必要**
- 自動計算機能:
  - 例：「宿泊費 15,000円/泊 × 3泊 = 45,000円」
  - 単価と日数/回数を入力して自動計算
- 適用例:
  - 宿泊費（1泊あたりの料金 × 泊数）
  - レンタカー（1日あたりの料金 × 日数）

---

## 6. 予算と実費の比較

### 6.1 表示形式

- ✅ **数値のみで表示**
- 表示項目:
  - 予算額
  - 実費額
  - 残額（予算 - 実費）
  - 使用率（実費 / 予算 × 100%）

### 6.2 表示例

```
総予算: 100,000円
実費: 75,000円
残額: 25,000円
使用率: 75%

[費目別内訳]
交通費
  予算: 20,000円
  実費: 18,000円
  残額: 2,000円

宿泊費
  予算: 30,000円
  実費: 32,000円
  残額: -2,000円（超過）
```

### 6.3 予算超過時の警告

- ❌ **警告表示は不要**
- 残額がマイナスの場合は赤字で表示（視覚的なフィードバック）

---

## 7. グラフ・可視化

### 7.1 グラフ表示

- ❌ **グラフ・チャート表示は不要**
- 数値とテーブルでのシンプルな表示のみ

### 7.2 レポート出力

- ❌ **PDF出力は不要**
- ❌ **CSV/Excelエクスポートは不要**
- 画面上での確認のみ

---

## 8. 旅行プランとの連携

### 8.1 双方向編集

- ✅ **アクティビティごとに予算項目が自動作成**
- ✅ **予算項目からアクティビティへのリンク表示**
  - 予算項目をクリック → 対応するアクティビティに遷移
- ✅ **双方向で編集可能**
  - アクティビティの料金変更 → 予算に自動反映
  - 予算の金額変更 → アクティビティに反映（オプション）

### 8.2 リアルタイム同期

- ✅ **アクティビティの料金変更時、予算も自動更新**
- ✅ **デバウンス処理**: 連続入力時は一定時間後に同期

---

## 9. メンバーごとの予算管理

### 9.1 個別予算設定

- ✅ **メンバーごとに予算を設定可能**（オプション、必須ではない）
  - 例：太郎 50,000円、花子 40,000円

### 9.2 支出の記録

- ✅ **各支出に「誰が払ったか」を記録**
- ✅ **各支出に「誰が負担するか」を記録**
  - 均等割り（全員同額）
  - 不均等割り（メンバーごとに負担額を指定）

### 9.3 メンバー別表示

- ❌ **メンバー別のサマリー表示は不要**
- ✅ **割り勘計算・精算機能で個別支出を確認可能**

---

## 10. 割り勘計算機能

### 10.1 割り勘の計算方法

#### **均等割り**
- 支出を全員で均等に分割
- 例：15,000円 ÷ 3人 = 各5,000円

#### **不均等割り**
- メンバーごとに負担額を指定
- 例：宿泊費 15,000円 → 太郎 6,000円、花子 5,000円、次郎 4,000円

### 10.2 立て替え精算の自動計算

#### **機能**
- ✅ **「誰が誰にいくら払う必要があるか」を自動計算**
- ✅ **支払い回数を最小化するアルゴリズム**

#### **計算例**

```
【支出記録】
- 太郎が宿泊費 15,000円を立替（3人で均等割り → 各5,000円負担）
- 花子がレストラン代 9,000円を立替（3人で均等割り → 各3,000円負担）
- 次郎が交通費 6,000円を立替（3人で均等割り → 各2,000円負担）

【各メンバーの収支】
太郎: 立替 15,000円 - 負担 10,000円 = +5,000円（受け取る）
花子: 立替 9,000円 - 負担 10,000円 = -1,000円（払う）
次郎: 立替 6,000円 - 負担 10,000円 = -4,000円（払う）

【最適な精算方法（自動計算）】
- 花子 → 太郎: 1,000円
- 次郎 → 太郎: 4,000円
```

### 10.3 精算ステータス管理

- ✅ **ステータス管理が必要**

| ステータス | 説明 |
|-----------|------|
| 未精算 | まだ精算が完了していない |
| 精算済み | 精算が完了した |

- ✅ 各精算項目（「花子 → 太郎: 1,000円」等）にステータスを付与
- ✅ ステータス変更機能（チェックボックス等）

---

## 11. 予算テンプレート機能

### 11.1 テンプレート作成

#### **含める情報**
- ✅ 費目とその予算額
- ✅ メンバー情報（予算含む）
- ✅ すべての予算設定情報

### 11.2 テンプレートの使用

- ✅ **過去の旅行から予算をコピー**
- ✅ **標準的な予算テンプレートを作成**
  - 例：「国内旅行2泊3日の標準予算」
- ✅ **テンプレートから新規旅行の予算を作成**
- ✅ **カスタマイズ後に保存**

### 11.3 テンプレートの共有

- ✅ **初期は個人用のみ**
- 🔜 **将来的に他ユーザーと共有可能**（フェーズ2以降）

---

## 12. 予算履歴管理

### 12.1 記録する変更内容

以下のすべての変更を履歴として記録：

- ✅ 予算額の変更
- ✅ 費目の追加・削除・名前変更
- ✅ 実費の追加・編集・削除
- ✅ 割り勘設定の変更

### 12.2 履歴情報

各履歴に以下を記録：

| 項目 | 説明 |
|------|------|
| 日時 | 変更日時 |
| ユーザー | 誰が変更したか |
| 変更内容 | 何を変更したか |
| 変更前の値 | 変更前の値 |
| 変更後の値 | 変更後の値 |

### 12.3 履歴の表示

- ✅ **タイムライン形式で表示**
- 表示例:
  ```
  2025-10-09 14:30 - 太郎
    宿泊費の予算を 30,000円 → 35,000円 に変更

  2025-10-09 12:15 - 花子
    「カフェ代 800円」を食費に追加

  2025-10-08 18:45 - 太郎
    旅行全体の予算を 100,000円 に設定
  ```

---

## 13. 予算アラート・通知

### 13.1 アラート機能

- ❌ **予算アラート・通知機能は不要**
- 予算超過は画面上で視覚的に確認可能（赤字表示等）

---

## 14. データベース設計

### 14.1 テーブル構造

#### **budgets（予算設定）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_plan_id | UUID | ✅ | 旅行プランID（外部キー: trip_plans.id） |
| total_budget | DECIMAL(12,2) | ❌ | 総予算（日本円） |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| updated_at | TIMESTAMP | ✅ | 更新日時 |

**インデックス**: trip_plan_id

---

#### **budget_categories（費目別予算）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| budget_id | UUID | ✅ | 予算ID（外部キー） |
| category_name | VARCHAR(100) | ✅ | 費目名 |
| amount | DECIMAL(12,2) | ✅ | 予算額 |
| is_custom | BOOLEAN | ✅ | カスタム費目かどうか |
| order | INTEGER | ✅ | 表示順 |

**インデックス**: budget_id

---

#### **daily_budgets（日別予算）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| budget_id | UUID | ✅ | 予算ID（外部キー） |
| day_id | UUID | ✅ | 日程ID（外部キー） |
| amount | DECIMAL(12,2) | ✅ | その日の予算 |

**インデックス**: budget_id, day_id

---

#### **member_budgets（メンバー別予算）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| budget_id | UUID | ✅ | 予算ID（外部キー） |
| member_id | UUID | ✅ | メンバーID（外部キー） |
| amount | DECIMAL(12,2) | ❌ | メンバーの予算（オプション） |

**インデックス**: budget_id, member_id

---

#### **expenses（実費記録）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_plan_id | UUID | ✅ | 旅行プランID（外部キー: trip_plans.id） |
| activity_id | UUID | ❌ | アクティビティID（外部キー: trip_plan_activities.id、オプション） |
| category_name | VARCHAR(100) | ✅ | 費目 |
| amount | DECIMAL(12,2) | ✅ | 金額（日本円） |
| date | DATE | ✅ | 支出日 |
| memo | TEXT | ❌ | メモ・説明 |
| receipt_url | TEXT | ❌ | 領収書画像（Phase 1: Base64, Phase 2+: クラウドストレージURL） |
| storage_type | VARCHAR(20) | ❌ | 保存方式（'base64' / 'cloudinary' / 'cloudflare_r2'） |
| paid_by_member_id | UUID | ❌ | 支払ったメンバーID（trip_plan_members.id） |
| is_recurring | BOOLEAN | ✅ | 定期支出かどうか |
| unit_price | DECIMAL(12,2) | ❌ | 単価（定期支出の場合） |
| quantity | INTEGER | ❌ | 数量（定期支出の場合） |
| created_at | TIMESTAMP | ✅ | 作成日時 |
| updated_at | TIMESTAMP | ✅ | 更新日時 |

**インデックス**: trip_plan_id, activity_id, date, paid_by_member_id

---

#### **expense_splits（支出の負担分割）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| expense_id | UUID | ✅ | 実費ID（外部キー） |
| member_id | UUID | ✅ | メンバーID（外部キー） |
| amount | DECIMAL(12,2) | ✅ | 負担額 |
| is_equal_split | BOOLEAN | ✅ | 均等割りかどうか |

**インデックス**: expense_id, member_id

---

#### **settlements（精算情報）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_id | UUID | ✅ | 旅行プランID（外部キー） |
| from_member_id | UUID | ✅ | 支払う人（外部キー） |
| to_member_id | UUID | ✅ | 受け取る人（外部キー） |
| amount | DECIMAL(12,2) | ✅ | 金額 |
| currency | VARCHAR(3) | ✅ | 通貨（Phase 1では'JPY'固定、Phase 2以降で複数通貨対応） |
| status | ENUM | ✅ | pending/completed |
| settled_at | TIMESTAMP | ❌ | 精算完了日時 |
| created_at | TIMESTAMP | ✅ | 作成日時 |

**ENUM**: pending（未精算）, completed（精算済み）

**インデックス**: trip_id, from_member_id, to_member_id, status

---

#### **budget_templates（予算テンプレート）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| user_id | UUID | ✅ | 作成者ID |
| name | VARCHAR(255) | ✅ | テンプレート名 |
| description | TEXT | ❌ | 説明 |
| template_data | JSON | ✅ | テンプレートデータ |
| is_public | BOOLEAN | ✅ | 公開/非公開 |
| created_at | TIMESTAMP | ✅ | 作成日時 |

**インデックス**: user_id, is_public

---

#### **budget_history（予算履歴）**

| カラム名 | 型 | 必須 | 説明 |
|----------|-----|------|------|
| id | UUID | ✅ | 主キー |
| trip_id | UUID | ✅ | 旅行プランID（外部キー） |
| user_id | UUID | ✅ | 変更者ID |
| change_type | VARCHAR(50) | ✅ | 変更種別 |
| field_name | VARCHAR(100) | ✅ | 変更項目 |
| old_value | TEXT | ❌ | 変更前の値（JSON） |
| new_value | TEXT | ❌ | 変更後の値（JSON） |
| changed_at | TIMESTAMP | ✅ | 変更日時 |

**インデックス**: trip_id, changed_at

---

### 14.2 リレーションシップ

```
trips (1) ─── (1) budgets
budgets (1) ─── (N) budget_categories
budgets (1) ─── (N) daily_budgets
budgets (1) ─── (N) member_budgets

trips (1) ─── (N) expenses
activities (1) ─── (N) expenses
expenses (1) ─── (N) expense_splits

trips (1) ─── (N) settlements
trip_members (1) ─── (N) settlements (from/to)

users (1) ─── (N) budget_templates
trips (1) ─── (N) budget_history
```

---

## 15. フロントエンド実装

### 15.1 コンポーネント設計

#### **予算管理メイン**
- `BudgetOverview`: 予算概要・サマリー
- `BudgetSetup`: 予算設定画面
- `BudgetCategoryList`: 費目別予算一覧
- `BudgetProgress`: 予算使用率表示

#### **実費記録**
- `ExpenseList`: 実費一覧
- `ExpenseForm`: 実費入力フォーム
- `ExpenseCard`: 実費カード
- `ReceiptUpload`: 領収書アップロード
- `RecurringExpenseCalculator`: 定期支出計算機

#### **割り勘・精算**
- `ExpenseSplitForm`: 割り勘設定フォーム
- `SettlementCalculator`: 精算自動計算
- `SettlementList`: 精算一覧
- `SettlementStatus`: 精算ステータス管理


#### **テンプレート**
- `BudgetTemplateList`: テンプレート一覧
- `BudgetTemplateSelector`: テンプレート選択
- `BudgetTemplateSaveDialog`: テンプレート保存

#### **履歴**
- `BudgetHistory`: 予算履歴タイムライン

### 15.2 状態管理（Zustand）

```typescript
interface BudgetState {
  budget: Budget | null;
  expenses: Expense[];
  settlements: Settlement[];

  // Actions
  fetchBudget: (tripId: string) => Promise<void>;
  updateBudget: (data: BudgetData) => Promise<void>;

  addExpense: (data: ExpenseData) => Promise<void>;
  updateExpense: (id: string, data: ExpenseData) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  calculateSettlements: (tripId: string) => Promise<void>;
  updateSettlementStatus: (id: string, status: SettlementStatus) => Promise<void>;
}
```

---

## 16. 割り勘計算アルゴリズム

### 16.1 精算の最適化アルゴリズム

#### **目的**
- 支払い回数を最小化
- 各メンバーの収支をゼロにする

#### **アルゴリズム概要**

1. **各メンバーの収支を計算**
   ```
   収支 = 立替金額 - 負担金額
   ```

2. **プラスのメンバー（受け取る人）とマイナスのメンバー（払う人）に分ける**

3. **貪欲法で精算ペアを作成**
   - 最も多く受け取る人と最も多く払う人をマッチング
   - 小さい方の金額で精算
   - 収支がゼロになったメンバーをリストから削除
   - すべてのメンバーの収支がゼロになるまで繰り返し

#### **実装例（疑似コード）**

```typescript
function calculateSettlements(expenses: Expense[]): Settlement[] {
  // 1. 各メンバーの収支を計算
  const balances = calculateBalances(expenses);

  // 2. プラス（受け取る）とマイナス（払う）に分類
  const creditors = balances.filter(b => b.amount > 0).sort((a, b) => b.amount - a.amount);
  const debtors = balances.filter(b => b.amount < 0).sort((a, b) => a.amount - b.amount);

  const settlements: Settlement[] = [];

  // 3. 貪欲法で精算ペアを作成
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const amount = Math.min(creditor.amount, Math.abs(debtor.amount));

    settlements.push({
      from: debtor.memberId,
      to: creditor.memberId,
      amount: amount,
    });

    creditor.amount -= amount;
    debtor.amount += amount;

    if (creditor.amount === 0) creditors.shift();
    if (debtor.amount === 0) debtors.shift();
  }

  return settlements;
}
```

---

## 17. パフォーマンス最適化

### 17.1 計算の最適化

#### **予算集計の高速化**
- ✅ **メモ化**: 頻繁に計算する合計値をキャッシュ
- ✅ **デバウンス**: リアルタイム計算は500msのデバウンス処理
- ✅ **インクリメンタル計算**: 全体を再計算せず差分のみ更新

#### **データベースクエリの最適化**
- ✅ **適切なインデックス**: `trip_plan_id`, `created_at`, `category` にインデックス
- ✅ **集計クエリ**: SQLの`SUM`、`GROUP BY`を活用
- ✅ **ページネーション**: 大量の経費データは分割取得

### 17.2 データキャッシング

#### **フロントエンドキャッシング**
- ✅ **TanStack Query**: サーバーデータを5分間キャッシュ
- ✅ **楽観的更新**: 編集時は即座にUIを更新、バックグラウンドで同期
- ✅ **無効化戦略**: 関連データ変更時は自動的にキャッシュ無効化

#### **計算結果のキャッシュ**
```typescript
// 予算サマリーのメモ化例
const budgetSummary = useMemo(() => {
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
}, [expenses]);
```

### 17.3 リアルタイム更新の最適化

- ✅ **バッチ更新**: 複数の変更をまとめて送信
- ✅ **WebSocketの選択的使用**: 共同編集時のみWebSocket、それ以外はポーリング
- ✅ **差分同期**: 変更部分のみ送受信

---

## 18. 受け入れ基準

### 18.1 機能要件

- ✅ 予算設定が動作する（総予算/費目別/日別/メンバー別）
- ✅ 費目のカスタマイズができる
- ✅ 実費の記録ができる（手動/自動、日本円のみ）
- ✅ 定期支出の日割り計算ができる
- ✅ 領収書画像のアップロードができる
- ✅ 予算と実費の比較表示が正しい
- ✅ 旅行プランのアクティビティと自動連携する
- ✅ リアルタイム同期が動作する
- ✅ 割り勘計算（均等/不均等）ができる
- ✅ 精算の自動計算が正しく動作する
- ✅ 精算ステータス管理ができる
- ✅ 予算テンプレート機能が動作する
- ✅ 予算履歴がタイムライン表示される

### 18.2 非機能要件

- ✅ レスポンシブデザイン
- ✅ 適切なエラーハンドリング

### 18.3 テスト要件

- ✅ ユニットテスト: カバレッジ80%以上
- ✅ 割り勘計算アルゴリズムのテスト
- ✅ E2Eテスト: 予算設定〜実費記録〜精算までのフロー

---

## 19. 関連ドキュメント

- [要件概要](./00-overview.md)
- [旅行プラン検索](./01-search-and-proposal.md)
- [旅行プランの作成と管理](./02-itinerary-management.md)
- [キャンバスベース旅行プラン作成](./02-1-canvas-planning.md)
- [外部サービス連携](./07-external-services.md)
- [CLAUDE.md](../../CLAUDE.md) - 実装ルール
