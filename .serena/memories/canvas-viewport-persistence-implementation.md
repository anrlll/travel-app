# キャンバスビューポート位置永続化機能 実装完了

## 実装日
2025-10-21

## 概要
キャンバスプランニングページで、ユーザーがキャンバスを閉じて再度開いた時に、前回の表示位置（viewport: x, y, zoom）を復元する機能を実装しました。

## 背景
- ユーザーがキャンバスモードで作業中に特定の位置にズーム・移動した後、ページを閉じて再度開くと初期位置に戻ってしまう問題があった
- 作業効率を向上させるため、前回の表示位置を記憶して復元する機能が必要だった

## 技術仕様

### ストレージ
- **使用技術**: localStorage
- **キー形式**: `canvas-viewport-${tripId}`
- **保存データ**: `{ x: number, y: number, zoom: number }`
- **理由**: ページリロードしても永続化する必要があり、tripIdごとに独立した位置を保存

### デバウンス処理
- **デバウンス時間**: 500ms
- **理由**: パン・ズーム操作は頻繁に発生するため、保存頻度を抑制してパフォーマンスを確保

## 実装詳細

### 1. デバウンスタイマーの追加

**ファイル**: `frontend/src/pages/CanvasPlanning.tsx:81`

```typescript
const saveViewportTimerRef = useRef<NodeJS.Timeout | null>(null);
```

- デバウンス処理用のタイマー参照を保持
- クリーンアップ時にタイマーをクリアするために使用

### 2. ビューポート変更ハンドラーの実装

**ファイル**: `frontend/src/pages/CanvasPlanning.tsx:687-707`

```typescript
// ビューポート変更時のハンドラー（デバウンス付き）
const handleViewportChange = useCallback(
  (viewport: { x: number; y: number; zoom: number }) => {
    // 既存のタイマーをクリア
    if (saveViewportTimerRef.current) {
      clearTimeout(saveViewportTimerRef.current);
    }

    // 500msデバウンス
    saveViewportTimerRef.current = setTimeout(() => {
      if (tripId) {
        localStorage.setItem(
          `canvas-viewport-${tripId}`,
          JSON.stringify(viewport)
        );
        console.log('ビューポート保存:', viewport);
      }
    }, 500);
  },
  [tripId]
);
```

**機能**:
- ビューポート変更時に呼び出される
- 既存のタイマーをクリアして新しいタイマーを設定（デバウンス）
- 500ms後にlocalStorageに保存
- tripIdがない場合は保存しない

### 3. ReactFlowのonMoveイベント追加

**ファイル**: `frontend/src/pages/CanvasPlanning.tsx:793`

```typescript
<ReactFlow
  // ... 既存のプロパティ
  onMove={(event, viewport) => handleViewportChange(viewport)}
  // ... 他のプロパティ
>
```

**機能**:
- ユーザーがキャンバスをパン・ズームする度に`onMove`イベントが発火
- `handleViewportChange`を呼び出してビューポートを保存

### 4. ビューポート復元処理

**ファイル**: `frontend/src/pages/CanvasPlanning.tsx:230-244`

```typescript
// カードをReact Flowのノードに変換（初回読み込み時のみ）
useEffect(() => {
  if (cards.length > 0 && nodes.length === 0) {
    // ... ノード初期化コード ...
    setNodes(flowNodes);

    // ビューポート復元処理
    requestAnimationFrame(() => {
      if (tripId) {
        const savedViewport = localStorage.getItem(`canvas-viewport-${tripId}`);
        if (savedViewport) {
          try {
            const viewport = JSON.parse(savedViewport);
            reactFlowInstance.setViewport(viewport, { duration: 0 });
            console.log('ビューポート復元:', viewport);
          } catch (error) {
            console.error('ビューポート復元エラー:', error);
          }
        }
      }
    });
  }
}, [cards.length, proposals, tripId, reactFlowInstance]);
```

**機能**:
- ノード初期化完了後にビューポート復元を実行
- `requestAnimationFrame`でノード描画完了後に復元（タイミング調整）
- localStorageから保存されたビューポートを取得
- JSON.parseのエラーハンドリング付き
- `setViewport({ duration: 0 })`でアニメーションなしで即座に復元

**実行タイミング**:
- `cards.length > 0 && nodes.length === 0`の条件により、初回読み込み時のみ実行
- ノード作成後は`nodes.length > 0`となるため再実行されない

### 5. クリーンアップ処理

**ファイル**: `frontend/src/pages/CanvasPlanning.tsx:303-310`

```typescript
// ビューポートタイマーのクリーンアップ
useEffect(() => {
  return () => {
    if (saveViewportTimerRef.current) {
      clearTimeout(saveViewportTimerRef.current);
    }
  };
}, []);
```

