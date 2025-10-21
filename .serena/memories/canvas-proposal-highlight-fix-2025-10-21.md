# キャンバスプラン案ハイライト表示の修正 (2025-10-21)

## 問題の概要

正式プランに決定されていないプラン案をクリックしても、キャンバス上でカードと接続線が強調表示されない問題が発生していました。画面を開きなおすとハイライト表示されるが、再検出直後のクリックでは表示されませんでした。

## 根本原因

### 原因1: useEffectの依存配列が不完全
フロントエンドの`CanvasPlanning.tsx`で、プラン案選択時のハイライト処理を行うuseEffectの依存配列に`proposals`が含まれていませんでした。

```typescript
// 修正前
}, [selectedProposalId]);  // ❌ proposalsが依存配列にない

// 修正後
}, [selectedProposalId, proposals, setNodes, setEdges]);  // ✅
```

**影響:**
- `selectedProposalId`が変わらない限り、useEffectが再実行されない
- プラン案を再検出しても古い（空の）proposals配列を参照し続ける
- `selectedProposal.activities`と`selectedProposal.connections`が空のため、ハイライト対象が見つからない

### 原因2: バックエンドでactivitiesとconnectionsがincludeされていない
バックエンドの`canvas.service.ts`の`detectProposals`関数で、新しく検出されたプラン案を更新する際に、`activities`と`connections`を`include`していませんでした。

```typescript
// 修正前（693-700行目）
const updatedProposal = await prisma.tripPlanProposal.update({
  where: { id: savedProposal.id },
  data: {
    totalBudget: totalBudget._sum.cost,
    activityCount: proposal.cardIds.length,
    totalDistanceKm: totalDistanceKm._sum.distanceKm,
  },
  // ❌ includeがない
});

// 修正後（693-704行目）
const updatedProposal = await prisma.tripPlanProposal.update({
  where: { id: savedProposal.id },
  data: {
    totalBudget: totalBudget._sum.cost,
    activityCount: proposal.cardIds.length,
    totalDistanceKm: totalDistanceKm._sum.distanceKm,
  },
  include: {
    activities: true,      // ✅ 追加
    connections: true,     // ✅ 追加
  },
});
```

**影響:**
- `getProposals`APIのレスポンスで、正式プランには`activities`配列が含まれるが、非正式プラン（新規検出されたプラン案）には含まれない
- フロントエンドで`selectedProposal.activities`が`undefined`となり、ハイライト対象のカードIDが取得できない

## 修正内容

### 1. フロントエンド修正

**ファイル:** `frontend/src/pages/CanvasPlanning.tsx`

**修正箇所1:** 依存配列の修正（444行目）
```typescript
// 修正前
}, [selectedProposalId]);

// 修正後
}, [selectedProposalId, proposals, setNodes, setEdges]);
```

**修正箇所2:** デバッグログの追加（375-420行目）
プラン案選択時のuseEffect内にconsole.logを追加し、以下を確認できるようにしました：
- useEffectが実行されたか
- selectedProposalが正しく取得できたか
- ハイライト対象のカードIDと接続IDが正しく取得できたか

```typescript
console.log('🎯 ハイライトuseEffect実行:', { selectedProposalId, proposalsCount: proposals.length });
console.log('📋 選択されたプラン案:', selectedProposal);
console.log('🎴 ハイライト対象カードID:', Array.from(cardIdsInProposal));
console.log('🔗 ハイライト対象接続ID:', Array.from(connectionIdsInProposal));
```

### 2. バックエンド修正

**ファイル:** `backend/src/services/canvas.service.ts`

**修正箇所1:** detectProposals関数でのinclude追加（693-704行目）
```typescript
const updatedProposal = await prisma.tripPlanProposal.update({
  where: { id: savedProposal.id },
  data: {
    totalBudget: totalBudget._sum.cost,
    activityCount: proposal.cardIds.length,
    totalDistanceKm: totalDistanceKm._sum.distanceKm,
  },
  include: {
    activities: true,
    connections: true,
  },
});
```

**修正箇所2:** デバッグログの追加（368-392行目）
getProposals関数にconsole.logを追加し、以下を確認できるようにしました：
- Prismaから取得したプラン案のactivities/connectionsの有無
- 返却直前のデータのactivities/connectionsの有無

