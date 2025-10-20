# キャンバスプランニング機能実装状況 (2025-10-21)

## 実装完了済み

### 1. プラン案強調表示機能とバッジ表示 ✅

**機能概要:**
- プラン案リストでプラン案をクリックすると、そのプラン案に属するカードと接続を色付きボーダーで強調表示
- 各カードのヘッダーに所属プラン案のバッジ（A, B, C...）を表示
- キャンバス空白部分クリックで選択解除

**実装ファイル:**
- `frontend/src/components/canvas/ActivityCardNode.tsx`
  - `ActivityCardNodeData`インターフェースに`proposalBadges`追加
  - カードヘッダーにバッジ表示UIを実装（色付き、プラン案名表示）
  
- `frontend/src/pages/CanvasPlanning.tsx`
  - プラン案変更時にバッジを自動更新するuseEffect (262-283行目)
  - プラン案選択時の強調表示useEffect (285-356行目)
    - カード: `boxShadow: 0 0 0 3px ${color}`
    - 接続: `stroke: ${color}`, `strokeWidth: 4`
  - キャンバス空白クリックハンドラー`handlePaneClick` (375-380行目)
  - ReactFlowに`onPaneClick`イベント追加 (738行目)

**技術的詳細:**
- バッジ計算: proposals配列をフィルタして各カードが属するプラン案を特定
- 強調表示: selectedProposalIdの変更時にnodesとedgesのstyleプロパティを更新
- 依存配列の最適化: setNodes/setEdgesを除外して無限ループを防止

---

### 2. ProposalListのUI変更 ✅

**変更内容:**
- **変更前:** プラン案をクリック→展開→編集/削除/正式プラン決定ボタンが出現
- **変更後:** すべてのコントロールを常時表示

**実装詳細:**

#### 削除した機能:
- `expandedProposalId` state
- 展開/折りたたみボタン（▶/▼）
- 展開時のみ表示されるアクションエリア

#### 追加した機能:
1. **日程選択ドロップダウン** (常時表示)
   - 旅行プランの開始日〜終了日の範囲から選択
   - `getAvailableDates()`関数で日付リストを生成
   - 選択時に`onUpdateProposalDate`でリアルタイム更新
   - 旅行日程未設定時は非活性

2. **アクションボタン** (常時表示)
   - 編集ボタン
   - 削除ボタン（正式プランでない場合のみ）
   - 正式プラン決定ボタン
     - 日程未選択時は非活性（グレーアウト）
     - ホバー時にツールチップ表示

**実装ファイル:**
- `frontend/src/components/canvas/ProposalList.tsx`
  - Props追加: `tripStartDate`, `tripEndDate`, `onUpdateProposalDate`
  - `getAvailableDates()`関数 (37-61行目)
  - 日程選択ドロップダウン (184-214行目)
  - アクションボタン (209-249行目)

- `frontend/src/pages/CanvasPlanning.tsx`
  - `handleUpdateProposalDate`ハンドラー追加 (616-627行目)
  - ProposalListに日程データを渡す (809-810行目)

- `frontend/src/stores/canvasStore.ts`
  - 既存の`updateProposal`関数を利用（変更なし）

**UI改善効果:**
- 操作ステップ削減（3クリック → 1クリック）
- 日程の視認性向上
- 条件の明確化（日程選択が必須であることが一目瞭然）

---

## 実装未完了（元に戻した）

### 3. 正式プラン解除機能 ❌

**問題の本質:**

正式プラン設定は2つの処理で構成される:
1. `trip_plan_proposals.isOfficial = true`
2. キャンバスカードを`trip_plan_activities`にコピー（従来型構造に変換）
   - 実装場所: `backend/src/services/proposal-conversion.service.ts::selectOfficialProposal`
   - 処理内容:
     - proposalDateから旅行の何日目かを計算（dayNumber）
     - 同じ日の既存trip_plan_activitiesを削除
     - canvas_activity_cardsをtrip_plan_activitiesに変換してコピー
     - trip_plansのstatusを'planning'に更新

