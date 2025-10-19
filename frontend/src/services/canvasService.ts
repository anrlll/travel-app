/**
 * キャンバスプランニング機能のAPIサービス
 */

import axios from '../lib/axios';
import type {
  CanvasActivityCard,
  CreateCardData,
  UpdateCardData,
  UpdateCardPositionData,
  CardConnection,
  CreateConnectionData,
  UpdateConnectionData,
  TripPlanProposal,
  CreateProposalData,
  UpdateProposalData,
  ApiResponse,
} from '../types/canvas';

// ========================================
// カード操作
// ========================================

/**
 * カードを作成
 */
export async function createCard(
  tripId: string,
  data: CreateCardData
): Promise<CanvasActivityCard> {
  const response = await axios.post<ApiResponse<CanvasActivityCard>>(
    `/api/v1/trips/${tripId}/canvas/cards`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カードの作成に失敗しました');
  }

  return response.data.data;
}

/**
 * カード一覧を取得
 */
export async function getCards(tripId: string): Promise<CanvasActivityCard[]> {
  const response = await axios.get<ApiResponse<CanvasActivityCard[]>>(
    `/api/v1/trips/${tripId}/canvas/cards`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カード一覧の取得に失敗しました');
  }

  return response.data.data;
}

/**
 * カード詳細を取得
 */
export async function getCardById(
  tripId: string,
  cardId: string
): Promise<CanvasActivityCard> {
  const response = await axios.get<ApiResponse<CanvasActivityCard>>(
    `/api/v1/trips/${tripId}/canvas/cards/${cardId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カードの取得に失敗しました');
  }

  return response.data.data;
}

/**
 * カードを更新
 */
export async function updateCard(
  tripId: string,
  cardId: string,
  data: UpdateCardData
): Promise<CanvasActivityCard> {
  const response = await axios.put<ApiResponse<CanvasActivityCard>>(
    `/api/v1/trips/${tripId}/canvas/cards/${cardId}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カードの更新に失敗しました');
  }

  return response.data.data;
}

/**
 * カード位置を更新
 */
export async function moveCard(
  tripId: string,
  cardId: string,
  position: UpdateCardPositionData
): Promise<CanvasActivityCard> {
  const response = await axios.patch<ApiResponse<CanvasActivityCard>>(
    `/api/v1/trips/${tripId}/canvas/cards/${cardId}/position`,
    position
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'カード位置の更新に失敗しました');
  }

  return response.data.data;
}

/**
 * カードを削除
 */
export async function deleteCard(tripId: string, cardId: string): Promise<void> {
  const response = await axios.delete<ApiResponse<void>>(
    `/api/v1/trips/${tripId}/canvas/cards/${cardId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'カードの削除に失敗しました');
  }
}

// ========================================
// 接続操作
// ========================================

/**
 * 接続を作成
 */
export async function createConnection(
  tripId: string,
  data: CreateConnectionData
): Promise<CardConnection> {
  const response = await axios.post<ApiResponse<CardConnection>>(
    `/api/v1/trips/${tripId}/canvas/connections`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '接続の作成に失敗しました');
  }

  return response.data.data;
}

/**
 * 接続一覧を取得
 */
export async function getConnections(tripId: string): Promise<CardConnection[]> {
  const response = await axios.get<ApiResponse<CardConnection[]>>(
    `/api/v1/trips/${tripId}/canvas/connections`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '接続一覧の取得に失敗しました');
  }

  return response.data.data;
}

/**
 * 接続を更新
 */
export async function updateConnection(
  tripId: string,
  connectionId: string,
  data: UpdateConnectionData
): Promise<CardConnection> {
  const response = await axios.put<ApiResponse<CardConnection>>(
    `/api/v1/trips/${tripId}/canvas/connections/${connectionId}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '接続の更新に失敗しました');
  }

  return response.data.data;
}

/**
 * 接続を削除
 */
export async function deleteConnection(
  tripId: string,
  connectionId: string
): Promise<void> {
  const response = await axios.delete<ApiResponse<void>>(
    `/api/v1/trips/${tripId}/canvas/connections/${connectionId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || '接続の削除に失敗しました');
  }
}

// ========================================
// プラン案操作
// ========================================

/**
 * プラン案を作成
 */
export async function createProposal(
  tripId: string,
  data: CreateProposalData
): Promise<TripPlanProposal> {
  const response = await axios.post<ApiResponse<TripPlanProposal>>(
    `/api/v1/trips/${tripId}/canvas/proposals`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'プラン案の作成に失敗しました');
  }

  return response.data.data;
}

/**
 * プラン案一覧を取得
 */
export async function getProposals(tripId: string): Promise<TripPlanProposal[]> {
  const response = await axios.get<ApiResponse<TripPlanProposal[]>>(
    `/api/v1/trips/${tripId}/canvas/proposals`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'プラン案一覧の取得に失敗しました');
  }

  return response.data.data;
}

/**
 * プラン案詳細を取得
 */
export async function getProposalById(
  tripId: string,
  proposalId: string
): Promise<TripPlanProposal> {
  const response = await axios.get<ApiResponse<TripPlanProposal>>(
    `/api/v1/trips/${tripId}/canvas/proposals/${proposalId}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'プラン案の取得に失敗しました');
  }

  return response.data.data;
}

/**
 * プラン案を更新
 */
export async function updateProposal(
  tripId: string,
  proposalId: string,
  data: UpdateProposalData
): Promise<TripPlanProposal> {
  const response = await axios.put<ApiResponse<TripPlanProposal>>(
    `/api/v1/trips/${tripId}/canvas/proposals/${proposalId}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'プラン案の更新に失敗しました');
  }

  return response.data.data;
}

/**
 * プラン案を削除
 */
export async function deleteProposal(
  tripId: string,
  proposalId: string
): Promise<void> {
  const response = await axios.delete<ApiResponse<void>>(
    `/api/v1/trips/${tripId}/canvas/proposals/${proposalId}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'プラン案の削除に失敗しました');
  }
}
