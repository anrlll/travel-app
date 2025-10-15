import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as tripService from '../services/tripService';
import type {
  Trip,
  CreateTripData,
  UpdateTripData,
  GetTripsParams,
} from '../types/trip';

// 旅行プランストアの型定義
interface TripStore {
  // 状態
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };

  // アクション
  fetchTrips: (params?: GetTripsParams) => Promise<void>;
  createTrip: (data: CreateTripData) => Promise<Trip>;
  fetchTripById: (id: string) => Promise<void>;
  updateTrip: (id: string, data: UpdateTripData) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  clearCurrentTrip: () => void;
  clearError: () => void;
}

/**
 * 旅行プランストア
 * LocalStorageに永続化（tripsとpaginationのみ）
 */
export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      // 初期状態
      trips: [],
      currentTrip: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        totalPages: 1,
        total: 0,
      },

      // 旅行プラン一覧取得
      fetchTrips: async (params?: GetTripsParams) => {
        try {
          set({ isLoading: true, error: null });

          const response = await tripService.getTrips(params);

          set({
            trips: response.trips,
            pagination: {
              page: response.page,
              totalPages: response.totalPages,
              total: response.total,
            },
            isLoading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '旅行プラン一覧の取得に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 旅行プラン作成
      createTrip: async (data: CreateTripData) => {
        try {
          set({ isLoading: true, error: null });

          const newTrip = await tripService.createTrip(data);

          // 一覧に追加
          set((state) => ({
            trips: [newTrip, ...state.trips],
            isLoading: false,
          }));

          return newTrip;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '旅行プランの作成に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 旅行プラン詳細取得
      fetchTripById: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          const trip = await tripService.getTripById(id);

          set({
            currentTrip: trip,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '旅行プランの取得に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 旅行プラン更新
      updateTrip: async (id: string, data: UpdateTripData) => {
        try {
          set({ isLoading: true, error: null });

          const updatedTrip = await tripService.updateTrip(id, data);

          // 一覧を更新
          set((state) => ({
            trips: state.trips.map((trip) =>
              trip.id === id ? updatedTrip : trip
            ),
            currentTrip: state.currentTrip?.id === id ? updatedTrip : state.currentTrip,
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '旅行プランの更新に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 旅行プラン削除
      deleteTrip: async (id: string) => {
        try {
          set({ isLoading: true, error: null });

          await tripService.deleteTrip(id);

          // 一覧から削除
          set((state) => ({
            trips: state.trips.filter((trip) => trip.id !== id),
            currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '旅行プランの削除に失敗しました';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 現在の旅行プランをクリア
      clearCurrentTrip: () => {
        set({ currentTrip: null });
      },

      // エラーをクリア
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'trip-storage',
      partialize: (state) => ({
        trips: state.trips,
        pagination: state.pagination,
      }),
    }
  )
);
