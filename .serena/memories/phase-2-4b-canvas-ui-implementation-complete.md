# Phase 2.4b: キャンバスUI実装完了

**完了日**: 2025-10-18
**ステータス**: Phase 2.4b 完了

---

## 概要

Phase 2.4a（基盤構築）に続き、Phase 2.4b（キャンバスUI実装）が完了しました。
React Flowを使用したMiro風の無限キャンバス上で、アクティビティカードをドラッグ&ドロップで配置・接続できる完全なUIが実装されました。

---

## 実装したコンポーネント

### 1. ActivityCardNode コンポーネント
**ファイル**: `frontend/src/components/canvas/ActivityCardNode.tsx`

**機能**:
- アクティビティカードの表示
- アクティビティタイプ別の色分け
  - 観光: 青 (bg-blue-100 border-blue-400)
  - 飲食: オレンジ (bg-orange-100 border-orange-400)
  - 宿泊: 紫 (bg-purple-100 border-purple-400)
  - 移動: 緑 (bg-green-100 border-green-400)
  - その他: グレー (bg-gray-100 border-gray-400)
- 表示情報: タイトル、場所、時間、コスト、参加者数、メモ
- アクションボタン: 編集(✏️)、削除(🗑️)
- React Flow Handle: 上部(target)、下部(source)
- 完了マーク表示(✓)
- コスト表示のフォーマット（日本円）

**技術的特徴**:
- `NodeProps<ActivityCardNodeData>` でデータを受け取り
- `Handle` コンポーネントでカード間接続をサポート
- `line-clamp-*` でテキストの行数制限
- 削除時の確認ダイアログ

**コード例**:
```typescript
interface ActivityCardNodeData {
  card: CanvasActivityCard;
  onEdit: (card: CanvasActivityCard) => void;
  onDelete: (cardId: string) => void;
}

export const ActivityCardNode: React.FC<NodeProps<ActivityCardNodeData>> = ({ data }) => {
  const { card, onEdit, onDelete } = data;
  // ... カードの表示とアクション
}
```

---

### 2. ConnectionEdge コンポーネント
**ファイル**: `frontend/src/components/canvas/ConnectionEdge.tsx`

