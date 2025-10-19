/**
 * プラン案→正式プランデータ変換サービス - Phase 2.4c-3
 * キャンバスデータを従来型構造に変換
 */

import { prisma } from '../config/prisma.js';

/**
 * プラン案を正式プランとして選択し、データを従来型構造に変換
 */
export async function selectOfficialProposal(
  tripPlanId: string,
  proposalId: string,
  userId: string
) {
  // プラン案取得
  const proposal = await prisma.tripPlanProposal.findUnique({
    where: { id: proposalId },
    include: {
      activities: {
        include: {
          card: true,
        },
        orderBy: [
          { dayNumber: 'asc' },
          { orderInDay: 'asc' },
        ],
      },
      tripPlan: true, // 旅行プラン全体の情報を取得
    },
  });

  if (!proposal) {
    throw new Error('プラン案が見つかりません');
  }

  if (!proposal.proposalDate) {
    throw new Error('プラン案の日付が設定されていません。先に日付を設定してください。');
  }

  // 旅行プラン全体の開始日を確認
  if (!proposal.tripPlan.startDate) {
    throw new Error('旅行プランの開始日が設定されていません');
  }

  // proposalDateから旅行の何日目かを計算
  const tripStartDate = new Date(proposal.tripPlan.startDate);
  const proposalDateObj = new Date(proposal.proposalDate);

  // 日付のみを比較するため、時刻をリセット
  tripStartDate.setHours(0, 0, 0, 0);
  proposalDateObj.setHours(0, 0, 0, 0);

  const diffTime = proposalDateObj.getTime() - tripStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const calculatedDayNumber = diffDays + 1; // 1日目、2日目、3日目...

  console.log('日程計算:', {
    tripStartDate: tripStartDate.toISOString(),
    proposalDate: proposalDateObj.toISOString(),
    diffDays,
    calculatedDayNumber,
  });

  // 接続情報を取得
  const connections = await prisma.cardConnection.findMany({
    where: { proposalId },
  });

  // トランザクションでデータ変換
  await prisma.$transaction(async (tx) => {
    // 1. 同じ日付の既存の正式プランを下書きに変更
    await tx.tripPlanProposal.updateMany({
      where: {
        tripPlanId,
        isOfficial: true,
        proposalDate: proposal.proposalDate, // 同じ日付のプラン案のみ
      },
      data: {
        isOfficial: false,
      },
    });

    // 2. 選択したプラン案を正式化
    await tx.tripPlanProposal.update({
      where: { id: proposalId },
      data: {
        isOfficial: true,
      },
    });

    // 3. trip_plansのステータス更新
    await tx.tripPlan.update({
      where: { id: tripPlanId },
      data: {
        status: 'planning',
      },
    });

    // 4. 同じ日（dayNumber）の既存のtrip_plan_activitiesを削除
    await tx.tripPlanActivity.deleteMany({
      where: {
        tripPlanId,
        dayNumber: calculatedDayNumber, // 同じ日のアクティビティのみ削除
      },
    });

    // 5. canvas_activity_cards → trip_plan_activitiesに変換
    const activityCardMap = new Map<string, string>(); // cardId → trip_plan_activity.id

    for (const proposalActivity of proposal.activities) {
      const card = proposalActivity.card;

      // startTime/endTimeをDateTime型に変換（HH:mm形式 → DateTime）
      let startDateTime = null;
      let endDateTime = null;

      if (card.startTime) {
        const [hours, minutes] = card.startTime.split(':');
        startDateTime = new Date();
        startDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }

      if (card.endTime) {
        const [hours, minutes] = card.endTime.split(':');
        endDateTime = new Date();
        endDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }

      // trip_plan_activityを作成
      // dayNumberはproposalDateから計算した値を使用
      const activity = await tx.tripPlanActivity.create({
        data: {
          tripPlanId,
          dayNumber: proposalActivity.dayNumber || calculatedDayNumber,
          order: proposalActivity.orderInDay ?? 0, // nullish coalescingで0も有効な値として扱う
          title: card.title,
          category: card.activityType,
          location: card.location,
          customLocation: card.customLocation as any,
          startTime: startDateTime,
          endTime: endDateTime,
          estimatedCost: card.cost,
          notes: card.memo,
          isCompleted: card.isCompleted,
          isFromCanvas: true, // キャンバスモードから作成されたアクティビティ
          canvasCardId: card.id, // キャンバスカードへの参照（双方向同期用）
        },
      });

      activityCardMap.set(card.id, activity.id);

      // 参加者情報の変換（JSONB配列 → trip_plan_activity_participants）
      if (card.participants && Array.isArray(card.participants)) {
        const participantIds = card.participants as string[];

        if (participantIds.length > 0) {
          await tx.tripPlanActivityParticipant.createMany({
            data: participantIds.map((memberId) => ({
              tripPlanActivityId: activity.id,
              tripPlanMemberId: memberId,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    // 6. card_connections → trip_plan_activity_transportに変換
    for (const connection of connections) {
      const toActivityId = activityCardMap.get(connection.toCardId);

      if (toActivityId) {
        await tx.tripPlanActivityTransport.create({
          data: {
            tripPlanActivityId: toActivityId,
            transportType: connection.transportType || 'other',
            durationMinutes: connection.durationMinutes,
            distanceKm: connection.distanceKm,
            cost: connection.cost,
            routeData: connection.routeData as any,
            isAutoCalculated: true, // キャンバスからの変換は自動計算扱い
          },
        });
      }
    }
  });

  // 変換完了後、更新されたプラン案を返却
  const updatedProposal = await prisma.tripPlanProposal.findUnique({
    where: { id: proposalId },
    include: {
      activities: {
        include: {
          card: true,
        },
      },
    },
  });

  return updatedProposal;
}
