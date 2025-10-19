import { prisma } from '../config/prisma.js';
import type { CreateActivityData, UpdateActivityData, GetActivitiesParams } from '../models/activity.model.js';

/**
 * 旅行プランへのアクセス権限とメンバー情報を確認
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @returns メンバー情報（roleを含む）
 * @throws 旅行プランが見つからない、またはメンバーでない場合エラー
 */
async function getTripPlanWithMemberCheck(tripId: string, userId: string) {
  const trip = await prisma.tripPlan.findUnique({
    where: { id: tripId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!trip) {
    throw new Error('旅行プランが見つかりません');
  }

  const member = trip.members[0];
  if (!member) {
    throw new Error('この旅行プランにアクセスする権限がありません');
  }

  return { trip, member };
}

/**
 * オーナーまたはエディター権限を確認
 * @param role - ユーザーロール
 * @throws 権限がない場合エラー
 */
function checkEditPermission(role: string) {
  if (role !== 'owner' && role !== 'editor') {
    throw new Error('この操作を行う権限がありません（オーナーまたはエディターのみ可能）');
  }
}

/**
 * アクティビティ作成
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @param input - アクティビティ作成データ
 * @returns 作成されたアクティビティ
 */
export async function createActivity(
  tripId: string,
  userId: string,
  input: CreateActivityData
) {
  // 権限チェック（オーナーまたはエディター）
  const { member } = await getTripPlanWithMemberCheck(tripId, userId);
  checkEditPermission(member.role);

  // 同じ日の最大order値を取得
  const maxOrderActivity = await prisma.tripPlanActivity.findFirst({
    where: {
      tripPlanId: tripId,
      dayNumber: input.dayNumber,
    },
    orderBy: {
      order: 'desc',
    },
  });

  const nextOrder = maxOrderActivity ? maxOrderActivity.order + 1 : 0;

  // アクティビティ作成
  const activity = await prisma.tripPlanActivity.create({
    data: {
      tripPlanId: tripId,
      dayNumber: input.dayNumber,
      order: nextOrder,
      title: input.title,
      startTime: input.startTime ? new Date(input.startTime) : null,
      endTime: input.endTime ? new Date(input.endTime) : null,
      description: input.description || null,
      category: input.category,
      location: input.location || null,
      customLocation: input.customLocation || null,
      estimatedCost: input.estimatedCost || null,
      notes: input.notes || null,
      isCompleted: false,
    },
  });

  return activity;
}

/**
 * アクティビティ一覧取得
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @param params - クエリパラメータ
 * @returns アクティビティ一覧
 */
export async function getActivities(
  tripId: string,
  userId: string,
  params: GetActivitiesParams
) {
  // 権限チェック（メンバーであればOK）
  await getTripPlanWithMemberCheck(tripId, userId);

  // フィルタ条件を構築
  const where: any = {
    tripPlanId: tripId,
  };

  if (params.dayNumber !== undefined) {
    where.dayNumber = params.dayNumber;
  }

  // アクティビティ一覧を取得（dayNumberとorder順でソート）
  const activities = await prisma.tripPlanActivity.findMany({
    where,
    orderBy: [
      { dayNumber: 'asc' },
      { order: 'asc' },
    ],
  });

  return activities;
}

/**
 * アクティビティ詳細取得
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 * @returns アクティビティ詳細
 */
export async function getActivityById(activityId: string, userId: string) {
  // アクティビティを取得
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  // 旅行プランのメンバーであるか確認
  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }

  // tripPlanを除外してアクティビティのみ返す
  const { tripPlan, ...activityData } = activity;

  return activityData;
}

/**
 * アクティビティ更新
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 * @param input - 更新データ
 * @returns 更新されたアクティビティ
 */
export async function updateActivity(
  activityId: string,
  userId: string,
  input: UpdateActivityData
) {
  // アクティビティを取得
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  // 権限チェック（オーナーまたはエディター）
  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }
  checkEditPermission(member.role);

  // 更新データを構築
  const updateData: any = {};

  if (input.dayNumber !== undefined) updateData.dayNumber = input.dayNumber;
  if (input.order !== undefined) updateData.order = input.order;
  if (input.title !== undefined) updateData.title = input.title;
  if (input.startTime !== undefined) {
    updateData.startTime = input.startTime ? new Date(input.startTime) : null;
  }
  if (input.endTime !== undefined) {
    updateData.endTime = input.endTime ? new Date(input.endTime) : null;
  }
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.location !== undefined) updateData.location = input.location;
  if (input.customLocation !== undefined) updateData.customLocation = input.customLocation;
  if (input.estimatedCost !== undefined) updateData.estimatedCost = input.estimatedCost;
  if (input.actualCost !== undefined) updateData.actualCost = input.actualCost;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.isCompleted !== undefined) updateData.isCompleted = input.isCompleted;

  // アクティビティを更新
  const updatedActivity = await prisma.tripPlanActivity.update({
    where: { id: activityId },
    data: updateData,
  });

  // キャンバスカードとの同期: isFromCanvasがtrueかつcanvasCardIdが存在する場合
  if (activity.isFromCanvas && activity.canvasCardId) {
    // キャンバスカードも同期更新
    const canvasUpdateData: any = {};

    // タイトル
    if (input.title !== undefined) canvasUpdateData.title = input.title;

    // カテゴリ（activityType）
    if (input.category !== undefined) canvasUpdateData.activityType = input.category;

    // 場所
    if (input.location !== undefined) canvasUpdateData.location = input.location;

    // カスタムロケーション
    if (input.customLocation !== undefined) canvasUpdateData.customLocation = input.customLocation;

    // 開始・終了時刻（DateTime → HH:mm形式）
    if (input.startTime !== undefined) {
      if (input.startTime === null) {
        canvasUpdateData.startTime = null;
      } else {
        const startDate = new Date(input.startTime);
        canvasUpdateData.startTime = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
      }
    }
    if (input.endTime !== undefined) {
      if (input.endTime === null) {
        canvasUpdateData.endTime = null;
      } else {
        const endDate = new Date(input.endTime);
        canvasUpdateData.endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
      }
    }

    // コスト
    if (input.estimatedCost !== undefined) canvasUpdateData.cost = input.estimatedCost;

    // メモ
    if (input.notes !== undefined) canvasUpdateData.memo = input.notes;

    // 完了状態
    if (input.isCompleted !== undefined) canvasUpdateData.isCompleted = input.isCompleted;

    // 更新するフィールドがある場合のみ実行
    if (Object.keys(canvasUpdateData).length > 0) {
      await prisma.canvasActivityCard.update({
        where: { id: activity.canvasCardId },
        data: canvasUpdateData,
      });
    }
  }

  return updatedActivity;
}

