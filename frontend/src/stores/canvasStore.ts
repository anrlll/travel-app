/**
 * キャンバスプランニングのZustand状態管理
 */

import { create } from 'zustand';
import type {
  CanvasActivityCard,
  CardConnection,
  TripPlanProposal,
  CreateCardData,
  UpdateCardData,
  UpdateCardPositionData,
  CreateConnectionData,
  UpdateConnectionData,
  CreateProposalData,
  UpdateProposalData,
} from '../types/canvas';
import * as canvasService from '../services/canvasService';

interface CanvasState {
  // データ
  cards: CanvasActivityCard[];
  connections: CardConnection[];
  proposals: TripPlanProposal[];
  selectedCardId: string | null;
  selectedProposalId: string | null;

  // ローディング状態
  isLoading: boolean;
  error: string | null;

  // カード操作
  loadCards: (tripId: string) => Promise<void>;
  createCard: (tripId: string, data: CreateCardData) => Promise<CanvasActivityCard>;
  updateCard: (tripId: string, cardId: string, data: UpdateCardData) => Promise<void>;
  moveCard: (tripId: string, cardId: string, position: UpdateCardPositionData) => Promise<void>;
  deleteCard: (tripId: string, cardId: string) => Promise<void>;
  selectCard: (cardId: string | null) => void;

  // 接続操作
  loadConnections: (tripId: string) => Promise<void>;
  createConnection: (tripId: string, data: CreateConnectionData) => Promise<CardConnection>;
  updateConnection: (tripId: string, connectionId: string, data: UpdateConnectionData) => Promise<void>;
  deleteConnection: (tripId: string, connectionId: string) => Promise<void>;

  // プラン案操作
  loadProposals: (tripId: string) => Promise<void>;
  createProposal: (tripId: string, data: CreateProposalData) => Promise<TripPlanProposal>;
  updateProposal: (tripId: string, proposalId: string, data: UpdateProposalData) => Promise<void>;
  deleteProposal: (tripId: string, proposalId: string) => Promise<void>;
  selectProposal: (proposalId: string | null) => void;

  // Phase 2.4c: プラン案自動検出と日程管理
  detectProposals: (tripId: string) => Promise<void>;
  assignSchedule: (
    tripId: string,
    proposalId: string,
    schedule: Array<{ cardId: string; dayNumber: number; orderInDay: number }>
  ) => Promise<void>;
  selectOfficialProposal: (tripId: string, proposalId: string) => Promise<void>;
  unselectOfficialProposal: (tripId: string, proposalId: string) => Promise<void>;

  // 初期化
  loadAllData: (tripId: string) => Promise<void>;
  reset: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  // 初期状態
  cards: [],
  connections: [],
  proposals: [],
  selectedCardId: null,
  selectedProposalId: null,
  isLoading: false,
  error: null,

  // ========================================
  // カード操作
  // ========================================

