import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { logout } from '../services/authService';

/**
 * ホームページコンポーネント
 */
export default function Home() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  /**
   * ログアウト処理
   */
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      // エラーが発生してもログインページへ遷移
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">TravelApp</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                ようこそ、{user?.displayName || user?.username} さん
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              TravelAppへようこそ！
            </h2>
            <p className="text-gray-600 mb-8">
              認証機能の実装が完了しました。旅行計画機能の実装はこれから進めていきます。
            </p>
            <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                あなたのアカウント情報
              </h3>
              <dl className="space-y-2 text-sm text-left">
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500">ユーザーID:</dt>
                  <dd className="text-gray-900">{user?.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500">メールアドレス:</dt>
                  <dd className="text-gray-900">{user?.email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500">ユーザー名:</dt>
                  <dd className="text-gray-900">{user?.username}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500">表示名:</dt>
                  <dd className="text-gray-900">{user?.displayName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium text-gray-500">言語設定:</dt>
                  <dd className="text-gray-900">{user?.locale === 'ja' ? '日本語' : '英語'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