**正式プラン解除に必要な処理:**
1. `trip_plan_proposals.isOfficial = false`
2. **対応するtrip_plan_activitiesを削除** ← これが欠けていた

**試行した失敗アプローチ:**

既存の`updateProposal` APIを使用する方法:
```typescript
// frontend/src/stores/canvasStore.ts
await canvasService.updateProposal(tripId, proposalId, { isOfficial: false } as any);
```

**失敗理由:**
1. 型定義の問題:
   - `frontend/src/types/canvas.ts::UpdateProposalData`に`isOfficial`フィールドがない
   - `backend/src/models/canvas.model.ts::updateProposalSchema`に`isOfficial`がない

2. **最も重要な問題:**
   - `backend/src/services/canvas.service.ts::updateProposal` (405-427行目)は`name`, `color`, `proposalDate`のみ処理
   - **trip_plan_activitiesの削除処理が完全に欠落**

**参考実装:**

1. **正式プラン削除時の処理** (`backend/src/services/canvas.service.ts::deleteProposal`, 446-464行目):
```typescript
if (proposal.isOfficial && proposal.proposalDate && proposal.tripPlan.startDate) {
  // proposalDateから日数を計算
  const tripStartDate = new Date(proposal.tripPlan.startDate);
  const proposalDateObj = new Date(proposal.proposalDate);
  tripStartDate.setHours(0, 0, 0, 0);
  proposalDateObj.setHours(0, 0, 0, 0);
  
  const diffTime = proposalDateObj.getTime() - tripStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const dayNumber = diffDays + 1;
  
  // 該当する日のアクティビティを削除
  await prisma.tripPlanActivity.deleteMany({
    where: { tripPlanId, dayNumber },
  });
}
```

2. **正式プラン設定時の処理** (`backend/src/services/proposal-conversion.service.ts::selectOfficialProposal`, 71-150行目):
- トランザクション内で処理
- 同じ日付の既存正式プランを下書きに変更
- trip_plan_activitiesを削除してから新規作成

---

## 今後の実装計画

### 正式プラン解除機能の完全実装

**アーキテクチャ方針:**
- 既存のupdateProposal APIは使用しない
- 専用のDELETEエンドポイント`DELETE /trips/:tripId/canvas/proposals/:proposalId/select-official`を作成
- proposal-conversion.service.tsに`unselectOfficialProposal`関数を追加

**実装手順:**

#### ステップ1: バックエンドサービス層

**ファイル:** `backend/src/services/proposal-conversion.service.ts`

新規関数を追加:
```typescript
/**
 * 正式プランを解除し、対応するtrip_plan_activitiesを削除
 */
export async function unselectOfficialProposal(
  tripPlanId: string,
  proposalId: string,
  userId: string
) {
  // 権限チェックは不要（proposal-conversion.service内部で実施）
  
  // プラン案取得
  const proposal = await prisma.tripPlanProposal.findUnique({
    where: { id: proposalId },
    include: {
      tripPlan: true,
    },
  });

  if (!proposal) {
    throw new Error('プラン案が見つかりません');
  }

  if (!proposal.isOfficial) {
    throw new Error('このプラン案は正式プランではありません');
  }

  // proposalDateから日数を計算してtrip_plan_activitiesを削除
  if (proposal.proposalDate && proposal.tripPlan.startDate) {
    const tripStartDate = new Date(proposal.tripPlan.startDate);
    const proposalDateObj = new Date(proposal.proposalDate);
    tripStartDate.setHours(0, 0, 0, 0);
    proposalDateObj.setHours(0, 0, 0, 0);

    const diffTime = proposalDateObj.getTime() - tripStartDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const dayNumber = diffDays + 1;

    console.log('正式プラン解除:', {
      proposalId,
      proposalDate: proposalDateObj.toISOString(),
      dayNumber,
    });

    // トランザクションで処理
    await prisma.$transaction(async (tx) => {
      // 1. 対応するtrip_plan_activitiesを削除
      //    isFromCanvas=trueのみ削除（キャンバスから作成されたもの）
      await tx.tripPlanActivity.deleteMany({
        where: {
          tripPlanId,
          dayNumber,
          isFromCanvas: true,
        },
      });

      // 2. isOfficialをfalseに
      await tx.tripPlanProposal.update({
        where: { id: proposalId },
        data: {
          isOfficial: false,
        },
      });
    });
  } else {
    // proposalDateがない場合は単にisOfficialをfalseに
    // （通常このケースは発生しないはずだが、防御的に実装）
    await prisma.tripPlanProposal.update({
      where: { id: proposalId },
      data: {
        isOfficial: false,
      },
    });
  }

  // 更新後のプラン案を返す
  const updatedProposal = await prisma.tripPlanProposal.findUnique({
    where: { id: proposalId },
  });

  return updatedProposal;
}
```

