import { create } from 'zustand';
import * as activityService from '../services/activityService';
import type {
  Activity,
  CreateActivityData,
  UpdateActivityData,
  GetActivitiesParams,
  ActivityParticipant,
  ActivityTransport,
  TransportData,
} from '../types/activity';

// アクティビティストアの型定義
interface ActivityStore {
  // 状態
  activities: Activity[];
  currentActivity: Activity | null;
  participants: Record<string, ActivityParticipant[]>; // activityId -> participants
  transports: Record<string, ActivityTransport | null>; // activityId -> transport
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

  // 参加者管理
  addParticipant: (activityId: string, memberId: string) => Promise<void>;
  removeParticipant: (activityId: string, memberId: string) => Promise<void>;
  fetchParticipants: (activityId: string) => Promise<void>;

  // 移動手段管理
  setTransport: (activityId: string, data: TransportData) => Promise<void>;
  deleteTransport: (activityId: string) => Promise<void>;
  fetchTransport: (activityId: string) => Promise<void>;
}

/**
 * アクティビティストア
 * アクティビティは旅行プランに紐づくため、LocalStorageには永続化しない
 */
export const useActivityStore = create<ActivityStore>()((set, get) => ({
  // 初期状態
  activities: [],
  currentActivity: null,
  participants: {},
  transports: {},
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

  // ==================== 参加者管理 ====================

  // 参加者追加
  addParticipant: async (activityId: string, memberId: string) => {
    try {
      set({ isLoading: true, error: null });

      const participant = await activityService.addParticipant(activityId, memberId);

      set((state) => ({
        participants: {
          ...state.participants,
          [activityId]: [...(state.participants[activityId] || []), participant],
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '参加者の追加に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 参加者削除
  removeParticipant: async (activityId: string, memberId: string) => {
    try {
      set({ isLoading: true, error: null });

      await activityService.removeParticipant(activityId, memberId);

      set((state) => ({
        participants: {
          ...state.participants,
          [activityId]: (state.participants[activityId] || []).filter(
            (p) => p.tripPlanMemberId !== memberId
          ),
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '参加者の削除に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 参加者一覧取得
  fetchParticipants: async (activityId: string) => {
    try {
      set({ isLoading: true, error: null });

      const participants = await activityService.getParticipants(activityId);

      set((state) => ({
        participants: {
          ...state.participants,
          [activityId]: participants,
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '参加者一覧の取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // ==================== 移動手段管理 ====================

  // 移動手段設定
  setTransport: async (activityId: string, data: TransportData) => {
    try {
      set({ isLoading: true, error: null });

      const transport = await activityService.setTransport(activityId, data);

      set((state) => ({
        transports: {
          ...state.transports,
          [activityId]: transport,
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '移動手段の設定に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 移動手段削除
  deleteTransport: async (activityId: string) => {
    try {
      set({ isLoading: true, error: null });

      await activityService.deleteTransport(activityId);

      set((state) => ({
        transports: {
          ...state.transports,
          [activityId]: null,
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '移動手段の削除に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 移動手段取得
  fetchTransport: async (activityId: string) => {
    try {
      set({ isLoading: true, error: null });

      const transport = await activityService.getTransport(activityId);

      set((state) => ({
        transports: {
          ...state.transports,
          [activityId]: transport,
        },
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '移動手段の取得に失敗しました';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));
