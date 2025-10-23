// 目的地の型定義
export interface Destination {
  name: string;
}

// 旅行プランのステータス
export type TripStatus = 'draft' | 'planning' | 'confirmed' | 'completed' | 'cancelled';

// メンバーの型定義
export interface TripMember {
  id: string;
  userId: string | null;
  guestName: string | null;
  role: 'owner' | 'editor' | 'viewer' | 'member';
  user?: {
    id: string;
    username: string;
    displayName: string | null;
    email: string;
  };
}

// 旅行プランの型定義
export interface Trip {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  destinations: Destination[];
  startDate: string | null; // ISO 8601形式（オプション）
  endDate: string | null; // ISO 8601形式（オプション）
  dayCount: number | null; // 日数（オプション）
  status: TripStatus;
  tags: string[];
  notes: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  members?: TripMember[];
}

// 旅行プラン作成リクエストの型定義
export interface CreateTripData {
  title: string;
  description?: string;
  startDate?: string; // ISO 8601形式（オプション）
  endDate?: string; // ISO 8601形式（オプション）
  dayCount?: number; // 日数（オプション）
  destinations: Destination[];
  tags?: string[];
  notes?: string;
  isPublic?: boolean;
}

// 旅行プラン更新リクエストの型定義
export interface UpdateTripData {
  title?: string;
  description?: string | null;
  startDate?: string;
  endDate?: string;
  dayCount?: number; // 日数（オプション）
  destinations?: Destination[];
  status?: TripStatus;
  tags?: string[];
  notes?: string | null;
  isPublic?: boolean;
}

// 旅行プラン一覧取得パラメータの型定義
export interface GetTripsParams {
  page?: number;
  limit?: number;
  status?: TripStatus;
  search?: string;
}

// 旅行プラン一覧レスポンスの型定義
export interface GetTripsResponse {
  trips: Trip[];
  total: number;
  page: number;
  totalPages: number;
}

// APIレスポンスの型定義
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

// ==================== フレンド関連の型定義 ====================

// ユーザー基本情報
export interface UserBasicInfo {
  id: string;
  email: string;
  displayName: string;
  username: string;
}

// フレンド関係
export interface Friend {
  id: string;
  userId: string;
  friendUserId: string;
  friendUser: UserBasicInfo;
  createdAt: string;
}

// フレンドリクエスト（受信用）
export interface PendingFriendRequest {
  id: string;
  userId: string;
  friendUserId: string;
  user: UserBasicInfo;
  createdAt: string;
}

// フレンドリクエスト（送信用）
export interface SentFriendRequest {
  id: string;
  userId: string;
  friendUserId: string;
  friendUser: UserBasicInfo;
  createdAt: string;
}
