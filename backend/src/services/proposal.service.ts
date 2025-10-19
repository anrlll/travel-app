/**
 * プラン案サービス - Phase 2.4c
 * グラフ走査による自動検出、CRUD操作、日程管理
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * プラン案の自動検出アルゴリズム
 * グラフ解析により接続されたカードグループを検出
 */
export async function detectProposals(tripPlanId: string) {
  // 1. 全てのカードと接続を取得
  const cards = await prisma.canvasActivityCard.findMany({
    where: { tripPlanId },
  });

  const connections = await prisma.cardConnection.findMany({
    where: { tripPlanId },
  });

  // 2. グラフ構造を構築（隣接リスト）
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

  // 3. 連結成分（プラン案）を検出
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

      proposals.push({
        cardIds: component,
        startCardId,
      });
    }
  });

  // 4. データベースに保存
  const colors = ['#3B82F6', '#10B981', '#A855F7', '#F97316', '#EF4444', '#06B6D4'];
  const savedProposals = [];

  for (let i = 0; i < proposals.length; i++) {
    const proposal = proposals[i];
    const proposalName = `プラン案${String.fromCharCode(65 + i)}`; // A, B, C...
    const color = colors[i % colors.length];

    // 既存のプラン案を削除（再検出時）
    await prisma.tripPlanProposal.deleteMany({
      where: {
        tripPlanId,
        name: proposalName,
      },
    });

    // 新規プラン案を作成
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

    savedProposals.push(savedProposal);
  }

  return savedProposals;
}

/**
 * プラン案の一覧取得
 */
export async function getProposals(tripPlanId: string) {
  const proposals = await prisma.tripPlanProposal.findMany({
    where: { tripPlanId },
    include: {
      activities: {
        include: {
          card: true,
        },
      },
      connections: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // メタ情報の計算
  const proposalsWithMetrics = await Promise.all(
    proposals.map(async (proposal) => {
      const totalBudget = proposal.activities.reduce((sum, activity) => {
        const cost = activity.card.cost ? Number(activity.card.cost) : 0;
        return sum + cost;
      }, 0);

      const totalDistanceKm = proposal.connections.reduce((sum, conn) => {
        const distance = conn.distanceKm ? Number(conn.distanceKm) : 0;
        return sum + distance;
      }, 0);

      // メタ情報を更新
      await prisma.tripPlanProposal.update({
        where: { id: proposal.id },
        data: {
          totalBudget,
          activityCount: proposal.activities.length,
          totalDistanceKm,
        },
      });

      return {
        ...proposal,
        totalBudget,
        activityCount: proposal.activities.length,
        totalDistanceKm,
      };
    })
  );

  return proposalsWithMetrics;
}

/**
 * プラン案の作成（手動）
 */
export async function createProposal(
  tripPlanId: string,
  data: { name: string; color?: string }
) {
  const proposal = await prisma.tripPlanProposal.create({
    data: {
      tripPlanId,
      name: data.name,
      color: data.color || '#6B7280',
      isOfficial: false,
    },
  });

  return proposal;
}

/**
 * プラン案の更新
 */
export async function updateProposal(
  proposalId: string,
  data: Partial<{
    name: string;
    color: string;
    startDate: Date;
    endDate: Date;
  }>
) {
  const proposal = await prisma.tripPlanProposal.update({
    where: { id: proposalId },
    data,
  });

  return proposal;
}

/**
 * プラン案の削除
 */
export async function deleteProposal(proposalId: string) {
  await prisma.tripPlanProposal.delete({
    where: { id: proposalId },
  });
}

/**
 * プラン案へのアクティビティ追加
 */
export async function addActivityToProposal(
  proposalId: string,
  cardId: string,
  dayNumber?: number
) {
  const activity = await prisma.proposalActivity.create({
    data: {
      proposalId,
      cardId,
      dayNumber,
    },
  });

  return activity;
}

/**
 * プラン案のアクティビティ削除
 */
export async function removeActivityFromProposal(
  proposalId: string,
  cardId: string
) {
  await prisma.proposalActivity.deleteMany({
    where: {
      proposalId,
      cardId,
    },
  });
}

/**
 * 日程割り当て
 */
export async function assignSchedule(
  proposalId: string,
  schedule: Array<{ cardId: string; dayNumber: number; orderInDay: number }>
) {
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
