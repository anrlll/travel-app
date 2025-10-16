import { create } from 'zustand';
import * as activityService from '../services/activityService';
import type { Activity, CreateActivityData, UpdateActivityData, GetActivitiesParams } from '../types/activity';

// アクティビティストアの型定義
interface ActivityStore {
  // 状態
  activities: Activity[];
  currentActivity: Activity | null;
  isLoading: boolean;
  error: string | null;

  // アクション
  fetchActivities: (tripId: string, params?: GetActivitiesParams) => Promise<void>;
  createActivity: (tripId: string, data: CreateActivityData) => Promise<Activity>;
  fetchActivityById: (id: string) => Promise<void>;
  updateActivity: (id: string, data: UpdateActivityData) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  toggleActivityCompletion: (id: string) => Promise<void>;
  clearCurrentActivity: () => void;
  clearError: () => void;
}

/**
 * アクティビティストア
 * アクティビティは旅行プランに紐づくため、LocalStorageには永続化しない
 */
export const useActivityStore = create<ActivityStore>()((set, get) => ({
  // 初期状態
  activities: [],
  currentActivity: null,
  isLoading: false,
  error: null,

  // アクティビティ一覧取得
  fetchActivities: async (tripId: string, params?: GetActivitiesParams) => {
    try {
      set({ isLoading: true, error: null });

      const activities = await activityService.getActivities(tripId, params);

      set({
        activities,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'アクティビティ一覧の取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // アクティビティ作成
  createActivity: async (tripId: string, data: CreateActivityData) => {
    try {
      set({ isLoading: true, error: null });

      const newActivity = await activityService.createActivity(tripId, data);

      // 一覧に追加（dayNumberとorder順でソート）
      set((state) => {
        const updatedActivities = [...state.activities, newActivity].sort((a, b) => {
          if (a.dayNumber !== b.dayNumber) {
            return a.dayNumber - b.dayNumber;
          }
          return a.order - b.order;
        });

        return {
          activities: updatedActivities,
          isLoading: false,
        };
      });

      return newActivity;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'アクティビティの作成に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // アクティビティ詳細取得
  fetchActivityById: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const activity = await activityService.getActivityById(id);

      set({
        currentActivity: activity,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'アクティビティの取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // アクティビティ更新
  updateActivity: async (id: string, data: UpdateActivityData) => {
    try {
      set({ isLoading: true, error: null });

      const updatedActivity = await activityService.updateActivity(id, data);

      // 一覧を更新
      set((state) => {
        const updatedActivities = state.activities
          .map((activity) => (activity.id === id ? updatedActivity : activity))
          .sort((a, b) => {
            if (a.dayNumber !== b.dayNumber) {
              return a.dayNumber - b.dayNumber;
            }
            return a.order - b.order;
          });

        return {
          activities: updatedActivities,
          currentActivity: state.currentActivity?.id === id ? updatedActivity : state.currentActivity,
          isLoading: false,
        };
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'アクティビティの更新に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // アクティビティ削除
  deleteActivity: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      await activityService.deleteActivity(id);

      // 一覧から削除
      set((state) => ({
        activities: state.activities.filter((activity) => activity.id !== id),
        currentActivity: state.currentActivity?.id === id ? null : state.currentActivity,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'アクティビティの削除に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // アクティビティ完了状態トグル
  toggleActivityCompletion: async (id: string) => {
    const activity = get().activities.find((a) => a.id === id);
    if (!activity) return;

    try {
      await get().updateActivity(id, { isCompleted: !activity.isCompleted });
    } catch (error) {
      // エラーは updateActivity で処理済み
      throw error;
    }
  },

  // 現在のアクティビティをクリア
  clearCurrentActivity: () => {
    set({ currentActivity: null });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));
