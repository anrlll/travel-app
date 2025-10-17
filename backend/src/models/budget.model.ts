import { z } from 'zod';

// 予算カテゴリ
export const budgetCategories = [
  'food',           // 食費
  'transport',      // 交通費
  'accommodation',  // 宿泊費
  'sightseeing',    // 観光費
  'other',          // その他
  'total',          // 全体予算
] as const;

export type BudgetCategory = (typeof budgetCategories)[number];

// 予算カテゴリラベル（日本語）
export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  food: '食費',
  transport: '交通費',
  accommodation: '宿泊費',
  sightseeing: '観光費',
  other: 'その他',
  total: '全体予算',
};

// アクティビティカテゴリから予算カテゴリへのマッピング
export const activityToBudgetCategoryMap: Record<string, BudgetCategory> = {
  restaurant: 'food',
  accommodation: 'accommodation',
  transport: 'transport',
  sightseeing: 'sightseeing',
  other: 'other',
};

// 予算型
export interface TripPlanBudget {
  id: string;
  tripPlanId: string;
  category: BudgetCategory;
  budgetAmount: number;
  isPerPerson: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 予算作成データ型
export interface CreateBudgetData {
  category: BudgetCategory;
  budgetAmount: number;
  isPerPerson?: boolean;
  notes?: string;
}

// 予算更新データ型
export interface UpdateBudgetData {
  budgetAmount?: number;
  isPerPerson?: boolean;
  notes?: string;
}

// 予算サマリー型
export interface BudgetSummary {
  category: BudgetCategory;
  budgetAmount: number;
  actualAmount: number;
  difference: number;
  percentage: number;
  isPerPerson: boolean;
}

// 予算比較型
export interface BudgetComparison {
  totalBudget: number;
  totalActual: number;
  totalDifference: number;
  categories: BudgetSummary[];
  memberCount: number;
}

// 日別費用型
export interface DailyExpense {
  dayNumber: number;
  date?: string;
  totalAmount: number;
  categories: {
    category: BudgetCategory;
    amount: number;
  }[];
}

// グラフデータ型
export interface BudgetChartData {
  categoryBreakdown: {
    category: BudgetCategory;
    label: string;
    budgetAmount: number;
    actualAmount: number;
    color: string;
  }[];
  dailyExpenses: DailyExpense[];
}

// Zodバリデーションスキーマ

// 予算作成
export const createBudgetSchema = z.object({
  category: z.enum(budgetCategories, {
    message: 'カテゴリは必須です',
  }),
  budgetAmount: z
    .number()
    .nonnegative('予算額は0以上の数値である必要があります')
    .finite('予算額は有限な数値である必要があります'),
  isPerPerson: z.boolean().optional().default(false),
  notes: z.string().max(500, 'メモは500文字以内で入力してください').optional(),
});

// 予算更新
export const updateBudgetSchema = z.object({
  budgetAmount: z
    .number()
    .nonnegative('予算額は0以上の数値である必要があります')
    .finite('予算額は有限な数値である必要があります')
    .optional(),
  isPerPerson: z.boolean().optional(),
  notes: z.string().max(500, 'メモは500文字以内で入力してください').optional(),
});

// カテゴリパラメータ
export const categoryParamSchema = z.enum(budgetCategories, {
  message: '無効なカテゴリです',
});