/**
 * アクティビティ削除
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 */
export async function deleteActivity(activityId: string, userId: string): Promise<void> {
  // アクティビティを取得
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  // 権限チェック（オーナーまたはエディター）
  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }
  checkEditPermission(member.role);

  // アクティビティを削除
  await prisma.tripPlanActivity.delete({
    where: { id: activityId },
  });
}

// ========================================
// 参加者管理
// ========================================

/**
 * アクティビティに参加者を追加
 * @param activityId - アクティビティID
 * @param memberId - メンバーID
 * @param userId - ユーザーID
 */
export async function addParticipant(
  activityId: string,
  memberId: string,
  userId: string
): Promise<void> {
  // アクティビティを取得して権限チェック
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }
  checkEditPermission(member.role);

  // メンバーが同じ旅行プランに所属しているか確認
  const targetMember = await prisma.tripPlanMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember || targetMember.tripPlanId !== activity.tripPlanId) {
    throw new Error('指定されたメンバーはこの旅行プランに所属していません');
  }

  // 既に参加者として登録されているか確認
  const existingParticipant = await prisma.tripPlanActivityParticipant.findUnique({
    where: {
      tripPlanActivityId_tripPlanMemberId: {
        tripPlanActivityId: activityId,
        tripPlanMemberId: memberId,
      },
    },
  });

  if (existingParticipant) {
    throw new Error('このメンバーは既に参加者として登録されています');
  }

  // 参加者を追加
  await prisma.tripPlanActivityParticipant.create({
    data: {
      tripPlanActivityId: activityId,
      tripPlanMemberId: memberId,
    },
  });
}

