# Phase 2.2c アクティビティ順序変更・一括操作機能 実装完了

## 実装日
2025-10-18

## 実装機能

### 1. アクティビティ順序変更機能
- **↑↓ボタンでの順序変更**: 同じ日内でアクティビティの順序を上下に移動
- **日をまたぐ移動**: ドロップダウンメニューで別の日へアクティビティを移動
- **スクロール位置保持**: 順序変更時に画面が最上部にスクロールしないよう、スクロール位置を保持

### 2. 一括操作機能
- **選択モード**: チェックボックスでアクティビティを複数選択可能
- **一括削除**: 選択した複数のアクティビティを一括削除
- **一括完了/未完了切り替え**: 選択したアクティビティのステータスを一括で変更
- **一括操作バー**: 画面下部に固定表示される操作バー

## 実装ファイル

### バックエンド

#### backend/src/services/activity.service.ts (Lines 617-954)
4つの新機能を追加:

1. **reorderActivity**: 同じ日内での順序変更
   - トランザクション処理で順序値を再計算
   - 上に移動: [newOrder, oldOrder)の範囲のorderを+1
   - 下に移動: (oldOrder, newOrder]の範囲のorderを-1

2. **moveActivityToDay**: 別の日への移動
   - トランザクション処理で両方の日の順序値を再計算
   - 元の日: 削除位置より後のorderを-1
   - 新しい日: 挿入位置以降のorderを+1

3. **batchDeleteActivities**: 一括削除
   - トランザクション処理で複数アクティビティを削除
   - 日ごとにグループ化して順序値を0から再採番

4. **batchToggleCompletion**: 一括完了/未完了切り替え
   - 複数アクティビティのisCompletedフラグを一括更新

#### backend/src/routes/activity.routes.ts (Lines 534-666)
4つの新しいAPIエンドポイントを追加:
- `PATCH /api/v1/activities/:id/reorder` - 順序変更
- `PATCH /api/v1/activities/:id/move` - 日移動
- `DELETE /api/v1/trips/:tripId/activities/batch` - 一括削除
- `PATCH /api/v1/trips/:tripId/activities/batch-complete` - 一括完了切り替え

### フロントエンド

#### frontend/src/services/activityService.ts (Lines 227-311)
4つのAPI呼び出し関数を追加:
- `reorderActivity(activityId, newOrder)`
- `moveActivityToDay(activityId, dayNumber, newOrder?)`
- `batchDeleteActivities(tripId, activityIds)`
- `batchToggleCompletion(tripId, activityIds, isCompleted)`

#### frontend/src/stores/activityStore.ts (Lines 43-47, 342-444)
4つのZustandアクションを追加:
- `reorderActivity` - 楽観的更新とソート
- `moveActivityToDay` - 楽観的更新とソート
- `batchDeleteActivities` - 一括削除
- `batchToggleCompletion` - 一括ステータス更新

#### frontend/src/components/ActivityCard.tsx (Lines 12-28, 202-265)
順序変更UIを追加:
- `isFirst`, `isLast` props - 最初/最後のアクティビティ判定
- `onMoveUp`, `onMoveDown` props - ↑↓ボタンのハンドラー
- `availableDays` prop - 移動可能な日のリスト
- `onMoveToDay` prop - 日移動のハンドラー
- UIに↑↓ボタンと日移動ドロップダウンを表示

#### frontend/src/pages/TripDetail.tsx
複数の機能追加:

1. **選択モード状態管理** (Lines 57-72)
   - `selectionMode` - 選択モード on/off
   - `selectedActivities` - 選択されたアクティビティIDのSet

2. **順序変更ハンドラー** (Lines 208-292)
   - `handleMoveUp` - ↑ボタン処理（スクロール位置保持）
   - `handleMoveDown` - ↓ボタン処理（スクロール位置保持）
   - `handleMoveToDay` - 日移動処理（スクロール位置保持）
   - スクロール位置保持の実装:
     ```typescript
     const scrollPosition = window.scrollY;
     await reorderActivity(activityId, newOrder);
     await fetchActivities(id);
     requestAnimationFrame(() => {
       window.scrollTo(0, scrollPosition);
     });
     ```