  loadCards: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const cards = await canvasService.getCards(tripId);
      set({ cards, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'カードの読み込みに失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createCard: async (tripId: string, data: CreateCardData) => {
    set({ isLoading: true, error: null });
    try {
      const newCard = await canvasService.createCard(tripId, data);
      // UI側で直接nodesを管理するため、Storeのcards配列は更新しない
      // これにより、useEffectのトリガーを防ぎ、ビューポートのリセットを回避
      set({ isLoading: false });
      return newCard;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'カードの作成に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCard: async (tripId: string, cardId: string, data: UpdateCardData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCard = await canvasService.updateCard(tripId, cardId, data);
      // UI側で直接nodesを管理するため、Storeのcards配列は更新しない
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'カードの更新に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  moveCard: async (tripId: string, cardId: string, position: UpdateCardPositionData) => {
    // 楽観的更新（即座にUI反映）
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === cardId
          ? { ...card, positionX: position.positionX, positionY: position.positionY }
          : card
      ),
    }));

    try {
      const updatedCard = await canvasService.moveCard(tripId, cardId, position);
      set((state) => ({
        cards: state.cards.map((card) =>
          card.id === cardId ? updatedCard : card
        ),
      }));
    } catch (error) {
      // エラー時は再読み込み
      await get().loadCards(tripId);
      const errorMessage = error instanceof Error ? error.message : 'カード位置の更新に失敗しました';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteCard: async (tripId: string, cardId: string) => {
    set({ isLoading: true, error: null });
    try {
      await canvasService.deleteCard(tripId, cardId);
      // UI側で直接nodesを管理するため、Storeのcards配列は更新しない
      set((state) => ({
        selectedCardId: state.selectedCardId === cardId ? null : state.selectedCardId,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'カードの削除に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  selectCard: (cardId: string | null) => {
    set({ selectedCardId: cardId });
  },

  // ========================================
  // 接続操作
  // ========================================

  loadConnections: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const connections = await canvasService.getConnections(tripId);
      set({ connections, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '接続の読み込みに失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createConnection: async (tripId: string, data: CreateConnectionData) => {
    set({ isLoading: true, error: null });
    try {
      const newConnection = await canvasService.createConnection(tripId, data);
      // UI側で直接edgesを管理するため、Storeのconnections配列は更新しない
      set({ isLoading: false });
      return newConnection;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '接続の作成に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateConnection: async (tripId: string, connectionId: string, data: UpdateConnectionData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedConnection = await canvasService.updateConnection(tripId, connectionId, data);
      set((state) => ({
        connections: state.connections.map((conn) =>
          conn.id === connectionId ? updatedConnection : conn
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '接続の更新に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteConnection: async (tripId: string, connectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      await canvasService.deleteConnection(tripId, connectionId);
      // UI側で直接edgesを管理するため、Storeのconnections配列は更新しない
      set({ isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '接続の削除に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // ========================================
  // プラン案操作
  // ========================================

  loadProposals: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const proposals = await canvasService.getProposals(tripId);
      set({ proposals, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'プラン案の読み込みに失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createProposal: async (tripId: string, data: CreateProposalData) => {
    set({ isLoading: true, error: null });
    try {
      const newProposal = await canvasService.createProposal(tripId, data);
      set((state) => ({
        proposals: [...state.proposals, newProposal],
        isLoading: false,
      }));
      return newProposal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'プラン案の作成に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateProposal: async (tripId: string, proposalId: string, data: UpdateProposalData) => {
    set({ isLoading: true, error: null });
    try {
      const updatedProposal = await canvasService.updateProposal(tripId, proposalId, data);
      set((state) => ({
        proposals: state.proposals.map((proposal) =>
          proposal.id === proposalId ? updatedProposal : proposal
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'プラン案の更新に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteProposal: async (tripId: string, proposalId: string) => {
    set({ isLoading: true, error: null });
    try {
      await canvasService.deleteProposal(tripId, proposalId);
      set((state) => ({
        proposals: state.proposals.filter((proposal) => proposal.id !== proposalId),
        selectedProposalId: state.selectedProposalId === proposalId ? null : state.selectedProposalId,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'プラン案の削除に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  selectProposal: (proposalId: string | null) => {
    set({ selectedProposalId: proposalId });
  },

  // ========================================
  // Phase 2.4c: プラン案自動検出と日程管理
  // ========================================

  detectProposals: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const proposals = await canvasService.detectProposals(tripId);
      set({ proposals, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'プラン案の検出に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  assignSchedule: async (
    tripId: string,
    proposalId: string,
    schedule: Array<{ cardId: string; dayNumber: number; orderInDay: number }>
  ) => {
    set({ isLoading: true, error: null });
    try {
      await canvasService.assignSchedule(tripId, proposalId, schedule);
      // プラン案を再読み込み
      const proposals = await canvasService.getProposals(tripId);
      set({ proposals, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '日程の割り当てに失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  selectOfficialProposal: async (tripId: string, proposalId: string) => {
    set({ isLoading: true, error: null });
    try {
      await canvasService.selectOfficialProposal(tripId, proposalId);

      // プラン案リストを再取得（isOfficialフラグが更新されている）
      const proposals = await canvasService.getProposals(tripId);
      set({ proposals, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '正式プラン設定に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  unselectOfficialProposal: async (tripId: string, proposalId: string) => {
    set({ isLoading: true, error: null });
    try {
      await canvasService.unselectOfficialProposal(tripId, proposalId);

      // プラン案リストを再取得（isOfficialフラグとデータが更新されている）
      const proposals = await canvasService.getProposals(tripId);
      set({ proposals, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '正式プラン解除に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // ========================================
  // 初期化
  // ========================================

  loadAllData: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [cards, connections, proposals] = await Promise.all([
        canvasService.getCards(tripId),
        canvasService.getConnections(tripId),
        canvasService.getProposals(tripId),
      ]);
      set({ cards, connections, proposals, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'データの読み込みに失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  reset: () => {
    set({
      cards: [],
      connections: [],
      proposals: [],
      selectedCardId: null,
      selectedProposalId: null,
      isLoading: false,
      error: null,
    });
  },
}));
