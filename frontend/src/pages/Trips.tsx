import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTripStore } from '../stores/tripStore';
import Header from '../components/Header';
import type { Trip } from '../types/trip';

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

function Trips() {
  const navigate = useNavigate();
  const { trips, isLoading, error, fetchTrips } = useTripStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 初回マウント時に旅行プラン一覧を取得
  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // 検索・フィルタリング処理
  const handleSearch = () => {
    const params: any = {};
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    if (statusFilter) {
      params.status = statusFilter;
    }
    fetchTrips(params);
  };

  // リセット処理
  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    fetchTrips();
  };

  // 旅行プランカードコンポーネント
  const TripCard = ({ trip }: { trip: Trip }) => {
    const startDate = trip.startDate ? new Date(trip.startDate) : null;
    const endDate = trip.endDate ? new Date(trip.endDate) : null;

    return (
      <div
        onClick={() => navigate(`/trips/${trip.id}`)}
        className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
      >
        {/* タイトルとステータス */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-gray-900 flex-1">{trip.title}</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              statusStyles[trip.status]
            }`}
          >
            {statusLabels[trip.status]}
          </span>
        </div>

        {/* 説明 */}
        {trip.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{trip.description}</p>
        )}

        {/* 日程 */}
        <div className="flex items-center text-gray-700 text-sm mb-3">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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

        {/* 目的地 */}
        {trip.destinations && trip.destinations.length > 0 && (
          <div className="flex items-center text-gray-700 text-sm mb-3">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>
              {trip.destinations.map((d) => d.name).join('、')}
            </span>
          </div>
        )}

        {/* タグ */}
        {trip.tags && trip.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {trip.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">旅行プラン</h1>
          <Link
            to="/trips/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition-colors"
          >
            + 新規作成
          </Link>
        </div>

        {/* 検索・フィルタリングフォーム */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 検索ボックス */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                検索（タイトル・説明）
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="キーワードを入力..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ステータスフィルター */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">すべて</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              検索
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              リセット
            </button>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* ローディング表示 */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* 旅行プラン一覧 */}
        {!isLoading && trips.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">旅行プランがありません</p>
            <Link
              to="/trips/new"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              最初の旅行プランを作成する
            </Link>
          </div>
        )}

        {!isLoading && trips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Trips;
