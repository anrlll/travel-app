import axios from '../lib/axios';
import type {
  Budget,
  CreateBudgetData,
  UpdateBudgetData,
  BudgetSummary,
  BudgetComparison,
  BudgetChartData,
  DailyExpense,
  BudgetCategory,
  ApiResponse,
} from '../types/budget';

const API_BASE_PATH = '/api/v1';

/**
 * 予算を作成
 */
export const createBudget = async (
  tripId: string,
  data: CreateBudgetData
): Promise<Budget> => {
  const response = await axios.post<ApiResponse<Budget>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '予算の作成に失敗しました');
  }

  return response.data.data;
};

/**
 * 予算一覧を取得
 */
export const getBudgets = async (tripId: string): Promise<Budget[]> => {
  const response = await axios.get<ApiResponse<Budget[]>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '予算一覧の取得に失敗しました');
  }

  return response.data.data;
};

/**
 * 特定カテゴリの予算を取得
 */
export const getBudgetByCategory = async (
  tripId: string,
  category: BudgetCategory
): Promise<Budget> => {
  const response = await axios.get<ApiResponse<Budget>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets/${category}`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '予算の取得に失敗しました');
  }

  return response.data.data;
};

/**
 * 予算を更新
 */
export const updateBudget = async (
  tripId: string,
  category: BudgetCategory,
  data: UpdateBudgetData
): Promise<Budget> => {
  const response = await axios.put<ApiResponse<Budget>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets/${category}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '予算の更新に失敗しました');
  }

  return response.data.data;
};

/**
 * 予算を削除
 */
export const deleteBudget = async (
  tripId: string,
  category: BudgetCategory
): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets/${category}`
  );

  if (!response.data.success) {
    throw new Error(response.data.message || '予算の削除に失敗しました');
  }
};

/**
 * 予算サマリーを取得
 */
export const getBudgetSummary = async (tripId: string): Promise<BudgetSummary[]> => {
  const response = await axios.get<ApiResponse<BudgetSummary[]>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets-summary`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '予算サマリーの取得に失敗しました');
  }

  return response.data.data;
};

/**
 * 予算vs実費の比較データを取得
 */
export const getBudgetComparison = async (tripId: string): Promise<BudgetComparison> => {
  const response = await axios.get<ApiResponse<BudgetComparison>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets-comparison`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '予算比較データの取得に失敗しました');
  }

  return response.data.data;
};

/**
 * グラフ用データを取得
 */
export const getBudgetChartData = async (tripId: string): Promise<BudgetChartData> => {
  const response = await axios.get<ApiResponse<BudgetChartData>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets-chart-data`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'グラフデータの取得に失敗しました');
  }

  return response.data.data;
};

/**
 * 日別費用を取得
 */
export const getDailyExpenses = async (tripId: string): Promise<DailyExpense[]> => {
  const response = await axios.get<ApiResponse<DailyExpense[]>>(
    `${API_BASE_PATH}/trips/${tripId}/budgets-daily`
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '日別費用の取得に失敗しました');
  }

  return response.data.data;
};
