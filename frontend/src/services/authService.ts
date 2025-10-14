import apiClient from '../lib/axios';
import { useAuthStore, User } from '../stores/authStore';

/**
 * 登録リクエストの型定義
 */
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  locale?: 'ja' | 'en';
}

/**
 * ログインリクエストの型定義
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 認証レスポンスの型定義
 */
interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * API共通レスポンスの型定義
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * ユーザー登録
 */
export async function register(data: RegisterRequest): Promise<User> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/api/v1/auth/register',
    data
  );

  const { user, accessToken, refreshToken } = response.data.data;

  // 認証情報をストアに保存
  useAuthStore.getState().setAuth(user, accessToken, refreshToken);

  return user;
}

/**
 * ログイン
 */
export async function login(data: LoginRequest): Promise<User> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/api/v1/auth/login',
    data
  );

  const { user, accessToken, refreshToken } = response.data.data;

  // 認証情報をストアに保存
  useAuthStore.getState().setAuth(user, accessToken, refreshToken);

  return user;
}

/**
 * ログアウト
 */
export async function logout(): Promise<void> {
  const { refreshToken } = useAuthStore.getState();

  if (refreshToken) {
    try {
      await apiClient.post('/api/v1/auth/logout', { refreshToken });
    } catch (error) {
      console.error('ログアウトAPIエラー:', error);
      // APIエラーでもローカルの認証情報はクリアする
    }
  }

  // ストアから認証情報をクリア
  useAuthStore.getState().logout();
}

/**
 * 現在のユーザー情報を取得
 */
export async function getMe(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/api/v1/auth/me');

  const user = response.data.data;

  // ストアのユーザー情報を更新
  useAuthStore.getState().setUser(user);

  return user;
}

/**
 * トークンリフレッシュ
 */
export async function refreshAccessToken(): Promise<void> {
  const { refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    throw new Error('リフレッシュトークンがありません');
  }

  const response = await apiClient.post<ApiResponse<AuthResponse>>(
    '/api/v1/auth/refresh',
    { refreshToken }
  );

  const {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  } = response.data.data;

  // 認証情報を更新
  useAuthStore.getState().setAuth(user, newAccessToken, newRefreshToken);
}
