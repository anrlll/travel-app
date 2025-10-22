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

// メンバー管理関数

// ユーザーメンバーを追加
export async function addUserMember(
  tripId: string,
  userId: string,
  email: string,
  role: string,
) {
  // owner権限確認
  const currentMember = await prisma.tripPlanMember.findFirst({
    where: {
      tripPlanId: tripId,
      userId,
    },
  });

  if (!currentMember || currentMember.role !== 'owner') {
    throw new Error('オーナーのみメンバーを追加できます');
  }

  // メール情報からユーザーを検索
  const targetUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!targetUser) {
    throw new Error(`メールアドレス "${email}" のユーザーが見つかりません`);
  }

  // 既に追加されていないか確認
  const existingMember = await prisma.tripPlanMember.findFirst({
    where: {
      tripPlanId: tripId,
      userId: targetUser.id,
    },
  });

  if (existingMember) {
    throw new Error('このユーザーは既にメンバーに追加されています');
  }

  // メンバーを追加
  const member = await prisma.tripPlanMember.create({
    data: {
      tripPlanId: tripId,
      userId: targetUser.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          username: true,
        },
      },
    },
  });

  return member;
}

// ゲストメンバーを追加
export async function addGuestMember(
  tripId: string,
  userId: string,
  guestName: string,
  guestEmail: string,
  role: string,
) {
  // owner権限確認
  const currentMember = await prisma.tripPlanMember.findFirst({
    where: {
      tripPlanId: tripId,
      userId,
    },
  });

  if (!currentMember || currentMember.role !== 'owner') {
    throw new Error('オーナーのみメンバーを追加できます');
  }

  // メールアドレスが既に登録されていないか確認
  const existingGuest = await prisma.tripPlanMember.findFirst({
    where: {
      tripPlanId: tripId,
      guestEmail,
    },
  });

  if (existingGuest) {
    throw new Error('このメールアドレスは既に登録されています');
  }

  // ゲストメンバーを追加
  const member = await prisma.tripPlanMember.create({
    data: {
      tripPlanId: tripId,
      guestName,
      guestEmail,
      role,
    },
  });

  return member;
}

// メンバーを削除
export async function deleteMember(tripId: string, memberId: string, userId: string) {
  // 削除対象のメンバーを確認
  const member = await prisma.tripPlanMember.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw new Error('メンバーが見つかりません');
  }

  if (member.tripPlanId !== tripId) {
    throw new Error('このメンバーは指定された旅行プランに属していません');
  }

  // owner のみが削除可能
  const currentMember = await prisma.tripPlanMember.findFirst({
    where: {
      tripPlanId,
      userId,
    },
  });

  if (!currentMember || currentMember.role !== 'owner') {
    throw new Error('オーナーのみメンバーを削除できます');
  }

  // メンバーを削除
  await prisma.tripPlanMember.delete({
    where: { id: memberId },
  });
}

// メンバーの役割を変更
export async function changeRole(
  tripId: string,
  memberId: string,
  userId: string,
  newRole: string,
) {
  // 変更対象のメンバーを確認
  const member = await prisma.tripPlanMember.findUnique({
    where: { id: memberId },
  });

  if (!member) {
    throw new Error('メンバーが見つかりません');
  }

  if (member.tripPlanId !== tripId) {
    throw new Error('このメンバーは指定された旅行プランに属していません');
  }

  // owner のみが役割を変更可能
  const currentMember = await prisma.tripPlanMember.findFirst({
    where: {
      tripPlanId,
      userId,
    },
  });

  if (!currentMember || currentMember.role !== 'owner') {
    throw new Error('オーナーのみメンバーの役割を変更できます');
  }

  // 役割を変更
  const updatedMember = await prisma.tripPlanMember.update({
    where: { id: memberId },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          username: true,
        },
      },
    },
  });

  return updatedMember;
}