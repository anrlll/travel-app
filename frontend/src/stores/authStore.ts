import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * ユーザー情報の型定義
 */
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 認証ストアの状態の型定義
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * 認証ストアのアクションの型定義
 */
interface AuthActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

/**
 * 認証ストアの型定義
 */
type AuthStore = AuthState & AuthActions;

/**
 * 初期状態
 */
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

/**
 * 認証ストア
 *
 * ユーザー認証情報を管理するZustandストア。
 * LocalStorageに永続化され、リロード後も認証状態を維持します。
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      /**
       * 認証情報を設定
       */
      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      /**
       * アクセストークンを更新
       */
      setAccessToken: (accessToken) =>
        set({ accessToken }),

      /**
       * ユーザー情報を更新
       */
      setUser: (user) =>
        set({ user }),

      /**
       * ログアウト（全ての認証情報をクリア）
       */
      logout: () =>
        set(initialState),

      /**
       * ローディング状態を設定
       */
      setLoading: (isLoading) =>
        set({ isLoading }),
    }),
    {
      name: 'auth-storage', // LocalStorageのキー名
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }), // isLoadingは永続化しない
    }
  )
);