**注意点:**
- `isFromCanvas: true`でフィルタリングしてキャンバス由来のアクティビティのみ削除
- proposalDateがない場合の防御的処理も追加
- トランザクションで原子性を保証

#### ステップ2: バックエンドルーティング層

**ファイル:** `backend/src/routes/canvas.routes.ts`

`selectOfficialProposal`エンドポイント（410-436行目）の後に追加:
```typescript
// 正式プラン解除（キャンバス→従来型構造の変換を取り消し）
fastify.delete(
  '/trips/:tripId/canvas/proposals/:proposalId/select-official',
  { preHandler: authMiddleware },
  async (request, reply) => {
    try {
      const { tripId, proposalId } = request.params as { tripId: string; proposalId: string };
      const userId = request.user!.userId;

      const proposal = await proposalConversionService.unselectOfficialProposal(
        tripId,
        proposalId,
        userId
      );

      return reply.status(200).send({
        success: true,
        data: proposal,
        message: '正式プランを解除しました',
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(400).send({
        success: false,
        message: error instanceof Error ? error.message : '正式プラン解除に失敗しました',
      });
    }
  }
);
```

**設計理由:**
- RESTful原則: DELETE /resource/sub-resource で解除を表現
- selectOfficialProposalと対称的なエンドポイント設計

#### ステップ3: フロントエンドAPIサービス層

**ファイル:** `frontend/src/services/canvas.service.ts`

canvasServiceオブジェクトに新規メソッドを追加:
```typescript
unselectOfficialProposal: async (tripId: string, proposalId: string) => {
  const response = await axios.delete(
    `/api/v1/trips/${tripId}/canvas/proposals/${proposalId}/select-official`
  );
  return response.data.data;
}
```

**実装位置:** `selectOfficialProposal`メソッドの直後

#### ステップ4: フロントエンド状態管理層

**ファイル:** `frontend/src/stores/canvasStore.ts`

既存の`unselectOfficialProposal`関数を修正（345-359行目）:
```typescript
// 修正前（動作しない）
unselectOfficialProposal: async (tripId: string, proposalId: string) => {
  set({ isLoading: true, error: null });
  try {
    await canvasService.updateProposal(tripId, proposalId, { isOfficial: false } as any);
    const proposals = await canvasService.getProposals(tripId);
    set({ proposals, isLoading: false });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '正式プラン解除に失敗しました';
    set({ error: errorMessage, isLoading: false });
    throw error;
  }
},

// 修正後（正しい実装）
unselectOfficialProposal: async (tripId: string, proposalId: string) => {
  set({ isLoading: true, error: null });
  try {
    // 専用のunselectOfficialProposal APIを呼び出し
    await canvasService.unselectOfficialProposal(tripId, proposalId);
    
    // プラン案リストを再取得（isOfficialフラグが更新されている）
    const proposals = await canvasService.getProposals(tripId);
    set({ proposals, isLoading: false });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '正式プラン解除に失敗しました';
    set({ error: errorMessage, isLoading: false });
    throw error;
  }
},
```

#### ステップ5: フロントエンドUI層（既存実装確認）

