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
