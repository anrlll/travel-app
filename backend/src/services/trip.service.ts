import { prisma } from '../config/prisma.js';
import type { CreateTripInput, UpdateTripInput, GetTripsQuery } from '../models/trip.model.js';

/**
 * 旅行プランへのアクセス権限とメンバー情報を確認
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @returns 旅行プランとメンバー情報
 * @throws 旅行プランが見つからない、またはメンバーでない場合エラー
 */
export async function getTripPlanWithMemberCheck(tripId: string, userId: string) {
  const trip = await prisma.tripPlan.findUnique({
    where: { id: tripId },
    include: {
      members: true,
    },
  });

  if (!trip) {
    throw new Error('旅行プランが見つかりません');
  }

  const member = trip.members.find((m) => m.userId === userId);
  if (!member) {
    throw new Error('この旅行プランにアクセスする権限がありません');
  }

  return trip;
}

// 旅行プランレスポンスの型定義
export interface TripResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  destinations: any; // JSONB型
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  tags: string[];
  notes: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  members?: any[]; // メンバー情報（詳細取得時のみ）
}

// 旅行プラン一覧レスポンスの型定義
export interface TripsResponse {
  trips: TripResponse[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * 旅行プラン作成
 * @param userId - ユーザーID
 * @param input - 旅行プラン作成データ
 * @returns 作成された旅行プラン
 */
export async function createTrip(userId: string, input: CreateTripInput): Promise<TripResponse> {
  // トランザクションで旅行プランとオーナーメンバーを作成
  const result = await prisma.$transaction(async (tx) => {
    // 旅行プラン作成
    const trip = await tx.tripPlan.create({
      data: {
        userId,
        title: input.title,
        description: input.description || null,
        destinations: input.destinations, // JSONB配列として保存
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        status: 'draft', // 初期ステータスは draft
        tags: input.tags || [],
        notes: input.notes || null,
        isPublic: input.isPublic || false,
      },
    });

    // オーナーをメンバーとして自動追加
    await tx.tripPlanMember.create({
      data: {
        tripPlanId: trip.id,
        userId: userId,
        role: 'owner',
      },
    });

    return trip;
  });

  return result;
}

/**
 * 旅行プラン一覧取得
 * @param userId - ユーザーID
 * @param query - クエリパラメータ
 * @returns 旅行プラン一覧とページネーション情報
 */
export async function getTrips(userId: string, query: GetTripsQuery): Promise<TripsResponse> {
  const { page, limit, status, search } = query;
  const skip = (page - 1) * limit;

  // フィルタ条件を構築
  const where: any = {
    members: {
      some: {
        userId: userId,
      },
    },
  };

  // ステータスフィルタ
  if (status) {
    where.status = status;
  }

  // 検索フィルタ（タイトルまたは説明に含まれる）
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // 旅行プラン取得とカウントを並列実行
  const [trips, total] = await Promise.all([
    prisma.tripPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        members: {
          select: {
            id: true,
            userId: true,
            guestName: true,
            role: true,
          },
        },
      },
    }),
    prisma.tripPlan.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    trips,
    total,
    page,
    totalPages,
  };
}

/**
 * 旅行プラン詳細取得
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @returns 旅行プラン詳細
 * @throws ユーザーがメンバーでない場合エラー
 */
export async function getTripById(tripId: string, userId: string): Promise<TripResponse> {
  // 旅行プランを取得
  const trip = await prisma.tripPlan.findUnique({
    where: { id: tripId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!trip) {
    throw new Error('旅行プランが見つかりません');
  }

  // ユーザーがメンバーであるか確認
  const isMember = trip.members.some((member) => member.userId === userId);
  if (!isMember) {
    throw new Error('この旅行プランにアクセスする権限がありません');
  }

  return trip;
}

/**
 * 旅行プラン更新
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @param input - 更新データ
 * @returns 更新された旅行プラン
 * @throws オーナーでない場合エラー
 */
export async function updateTrip(
  tripId: string,
  userId: string,
  input: UpdateTripInput
): Promise<TripResponse> {
  // オーナー権限チェック
  const member = await prisma.tripPlanMember.findFirst({
    where: {
      tripPlanId: tripId,
      userId: userId,
      role: 'owner',
    },
  });

  if (!member) {
    throw new Error('この旅行プランを更新する権限がありません（オーナーのみ可能）');
  }

  // 更新データを構築
  const updateData: any = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
  if (input.endDate !== undefined) updateData.endDate = new Date(input.endDate);
  if (input.destinations !== undefined) updateData.destinations = input.destinations;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;

  // 旅行プランを更新
  const updatedTrip = await prisma.tripPlan.update({
    where: { id: tripId },
    data: updateData,
    include: {
      members: {
        select: {
          id: true,
          userId: true,
          guestName: true,
          role: true,
        },
      },
    },
  });

  return updatedTrip;
}

/**
 * 旅行プラン削除
 * @param tripId - 旅行プランID
 * @param userId - ユーザーID
 * @throws オーナーでない場合エラー
 */
export async function deleteTrip(tripId: string, userId: string): Promise<void> {
  // オーナー権限チェック
  const member = await prisma.tripPlanMember.findFirst({
    where: {
      tripPlanId: tripId,
      userId: userId,
      role: 'owner',
    },
  });

  if (!member) {
    throw new Error('この旅行プランを削除する権限がありません（オーナーのみ可能）');
  }

  // 旅行プランを削除（Cascadeで関連データも削除される）
  await prisma.tripPlan.delete({
    where: { id: tripId },
  });
}