以下のファイルはすでに実装済みのため変更不要:

**ファイル:** `frontend/src/components/canvas/ProposalList.tsx`
- 正式プランの日程選択を非活性化 (195行目: `disabled={availableDates.length === 0 || proposal.isOfficial}`)
- 非活性時のガイドメッセージ表示 (209-213行目)
- 正式プラン解除ボタンの表示 (255-263行目)

**ファイル:** `frontend/src/pages/CanvasPlanning.tsx`
- `unselectOfficialProposal`をcanvasStoreから取得 (72行目)
- `handleUnselectOfficialProposal`ハンドラー (669-684行目)
- ProposalListにprops渡し (835行目)

---

## 実装の流れ

1. **バックエンドサービス層** 
   - `backend/src/services/proposal-conversion.service.ts`に`unselectOfficialProposal`追加

2. **バックエンドルーティング層**
   - `backend/src/routes/canvas.routes.ts`にDELETEエンドポイント追加

3. **フロントエンドAPIサービス層**
   - `frontend/src/services/canvas.service.ts`に`unselectOfficialProposal`メソッド追加

4. **フロントエンド状態管理層**
   - `frontend/src/stores/canvasStore.ts`の`unselectOfficialProposal`を修正

5. **動作確認**
   - プラン案作成 → 日程選択 → 正式プラン設定 → 正式プラン解除
   - 以下を確認:
     - trip_plan_proposals.isOfficialがfalse
     - trip_plan_activitiesが削除されている
     - 日程選択ドロップダウンが活性化
     - 正式マークが消える
     - 日程タブから予定が消える

---

## 期待される動作

正式プラン解除ボタンをクリックすると:
1. ✅ 確認ダイアログが表示される
2. ✅ `trip_plan_proposals.isOfficial`が`false`になる
3. ✅ 対応する`trip_plan_activities`（`isFromCanvas=true`）が削除される
4. ✅ 日程選択ドロップダウンが活性化する（グレーアウト解除）
5. ✅ 正式マーク（⭐正式）が消える
6. ✅ 日程タブから該当日の予定が消える
7. ✅ 成功メッセージが表示される

---

## 技術的注意事項

### データ整合性
- トランザクションを使用してtrip_plan_activitiesの削除とisOfficialの更新を原子的に実行
- `isFromCanvas: true`フィルタで手動作成のアクティビティは保護

### エラーハンドリング
- プラン案が存在しない場合
- 既に非正式プランの場合
- proposalDateが未設定の場合（防御的に対応）

### 日数計算ロジック
```typescript
const diffTime = proposalDateObj.getTime() - tripStartDate.getTime();
const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
const dayNumber = diffDays + 1; // 1日目、2日目、3日目...
```
- selectOfficialProposalと完全に同じ計算式を使用
- 時刻を0:00:00.000にリセットして日付のみで比較

### UIフィードバック
- ローディング状態の表示（canvasStore.isLoading）
- 成功時のアラート表示
- エラー時のエラーメッセージ表示

---

## 関連ファイル一覧

### バックエンド
- `backend/src/services/proposal-conversion.service.ts` - 正式プラン変換サービス
- `backend/src/services/canvas.service.ts` - キャンバスサービス
- `backend/src/routes/canvas.routes.ts` - キャンバスルート
- `backend/prisma/schema.prisma` - データベーススキーマ

### フロントエンド
- `frontend/src/components/canvas/ProposalList.tsx` - プラン案リストUI
- `frontend/src/components/canvas/ActivityCardNode.tsx` - アクティビティカードUI
- `frontend/src/pages/CanvasPlanning.tsx` - キャンバスプランニングページ
- `frontend/src/stores/canvasStore.ts` - キャンバス状態管理
- `frontend/src/services/canvas.service.ts` - キャンバスAPIサービス
- `frontend/src/types/canvas.ts` - 型定義

---

## 更新履歴
- 2025-10-21: 初版作成（プラン案強調表示、ProposalList UI変更完了、正式プラン解除機能未完了）
