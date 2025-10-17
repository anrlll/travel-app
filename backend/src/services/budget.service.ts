import { prisma } from '../config/prisma.js';
import type {
  TripPlanBudget,
  CreateBudgetData,
  UpdateBudgetData,
  BudgetCategory,
  BudgetSummary,
  BudgetComparison,
  DailyExpense,
  BudgetChartData,
} from '../models/budget.model.js';
import { budgetCategoryLabels, activityToBudgetCategoryMap } from '../models/budget.model.js';
import { Decimal } from '@prisma/client/runtime/library';
import { getTripPlanWithMemberCheck } from './trip.service.js';

/**
 * 予算カテゴリの色マッピング（グラフ用）
 */
const categoryColors: Record<BudgetCategory, string> = {
  food: '#FF6B6B',           // 赤
  transport: '#4ECDC4',      // シアン
  accommodation: '#95E1D3',  // ミントグリーン
  sightseeing: '#F38181',    // ピンク
  other: '#AA96DA',          // 紫
  total: '#3D5A80',          // ダークブルー
};

/**
 * Decimal を number に変換するヘルパー関数
 */
function decimalToNumber(value: Decimal | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return parseFloat(value.toString());
}

/**
 * 予算を作成
 */
export async function createBudget(
  tripId: string,
  userId: string,
  data: CreateBudgetData
): Promise<TripPlanBudget> {
  // 旅行プランの存在確認と権限チェック（owner/editor）
  const tripPlan = await getTripPlanWithMemberCheck(tripId, userId);
  const member = tripPlan.members?.find((m) => m.userId === userId);
  if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
    throw new Error('予算を作成する権限がありません');
  }

  // 同じカテゴリの予算が既に存在しないかチェック
  const existing = await prisma.tripPlanBudget.findUnique({
    where: {
      tripPlanId_category: {
        tripPlanId: tripId,
        category: data.category,
      },
    },
  });

  if (existing) {
    throw new Error(`カテゴリ「${budgetCategoryLabels[data.category]}」の予算は既に存在します`);
  }

  // 予算作成
  const budget = await prisma.tripPlanBudget.create({
    data: {
      tripPlanId: tripId,
      category: data.category,
      budgetAmount: new Decimal(data.budgetAmount),
      isPerPerson: data.isPerPerson || false,
      notes: data.notes,
    },
  });

  return {
    ...budget,
    budgetAmount: decimalToNumber(budget.budgetAmount),
  };
}

/**
 * 予算一覧を取得
 */
export async function getBudgets(tripId: string, userId: string): Promise<TripPlanBudget[]> {
  // 旅行プランの存在確認と権限チェック
  await getTripPlanWithMemberCheck(tripId, userId);

  const budgets = await prisma.tripPlanBudget.findMany({
    where: { tripPlanId: tripId },
    orderBy: [
      { category: 'asc' },
    ],
  });

  return budgets.map((budget) => ({
    ...budget,
    budgetAmount: decimalToNumber(budget.budgetAmount),
  }));
}

/**
 * 特定カテゴリの予算を取得
 */
export async function getBudgetByCategory(
  tripId: string,
  category: BudgetCategory,
  userId: string
): Promise<TripPlanBudget | null> {
  // 旅行プランの存在確認と権限チェック
  await getTripPlanWithMemberCheck(tripId, userId);

  const budget = await prisma.tripPlanBudget.findUnique({
    where: {
      tripPlanId_category: {
        tripPlanId: tripId,
        category: category,
      },
    },
  });

  if (!budget) return null;

  return {
    ...budget,
    budgetAmount: decimalToNumber(budget.budgetAmount),
  };
}

/**
 * 予算を更新
 */
export async function updateBudget(
  tripId: string,
  category: BudgetCategory,
  userId: string,
  data: UpdateBudgetData
): Promise<TripPlanBudget> {
  // 旅行プランの存在確認と権限チェック（owner/editor）
  const tripPlan = await getTripPlanWithMemberCheck(tripId, userId);
  const member = tripPlan.members?.find((m) => m.userId === userId);
  if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
    throw new Error('予算を更新する権限がありません');
  }

  // 予算の存在確認
  const existing = await prisma.tripPlanBudget.findUnique({
    where: {
      tripPlanId_category: {
        tripPlanId: tripId,
        category: category,
      },
    },
  });

  if (!existing) {
    throw new Error('予算が見つかりません');
  }

  // 更新データを準備
  const updateData: any = {};
  if (data.budgetAmount !== undefined) {
    updateData.budgetAmount = new Decimal(data.budgetAmount);
  }
  if (data.isPerPerson !== undefined) {
    updateData.isPerPerson = data.isPerPerson;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes;
  }

  // 予算更新
  const budget = await prisma.tripPlanBudget.update({
    where: {
      tripPlanId_category: {
        tripPlanId: tripId,
        category: category,
      },
    },
    data: updateData,
  });

  return {
    ...budget,
    budgetAmount: decimalToNumber(budget.budgetAmount),
  };
}

/**
 * 予算を削除
 */
export async function deleteBudget(
  tripId: string,
  category: BudgetCategory,
  userId: string
): Promise<void> {
  // 旅行プランの存在確認と権限チェック（owner/editor）
  const tripPlan = await getTripPlanWithMemberCheck(tripId, userId);
  const member = tripPlan.members?.find((m) => m.userId === userId);
  if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
    throw new Error('予算を削除する権限がありません');
  }

  // 予算の存在確認
  const existing = await prisma.tripPlanBudget.findUnique({
    where: {
      tripPlanId_category: {
        tripPlanId: tripId,
        category: category,
      },
    },
  });

  if (!existing) {
    throw new Error('予算が見つかりません');
  }

  // 予算削除
  await prisma.tripPlanBudget.delete({
    where: {
      tripPlanId_category: {
        tripPlanId: tripId,
        category: category,
      },
    },
  });
}

