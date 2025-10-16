import axios from '../lib/axios';
import type {
  Activity,
  CreateActivityData,
  UpdateActivityData,
  GetActivitiesParams,
  ApiResponse,
} from '../types/activity';

const API_BASE_PATH = '/api/v1';

/**
 * アクティビティ作成
 * @param tripId - 旅行プランID
 * @param data - アクティビティ作成データ
 * @returns 作成されたアクティビティ
 */
export const createActivity = async (
  tripId: string,
  data: CreateActivityData
): Promise<Activity> => {
  const response = await axios.post<ApiResponse<Activity>>(
    `${API_BASE_PATH}/trips/${tripId}/activities`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'アクティビティの作成に失敗しました');
  }

  return response.data.data;
};

/**
 * アクティビティ一覧取得
 * @param tripId - 旅行プランID
 * @param params - クエリパラメータ
 * @returns アクティビティ一覧
 */
export const getActivities = async (
  tripId: string,
  params?: GetActivitiesParams
): Promise<Activity[]> => {
  const response = await axios.get<ApiResponse<Activity[]>>(
    `${API_BASE_PATH}/trips/${tripId}/activities`,
    { params }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'アクティビティ一覧の取得に失敗しました');
  }

  return response.data.data;
};

/**
 * アクティビティ詳細取得
 * @param id - アクティビティID
 * @returns アクティビティ詳細
 */
export const getActivityById = async (id: string): Promise<Activity> => {
  const response = await axios.get<ApiResponse<Activity>>(`${API_BASE_PATH}/activities/${id}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'アクティビティの取得に失敗しました');
  }

  return response.data.data;
};

/**
 * アクティビティ更新
 * @param id - アクティビティID
 * @param data - 更新データ
 * @returns 更新されたアクティビティ
 */
export const updateActivity = async (
  id: string,
  data: UpdateActivityData
): Promise<Activity> => {
  const response = await axios.put<ApiResponse<Activity>>(
    `${API_BASE_PATH}/activities/${id}`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'アクティビティの更新に失敗しました');
  }

  return response.data.data;
};

/**
 * アクティビティ削除
 * @param id - アクティビティID
 */
export const deleteActivity = async (id: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_BASE_PATH}/activities/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.message || 'アクティビティの削除に失敗しました');
  }
};
