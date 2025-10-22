import axios from '../lib/axios';
import type {
  Trip,
  CreateTripData,
  UpdateTripData,
  GetTripsParams,
  GetTripsResponse,
  ApiResponse,
} from '../types/trip';

const API_BASE_PATH = '/api/v1/trips';

/**
 * 旅行プラン作成
 * @param data - 旅行プラン作成データ
 * @returns 作成された旅行プラン
 */
export const createTrip = async (data: CreateTripData): Promise<Trip> => {
  const response = await axios.post<ApiResponse<Trip>>(API_BASE_PATH, data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '旅行プランの作成に失敗しました');
  }

  return response.data.data;
};

/**
 * 旅行プラン一覧取得
 * @param params - クエリパラメータ
 * @returns 旅行プラン一覧
 */
export const getTrips = async (params?: GetTripsParams): Promise<GetTripsResponse> => {
  const response = await axios.get<ApiResponse<GetTripsResponse>>(API_BASE_PATH, {
    params,
  });

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '旅行プラン一覧の取得に失敗しました');
  }

  return response.data.data;
};

/**
 * 旅行プラン詳細取得
 * @param id - 旅行プランID
 * @returns 旅行プラン詳細
 */
export const getTripById = async (id: string): Promise<Trip> => {
  const response = await axios.get<ApiResponse<Trip>>(`${API_BASE_PATH}/${id}`);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '旅行プランの取得に失敗しました');
  }

  return response.data.data;
};

/**
 * 旅行プラン更新
 * @param id - 旅行プランID
 * @param data - 更新データ
 * @returns 更新された旅行プラン
 */
export const updateTrip = async (id: string, data: UpdateTripData): Promise<Trip> => {
  const response = await axios.put<ApiResponse<Trip>>(`${API_BASE_PATH}/${id}`, data);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '旅行プランの更新に失敗しました');
  }

  return response.data.data;
};

/**
 * 旅行プラン削除
 * @param id - 旅行プランID
 */
export const deleteTrip = async (id: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(`${API_BASE_PATH}/${id}`);

  if (!response.data.success) {
    throw new Error(response.data.message || '旅行プランの削除に失敗しました');
  }
};

/**
 * ユーザーメンバーを追加
 * @param tripId - 旅行プランID
 * @param email - メールアドレス
 * @param role - 役割
 */
export const addUserMember = async (
  tripId: string,
  email: string,
  role: string,
): Promise<any> => {
  const response = await axios.post<ApiResponse<any>>(
    `${API_BASE_PATH}/${tripId}/members/users`,
    { email, role },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'メンバーの追加に失敗しました');
  }

  return response.data.data;
};

/**
 * ゲストメンバーを追加
 * @param tripId - 旅行プランID
 * @param guestName - ゲスト名
 * @param guestEmail - ゲストメール
 * @param role - 役割
 */
export const addGuestMember = async (
  tripId: string,
  guestName: string,
  guestEmail: string,
  role: string,
): Promise<any> => {
  const response = await axios.post<ApiResponse<any>>(
    `${API_BASE_PATH}/${tripId}/members/guests`,
    { guestName, guestEmail, role },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'ゲストメンバーの追加に失敗しました');
  }

  return response.data.data;
};

/**
 * メンバーを削除
 * @param tripId - 旅行プランID
 * @param memberId - メンバーID
 */
export const deleteMember = async (tripId: string, memberId: string): Promise<void> => {
  const response = await axios.delete<ApiResponse<void>>(
    `${API_BASE_PATH}/${tripId}/members/${memberId}`,
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'メンバーの削除に失敗しました');
  }
};

/**
 * メンバーの役割を変更
 * @param tripId - 旅行プランID
 * @param memberId - メンバーID
 * @param role - 新しい役割
 */
export const changeRole = async (
  tripId: string,
  memberId: string,
  role: string,
): Promise<any> => {
  const response = await axios.put<ApiResponse<any>>(
    `${API_BASE_PATH}/${tripId}/members/${memberId}/role`,
    { role },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || '役割の変更に失敗しました');
  }

  return response.data.data;
};