3. **一括操作ハンドラー** (Lines 294-323)
   - `handleBatchDelete` - 一括削除処理
   - `handleBatchComplete` - 一括完了/未完了切り替え

4. **一括操作バー UI** (Lines 733-779)
   - 画面下部に固定表示 (`fixed bottom-0`)
   - z-index: 40（モーダルより下）
   - ボタン: すべて選択、選択解除、完了にする、未完了にする、削除

5. **ActivityCardへのprops追加** (Lines 602-665)
   - 順序変更用のpropsを渡す
   - 選択モード用のチェックボックスを表示

## 修正した問題

### 問題1: リロードしないと順序が更新されない
**原因**: Zustandストアが楽観的更新のみで、バックエンドで更新された他のアクティビティの順序値を取得していなかった

**解決策**: `fetchActivities(id)` を各ハンドラーに追加して、サーバーから最新の順序値を取得

### 問題2: 順序変更時に画面が最上部にスクロールされる
**原因**: `fetchActivities(id)` によるReactの再レンダリングでスクロール位置がリセットされる

**解決策**: 
1. 操作前に `window.scrollY` でスクロール位置を保存
2. 操作完了後、`requestAnimationFrame` を使って次のレンダリング後にスクロール位置を復元

### 問題3: TypeScript型エラー
**原因**: `ActivityForm.tsx` 内のローカル `TripMember` 型定義が `trip.ts` の定義と不一致
- ActivityForm: `userId?: string` (string | undefined)
- trip.ts: `userId: string | null`

**解決策**: ActivityForm.tsx のローカル型定義を trip.ts に合わせて修正
```typescript
interface TripMember {
  id: string;
  userId: string | null;  // ?: string から変更
  guestName: string | null;  // ?: string から変更
  role: string;
  user?: {
    id: string;
    username: string;
    displayName: string | null;  // string から変更
  };
}
```

### 問題4: アクティビティ編集モーダルが見切れる
**原因**: モーダルの高さ制限で、フォームのコンテンツが長い場合に下部が見切れていた

**解決策**: モーダルの構造を変更 (frontend/src/pages/TripDetail.tsx Lines 720-771)
```typescript
// 修正前: flexでセンタリングしてoverflow-y-auto
<div className="fixed inset-0 ... flex justify-center items-center overflow-y-auto">
  <div className="bg-white ...">

// 修正後: 外側でoverflow、内側でmin-h-screen flex
<div className="fixed inset-0 ... overflow-y-auto">
  <div className="min-h-screen flex justify-center items-center p-4">
    <div className="bg-white ...">
```

これにより、フォーム全体をスクロールして表示可能になった。

## 技術的なポイント

### トランザクション処理
- Prismaの`$transaction`を使用して、複数の順序値更新を原子的に実行
- データの一貫性を保証

### スクロール位置保持
- `window.scrollY`で現在位置を保存
- `requestAnimationFrame`でReactのレンダリング完了後に復元
- ユーザー体験の向上

### 楽観的UI更新
- Zustandストアでローカル状態を即座に更新
- サーバーからの完全なデータで最終的な一貫性を確保

### z-index管理
- モーダル: z-50
- 一括操作バー: z-40
- 適切な重なり順を維持

## 動作確認済み

すべての機能が正常に動作することを確認:
- ✅ ↑↓ボタンでの順序変更
- ✅ 日をまたぐ移動
- ✅ スクロール位置保持
- ✅ 選択モード
- ✅ 一括削除
- ✅ 一括完了/未完了切り替え
- ✅ TypeScript型エラー解消
- ✅ アクティビティ編集モーダルのスクロール表示

## 関連メモリ
- requirements-itinerary-management.md - 旅程管理の要件定義
- phase2-2a-implementation-complete-2025-10-17.md - Phase 2.2a実装完了
- phase-2-2b-participants-transport-implementation.md - Phase 2.2b実装完了

## 次のフェーズ
Phase 2.3: 予算管理機能は既に完了済み

Phase 3: Canvas機能（未実装）
