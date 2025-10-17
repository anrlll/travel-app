/**
 * アクティビティカテゴリ
 */
export type ActivityCategory =
  | 'sightseeing' // 観光
  | 'restaurant' // レストラン・食事
  | 'accommodation' // 宿泊
  | 'transport' // 移動
  | 'other'; // その他

/**
 * カスタムロケーション型
 */
export interface CustomLocation {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * アクティビティ型
 */
export interface Activity {
  id: string;
  tripPlanId: string;
  dayNumber: number;
  order: number;
  startTime?: string;
  endTime?: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  location?: string;
  customLocation?: CustomLocation;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * アクティビティ作成データ
 */
export interface CreateActivityData {
  dayNumber: number;
  title: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  category: ActivityCategory;
  location?: string;
  customLocation?: CustomLocation;
  estimatedCost?: number;
  notes?: string;
}

/**
 * アクティビティ更新データ
 */
export interface UpdateActivityData {
  dayNumber?: number;
  order?: number;
  title?: string;
  startTime?: string | null;
  endTime?: string | null;
  description?: string | null;
  category?: ActivityCategory;
  location?: string | null;
  customLocation?: CustomLocation | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  notes?: string | null;
  isCompleted?: boolean;
}

/**
 * アクティビティ取得パラメータ
 */
export interface GetActivitiesParams {
  dayNumber?: number;
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

/**
 * カテゴリラベルマッピング
 */
export const activityCategoryLabels: Record<ActivityCategory, string> = {
  sightseeing: '観光',
  restaurant: '食事',
  accommodation: '宿泊',
  transport: '移動',
  other: 'その他',
};

/**
 * カテゴリアイコンマッピング(Tailwind CSS対応)
 */
export const activityCategoryIcons: Record<ActivityCategory, string> = {
  sightseeing: '🏛️',
  restaurant: '🍽️',
  accommodation: '🏨',
  transport: '🚗',
  other: '📌',
};

/**
 * カテゴリカラーマッピング(Tailwind CSS対応)
 */
export const activityCategoryColors: Record<ActivityCategory, string> = {
  sightseeing: 'bg-blue-100 text-blue-800',
  restaurant: 'bg-orange-100 text-orange-800',
  accommodation: 'bg-purple-100 text-purple-800',
  transport: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

/**
 * アクティビティ参加者型
 */
export interface ActivityParticipant {
  id: string;
  tripPlanActivityId: string;
  tripPlanMemberId: string;
  member: {
    id: string;
    userId?: string;
    guestName?: string;
    role: string;
    user?: {
      id: string;
      username: string;
      displayName: string;
    };
  };
}

/**
 * 移動手段タイプ
 */
export type TransportType = 'walk' | 'car' | 'train' | 'bus' | 'plane' | 'other';

/**
 * アクティビティ移動手段型
 */
export interface ActivityTransport {
  id: string;
  tripPlanActivityId: string;
  transportType: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
  isAutoCalculated: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 移動手段作成・更新データ
 */
export interface TransportData {
  transportType: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: any;
}

/**
 * 移動手段タイプラベルマッピング
 */
export const transportTypeLabels: Record<TransportType, string> = {
  walk: '徒歩',
  car: '車',
  train: '電車',
  bus: 'バス',
  plane: '飛行機',
  other: 'その他',
};

/**
 * 移動手段タイプアイコンマッピング
 */
export const transportTypeIcons: Record<TransportType, string> = {
  walk: '🚶',
  car: '🚗',
  train: '🚃',
  bus: '🚌',
  plane: '✈️',
  other: '🚀',
};
