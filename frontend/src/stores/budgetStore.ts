import { create } from 'zustand';
import * as budgetService from '../services/budgetService';
import type {
  Budget,
  CreateBudgetData,
  UpdateBudgetData,
  BudgetSummary,
  BudgetComparison,
  BudgetChartData,
  DailyExpense,
  BudgetCategory,
} from '../types/budget';

// 予算ストアの型定義
interface BudgetStore {
  // 状態
  budgets: Budget[];
  currentBudget: Budget | null;
  summary: BudgetSummary[];
  comparison: BudgetComparison | null;
  chartData: BudgetChartData | null;
  dailyExpenses: DailyExpense[];
  isLoading: boolean;
  error: string | null;

  // アクション
  fetchBudgets: (tripId: string) => Promise<void>;
  fetchBudgetByCategory: (tripId: string, category: BudgetCategory) => Promise<void>;
  createBudget: (tripId: string, data: CreateBudgetData) => Promise<Budget>;
  updateBudget: (tripId: string, category: BudgetCategory, data: UpdateBudgetData) => Promise<void>;
  deleteBudget: (tripId: string, category: BudgetCategory) => Promise<void>;
  fetchBudgetSummary: (tripId: string) => Promise<void>;
  fetchBudgetComparison: (tripId: string) => Promise<void>;
  fetchBudgetChartData: (tripId: string) => Promise<void>;
  fetchDailyExpenses: (tripId: string) => Promise<void>;
  clearCurrentBudget: () => void;
  clearError: () => void;
}

/**
 * 予算ストア
 * 予算は旅行プランに紐づくため、LocalStorageには永続化しない
 */
export const useBudgetStore = create<BudgetStore>()((set, get) => ({
  // 初期状態
  budgets: [],
  currentBudget: null,
  summary: [],
  comparison: null,
  chartData: null,
  dailyExpenses: [],
  isLoading: false,
  error: null,

  // 予算一覧取得
  fetchBudgets: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });

      const budgets = await budgetService.getBudgets(tripId);

      set({
        budgets,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予算一覧の取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 特定カテゴリの予算取得
  fetchBudgetByCategory: async (tripId: string, category: BudgetCategory) => {
    try {
      set({ isLoading: true, error: null });

      const budget = await budgetService.getBudgetByCategory(tripId, category);

      set({
        currentBudget: budget,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予算の取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 予算作成
  createBudget: async (tripId: string, data: CreateBudgetData) => {
    try {
      set({ isLoading: true, error: null });

      const newBudget = await budgetService.createBudget(tripId, data);

      // 一覧に追加（カテゴリ順でソート）
      set((state) => {
        const updatedBudgets = [...state.budgets, newBudget].sort((a, b) =>
          a.category.localeCompare(b.category)
        );

        return {
          budgets: updatedBudgets,
          isLoading: false,
        };
      });

      return newBudget;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予算の作成に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 予算更新
  updateBudget: async (tripId: string, category: BudgetCategory, data: UpdateBudgetData) => {
    try {
      set({ isLoading: true, error: null });

      const updatedBudget = await budgetService.updateBudget(tripId, category, data);

      // 一覧を更新
      set((state) => {
        const updatedBudgets = state.budgets.map((budget) =>
          budget.category === category ? updatedBudget : budget
        );

        return {
          budgets: updatedBudgets,
          currentBudget: state.currentBudget?.category === category ? updatedBudget : state.currentBudget,
          isLoading: false,
        };
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予算の更新に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 予算削除
  deleteBudget: async (tripId: string, category: BudgetCategory) => {
    try {
      set({ isLoading: true, error: null });

      await budgetService.deleteBudget(tripId, category);

      // 一覧から削除
      set((state) => ({
        budgets: state.budgets.filter((budget) => budget.category !== category),
        currentBudget: state.currentBudget?.category === category ? null : state.currentBudget,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予算の削除に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 予算サマリー取得
  fetchBudgetSummary: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });

      const summary = await budgetService.getBudgetSummary(tripId);

      set({
        summary,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予算サマリーの取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 予算比較データ取得
  fetchBudgetComparison: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });

      const comparison = await budgetService.getBudgetComparison(tripId);

      set({
        comparison,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予算比較データの取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // グラフデータ取得
  fetchBudgetChartData: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });

      const chartData = await budgetService.getBudgetChartData(tripId);

      set({
        chartData,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'グラフデータの取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 日別費用取得
  fetchDailyExpenses: async (tripId: string) => {
    try {
      set({ isLoading: true, error: null });

      const dailyExpenses = await budgetService.getDailyExpenses(tripId);

      set({
        dailyExpenses,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '日別費用の取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 現在の予算をクリア
  clearCurrentBudget: () => {
    set({ currentBudget: null });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));
