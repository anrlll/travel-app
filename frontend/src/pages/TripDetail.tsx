import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTripStore } from '../stores/tripStore';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/Header';

// ステータスバッジのスタイル
const statusStyles: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-800',
  planning: 'bg-blue-200 text-blue-800',
  confirmed: 'bg-green-200 text-green-800',
  completed: 'bg-purple-200 text-purple-800',
  cancelled: 'bg-red-200 text-red-800',
};

// ステータスの日本語ラベル
const statusLabels: Record<string, string> = {
  draft: '下書き',
  planning: '計画中',
  confirmed: '確定済み',
  completed: '完了',
  cancelled: 'キャンセル',
};

function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrip, isLoading, error, fetchTripById, deleteTrip, clearCurrentTrip } =
    useTripStore();
  const { user } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 初回マウント時に旅行プラン詳細を取得
  useEffect(() => {
    if (id) {
      fetchTripById(id);
    }

    // クリーンアップ
    return () => {
      clearCurrentTrip();
    };
  }, [id, fetchTripById, clearCurrentTrip]);

  // オーナーかどうかを判定
  const isOwner =
    currentTrip &&
    user &&
    currentTrip.members?.some((member) => member.userId === user.id && member.role === 'owner');

  // ステータス変更処理
  const handleStatusChange = async (newStatus: string) => {
    if (!id || !currentTrip) return;

    try {
      setIsUpdatingStatus(true);
      const { updateTrip } = useTripStore.getState();
      await updateTrip(id, { status: newStatus as any });
      // 詳細を再取得
      await fetchTripById(id);
    } catch (error) {
      console.error('ステータス変更エラー:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await deleteTrip(id);
      navigate('/trips');
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <button
            onClick={() => navigate('/trips')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            旅行プラン一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  // 旅行プランが見つからない
  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">旅行プランが見つかりません</p>
            <button
              onClick={() => navigate('/trips')}
              className="text-blue-600 hover:text-blue-700"
            >
              旅行プラン一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  const startDate = currentTrip.startDate ? new Date(currentTrip.startDate) : null;
  const endDate = currentTrip.endDate ? new Date(currentTrip.endDate) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 戻るボタン */}
        <button
          onClick={() => navigate('/trips')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>

        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentTrip.title}</h1>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  statusStyles[currentTrip.status]
                }`}
              >
                {statusLabels[currentTrip.status]}
              </span>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/trips/${id}/edit`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  削除
                </button>
              </div>
            )}
          </div>

          {/* 日程 */}
          <div className="flex items-center text-gray-700 mb-3">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {startDate && endDate
                ? `${format(startDate, 'yyyy年M月d日（E）', { locale: ja })} 〜 ${format(
                    endDate,
                    'M月d日（E）',
                    { locale: ja }
                  )}`
                : '日程未定'}
            </span>
          </div>

          {/* 説明 */}
          {currentTrip.description && (
            <p className="text-gray-700 mb-3">{currentTrip.description}</p>
          )}

          {/* ステータス変更（オーナーのみ） */}
          {isOwner && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-2">
                ステータスを変更
              </label>
              <select
                id="status-select"
                value={currentTrip.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isUpdatingStatus}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {isUpdatingStatus && (
                <p className="text-sm text-gray-500 mt-2">更新中...</p>
              )}
            </div>
          )}
        </div>

        {/* 目的地 */}
        {currentTrip.destinations && currentTrip.destinations.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">目的地</h2>
            <div className="flex flex-wrap gap-2">
              {currentTrip.destinations.map((destination, index) => (
                <div
                  key={index}
                  className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium"
                >
                  {destination.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* メンバー */}
        {currentTrip.members && currentTrip.members.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">メンバー</h2>
            <div className="space-y-2">
              {currentTrip.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {member.guestName || member.userId || 'ユーザー'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {member.role === 'owner' ? 'オーナー' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* タグ */}
        {currentTrip.tags && currentTrip.tags.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">タグ</h2>
            <div className="flex flex-wrap gap-2">
              {currentTrip.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* メモ */}
        {currentTrip.notes && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">メモ</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{currentTrip.notes}</p>
          </div>
        )}

        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-bold mb-4">旅行プランを削除しますか？</h3>
              <p className="text-gray-600 mb-6">この操作は取り消せません。</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:bg-gray-400"
                >
                  {isDeleting ? '削除中...' : '削除'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripDetail;
