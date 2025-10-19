/**
 * キャンバスプランニング機能の型定義
 */

// アクティビティの種類
export type ActivityType = 'sightseeing' | 'restaurant' | 'accommodation' | 'transport' | 'other';

// 予算カテゴリ
export type BudgetCategory = 'food' | 'transport' | 'accommodation' | 'sightseeing' | 'other';

// 交通手段
export type TransportType = 'walk' | 'car' | 'train' | 'bus' | 'plane' | 'other';

// カスタム位置情報
export interface CustomLocation {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  url?: string;
}

// ルート情報
export interface RouteData {
  polyline?: string;
  waypoints?: Array<{ lat: number; lng: number }>;
  instructions?: string[];
}

// キャンバス上のアクティビティカード
export interface CanvasActivityCard {
  id: string;
  tripPlanId: string;
  positionX: number;
  positionY: number;
  title: string;
  activityType: ActivityType;
  location?: string;
  customLocation?: CustomLocation;
  startTime?: string; // HH:mm形式
  endTime?: string;
  cost?: number;
  budgetCategory?: BudgetCategory;
  memo?: string;
  participants?: string[];
  isCollapsed: boolean;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// カード作成データ
export interface CreateCardData {
  positionX: number;
  positionY: number;
  title: string;
  activityType: ActivityType;
  location?: string;
  customLocation?: CustomLocation;
  startTime?: string;
  endTime?: string;
  cost?: number;
  budgetCategory?: BudgetCategory;
  memo?: string;
  participants?: string[];
  isCollapsed?: boolean;
  isCompleted?: boolean;
}

// カード更新データ
export interface UpdateCardData {
  positionX?: number;
  positionY?: number;
  title?: string;
  activityType?: ActivityType;
  location?: string;
  customLocation?: CustomLocation;
  startTime?: string;
  endTime?: string;
  cost?: number;
  budgetCategory?: BudgetCategory;
  memo?: string;
  participants?: string[];
  isCollapsed?: boolean;
  isCompleted?: boolean;
}

// カード位置更新データ
export interface UpdateCardPositionData {
  positionX: number;
  positionY: number;
}

// カード間の接続
export interface CardConnection {
  id: string;
  tripPlanId: string;
  fromCardId: string;
  toCardId: string;
  transportType?: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: RouteData;
  proposalId?: string;
  createdAt: string;
  updatedAt: string;
}

// 接続作成データ
export interface CreateConnectionData {
  fromCardId: string;
  toCardId: string;
  transportType?: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: RouteData;
  proposalId?: string;
}

// 接続更新データ
export interface UpdateConnectionData {
  transportType?: TransportType;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
  routeData?: RouteData;
  proposalId?: string;
}

// プラン案
export interface TripPlanProposal {
  id: string;
  tripPlanId: string;
  name: string;
  color: string; // HEXカラーコード
  isOfficial: boolean;
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  totalDistanceKm?: number;
  activityCount?: number;
  createdAt: string;
  updatedAt: string;
  activities?: ProposalActivity[];
  connections?: CardConnection[];
}

// プラン案作成データ
export interface CreateProposalData {
  name: string;
  color: string;
  startDate?: string;
  endDate?: string;
}

// プラン案更新データ
export interface UpdateProposalData {
  name?: string;
  color?: string;
  startDate?: string;
  endDate?: string;
}

// プラン案のアクティビティ
export interface ProposalActivity {
  id: string;
  proposalId: string;
  cardId: string;
  dayNumber?: number;
  orderInDay?: number;
  createdAt: string;
  updatedAt: string;
  card?: CanvasActivityCard;
}

// API レスポンス型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// アクティビティタイプのラベル
export const activityTypeLabels: Record<ActivityType, string> = {
  sightseeing: '観光',
  restaurant: '飲食',
  accommodation: '宿泊',
  transport: '移動',
  other: 'その他',
};

// 予算カテゴリのラベル
export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  food: '食費',
  transport: '交通費',
  accommodation: '宿泊費',
  sightseeing: '観光費',
  other: 'その他',
};

// 交通手段のラベル
export const transportTypeLabels: Record<TransportType, string> = {
  walk: '徒歩',
  car: '車',
  train: '電車',
  bus: 'バス',
  plane: '飛行機',
  other: 'その他',
};

// アクティビティタイプのアイコン（Tailwind CSSのクラス名）
export const activityTypeIcons: Record<ActivityType, string> = {
  sightseeing: '🏛️',
  restaurant: '🍽️',
  accommodation: '🏨',
  transport: '🚗',
  other: '📍',
};

// 交通手段のアイコン
export const transportTypeIcons: Record<TransportType, string> = {
  walk: '🚶',
  car: '🚗',
  train: '🚆',
  bus: '🚌',
  plane: '✈️',
  other: '🚩',
};
