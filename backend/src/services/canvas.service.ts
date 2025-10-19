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
      proposalDate: data.proposalDate ? new Date(data.proposalDate) : undefined,
    },
  });

  return {
    ...proposal,
    proposalDate: proposal.proposalDate?.toISOString(),
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
    proposalDate: proposal.proposalDate?.toISOString(),
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
    proposalDate: proposal.proposalDate?.toISOString(),
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  };
}

// プラン案更新
export async function updateProposal(tripPlanId: string, proposalId: string, userId: string, data: UpdateProposalData) {
  await checkEditPermission(tripPlanId, userId);

  // 日付の処理
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.proposalDate !== undefined) {
    updateData.proposalDate = data.proposalDate ? new Date(data.proposalDate) : null;
  }

  const proposal = await prisma.tripPlanProposal.update({
    where: { id: proposalId },
    data: updateData,
  });

  return {
    ...proposal,
    proposalDate: proposal.proposalDate?.toISOString(),
    totalBudget: decimalToNumber(proposal.totalBudget),
    totalDistanceKm: decimalToNumber(proposal.totalDistanceKm),
  };
}

// プラン案削除
export async function deleteProposal(tripPlanId: string, proposalId: string, userId: string) {
  await checkEditPermission(tripPlanId, userId);

  // 削除前にプラン案の情報を取得
  const proposal = await prisma.tripPlanProposal.findUnique({
    where: { id: proposalId },
    include: {
      tripPlan: true,
    },
  });

  if (!proposal) {
    throw new Error('プラン案が見つかりません');
  }

  // 正式プランの場合、対応するアクティビティも削除
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
      where: {
        tripPlanId,
        dayNumber,
      },
    });
  }

  // プラン案を削除
  await prisma.tripPlanProposal.delete({
    where: { id: proposalId },
  });
}

// ========================================
// プラン案自動検出 (Phase 2.4c)
// ========================================

/**
 * プラン案の自動検出アルゴリズム
 * グラフ解析により接続されたカードグループを検出
 */