/**
 * アクティビティから参加者を削除
 * @param activityId - アクティビティID
 * @param memberId - メンバーID
 * @param userId - ユーザーID
 */
export async function removeParticipant(
  activityId: string,
  memberId: string,
  userId: string
): Promise<void> {
  // アクティビティを取得して権限チェック
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }
  checkEditPermission(member.role);

  // 参加者を削除
  await prisma.tripPlanActivityParticipant.delete({
    where: {
      tripPlanActivityId_tripPlanMemberId: {
        tripPlanActivityId: activityId,
        tripPlanMemberId: memberId,
      },
    },
  });
}

/**
 * アクティビティの参加者一覧を取得
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 * @returns 参加者一覧
 */
export async function getParticipants(activityId: string, userId: string) {
  // アクティビティを取得して権限チェック
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }

  // 参加者一覧を取得
  const participants = await prisma.tripPlanActivityParticipant.findMany({
    where: {
      tripPlanActivityId: activityId,
    },
    include: {
      member: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      },
    },
  });

  return participants;
}

// ========================================
// 移動手段管理
// ========================================

/**
 * 移動手段データの型定義
 */
export interface TransportData {
  transportType: string; // walk, car, train, bus, plane, other
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
}

/**
 * アクティビティの移動手段を設定または更新
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 * @param data - 移動手段データ
 */
export async function setTransport(
  activityId: string,
  userId: string,
  data: TransportData
) {
  // アクティビティを取得して権限チェック
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }
  checkEditPermission(member.role);

  // 既存の移動手段を確認
  const existingTransport = await prisma.tripPlanActivityTransport.findFirst({
    where: {
      tripPlanActivityId: activityId,
    },
  });

  if (existingTransport) {
    // 更新
    return await prisma.tripPlanActivityTransport.update({
      where: { id: existingTransport.id },
      data: {
        transportType: data.transportType,
        durationMinutes: data.durationMinutes || null,
        distanceKm: data.distanceKm || null,
        cost: data.cost || null,
        routeData: data.routeData || null,
        isAutoCalculated: false,
      },
    });
  } else {
    // 新規作成
    return await prisma.tripPlanActivityTransport.create({
      data: {
        tripPlanActivityId: activityId,
        transportType: data.transportType,
        durationMinutes: data.durationMinutes || null,
        distanceKm: data.distanceKm || null,
        cost: data.cost || null,
        routeData: data.routeData || null,
        isAutoCalculated: false,
      },
    });
  }
}

/**
 * アクティビティの移動手段を削除
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 */
export async function deleteTransport(activityId: string, userId: string): Promise<void> {
  // アクティビティを取得して権限チェック
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }
  checkEditPermission(member.role);

  // 移動手段を削除
  await prisma.tripPlanActivityTransport.deleteMany({
    where: {
      tripPlanActivityId: activityId,
    },
  });
}

/**
 * アクティビティの移動手段を取得
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 * @returns 移動手段情報
 */
export async function getTransport(activityId: string, userId: string) {
  // アクティビティを取得して権限チェック
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }

  // 移動手段を取得
  const transport = await prisma.tripPlanActivityTransport.findFirst({
    where: {
      tripPlanActivityId: activityId,
    },
  });

  return transport;
}

// ========================================
// 順序変更・一括操作
// ========================================