**機能**:
- コンポーネントアンマウント時にタイマーをクリア
- メモリリークを防止

## 修正ファイル

### frontend/src/pages/CanvasPlanning.tsx

1. **Line 81**: `saveViewportTimerRef`を追加
2. **Line 687-707**: `handleViewportChange`コールバックを実装
3. **Line 793**: ReactFlowに`onMove`プロパティを追加
4. **Line 230-244**: ノード初期化useEffect内にビューポート復元処理を追加
5. **Line 249**: useEffectの依存配列に`tripId, reactFlowInstance`を追加
6. **Line 303-310**: クリーンアップuseEffectを追加

## 動作フロー

### ビューポート保存フロー

1. ユーザーがキャンバスをパン・ズーム
2. `onMove`イベントが発火
3. `handleViewportChange`が呼ばれる
4. 既存のタイマーをクリア
5. 新しいタイマーを500ms後に設定
6. 500ms後にlocalStorageに保存
   - キー: `canvas-viewport-${tripId}`
   - 値: `{"x": 100, "y": 200, "zoom": 1.5}`

### ビューポート復元フロー

1. ページ読み込み・キャンバスモード起動
2. `loadAllData(tripId)`でデータ取得
3. `cards.length > 0 && nodes.length === 0`の条件を満たす
4. ノード初期化（`setNodes(flowNodes)`）
5. `requestAnimationFrame`でノード描画完了を待つ
6. localStorageから`canvas-viewport-${tripId}`を取得
7. 保存されたビューポートが存在する場合:
   - JSON.parseで解析
   - `reactFlowInstance.setViewport(viewport, { duration: 0 })`で復元
8. エラーがある場合はconsole.errorに出力

## 動作確認結果

### テスト1: ビューポート保存
- ✅ キャンバスをパン・ズームすると500ms後にlocalStorageに保存される
- ✅ DevToolsのLocalStorageタブで`canvas-viewport-${tripId}`キーを確認
- ✅ `{"x": ..., "y": ..., "zoom": ...}`の形式で保存されている

### テスト2: ビューポート復元
- ✅ キャンバスを特定位置に移動
- ✅ ページをリロード
- ✅ 前回の位置・ズームレベルで開く

### テスト3: 複数tripIdでの独立性
- ✅ tripId A: 位置(100, 200), zoom 1.5に移動
- ✅ tripId B: 位置(300, 400), zoom 0.8に移動
- ✅ tripId Aに戻る → 位置(100, 200), zoom 1.5で開く
- ✅ tripId Bに戻る → 位置(300, 400), zoom 0.8で開く

## 既存機能との統合

### viewportRefとの関係
- **既存のviewportRef**: カード削除・接続削除時の一時的なビューポート保存（操作中のジャンプ防止）
- **新規のlocalStorage**: ページ遷移を跨いだ永続化
- **統合方法**: 両者は独立して動作し、互いに干渉しない

### fitView設定との関係
- ReactFlowの`fitView={false}`が既に設定されているため、自動フィット機能との競合なし
- 初回読み込み時に復元されたビューポートが維持される

## 注意事項

### パフォーマンス考慮
- デバウンス処理により、頻繁な保存操作を抑制
- `requestAnimationFrame`でノード描画完了後に復元することで、描画とビューポート設定のタイミングを最適化

### エラーハンドリング
- JSON.parseのエラーをtry-catchでキャッチ
- エラー時はコンソールにログ出力し、デフォルト位置で開く

### ストレージ制限
- localStorageには容量制限があるが、ビューポートデータは小さい（約50バイト）ため問題なし
- tripIdごとに独立したキーを使用するため、複数のtripで問題なく動作

## 今後の改善案（オプション）

1. **ストレージクリーンアップ**:
   - 削除されたtripIdのビューポートデータを削除する機能
   - 一定期間アクセスされていないデータを削除

2. **ユーザー設定**:
   - ビューポート復元機能のON/OFF設定を追加
   - 常に中央から開始するオプション

3. **デバウンス時間の調整**:
   - ユーザーの操作パターンに応じてデバウンス時間を動的に調整

## 関連機能

このセッションでは、以下の機能も実装しました:

### 正式プラン解除機能（直前のタスク）
- 正式プランを解除して下書きに戻す機能
- バックエンド: `unselectOfficialProposal`サービス関数とDELETEエンドポイント
- フロントエンド: 解除ボタン、日程選択ドロップダウンの無効化
- 詳細は`canvas-proposal-ui-implementation-status`メモリ参照

## まとめ

キャンバスビューポート位置の永続化機能を実装し、ユーザーがキャンバスを閉じて再度開いた時に前回の表示位置を復元できるようになりました。localStorage、デバウンス処理、requestAnimationFrameを活用することで、パフォーマンスとユーザビリティを両立した実装を実現しています。