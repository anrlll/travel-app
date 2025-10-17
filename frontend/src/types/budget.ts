/**
 * 予算カテゴリ
 */
export type BudgetCategory =
  | 'food'           // 食費
  | 'transport'      // 交通費
  | 'accommodation'  // 宿泊費
  | 'sightseeing'    // 観光費
  | 'other'          // その他
  | 'total';         // 全体予算

/**
 * 予算カテゴリラベル（日本語）
 */
export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  food: '食費',
  transport: '交通費',
  accommodation: '宿泊費',
  sightseeing: '観光費',
  other: 'その他',
  total: '全体予算',
};

/**
 * 予算カテゴリカラー（Tailwind CSS）
 */
export const budgetCategoryColors: Record<BudgetCategory, string> = {
  food: 'bg-red-100 text-red-800',
  transport: 'bg-cyan-100 text-cyan-800',
  accommodation: 'bg-green-100 text-green-800',
  sightseeing: 'bg-pink-100 text-pink-800',
  other: 'bg-purple-100 text-purple-800',
  total: 'bg-blue-100 text-blue-800',
};

/**
 * 予算型
 */
export interface Budget {
  id: string;
  tripPlanId: string;
  category: BudgetCategory;
  budgetAmount: number;
  isPerPerson: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 予算作成データ型
 */
export interface CreateBudgetData {
  category: BudgetCategory;
  budgetAmount: number;
  isPerPerson?: boolean;
  notes?: string;
}

/**
 * 予算更新データ型
 */
export interface UpdateBudgetData {
  budgetAmount?: number;
  isPerPerson?: boolean;
  notes?: string;
}

/**
 * 予算サマリー型
 */
export interface BudgetSummary {
  category: BudgetCategory;
  budgetAmount: number;
  actualAmount: number;
  difference: number;
  percentage: number;
  isPerPerson: boolean;
}

/**
 * 予算比較型
 */
export interface BudgetComparison {
  totalBudget: number;
  totalActual: number;
  totalDifference: number;
  categories: BudgetSummary[];
  memberCount: number;
}

/**
 * 日別費用型
 */
export interface DailyExpense {
  dayNumber: number;
  date?: string;
  totalAmount: number;
  categories: {
    category: BudgetCategory;
    amount: number;
  }[];
}

/**
 * グラフデータ型
 */
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

/**
 * APIレスポンス型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