```typescript
console.log('🔍 getProposals - 取得したプラン案数:', proposals.length);
proposals.forEach((p, idx) => {
  console.log(`📋 プラン案${idx}:`, {
    id: p.id,
    name: p.name,
    activitiesCount: p.activities.length,
    connectionsCount: p.connections.length,
  });
});

console.log('📤 返却データ:', result.map(r => ({
  id: r.id,
  name: r.name,
  hasActivities: !!r.activities,
  activitiesCount: r.activities?.length,
  hasConnections: !!r.connections,
  connectionsCount: r.connections?.length,
})));
```

## 技術的詳細

### データフロー
1. ユーザーが「再検出」ボタンをクリック
2. バックエンド`detectProposals`が実行される
   - グラフ走査アルゴリズムでプラン案を検出
   - `ProposalActivity`レコードを作成（proposalIdとcardIdの関連付け）
   - `CardConnection`レコードに`proposalId`を設定
   - **修正後:** `include: { activities, connections }`で完全なデータを返す
3. フロントエンドのZustandストアが`proposals`配列を更新
4. **修正後:** useEffectの依存配列に`proposals`が含まれるため、再実行される
5. `selectedProposal.activities`からカードIDを取得
6. `selectedProposal.connections`から接続IDを取得
7. React Flowの`nodes`と`edges`にハイライトスタイルを適用

### Prismaリレーション構造
```
TripPlanProposal (プラン案)
  ├── activities: ProposalActivity[]  // 中間テーブル
  │     └── cardId: string
  └── connections: CardConnection[]   // proposalIdでリレーション
        └── id: string
```

### React useEffectの依存配列
- `selectedProposalId`: プラン案の選択・解除をトリガー
- `proposals`: プラン案データの更新（再検出）をトリガー
- `setNodes`, `setEdges`: React Flowの状態更新関数（安定した参照）

## 検証結果

### 修正前の動作
1. カード2枚作成 → 接続 → 再検出 → プラン案クリック
   - **結果:** ハイライト表示されない
   - **ブラウザログ:** `🎴 ハイライト対象カードID: []` (空配列)
   - **ネットワークレスポンス:** 非正式プラン案に`activities`配列が含まれていない

2. ページをリロード → プラン案クリック
   - **結果:** ハイライト表示される
   - **理由:** `loadAllData`で`getProposals`を呼び出し、`activities`を含む完全なデータを取得

### 修正後の動作
1. カード2枚作成 → 接続 → 再検出 → プラン案クリック
   - **結果:** ✅ ハイライト表示される
   - **ブラウザログ:** `🎴 ハイライト対象カードID: ['xxx', 'yyy']`
   - **バックエンドログ:** `activitiesCount: 2, connectionsCount: 1`
   - **ネットワークレスポンス:** `activities`配列と`connections`配列が含まれている

## 関連ファイル

### フロントエンド
- `frontend/src/pages/CanvasPlanning.tsx` (修正)
- `frontend/src/components/canvas/ProposalList.tsx` (確認のみ)
- `frontend/src/stores/canvasStore.ts` (確認のみ)
- `frontend/src/services/canvasService.ts` (確認のみ)
- `frontend/src/types/canvas.ts` (確認のみ)

### バックエンド
- `backend/src/services/canvas.service.ts` (修正)
- `backend/src/routes/canvas.routes.ts` (確認のみ)
- `backend/prisma/schema.prisma` (確認のみ)

## 今後の改善提案

### デバッグログの削除
本番環境では以下のログを削除またはdevelopmentモードのみに制限すべき：
- フロントエンド: `CanvasPlanning.tsx`の🎯、📋、🎴、🔗ログ
- バックエンド: `canvas.service.ts`の🔍、📋、📤ログ

### 型安全性の向上
`TripPlanProposal`型で`activities`と`connections`を必須プロパティとして定義することで、型レベルでこの問題を防げる可能性があります。

```typescript
export interface TripPlanProposal {
  // ... 他のプロパティ
  activities: ProposalActivity[];      // オプショナルから必須に変更
  connections: CardConnection[];       // オプショナルから必須に変更
}
```

ただし、これにはすべてのAPIレスポンスで`include`を必須とする必要があります。

## まとめ

この修正により、以下が実現されました：
1. ✅ 正式プラン・非正式プラン問わず、すべてのプラン案でハイライト表示が動作
2. ✅ 再検出直後にプラン案をクリックしてもハイライト表示される
3. ✅ 画面をリロードせずにキャンバス計画機能が完全に動作
4. ✅ useEffectの依存配列の正しい使用方法を実装
5. ✅ PrismaのincludeによるリレーションデータのEager Loadingを正しく実装
