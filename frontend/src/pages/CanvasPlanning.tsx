/**
 * キャンバスプランニングページ - Phase 2.4b: 完全実装
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useCanvasStore } from '../stores/canvasStore';
import { ActivityCardNode } from '../components/canvas/ActivityCardNode';
import { ConnectionEdge } from '../components/canvas/ConnectionEdge';
import { CardEditDialog } from '../components/canvas/CardEditDialog';
import { ConnectionEditDialog, ConnectionUpdateData } from '../components/canvas/ConnectionEditDialog';
import { ProposalList } from '../components/canvas/ProposalList';
import { ProposalEditDialog } from '../components/canvas/ProposalEditDialog';
import { ProposalComparison } from '../components/canvas/ProposalComparison';
import { OfficialPlanSelectionDialog } from '../components/canvas/OfficialPlanSelectionDialog';
import Button from '../components/Button';
import type { CanvasActivityCard, CreateCardData, TripPlanProposal, CardConnection } from '../types/canvas';
import axios from '../lib/axios';

// カスタムノード・エッジタイプの定義
const nodeTypes: NodeTypes = {
  activityCard: ActivityCardNode as any,
};

const edgeTypes: EdgeTypes = {
  connection: ConnectionEdge as any,
};

// 内部コンポーネント（useReactFlowを使用するため）
const CanvasPlanningInner: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const reactFlowInstance = useReactFlow();

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
    updateConnection,
    deleteConnection,
    detectProposals,
    selectProposal,
    updateProposal,
    deleteProposal,
    selectOfficialProposal,
    unselectOfficialProposal,
    reset,
  } = useCanvasStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // ビューポートの状態を保持
  const viewportRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const saveViewportTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CanvasActivityCard | null>(null);
  const [newCardPosition, setNewCardPosition] = useState<{ x: number; y: number } | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 接続線編集用のステート
  const [isConnectionEditOpen, setIsConnectionEditOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<CardConnection | null>(null);

  // Phase 2.4c: プラン案関連のステート
  const [showProposalPanel, setShowProposalPanel] = useState(true);
  const [editingProposal, setEditingProposal] = useState<TripPlanProposal | null>(null);
  const [isProposalEditOpen, setIsProposalEditOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [selectingOfficialProposal, setSelectingOfficialProposal] = useState<TripPlanProposal | null>(null);
  const [isOfficialSelectionOpen, setIsOfficialSelectionOpen] = useState(false);

  // 旅行プラン情報
  const [tripPlan, setTripPlan] = useState<{ startDate?: string; endDate?: string } | null>(null);

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
        // 現在のビューポートを保存
        const currentViewport = reactFlowInstance.getViewport();
        viewportRef.current = currentViewport;

        await deleteCard(tripId, cardId);

        // ノードを直接削除（再描画なし）
        setNodes((nds) => nds.filter((node) => node.id !== cardId));

        // ビューポートを復元
        requestAnimationFrame(() => {
          if (viewportRef.current) {
            reactFlowInstance.setViewport(viewportRef.current, { duration: 0 });
          }
        });
      } catch (error) {
        console.error('カード削除エラー:', error);
      }
    },
    [tripId, deleteCard, setNodes, reactFlowInstance]
  );

  // 接続線編集ハンドラー
  const handleEditConnection = useCallback((connection: CardConnection) => {
    setEditingConnection(connection);
    setIsConnectionEditOpen(true);
  }, []);

  // 接続線更新ハンドラー
  const handleUpdateConnection = useCallback(
    async (data: ConnectionUpdateData) => {
      if (!tripId || !editingConnection) return;

      try {
        // 現在のビューポートを保存
        const currentViewport = reactFlowInstance.getViewport();
        viewportRef.current = currentViewport;

        await updateConnection(tripId, editingConnection.id, data);

        // エッジを直接更新
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id === editingConnection.id) {
              return {
                ...edge,
                data: {
                  ...edge.data,
                  connection: {
                    ...edge.data.connection,
                    ...data,
                  },
                },
              };
            }
            return edge;
          })
        );

        // ビューポートを復元
        requestAnimationFrame(() => {
          if (viewportRef.current) {
            reactFlowInstance.setViewport(viewportRef.current, { duration: 0 });
          }
        });

        setIsConnectionEditOpen(false);
        setEditingConnection(null);
      } catch (error) {
        console.error('接続線更新エラー:', error);
        throw error;
      }
    },
    [tripId, editingConnection, updateConnection, setEdges, reactFlowInstance]
  );

  // 接続削除ハンドラー
  const handleDeleteConnection = useCallback(
    async (connectionId: string) => {
      if (!tripId) return;
      try {
        // 現在のビューポートを保存
        const currentViewport = reactFlowInstance.getViewport();
        viewportRef.current = currentViewport;

        await deleteConnection(tripId, connectionId);

        // エッジを直接削除
        setEdges((eds) => eds.filter((edge) => edge.id !== connectionId));

        // ビューポートを復元
        requestAnimationFrame(() => {
          if (viewportRef.current) {
            reactFlowInstance.setViewport(viewportRef.current, { duration: 0 });
          }
        });
      } catch (error) {
        console.error('接続削除エラー:', error);
      }
    },
    [tripId, deleteConnection, setEdges, reactFlowInstance]
  );

  // データ読み込み
  useEffect(() => {
    if (!tripId) {
      navigate('/trips');
      return;
    }

    loadAllData(tripId)
      .then(() => {
        // データ読み込み完了後、初回ノードを設定
        // この時点でcardsが更新されているが、useEffectは依存配列からcardsを削除したので再実行されない
      })
      .catch((err) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  // カードをReact Flowのノードに変換（初回読み込み時のみ）
  // cardsが読み込まれた時、かつnodesが空の場合のみ実行
  // その後のカード作成・削除は直接setNodesで管理するため、このuseEffectは再実行されない
  useEffect(() => {
    if (cards.length > 0 && nodes.length === 0) {
      // nodesが空で、cardsにデータがある場合のみ初期化
      const flowNodes: Node[] = cards.map((card) => {
        // このカードが属するプラン案のバッジを計算
        const proposalBadges = proposals
          .filter((p) => p.activities?.some((a) => a.cardId === card.id))
          .map((p) => ({
            name: p.name.replace('プラン案', ''), // "プラン案A" → "A"
            color: p.color,
          }));

        return {
          id: card.id,
          type: 'activityCard',
          position: { x: card.positionX, y: card.positionY },
          data: {
            card,
            onEdit: handleEditCard,
            onDelete: handleDeleteCard,
            proposalBadges,
          },
        };
      });
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
    // cardsが変わった時に実行されるが、nodes.length > 0 になった後は条件に合わないため実行されない
    // カード作成時も、既にnodes.length > 0 のため、この条件には入らない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, proposals, tripId, reactFlowInstance]);

  // 接続をReact Flowのエッジに変換（初回読み込み時のみ）
  // connections.lengthを依存配列にすることで、初回読み込み時のみ実行
  // その後の接続作成・削除は直接setEdgesで管理
  useEffect(() => {
    if (connections.length > 0 && edges.length === 0) {
      const flowEdges: Edge[] = connections.map((conn) => ({
        id: conn.id,
        source: conn.fromCardId,
        target: conn.toCardId,
        type: 'connection',
        data: {
          connection: conn,
          onEdit: handleEditConnection,
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connections.length]);

  // プラン案変更時にすべてのノードのバッジを更新
  useEffect(() => {
    if (nodes.length > 0) {
      setNodes((nds) =>
        nds.map((node) => {
          // このカードが属するプラン案のバッジを計算
          const proposalBadges = proposals
            .filter((p) => p.activities?.some((a) => a.cardId === node.id))
            .map((p) => ({
              name: p.name.replace('プラン案', ''),
              color: p.color,
            }));

          return {
            ...node,
            data: {
              ...node.data,
              proposalBadges,
            },
          };
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposals]);

  // ビューポートタイマーのクリーンアップ
  useEffect(() => {
    return () => {
      if (saveViewportTimerRef.current) {
        clearTimeout(saveViewportTimerRef.current);
      }
    };
  }, []);

  // プラン案選択時の強調表示
  useEffect(() => {
    console.log('🎯 ハイライトuseEffect実行:', { selectedProposalId, proposalsCount: proposals.length });

    if (!selectedProposalId) {
      // 選択解除: すべてのハイライトを削除
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          style: {
            ...node.style,
            boxShadow: undefined,
          },
        }))
      );
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            strokeWidth: 2,
            filter: undefined,
          },
        }))
      );
      return;
    }

    // 選択されたプラン案を取得（proposalsを直接参照）
    const selectedProposal = proposals.find((p) => p.id === selectedProposalId);
    console.log('📋 選択されたプラン案:', selectedProposal);

    if (!selectedProposal) {
      console.warn('⚠️ プラン案が見つかりません:', selectedProposalId);
      return;
    }

    // このプラン案に属するカードIDを取得
    const cardIdsInProposal = new Set(
      selectedProposal.activities?.map((a) => a.cardId) || []
    );
    console.log('🎴 ハイライト対象カードID:', Array.from(cardIdsInProposal));

    // このプラン案に属する接続IDを取得
    const connectionIdsInProposal = new Set(
      selectedProposal.connections?.map((c) => c.id) || []
    );
    console.log('🔗 ハイライト対象接続ID:', Array.from(connectionIdsInProposal));

    // カードをハイライト
    setNodes((nds) =>
      nds.map((node) => {
        const isHighlighted = cardIdsInProposal.has(node.id);
        return {
          ...node,
          style: {
            ...node.style,
            boxShadow: isHighlighted
              ? `0 0 0 3px ${selectedProposal.color}`
              : undefined,
          },
        };
      })
    );

    // 接続をハイライト
    setEdges((eds) =>
      eds.map((edge) => {
        const isHighlighted = connectionIdsInProposal.has(edge.id);
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: isHighlighted ? selectedProposal.color : undefined,
            strokeWidth: isHighlighted ? 4 : 2,
          },
        };
      })
    );
  }, [selectedProposalId, proposals, setNodes, setEdges]);

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

  // キャンバス空白部分クリック（プラン案選択解除）
  const handlePaneClick = useCallback(() => {
    if (selectedProposalId) {
      selectProposal(null);
    }
  }, [selectedProposalId, selectProposal]);

  // カード保存ハンドラー
  const handleSaveCard = useCallback(
    async (data: CreateCardData) => {
      if (!tripId) return;

      try {
        if (editingCard) {
          // 既存カードの更新
          await updateCard(tripId, editingCard.id, data);

          // 既存ノードのデータを更新（再描画なし）
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === editingCard.id) {
                // バッジを再計算
                const proposalBadges = proposals
                  .filter((p) => p.activities?.some((a) => a.cardId === editingCard.id))
                  .map((p) => ({
                    name: p.name.replace('プラン案', ''),
                    color: p.color,
                  }));

                return {
                  ...node,
                  data: {
                    ...node.data,
                    card: {
                      ...editingCard,
                      ...data,
                    },
                    proposalBadges,
                  },
                };
              }
              return node;
            })
          );
        } else {
          // 新規カード作成
          // 現在のビューポートを保存
          const currentViewport = reactFlowInstance.getViewport();
          viewportRef.current = currentViewport;

          const newCard = await createCard(tripId, data);

          // バッジを計算
          const proposalBadges = proposals
            .filter((p) => p.activities?.some((a) => a.cardId === newCard.id))
            .map((p) => ({
              name: p.name.replace('プラン案', ''),
              color: p.color,
            }));

          // 新しいノードを直接追加（再描画なし）
          const newNode: Node = {
            id: newCard.id,
            type: 'activityCard',
            position: { x: newCard.positionX, y: newCard.positionY },
            data: {
              card: newCard,
              onEdit: handleEditCard,
              onDelete: handleDeleteCard,
              proposalBadges,
            },
          };

          setNodes((nds) => [...nds, newNode]);

          // ビューポートを復元（画面を動かさない）
          requestAnimationFrame(() => {
            if (viewportRef.current) {
              reactFlowInstance.setViewport(viewportRef.current, { duration: 0 });
            }
          });
        }
        setIsDialogOpen(false);
        setEditingCard(null);
        setNewCardPosition(null);
      } catch (error) {
        console.error('カード保存エラー:', error);
        throw error;
      }
    },
    [tripId, editingCard, createCard, updateCard, reactFlowInstance, setNodes, handleEditCard, handleDeleteCard]
  );

  // ノード移動ハンドラー（ドラッグ終了時）
  const handleNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!tripId) return;

      // ノードが存在すれば位置を保存（cards配列に依存しない）
      // 新規作成したカードもStoreのcards配列を更新していないため、
      // cards配列での検証は不要（むしろ新規カードで失敗する原因）
      moveCard(tripId, node.id, {
        positionX: node.position.x,
        positionY: node.position.y,
      }).catch((error) => {
        console.error('カード位置更新エラー:', error);
      });
    },
    [tripId, moveCard]
  );

  // 接続作成ハンドラー
  const handleConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!tripId || !connection.source || !connection.target) return;

      try {
        // 現在のビューポートを保存
        const currentViewport = reactFlowInstance.getViewport();
        viewportRef.current = currentViewport;

        const newConnection = await createConnection(tripId, {
          fromCardId: connection.source,
          toCardId: connection.target,
        });

        // 新しいエッジを直接追加
        const newEdge: Edge = {
          id: newConnection.id,
          source: newConnection.fromCardId,
          target: newConnection.toCardId,
          type: 'connection',
          data: {
            connection: newConnection,
            onEdit: handleEditConnection,
            onDelete: handleDeleteConnection,
          },
          animated: false,
          markerEnd: {
            type: 'arrowclosed',
            width: 20,
            height: 20,
          },
        };

        setEdges((eds) => [...eds, newEdge]);

        // ビューポートを復元
        requestAnimationFrame(() => {
          if (viewportRef.current) {
            reactFlowInstance.setViewport(viewportRef.current, { duration: 0 });
          }
        });
      } catch (error) {
        console.error('接続作成エラー:', error);
        alert('接続の作成に失敗しました');
      }
    },
    [tripId, createConnection, setEdges, handleEditConnection, handleDeleteConnection, reactFlowInstance]
  );

  // 新規カードボタンクリック
  const handleNewCardClick = useCallback(() => {
    // キャンバスエリアの中央座標を計算（プラン案パネルの幅を考慮）
    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();

      // プラン案パネルが表示されている場合、その幅を考慮
      // プラン案パネルは w-96 = 384px
      const proposalPanelWidth = showProposalPanel ? 384 : 0;

      // 実際のキャンバス表示エリアの幅
      const visibleCanvasWidth = bounds.width - proposalPanelWidth;

      // 実際のキャンバス表示エリアの中央（パネル幅分をオフセット）
      const centerX = proposalPanelWidth + visibleCanvasWidth / 2;
      const centerY = bounds.height / 2;

      // ReactFlowのprojectメソッドを使用してスクリーン座標をフロー座標に変換
      const position = reactFlowInstance.screenToFlowPosition({
        x: centerX,
        y: centerY,
      });

      // カードが重ならないようにランダムなオフセットを追加
      const randomOffset = {
        x: (Math.random() - 0.5) * 200, // -100 ~ +100
        y: (Math.random() - 0.5) * 200, // -100 ~ +100
      };

      const finalPosition = {
        x: position.x + randomOffset.x,
        y: position.y + randomOffset.y,
      };

      setNewCardPosition(finalPosition);
    } else {
      // フォールバック: 固定座標
      setNewCardPosition({ x: 400, y: 300 });
    }

    setEditingCard(null);
    setIsDialogOpen(true);
  }, [reactFlowInstance, showProposalPanel]);

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

  const handleUnselectOfficialProposal = useCallback(
    async (proposal: TripPlanProposal) => {
      if (!tripId) return;
      try {
        if (!window.confirm(`${proposal.name}を正式プランから解除しますか？\n日程タブから予定が削除されます。`)) {
          return;
        }
        await unselectOfficialProposal(tripId, proposal.id);
        alert(`✅ ${proposal.name}を正式プランから解除しました`);
      } catch (error) {
        console.error('正式プラン解除エラー:', error);
        alert('正式プラン解除に失敗しました');
      }
    },
    [tripId, unselectOfficialProposal]
  );

  const handleUpdateProposalDate = useCallback(
    async (proposalId: string, proposalDate: string) => {
      if (!tripId) return;
      try {
        await updateProposal(tripId, proposalId, { proposalDate });
      } catch (error) {
        console.error('プラン案日程更新エラー:', error);
        alert('プラン案の日程更新に失敗しました');
      }
    },
    [tripId, updateProposal]
  );

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
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <div className="h-full" onDoubleClick={handleCanvasDoubleClick}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            onNodeDragStop={handleNodeDragStop}
            onPaneClick={handlePaneClick}
            onMove={(event, viewport) => handleViewportChange(viewport)}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            snapToGrid
            snapGrid={[15, 15]}
            minZoom={0.2}
            maxZoom={2}
            fitView={false}
            preventScrolling={false}
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
        {nodes.length === 0 && (
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
              onUnselectOfficialProposal={handleUnselectOfficialProposal}
              onUpdateProposalDate={handleUpdateProposalDate}
              tripStartDate={tripPlan?.startDate}
              tripEndDate={tripPlan?.endDate}
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

      {/* 接続線編集ダイアログ */}
      <ConnectionEditDialog
        connection={editingConnection}
        isOpen={isConnectionEditOpen}
        onClose={() => {
          setIsConnectionEditOpen(false);
          setEditingConnection(null);
        }}
        onSave={handleUpdateConnection}
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

// 外部コンポーネント（ReactFlowProviderでラップ）
export const CanvasPlanning: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasPlanningInner />
    </ReactFlowProvider>
  );
};
