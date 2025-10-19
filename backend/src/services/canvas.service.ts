import { prisma } from '../config/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import type {
  CreateCardData,
  UpdateCardData,
  UpdateCardPositionData,
  CreateConnectionData,
  UpdateConnectionData,
  CreateProposalData,
  UpdateProposalData,
} from '../models/canvas.model.js';

// ========================================
// ヘルパー関数
// ========================================

// Decimal型をnumberに変換
function decimalToNumber(value: Decimal | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  return parseFloat(value.toString());
}

// 空文字列をnullに変換
function emptyStringToNull(value: string | undefined): string | null {
  if (value === '' || value === undefined) return null;
  return value;
}

// 旅行プランとメンバーチェック
async function getTripPlanWithMemberCheck(tripPlanId: string, userId: string) {
  const tripPlan = await prisma.tripPlan.findUnique({
    where: { id: tripPlanId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!tripPlan) {
    throw new Error('旅行プランが見つかりません');
  }

  if (tripPlan.members.length === 0) {
    throw new Error('この旅行プランへのアクセス権限がありません');
  }

  return tripPlan;
}

// 編集権限チェック
async function checkEditPermission(tripPlanId: string, userId: string) {
  const tripPlan = await getTripPlanWithMemberCheck(tripPlanId, userId);
  const member = tripPlan.members[0];

  if (member.role !== 'owner' && member.role !== 'editor') {
    throw new Error('この操作を行う権限がありません');
  }

  return tripPlan;
}

// ========================================
// カード操作
// ========================================

// カード作成
export async function createCard(tripPlanId: string, userId: string, data: CreateCardData) {
  await checkEditPermission(tripPlanId, userId);

  const card = await prisma.canvasActivityCard.create({
    data: {
      tripPlanId,
      positionX: data.positionX,
      positionY: data.positionY,
      title: data.title,
      activityType: data.activityType,
      location: emptyStringToNull(data.location),
      customLocation: data.customLocation as any,
      startTime: emptyStringToNull(data.startTime),
      endTime: emptyStringToNull(data.endTime),
      cost: data.cost,
      budgetCategory: data.budgetCategory,
      memo: emptyStringToNull(data.memo),
      participants: data.participants as any,
      isCollapsed: data.isCollapsed ?? false,
      isCompleted: data.isCompleted ?? false,
    },
  });

  return {
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    location: card.location || undefined,
    startTime: card.startTime || undefined,
    endTime: card.endTime || undefined,
    memo: card.memo || undefined,
    budgetCategory: card.budgetCategory || undefined,
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  };
}

// カード一覧取得
export async function getCards(tripPlanId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const cards = await prisma.canvasActivityCard.findMany({
    where: { tripPlanId },
    orderBy: { createdAt: 'asc' },
  });

  return cards.map((card) => ({
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    location: card.location || undefined,
    startTime: card.startTime || undefined,
    endTime: card.endTime || undefined,
    memo: card.memo || undefined,
    budgetCategory: card.budgetCategory || undefined,
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  }));
}

// カード詳細取得
export async function getCardById(tripPlanId: string, cardId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const card = await prisma.canvasActivityCard.findFirst({
    where: { id: cardId, tripPlanId },
  });

  if (!card) {
    throw new Error('カードが見つかりません');
  }

  return {
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    location: card.location || undefined,
    startTime: card.startTime || undefined,
    endTime: card.endTime || undefined,
    memo: card.memo || undefined,
    budgetCategory: card.budgetCategory || undefined,
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  };
}

// カード更新
export async function updateCard(tripPlanId: string, cardId: string, userId: string, data: UpdateCardData) {
  await checkEditPermission(tripPlanId, userId);

  const card = await prisma.canvasActivityCard.update({
    where: { id: cardId },
    data: {
      ...(data.positionX !== undefined && { positionX: data.positionX }),
      ...(data.positionY !== undefined && { positionY: data.positionY }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.activityType !== undefined && { activityType: data.activityType }),
      ...(data.location !== undefined && { location: emptyStringToNull(data.location) }),
      ...(data.customLocation !== undefined && { customLocation: data.customLocation as any }),
      ...(data.startTime !== undefined && { startTime: emptyStringToNull(data.startTime) }),
      ...(data.endTime !== undefined && { endTime: emptyStringToNull(data.endTime) }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.budgetCategory !== undefined && { budgetCategory: data.budgetCategory }),
      ...(data.memo !== undefined && { memo: emptyStringToNull(data.memo) }),
      ...(data.participants !== undefined && { participants: data.participants as any }),
      ...(data.isCollapsed !== undefined && { isCollapsed: data.isCollapsed }),
      ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
    },
  });

  return {
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    location: card.location || undefined,
    startTime: card.startTime || undefined,
    endTime: card.endTime || undefined,
    memo: card.memo || undefined,
    budgetCategory: card.budgetCategory || undefined,
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  };
}

// カード位置更新
export async function moveCard(tripPlanId: string, cardId: string, userId: string, position: UpdateCardPositionData) {
  await checkEditPermission(tripPlanId, userId);

  const card = await prisma.canvasActivityCard.update({
    where: { id: cardId },
    data: {
      positionX: position.positionX,
      positionY: position.positionY,
    },
  });

  return {
    ...card,
    positionX: decimalToNumber(card.positionX)!,
    positionY: decimalToNumber(card.positionY)!,
    cost: decimalToNumber(card.cost),
    location: card.location || undefined,
    startTime: card.startTime || undefined,
    endTime: card.endTime || undefined,
    memo: card.memo || undefined,
    budgetCategory: card.budgetCategory || undefined,
    participants: card.participants ? JSON.parse(card.participants as string) : undefined,
    customLocation: card.customLocation ? JSON.parse(JSON.stringify(card.customLocation)) : undefined,
  };
}

// カード削除
export async function deleteCard(tripPlanId: string, cardId: string, userId: string) {
  await checkEditPermission(tripPlanId, userId);

  await prisma.canvasActivityCard.delete({
    where: { id: cardId },
  });
}

// ========================================
// 接続操作
// ========================================

// 接続作成
export async function createConnection(tripPlanId: string, userId: string, data: CreateConnectionData) {
  await checkEditPermission(tripPlanId, userId);

  // 自己接続チェック
  if (data.fromCardId === data.toCardId) {
    throw new Error('同じカードへの接続はできません');
  }

  // 重複接続チェック
  const existing = await prisma.cardConnection.findFirst({
    where: {
      tripPlanId,
      fromCardId: data.fromCardId,
      toCardId: data.toCardId,
    },
  });

  if (existing) {
    throw new Error('この接続は既に存在します');
  }

  const connection = await prisma.cardConnection.create({
    data: {
      tripPlanId,
      fromCardId: data.fromCardId,
      toCardId: data.toCardId,
      transportType: data.transportType,
      durationMinutes: data.durationMinutes,
      distanceKm: data.distanceKm,
      cost: data.cost,
      routeData: data.routeData as any,
      proposalId: data.proposalId,
    },
  });

  return {
    ...connection,
    distanceKm: decimalToNumber(connection.distanceKm),
    cost: decimalToNumber(connection.cost),
    routeData: connection.routeData as any,
  };
}

// 接続一覧取得
export async function getConnections(tripPlanId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const connections = await prisma.cardConnection.findMany({
    where: { tripPlanId },
    orderBy: { createdAt: 'asc' },
  });

  return connections.map((conn) => ({
    ...conn,
    distanceKm: decimalToNumber(conn.distanceKm),
    cost: decimalToNumber(conn.cost),
    routeData: conn.routeData as any,
  }));
}

// 接続更新
export async function updateConnection(tripPlanId: string, connectionId: string, userId: string, data: UpdateConnectionData) {
  await checkEditPermission(tripPlanId, userId);

  const connection = await prisma.cardConnection.update({
    where: { id: connectionId },
    data: {
      ...(data.transportType !== undefined && { transportType: data.transportType }),
      ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
      ...(data.distanceKm !== undefined && { distanceKm: data.distanceKm }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.routeData !== undefined && { routeData: data.routeData as any }),
      ...(data.proposalId !== undefined && { proposalId: data.proposalId }),
    },
  });

  return {
    ...connection,
    distanceKm: decimalToNumber(connection.distanceKm),
    cost: decimalToNumber(connection.cost),
    routeData: connection.routeData as any,
  };
}

// 接続削除
export async function deleteConnection(tripPlanId: string, connectionId: string, userId: string) {
  await checkEditPermission(tripPlanId, userId);

  await prisma.cardConnection.delete({
    where: { id: connectionId },
  });
}

// ========================================
// プラン案操作
// ========================================

// プラン案作成
export async function createProposal(tripPlanId: string, userId: string, data: CreateProposalData) {
  await checkEditPermission(tripPlanId, userId);

  const proposal = await prisma.tripPlanProposal.create({
    data: {
      tripPlanId,
      name: data.name,
      color: data.color,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });

  return {
    ...proposal,
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  };
}

// プラン案一覧取得
export async function getProposals(tripPlanId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const proposals = await prisma.tripPlanProposal.findMany({
    where: { tripPlanId },
    orderBy: { createdAt: 'asc' },
    include: {
      activities: true,
      connections: true,
    },
  });

  return proposals.map((proposal) => ({
    ...proposal,
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  }));
}

// プラン案詳細取得
export async function getProposalById(tripPlanId: string, proposalId: string, userId: string) {
  await getTripPlanWithMemberCheck(tripPlanId, userId);

  const proposal = await prisma.tripPlanProposal.findFirst({
    where: { id: proposalId, tripPlanId },
    include: {
      activities: {
        include: {
          card: true,
        },
      },
      connections: true,
    },
  });

  if (!proposal) {
    throw new Error('プラン案が見つかりません');
  }

  return {
    ...proposal,
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  };
}

// プラン案更新
export async function updateProposal(tripPlanId: string, proposalId: string, userId: string, data: UpdateProposalData) {
  await checkEditPermission(tripPlanId, userId);

  const proposal = await prisma.tripPlanProposal.update({
    where: { id: proposalId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
      ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
    },
  });

  return {
    ...proposal,
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  };
}

// プラン案削除
export async function deleteProposal(tripPlanId: string, proposalId: string, userId: string) {
  await checkEditPermission(tripPlanId, userId);

  await prisma.tripPlanProposal.delete({
    where: { id: proposalId },
  });
}
