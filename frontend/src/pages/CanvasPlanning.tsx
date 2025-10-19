/**
 * キャンバスプランニングページ - Phase 2.4b: 完全実装
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  OnConnect,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '../stores/canvasStore';
import { ActivityCardNode } from '../components/canvas/ActivityCardNode';
import { ConnectionEdge } from '../components/canvas/ConnectionEdge';
import { CardEditDialog } from '../components/canvas/CardEditDialog';
import { ProposalList } from '../components/canvas/ProposalList';
import { ProposalEditDialog } from '../components/canvas/ProposalEditDialog';
import { ProposalComparison } from '../components/canvas/ProposalComparison';
import { OfficialPlanSelectionDialog } from '../components/canvas/OfficialPlanSelectionDialog';
import Button from '../components/Button';
import type { CanvasActivityCard, CreateCardData, TripPlanProposal } from '../types/canvas';
import axios from '../lib/axios';

// カスタムノード・エッジタイプの定義
const nodeTypes: NodeTypes = {
  activityCard: ActivityCardNode,
};

const edgeTypes: EdgeTypes = {
  connection: ConnectionEdge,
};

export const CanvasPlanning: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const {
    cards,
    connections,
    proposals,
    selectedProposalId,
    isLoading,
    error,
    loadAllData,
    createCard,
    updateCard,
    moveCard,
    deleteCard,
    createConnection,
    deleteConnection,
    detectProposals,
    selectProposal,
    updateProposal,
    deleteProposal,
    selectOfficialProposal,
    reset,
  } = useCanvasStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CanvasActivityCard | null>(null);
  const [newCardPosition, setNewCardPosition] = useState<{ x: number; y: number } | null>(null);

  // Phase 2.4c: プラン案関連のステート
  const [showProposalPanel, setShowProposalPanel] = useState(true);
  const [editingProposal, setEditingProposal] = useState<TripPlanProposal | null>(null);
  const [isProposalEditOpen, setIsProposalEditOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [selectingOfficialProposal, setSelectingOfficialProposal] = useState<TripPlanProposal | null>(null);
  const [isOfficialSelectionOpen, setIsOfficialSelectionOpen] = useState(false);

  // 旅行プラン情報
  const [tripPlan, setTripPlan] = useState<{ startDate?: string; endDate?: string } | null>(null);

  // データ読み込み
  useEffect(() => {
    if (!tripId) {
      navigate('/trips');
      return;
    }

    loadAllData(tripId).catch((err) => {
      console.error('キャンバスデータの読み込みエラー:', err);
    });

    // 旅行プラン情報を取得
    axios
      .get(`/api/v1/trips/${tripId}`)
      .then((response) => {
        console.log('旅行プラン情報取得:', response.data);
        if (response.data.success && response.data.data) {
          const tripData = response.data.data;
          console.log('旅行プラン日程:', {
            startDate: tripData.startDate,
            endDate: tripData.endDate,
          });
          setTripPlan({
            startDate: tripData.startDate,
            endDate: tripData.endDate,
          });
        }
      })
      .catch((err) => {
        console.error('旅行プラン情報の読み込みエラー:', err);
      });

    return () => {
      reset();
    };
  }, [tripId, navigate, loadAllData, reset]);

  // カードをReact Flowのノードに変換
  useEffect(() => {
    const flowNodes: Node[] = cards.map((card) => ({
      id: card.id,
      type: 'activityCard',
      position: { x: card.positionX, y: card.positionY },
      data: {
        card,
        onEdit: handleEditCard,
        onDelete: handleDeleteCard,
      },
    }));
    setNodes(flowNodes);
  }, [cards, setNodes]);

  // 接続をReact Flowのエッジに変換
  useEffect(() => {
    const flowEdges: Edge[] = connections.map((conn) => ({
      id: conn.id,
      source: conn.fromCardId,
      target: conn.toCardId,
      type: 'connection',
      data: {
        connection: conn,
        onDelete: handleDeleteConnection,
      },
      animated: false,
      markerEnd: {
        type: 'arrowclosed',
        width: 20,
        height: 20,
      },
    }));
    setEdges(flowEdges);
  }, [connections, setEdges]);

  // カード編集ハンドラー
  const handleEditCard = useCallback((card: CanvasActivityCard) => {
    setEditingCard(card);
    setIsDialogOpen(true);
  }, []);

  // カード削除ハンドラー
  const handleDeleteCard = useCallback(
    async (cardId: string) => {
      if (!tripId) return;
      try {
        await deleteCard(tripId, cardId);
      } catch (error) {
        console.error('カード削除エラー:', error);
      }
    },
    [tripId, deleteCard]
  );

  // 接続削除ハンドラー
  const handleDeleteConnection = useCallback(
    async (connectionId: string) => {
      if (!tripId) return;
      try {
        await deleteConnection(tripId, connectionId);
      } catch (error) {
        console.error('接続削除エラー:', error);
      }
    },
    [tripId, deleteConnection]
  );

  // 新しいカード作成（キャンバスダブルクリック）
  const handleCanvasDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!tripId) return;

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
    },
    [tripId]
  );

  // カード保存ハンドラー
  const handleSaveCard = useCallback(
    async (data: CreateCardData) => {
      if (!tripId) return;

      try {
        if (editingCard) {
          // 既存カードの更新
          await updateCard(tripId, editingCard.id, data);
        } else {
          // 新規カード作成
          await createCard(tripId, data);
        }
        setIsDialogOpen(false);
        setEditingCard(null);
        setNewCardPosition(null);
      } catch (error) {
        console.error('カード保存エラー:', error);
        throw error;
      }
    },
    [tripId, editingCard, createCard, updateCard]
  );

  // ノード移動ハンドラー（ドラッグ終了時）
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!tripId) return;

      const card = cards.find((c) => c.id === node.id);
      if (card && (card.positionX !== node.position.x || card.positionY !== node.position.y)) {
        // React Flowの{x, y}をバックエンドの{positionX, positionY}に変換
        moveCard(tripId, node.id, {
          positionX: node.position.x,
          positionY: node.position.y,
        }).catch((error) => {
          console.error('カード位置更新エラー:', error);
        });
      }
    },
    [tripId, cards, moveCard]
  );

  // 接続作成ハンドラー
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!tripId || !connection.source || !connection.target) return;

      createConnection(tripId, {
        fromCardId: connection.source,
        toCardId: connection.target,
      }).catch((error) => {
        console.error('接続作成エラー:', error);
        alert('接続の作成に失敗しました');
      });
    },
    [tripId, createConnection]
  );

  // 新規カードボタンクリック
  const handleNewCardClick = useCallback(() => {
    setNewCardPosition({ x: 100, y: 100 });
    setEditingCard(null);
    setIsDialogOpen(true);
  }, []);

  // Phase 2.4c: プラン案関連のハンドラー
  const handleDetectProposals = useCallback(async () => {
    if (!tripId) return;
    try {
      await detectProposals(tripId);
    } catch (error) {
      console.error('プラン案検出エラー:', error);
      alert('プラン案の検出に失敗しました');
    }
  }, [tripId, detectProposals]);

  const handleEditProposal = useCallback((proposal: TripPlanProposal) => {
    setEditingProposal(proposal);
    setIsProposalEditOpen(true);
  }, []);

  const handleSaveProposal = useCallback(
    async (data: { name: string; color: string; proposalDate?: string }) => {
      if (!tripId || !editingProposal) return;
      try {
        await updateProposal(tripId, editingProposal.id, data);
        setIsProposalEditOpen(false);
        setEditingProposal(null);
      } catch (error) {
        console.error('プラン案更新エラー:', error);
        alert('プラン案の更新に失敗しました');
      }
    },
    [tripId, editingProposal, updateProposal]
  );

  const handleDeleteProposal = useCallback(
    async (proposalId: string) => {
      if (!tripId) return;
      try {
        await deleteProposal(tripId, proposalId);
      } catch (error) {
        console.error('プラン案削除エラー:', error);
        alert('プラン案の削除に失敗しました');
      }
    },
    [tripId, deleteProposal]
  );

  const handleSelectOfficialProposal = useCallback((proposal: TripPlanProposal) => {
    setSelectingOfficialProposal(proposal);
    setIsOfficialSelectionOpen(true);
  }, []);

  const handleConfirmOfficialSelection = useCallback(async () => {
    if (!tripId || !selectingOfficialProposal) return;
    try {
      await selectOfficialProposal(tripId, selectingOfficialProposal.id);
      setIsOfficialSelectionOpen(false);
      setSelectingOfficialProposal(null);
      alert(`✅ ${selectingOfficialProposal.name}を正式プランに設定しました`);
    } catch (error) {
      console.error('正式プラン設定エラー:', error);
      alert('正式プラン設定に失敗しました');
    }
  }, [tripId, selectingOfficialProposal, selectOfficialProposal]);

  const handleEditDatesForOfficial = useCallback(() => {
    if (selectingOfficialProposal) {
      setIsOfficialSelectionOpen(false);
      setEditingProposal(selectingOfficialProposal);
      setIsProposalEditOpen(true);
    }
  }, [selectingOfficialProposal]);

  if (!tripId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-bold text-lg mb-2">エラーが発生しました</h2>
          <p className="text-red-600">{error}</p>
          <Button
            onClick={() => navigate(`/trips/${tripId}`)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            旅行詳細に戻る
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー・ツールバー */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate(`/trips/${tripId}`)}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← 戻る
          </Button>
          <h1 className="text-xl font-bold text-gray-900">キャンバスプランニング</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            カード: {cards.length} | 接続: {connections.length} | プラン案: {proposals.length}
          </span>
          <Button
            onClick={() => setShowProposalPanel(!showProposalPanel)}
            className={`px-4 py-2 rounded-md flex items-center gap-2 ${
              showProposalPanel
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <span>📊</span>
            <span>プラン案パネル</span>
          </Button>
          <Button
            onClick={handleNewCardClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            <span>新規カード</span>
          </Button>
        </div>
      </header>

      {/* キャンバスエリア + プラン案パネル */}
      <main className="flex-1 flex overflow-hidden">
        {/* キャンバス */}
        <div className="flex-1 relative">
          <div className="h-full" onDoubleClick={handleCanvasDoubleClick}>
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
                const colors: Record<string, string> = {
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
        </div>

        {/* 初回ヒント */}
        {cards.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
              <div className="text-4xl mb-3">🗺️</div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                キャンバスプランニングを始めましょう
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                「+ 新規カード」ボタンをクリックするか、
                <br />
                キャンバスをダブルクリックしてカードを追加できます
              </p>
              <ul className="text-xs text-gray-500 text-left space-y-1">
                <li>• カードをドラッグして自由に配置</li>
                <li>• カード間をドラッグして接続を作成</li>
                <li>• カードをクリックして編集・削除</li>
              </ul>
            </div>
          </div>
        )}
        </div>

        {/* プラン案パネル (Phase 2.4c) */}
        {showProposalPanel && (
          <div className="w-96 bg-gray-50 border-l border-gray-200 overflow-hidden">
            <ProposalList
              proposals={proposals}
              selectedProposalId={selectedProposalId}
              onSelectProposal={selectProposal}
              onEditProposal={handleEditProposal}
              onDeleteProposal={handleDeleteProposal}
              onCompareProposals={() => setIsComparisonOpen(true)}
              onDetectProposals={handleDetectProposals}
              onSelectOfficialProposal={handleSelectOfficialProposal}
            />
          </div>
        )}
      </main>

      {/* カード編集ダイアログ */}
      <CardEditDialog
        isOpen={isDialogOpen}
        card={editingCard}
        initialPosition={newCardPosition || undefined}
        onSave={handleSaveCard}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingCard(null);
          setNewCardPosition(null);
        }}
      />

      {/* プラン案編集ダイアログ (Phase 2.4c) */}
      <ProposalEditDialog
        proposal={editingProposal}
        tripStartDate={tripPlan?.startDate}
        tripEndDate={tripPlan?.endDate}
        isOpen={isProposalEditOpen}
        onClose={() => {
          setIsProposalEditOpen(false);
          setEditingProposal(null);
        }}
        onSave={handleSaveProposal}
      />

      {/* プラン案比較モーダル (Phase 2.4c) */}
      <ProposalComparison
        proposals={proposals}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />

      {/* 正式プラン選択ダイアログ (Phase 2.4c-4) */}
      <OfficialPlanSelectionDialog
        proposal={selectingOfficialProposal}
        isOpen={isOfficialSelectionOpen}
        onClose={() => {
          setIsOfficialSelectionOpen(false);
          setSelectingOfficialProposal(null);
        }}
        onConfirm={handleConfirmOfficialSelection}
        onEditDates={handleEditDatesForOfficial}
      />
    </div>
  );
};