/**
 * 予算サマリーを取得（予算vs実費比較）
 */
export async function getBudgetSummary(tripId: string, userId: string): Promise<BudgetSummary[]> {
  // 旅行プランの存在確認と権限チェック
  await getTripPlanWithMemberCheck(tripId, userId);

  // 予算一覧を取得
  const budgets = await prisma.tripPlanBudget.findMany({
    where: { tripPlanId: tripId },
  });

  // アクティビティの実費を集計
  const activities = await prisma.tripPlanActivity.findMany({
    where: { tripPlanId: tripId },
    select: {
      category: true,
      actualCost: true,
      estimatedCost: true,
    },
  });

  // カテゴリ別実費を計算
  const actualByCategory: Record<string, number> = {};
  activities.forEach((activity) => {
    const budgetCategory = activityToBudgetCategoryMap[activity.category] || 'other';
    const cost = decimalToNumber(activity.actualCost || activity.estimatedCost);
    actualByCategory[budgetCategory] = (actualByCategory[budgetCategory] || 0) + cost;
  });

  // サマリーを作成
  const summaries: BudgetSummary[] = budgets
    .filter((budget) => budget.category !== 'total')
    .map((budget) => {
      const budgetAmount = decimalToNumber(budget.budgetAmount);
      const actualAmount = actualByCategory[budget.category] || 0;
      const difference = budgetAmount - actualAmount;
      const percentage = budgetAmount > 0 ? (actualAmount / budgetAmount) * 100 : 0;

      return {
        category: budget.category as BudgetCategory,
        budgetAmount,
        actualAmount,
        difference,
        percentage,
        isPerPerson: budget.isPerPerson,
      };
    });

  return summaries;
}

/**
 * 予算vs実費の比較データを取得
 */
export async function getBudgetComparison(
  tripId: string,
  userId: string
): Promise<BudgetComparison> {
  // 旅行プランの存在確認と権限チェック
  const tripPlan = await getTripPlanWithMemberCheck(tripId, userId);

  // メンバー数を取得
  const memberCount = tripPlan.members?.length || 1;

  // サマリーを取得
  const summaries = await getBudgetSummary(tripId, userId);

  // 全体予算を取得
  const totalBudgetRecord = await prisma.tripPlanBudget.findUnique({
    where: {
      tripPlanId_category: {
        tripPlanId: tripId,
        category: 'total',
      },
    },
  });

  const totalBudget = totalBudgetRecord ? decimalToNumber(totalBudgetRecord.budgetAmount) : 0;
  const totalActual = summaries.reduce((sum, s) => sum + s.actualAmount, 0);
  const totalDifference = totalBudget - totalActual;

  return {
    totalBudget,
    totalActual,
    totalDifference,
    categories: summaries,
    memberCount,
  };
}

/**
 * グラフ用データを取得
 */
export async function getBudgetChartData(
  tripId: string,
  userId: string
): Promise<BudgetChartData> {
  // 旅行プランの存在確認と権限チェック
  await getTripPlanWithMemberCheck(tripId, userId);

  // サマリーを取得
  const summaries = await getBudgetSummary(tripId, userId);

  // カテゴリ別データ
  const categoryBreakdown = summaries.map((summary) => ({
    category: summary.category,
    label: budgetCategoryLabels[summary.category],
    budgetAmount: summary.budgetAmount,
    actualAmount: summary.actualAmount,
    color: categoryColors[summary.category],
  }));

  // 日別費用データ
  const dailyExpenses = await getDailyExpenses(tripId, userId);

  return {
    categoryBreakdown,
    dailyExpenses,
  };
}

/**
 * 日別費用を取得
 */
export async function getDailyExpenses(tripId: string, userId: string): Promise<DailyExpense[]> {
  // 旅行プランの存在確認と権限チェック
  await getTripPlanWithMemberCheck(tripId, userId);

  // アクティビティを日別に取得
  const activities = await prisma.tripPlanActivity.findMany({
    where: { tripPlanId: tripId },
    select: {
      dayNumber: true,
      category: true,
      actualCost: true,
      estimatedCost: true,
    },
    orderBy: { dayNumber: 'asc' },
  });

  // 日別にグループ化
  const dailyMap: Record<number, Record<string, number>> = {};
  activities.forEach((activity) => {
    if (!dailyMap[activity.dayNumber]) {
      dailyMap[activity.dayNumber] = {};
    }
    const budgetCategory = activityToBudgetCategoryMap[activity.category] || 'other';
    const cost = decimalToNumber(activity.actualCost || activity.estimatedCost);
    dailyMap[activity.dayNumber][budgetCategory] =
      (dailyMap[activity.dayNumber][budgetCategory] || 0) + cost;
  });

  // 日別費用配列を作成
  const dailyExpenses: DailyExpense[] = Object.entries(dailyMap).map(([day, categories]) => {
    const dayNumber = parseInt(day);
    const categoryArray = Object.entries(categories).map(([cat, amount]) => ({
      category: cat as BudgetCategory,
      amount,
    }));
    const totalAmount = categoryArray.reduce((sum, c) => sum + c.amount, 0);

    return {
      dayNumber,
      totalAmount,
      categories: categoryArray,
    };
  });

  return dailyExpenses.sort((a, b) => a.dayNumber - b.dayNumber);
}