export async function detectProposals(tripPlanId: string, userId: string) {
  await checkEditPermission(tripPlanId, userId);

  // 1. 既存の正式プラン案を取得
  const existingOfficialProposals = await prisma.tripPlanProposal.findMany({
    where: {
      tripPlanId,
      isOfficial: true,
    },
    include: {
      activities: true, // ProposalActivityを含める
    },
  });

  // 2. 正式プラン案に含まれるカードIDのセット
  const officialCardIds = new Set<string>();
  existingOfficialProposals.forEach((proposal) => {
    proposal.activities.forEach((activity) => {
      officialCardIds.add(activity.cardId);
    });
  });

  console.log('正式プラン案のカードID:', Array.from(officialCardIds));

  // 3. 全てのカードを取得（正式プラン案のカードは除外）
  const cards = await prisma.canvasActivityCard.findMany({
    where: {
      tripPlanId,
      id: {
        notIn: Array.from(officialCardIds), // 正式プラン案のカードを除外
      },
    },
  });

  const connections = await prisma.cardConnection.findMany({
    where: { tripPlanId },
  });

  // 4. グラフ構造を構築（隣接リスト）
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // 全てのカードを初期化
  cards.forEach((card) => {
    graph.set(card.id, []);
    inDegree.set(card.id, 0);
  });

  // 接続を追加
  connections.forEach((conn) => {
    graph.get(conn.fromCardId)?.push(conn.toCardId);
    inDegree.set(conn.toCardId, (inDegree.get(conn.toCardId) || 0) + 1);
  });

  // 5. 連結成分（プラン案）を検出
  const visited = new Set<string>();
  const proposals: Array<{
    cardIds: string[];
    startCardId: string;
  }> = [];

  cards.forEach((card) => {
    if (visited.has(card.id)) return;

    // 深さ優先探索で連結成分を検出
    const component: string[] = [];
    const stack = [card.id];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;

      visited.add(currentId);
      component.push(currentId);

      // 前方向の接続
      graph.get(currentId)?.forEach((nextId) => {
        if (!visited.has(nextId)) {
          stack.push(nextId);
        }
      });

      // 後方向の接続も辿る（無向グラフとして扱う）
      connections.forEach((conn) => {
        if (conn.toCardId === currentId && !visited.has(conn.fromCardId)) {
          stack.push(conn.fromCardId);
        }
      });
    }

    // 連結成分が2つ以上のカードを含む場合のみプラン案として認識
    if (component.length >= 2) {
      // 開始ノードを特定（入力接続が最も少ないノード）
      const startCardId = component.reduce((minCard, cardId) => {
        const minDegree = inDegree.get(minCard) || 0;
        const currentDegree = inDegree.get(cardId) || 0;
        return currentDegree < minDegree ? cardId : minCard;
      }, component[0]);

      // 開始ノードからBFSで正しい順序でカードを並べる
      const orderedCardIds: string[] = [];
      const bfsVisited = new Set<string>();
      const queue = [startCardId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (bfsVisited.has(currentId)) continue;

        bfsVisited.add(currentId);
        orderedCardIds.push(currentId);

        // 接続されている次のノードをキューに追加
        const nextNodes = graph.get(currentId) || [];
        nextNodes.forEach((nextId) => {
          if (!bfsVisited.has(nextId) && component.includes(nextId)) {
            queue.push(nextId);
          }
        });
      }

      proposals.push({
        cardIds: orderedCardIds,
        startCardId,
      });
    }
  });

  // 6. 既存の下書きプラン案を削除
  await prisma.tripPlanProposal.deleteMany({
    where: {
      tripPlanId,
      isOfficial: false,
    },
  });

  // 7. データベースに保存
  const colors = ['#3B82F6', '#10B981', '#A855F7', '#F97316', '#EF4444', '#06B6D4'];
  const savedProposals = [];

  for (let i = 0; i < proposals.length; i++) {
    const proposal = proposals[i];
    const proposalName = `プラン案${String.fromCharCode(65 + i)}`; // A, B, C...
    const color = colors[i % colors.length];

    // 新規プラン案を作成（下書きとして）
    const savedProposal = await prisma.tripPlanProposal.create({
      data: {
        tripPlanId,
        name: proposalName,
        color,
        isOfficial: false,
      },
    });

    // カードをプラン案に割り当て
    await prisma.proposalActivity.createMany({
      data: proposal.cardIds.map((cardId, index) => ({
        proposalId: savedProposal.id,
        cardId,
        dayNumber: null,
        orderInDay: index,
      })),
    });

    // 接続線にproposalIdを設定
    await prisma.cardConnection.updateMany({
      where: {
        tripPlanId,
        AND: [
          { fromCardId: { in: proposal.cardIds } },
          { toCardId: { in: proposal.cardIds } },
        ],
      },
      data: {
        proposalId: savedProposal.id,
      },
    });

    // メタ情報の計算
    const totalBudget = await prisma.canvasActivityCard.aggregate({
      where: { id: { in: proposal.cardIds } },
      _sum: { cost: true },
    });

    const totalDistanceKm = await prisma.cardConnection.aggregate({
      where: {
        proposalId: savedProposal.id,
      },
      _sum: { distanceKm: true },
    });

    // プラン案を更新
    const updatedProposal = await prisma.tripPlanProposal.update({
      where: { id: savedProposal.id },
      data: {
        totalBudget: totalBudget._sum.cost,
        activityCount: proposal.cardIds.length,
        totalDistanceKm: totalDistanceKm._sum.distanceKm,
      },
    });

    savedProposals.push({
      ...updatedProposal,
      proposalDate: updatedProposal.proposalDate?.toISOString(),
      totalBudget: decimalToNumber(updatedProposal.totalBudget),
      totalDistanceKm: decimalToNumber(updatedProposal.totalDistanceKm),
    });
  }

  // 8. 既存の正式プラン案も結果に含める
  const allProposals = [
    ...existingOfficialProposals.map((p) => ({
      ...p,
      proposalDate: p.proposalDate?.toISOString(),
      totalBudget: decimalToNumber(p.totalBudget),
      totalDistanceKm: decimalToNumber(p.totalDistanceKm),
    })),
    ...savedProposals,
  ];

  return allProposals;
}

/**
 * 日程割り当て
 */
export async function assignSchedule(
  tripPlanId: string,
  proposalId: string,
  userId: string,
  schedule: Array<{ cardId: string; dayNumber: number; orderInDay: number }>
) {
  await checkEditPermission(tripPlanId, userId);

  // トランザクションで一括更新
  await prisma.$transaction(
    schedule.map((item) =>
      prisma.proposalActivity.updateMany({
        where: {
          proposalId,
          cardId: item.cardId,
        },
        data: {
          dayNumber: item.dayNumber,
          orderInDay: item.orderInDay,
        },
      })
    )
  );
}