**機能**:
- カード間の接続線表示
- 移動手段別の色分け
  - 徒歩: 緑 (#10B981)
  - 車: 青 (#3B82F6)
  - 電車: 紫 (#8B5CF6)
  - バス: 黄 (#F59E0B)
  - 飛行機: 赤 (#EF4444)
  - その他: グレー (#6B7280)
- 接続情報ラベル表示
  - 移動手段アイコン
  - 所要時間（分）
  - 距離（km）
  - コスト（円）
- アクションボタン: 編集(✏️)、削除(✕)

**技術的特徴**:
- `EdgeProps<ConnectionEdgeData>` でデータを受け取り
- `getSmoothStepPath` でスムーズな曲線経路
- `EdgeLabelRenderer` でカスタムラベル表示
- `BaseEdge` で基本的なエッジ描画
- `markerEnd` で矢印表示

**コード例**:
```typescript
const [edgePath, labelX, labelY] = getSmoothStepPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
});

<BaseEdge
  id={id}
  path={edgePath}
  markerEnd={markerEnd}
  style={{ stroke: strokeColor, strokeWidth: 2 }}
/>
```

---

### 3. CardEditDialog コンポーネント
**ファイル**: `frontend/src/components/canvas/CardEditDialog.tsx`

**機能**:
- カードの新規作成・編集用モーダルダイアログ
- 入力フィールド:
  - タイトル（必須）
  - カテゴリ（必須）: 観光/飲食/宿泊/移動/その他
  - 場所（任意）
  - 開始時刻・終了時刻（任意、time入力）
  - コスト（任意、数値）
  - 予算カテゴリ（任意）: 食費/交通費/宿泊費/観光費/その他
  - メモ（任意、textarea）
  - 完了済みチェックボックス
- バリデーション: タイトルとカテゴリは必須
- 保存中状態の表示（ボタン無効化）

**技術的特徴**:
- `useState` でフォームデータ管理
- `useEffect` で初期値設定（新規 or 編集）
- `onSubmit` で非同期保存処理
- エラーハンドリングとアラート表示

**コード例**:
```typescript
interface CardEditDialogProps {
  isOpen: boolean;
  card?: CanvasActivityCard | null;
  initialPosition?: { x: number; y: number };
  onSave: (data: CreateCardData) => Promise<void>;
  onClose: () => void;
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    await onSave(formData);
    onClose();
  } catch (error) {
    alert('カードの保存に失敗しました');
  } finally {
    setIsSubmitting(false);
  }
};
```

---

### 4. CanvasPlanning ページ（完全実装）
**ファイル**: `frontend/src/pages/CanvasPlanning.tsx`

**機能**:
- React Flow統合による無限キャンバス
- カードのドラッグ&ドロップ移動
- カード間のドラッグ接続作成
- ダブルクリックで新規カード作成
- ツールバー:
  - 戻るボタン
  - タイトル表示
  - 統計表示（カード数、接続数）
  - 「+ 新規カード」ボタン
- キャンバス機能:
  - グリッドスナップ（15px間隔）
  - ズーム（0.2x - 2x）
  - パン（ドラッグ）
  - ミニマップ（カテゴリ別色分け）
  - ドット背景
  - コントロールパネル
- 初回ヒント表示（カードが0件の時）

**技術的特徴**:
- `useNodesState`, `useEdgesState` でReact Flow状態管理
- `useCallback` で最適化されたイベントハンドラー
- カードとノードの相互変換
- 接続とエッジの相互変換
- カスタムノードタイプ・エッジタイプの登録
- ダブルクリック位置の計算（`getBoundingClientRect`）
- ドラッグ終了時の位置更新（`onNodeDragStop`）
- 接続作成時のAPI呼び出し（`onConnect`）

**主要なイベントハンドラー**:

```typescript
// カードをReact Flowノードに変換
useEffect(() => {
  const flowNodes: Node[] = cards.map((card) => ({
    id: card.id,
    type: 'activityCard',
    position: { x: card.positionX, y: card.positionY },
    data: { card, onEdit: handleEditCard, onDelete: handleDeleteCard },
  }));
  setNodes(flowNodes);
}, [cards, setNodes]);

// 接続をReact Flowエッジに変換
useEffect(() => {
  const flowEdges: Edge[] = connections.map((conn) => ({
    id: conn.id,
    source: conn.fromCardId,
    target: conn.toCardId,
    type: 'connection',
    data: { connection: conn, onDelete: handleDeleteConnection },
    markerEnd: { type: 'arrowclosed', width: 20, height: 20 },
  }));
  setEdges(flowEdges);
}, [connections, setEdges]);

// ノード移動ハンドラー
const handleNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
  if (!tripId) return;
  const card = cards.find((c) => c.id === node.id);
  if (card && (card.positionX !== node.position.x || card.positionY !== node.position.y)) {
    moveCard(tripId, node.id, node.position).catch(console.error);
  }
}, [tripId, cards, moveCard]);

// 接続作成ハンドラー
const handleConnect: OnConnect = useCallback((connection: Connection) => {
  if (!tripId || !connection.source || !connection.target) return;
  createConnection(tripId, {
    fromCardId: connection.source,
    toCardId: connection.target,
  }).catch((error) => {
    console.error('接続作成エラー:', error);
    alert('接続の作成に失敗しました');
  });
}, [tripId, createConnection]);

// キャンバスダブルクリック
const handleCanvasDoubleClick = useCallback((event: React.MouseEvent) => {
  const reactFlowBounds = (event.target as HTMLElement)
    .closest('.react-flow')
    ?.getBoundingClientRect();
  if (reactFlowBounds) {
    const position = {
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    };
    setNewCardPosition(position);
    setEditingCard(null);
    setIsDialogOpen(true);
  }
}, [tripId]);
```

**React Flow設定**:
```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={handleConnect}
  onNodeDragStop={handleNodeDragStop}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  fitView
  snapToGrid
  snapGrid={[15, 15]}
  defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
  minZoom={0.2}
  maxZoom={2}
>
  <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
  <Controls showInteractive={false} />
  <MiniMap
    nodeColor={(node) => {
      const card = cards.find((c) => c.id === node.id);
      const colors = {
        sightseeing: '#3B82F6',
        restaurant: '#F97316',
        accommodation: '#A855F7',
        transport: '#10B981',
        other: '#6B7280',
      };
      return colors[card?.activityType || 'other'];
    }}
    maskColor="rgba(0, 0, 0, 0.1)"
  />
</ReactFlow>
```

---

## ユーザー操作フロー

### 1. カード作成
1. **方法A**: 「+ 新規カード」ボタンをクリック
2. **方法B**: キャンバスをダブルクリック
3. CardEditDialogが開く
4. タイトル、カテゴリなどを入力
5. 「保存」をクリック
6. カードがキャンバスに表示される

### 2. カード編集
1. カード上の✏️ボタンをクリック
2. CardEditDialogが開く（既存データが入力済み）
3. 内容を変更
4. 「保存」をクリック
5. カードが更新される

### 3. カード移動
1. カードをマウスでドラッグ
2. ドロップ位置にカードが移動
3. ドラッグ終了時に自動保存（`onNodeDragStop`）

### 4. カード削除
1. カード上の🗑️ボタンをクリック
2. 確認ダイアログが表示
3. 「OK」で削除実行
4. カードがキャンバスから消える

### 5. 接続作成
1. カード下部の接続ハンドル（●）をドラッグ開始
2. 別のカード上部の接続ハンドルにドロップ
3. 接続線が表示される
4. API呼び出しでデータベースに保存

### 6. 接続削除
1. 接続線のラベル上の✕ボタンをクリック
2. 確認ダイアログが表示
3. 「OK」で削除実行
4. 接続線が消える

---

## 技術的な解決策

### 問題1: 認証エラー（401 Unauthorized）
**発生**: Phase 2.4aの実装直後、キャンバスページでAPIリクエストが401エラー

**原因**: `frontend/src/services/canvasService.ts` で生の`axios`をインポートしていた
- 既存のサービスは `../lib/axios` を使用（認証トークンを自動付与）
- `canvasService.ts` は `axios` を直接インポート → トークンなし

**解決策**:
```typescript
// 修正前
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 修正後
import axios from '../lib/axios';
// API_BASE_URLの削除、相対パスを使用
```

すべてのエンドポイントURLを修正:
```typescript
// 修正前
`${API_BASE_URL}/api/v1/trips/${tripId}/canvas/cards`

// 修正後
`/api/v1/trips/${tripId}/canvas/cards`
```

**結果**: 認証トークンが自動的に付与され、401エラーが解消

---

### 問題2: バックエンドのprismaインポートエラー
**発生**: バックエンドサーバー起動時に `Cannot find module '../lib/prisma.js'`

**原因**: `backend/src/services/canvas.service.ts` のインポートパスが間違っていた
- 実際のprismaファイルは `backend/src/config/prisma.ts`
- インポートは `../lib/prisma.js` と記述

**解決策**:
```typescript
// 修正前
import { prisma } from '../lib/prisma.js';

// 修正後
import { prisma } from '../config/prisma.js';
```

**結果**: バックエンドサーバーが正常に起動

---

### 問題3: React Flowのnpm installエラー
**発生**: Phase 2.4bの開始時、`npm install @xyflow/react` が失敗
```
npm error Cannot read properties of null (reading 'location')
```

**原因**: npm環境の問題（キャッシュ破損の可能性）

**試行した解決策**:
1. `npm cache clean --force` → 失敗
2. 別パッケージ名 `reactflow` で試行 → 失敗

**最終解決**: ユーザーが手動でインストール
- インストール確認: `package.json` に `"@xyflow/react": "^12.8.6"` が存在
- 実装はユーザーによる手動インストール後に進行

---

## React Flow統合の詳細

### カスタムノード・エッジの登録
```typescript
const nodeTypes: NodeTypes = {
  activityCard: ActivityCardNode,
};

const edgeTypes: EdgeTypes = {
  connection: ConnectionEdge,
};
```

### ノード・エッジの状態管理
```typescript
const [nodes, setNodes, onNodesChange] = useNodesState([]);
const [edges, setEdges, onEdgesChange] = useEdgesState([]);
```

### データ変換パターン
**カード → ノード**:
```typescript
const flowNodes: Node[] = cards.map((card) => ({
  id: card.id,
  type: 'activityCard',
  position: { x: card.positionX, y: card.positionY },
  data: { card, onEdit, onDelete },
}));
```

**接続 → エッジ**:
```typescript
const flowEdges: Edge[] = connections.map((conn) => ({
  id: conn.id,
  source: conn.fromCardId,
  target: conn.toCardId,
  type: 'connection',
  data: { connection, onDelete },
  markerEnd: { type: 'arrowclosed', width: 20, height: 20 },
}));
```

---

## パフォーマンス最適化

### 1. useCallback の活用
すべてのイベントハンドラーを `useCallback` でメモ化:
- `handleEditCard`
- `handleDeleteCard`
- `handleDeleteConnection`
- `handleCanvasDoubleClick`
- `handleSaveCard`
- `handleNodeDragStop`
- `handleConnect`
- `handleNewCardClick`

### 2. React Flowの最適化設定
- `snapToGrid`: グリッドスナップで計算量削減
- `fitView`: 初回表示の最適化
- `defaultViewport`: 初期ズームレベルの設定

### 3. 楽観的更新
カード移動時は即座にUI更新、バックグラウンドでAPI呼び出し:
```typescript
const handleNodeDragStop = useCallback((_event, node) => {
  // UIは即座に更新済み（React Flowが自動処理）
  // バックグラウンドでAPIを呼び出し
  moveCard(tripId, node.id, node.position).catch(console.error);
}, [tripId, cards, moveCard]);
```

---

## ファイル構成

```
frontend/src/
├── components/
│   └── canvas/
│       ├── ActivityCardNode.tsx      # アクティビティカードノード
│       ├── ConnectionEdge.tsx         # 接続エッジ
│       └── CardEditDialog.tsx         # カード編集ダイアログ
├── pages/
│   └── CanvasPlanning.tsx            # キャンバスプランニングページ（完全実装）
├── services/
│   └── canvasService.ts              # APIサービス（修正済み）
├── stores/
│   └── canvasStore.ts                # Zustand状態管理
└── types/
    └── canvas.ts                     # 型定義
```

---

## 完了条件チェックリスト

### Phase 2.4b 完了条件
- ✅ React Flowインストール確認（v12.8.6）
- ✅ ActivityCardNodeコンポーネント実装
- ✅ ConnectionEdgeコンポーネント実装
- ✅ CardEditDialogコンポーネント実装
- ✅ CanvasPlanning完全実装
- ✅ カードのドラッグ&ドロップ機能
- ✅ カード間の接続作成機能
- ✅ カード編集・削除機能
- ✅ 接続削除機能
- ✅ ツールバー機能
- ✅ ミニマップ表示
- ✅ グリッドスナップ
- ✅ ズーム・パン機能
- ✅ ダブルクリックでカード作成
- ✅ 初回ヒント表示
- ✅ 認証エラー修正
- ✅ バックエンドインポートエラー修正

---

## 動作確認方法

### 1. サーバー起動
```bash
# バックエンド
cd backend
npm run dev

# フロントエンド
cd frontend
npm run dev
```

### 2. アクセス
1. `http://localhost:5173` でログイン
2. 旅行プラン一覧から既存プランを選択
3. 「キャンバスで編集」ボタンをクリック
4. キャンバスプランニングページが表示される

### 3. 機能テスト

**カード作成テスト**:
1. 「+ 新規カード」ボタンをクリック
2. タイトル「東京スカイツリー」、カテゴリ「観光」を入力
3. 場所「東京都墨田区押上」、開始時刻「10:00」、終了時刻「12:00」
4. コスト「2100」円、予算カテゴリ「観光費」
5. 「保存」をクリック
6. カードがキャンバスに表示されることを確認

**カード移動テスト**:
1. カードをドラッグして別の位置に移動
2. ドロップすると位置が保存される
3. ページをリロードして位置が保持されていることを確認

**接続作成テスト**:
1. もう1枚カードを作成（例: 「浅草寺」）
2. 「東京スカイツリー」カードの下部ハンドルをドラッグ
3. 「浅草寺」カードの上部ハンドルにドロップ
4. 接続線が表示されることを確認

**カード編集テスト**:
1. カード上の✏️ボタンをクリック
2. タイトルを「東京スカイツリー 展望台」に変更
3. 「保存」をクリック
4. カードのタイトルが更新されることを確認

**カード削除テスト**:
1. カード上の🗑️ボタンをクリック
2. 確認ダイアログで「OK」をクリック
3. カードが削除されることを確認

**接続削除テスト**:
1. 接続線のラベル上の✕ボタンをクリック
2. 確認ダイアログで「OK」をクリック
3. 接続線が削除されることを確認

---

## 次のフェーズ: Phase 2.4c

### 実装予定の機能
1. **プラン案自動検出アルゴリズム**
   - キャンバス上の接続されたカード群を自動検出
   - 独立した経路を別々のプラン案として認識
   - プラン案ごとの統計情報を自動計算

2. **プラン案管理UI**
   - プラン案一覧表示
   - プラン案の作成・編集・削除
   - プラン案の色分け表示
   - プラン案比較表（コスト、日数、距離など）

3. **日程割り当て機能**
   - プラン案のアクティビティに日付を割り当て
   - ドラッグ&ドロップで日程調整
   - 日ごとの予算・時間計算

4. **正式プラン選択**
   - プラン案から1つを正式プランとして選択
   - 正式プランのアクティビティをTripPlanActivityテーブルに変換
   - 既存の日程管理機能との統合

---

## 技術的な注意点

### React Flowの制限事項
1. **ノードの再レンダリング**: データが変更されるとノード全体が再レンダリングされる
   - 対策: `React.memo` でコンポーネントをメモ化（将来の最適化）

2. **大量ノードのパフォーマンス**: 100個以上のノードで遅延が発生する可能性
   - 対策: 仮想化または表示範囲の制限（Phase 2.4cで検討）

3. **カスタムエッジのイベント**: エッジ上のボタンクリックが難しい
   - 対策: `EdgeLabelRenderer` + `nodrag nopan` クラス

### Zustand状態管理の注意
1. **楽観的更新**: 移動操作は即座にUI反映、エラー時に再取得
2. **エラーハンドリング**: すべての非同期処理でtry-catch
3. **状態のリセット**: ページ離脱時に `reset()` を呼び出し

---

## 関連ドキュメント

- **要件定義**: `docs/requirements/02-1-canvas-planning.md`
- **Phase 2.4a完了**: `.serena/memories/phase-2-4-canvas-planning-implementation-plan.md`
- **実装状況**: `.serena/memories/implementation-status-2025-10-14.md`

---

## まとめ

Phase 2.4b（キャンバスUI実装）が完全に完了しました。

**実装した主要機能**:
- ✅ React Flow統合による無限キャンバス
- ✅ ドラッグ&ドロップでカード配置
- ✅ カード間の接続作成
- ✅ カード編集・削除
- ✅ 接続削除
- ✅ 色分け表示（カテゴリ別、移動手段別）
- ✅ ツールバーとコントロール
- ✅ ミニマップ
- ✅ 初回ヒント

**解決した問題**:
- ✅ 認証エラー（canvasService.tsのaxiosインポート）
- ✅ バックエンドインポートエラー（prismaパス）

**現在の状態**:
- キャンバスプランニング機能が完全に動作
- ユーザーは自由にカードを配置・接続可能
- すべての操作がデータベースに永続化

**次のステップ**:
Phase 2.4c（プラン案管理と正式化）の実装