/**
 * 同一日内でアクティビティの順序を変更
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 * @param newOrder - 新しい順序
 * @returns 更新されたアクティビティ
 */
export async function reorderActivity(
  activityId: string,
  userId: string,
  newOrder: number
) {
  // アクティビティを取得して権限チェック
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }
  checkEditPermission(member.role);

  const oldOrder = activity.order;
  const dayNumber = activity.dayNumber;

  // 同じ日の他のアクティビティを取得
  const dayActivities = await prisma.tripPlanActivity.findMany({
    where: {
      tripPlanId: activity.tripPlanId,
      dayNumber: dayNumber,
    },
    orderBy: {
      order: 'asc',
    },
  });

  // トランザクション内でorder値を再計算して更新
  await prisma.$transaction(async (tx) => {
    // 移動方向によって処理を分ける
    if (newOrder < oldOrder) {
      // 上に移動: newOrder～oldOrder-1の範囲を+1
      await tx.tripPlanActivity.updateMany({
        where: {
          tripPlanId: activity.tripPlanId,
          dayNumber: dayNumber,
          order: {
            gte: newOrder,
            lt: oldOrder,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });
    } else if (newOrder > oldOrder) {
      // 下に移動: oldOrder+1～newOrderの範囲を-1
      await tx.tripPlanActivity.updateMany({
        where: {
          tripPlanId: activity.tripPlanId,
          dayNumber: dayNumber,
          order: {
            gt: oldOrder,
            lte: newOrder,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });
    }

    // 対象アクティビティのorderを更新
    await tx.tripPlanActivity.update({
      where: { id: activityId },
      data: { order: newOrder },
    });
  });

  // 更新後のアクティビティを取得して返す
  const updatedActivity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
  });

  return updatedActivity;
}

/**
 * アクティビティを別の日に移動
 * @param activityId - アクティビティID
 * @param userId - ユーザーID
 * @param newDayNumber - 新しい日番号
 * @param newOrder - 新しい順序（省略時は末尾に追加）
 * @returns 更新されたアクティビティ
 */
export async function moveActivityToDay(
  activityId: string,
  userId: string,
  newDayNumber: number,
  newOrder?: number
) {
  // アクティビティを取得して権限チェック
  const activity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
    include: {
      tripPlan: {
        include: {
          members: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!activity) {
    throw new Error('アクティビティが見つかりません');
  }

  const member = activity.tripPlan.members[0];
  if (!member) {
    throw new Error('このアクティビティにアクセスする権限がありません');
  }
  checkEditPermission(member.role);

  const oldDayNumber = activity.dayNumber;
  const oldOrder = activity.order;

  // 同じ日への移動の場合はreorderActivityを使用
  if (newDayNumber === oldDayNumber) {
    if (newOrder !== undefined && newOrder !== oldOrder) {
      return await reorderActivity(activityId, userId, newOrder);
    }
    return activity;
  }

  // 移動先の日の最大order値を取得
  const maxOrderActivity = await prisma.tripPlanActivity.findFirst({
    where: {
      tripPlanId: activity.tripPlanId,
      dayNumber: newDayNumber,
    },
    orderBy: {
      order: 'desc',
    },
  });

  const targetOrder = newOrder !== undefined ? newOrder : (maxOrderActivity ? maxOrderActivity.order + 1 : 0);

  // トランザクション内で処理
  await prisma.$transaction(async (tx) => {
    // 元の日で、削除されたアクティビティより後ろのorderを-1
    await tx.tripPlanActivity.updateMany({
      where: {
        tripPlanId: activity.tripPlanId,
        dayNumber: oldDayNumber,
        order: {
          gt: oldOrder,
        },
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    });

    // 移動先の日で、挿入位置以降のorderを+1
    await tx.tripPlanActivity.updateMany({
      where: {
        tripPlanId: activity.tripPlanId,
        dayNumber: newDayNumber,
        order: {
          gte: targetOrder,
        },
      },
      data: {
        order: {
          increment: 1,
        },
      },
    });

    // アクティビティを更新
    await tx.tripPlanActivity.update({
      where: { id: activityId },
      data: {
        dayNumber: newDayNumber,
        order: targetOrder,
      },
    });
  });

  // 更新後のアクティビティを取得して返す
  const updatedActivity = await prisma.tripPlanActivity.findUnique({
    where: { id: activityId },
  });

  return updatedActivity;
}

/**
 * 複数のアクティビティを一括削除
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @param activityIds - 削除するアクティビティIDの配列
 */
export async function batchDeleteActivities(
  tripId: string,
  userId: string,
  activityIds: string[]
): Promise<void> {
  // 権限チェック
  const { member } = await getTripPlanWithMemberCheck(tripId, userId);
  checkEditPermission(member.role);

  // 指定されたアクティビティがすべて同じ旅行プランに属しているか確認
  const activities = await prisma.tripPlanActivity.findMany({
    where: {
      id: {
        in: activityIds,
      },
    },
  });

  if (activities.length !== activityIds.length) {
    throw new Error('一部のアクティビティが見つかりません');
  }

  const invalidActivity = activities.find((a) => a.tripPlanId !== tripId);
  if (invalidActivity) {
    throw new Error('指定されたアクティビティの一部がこの旅行プランに属していません');
  }

  // トランザクション内で削除とorder値の再計算
  await prisma.$transaction(async (tx) => {
    // 削除対象のアクティビティを日ごとにグループ化
    const activitiesByDay = activities.reduce((acc, activity) => {
      if (!acc[activity.dayNumber]) {
        acc[activity.dayNumber] = [];
      }
      acc[activity.dayNumber].push(activity);
      return acc;
    }, {} as Record<number, typeof activities>);

    // 各日ごとに処理
    for (const [dayNumber, dayActivities] of Object.entries(activitiesByDay)) {
      // 削除対象のorder値を取得してソート
      const deletedOrders = dayActivities.map((a) => a.order).sort((a, b) => a - b);

      // アクティビティを削除
      await tx.tripPlanActivity.deleteMany({
        where: {
          id: {
            in: dayActivities.map((a) => a.id),
          },
        },
      });

      // 残りのアクティビティのorder値を再計算
      const remainingActivities = await tx.tripPlanActivity.findMany({
        where: {
          tripPlanId: tripId,
          dayNumber: parseInt(dayNumber),
        },
        orderBy: {
          order: 'asc',
        },
      });

      // order値を0から順に振り直す
      for (let i = 0; i < remainingActivities.length; i++) {
        await tx.tripPlanActivity.update({
          where: { id: remainingActivities[i].id },
          data: { order: i },
        });
      }
    }
  });
}

/**
 * 複数のアクティビティの完了状態を一括変更
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @param activityIds - 対象アクティビティIDの配列
 * @param isCompleted - 完了状態
 */
export async function batchToggleCompletion(
  tripId: string,
  userId: string,
  activityIds: string[],
  isCompleted: boolean
): Promise<void> {
  // 権限チェック
  const { member } = await getTripPlanWithMemberCheck(tripId, userId);
  checkEditPermission(member.role);

  // 指定されたアクティビティがすべて同じ旅行プランに属しているか確認
  const activities = await prisma.tripPlanActivity.findMany({
    where: {
      id: {
        in: activityIds,
      },
    },
  });

  if (activities.length !== activityIds.length) {
    throw new Error('一部のアクティビティが見つかりません');
  }

  const invalidActivity = activities.find((a) => a.tripPlanId !== tripId);
  if (invalidActivity) {
    throw new Error('指定されたアクティビティの一部がこの旅行プランに属していません');
  }

  // 一括更新
  await prisma.tripPlanActivity.updateMany({
    where: {
      id: {
        in: activityIds,
      },
    },
    data: {
      isCompleted: isCompleted,
    },
  });
}
