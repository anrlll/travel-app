import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * ヘッダーコンポーネント
 *
 * アプリケーション全体のヘッダーを表示します。
 * ログイン状態に応じてログイン・ログアウトボタンを表示します。
 */
export default function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  /**
   * ログアウト処理
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            <Link to="/trips" className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
              TravelApp
            </Link>
          </div>

          {/* ナビゲーション */}
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* 旅行プラン一覧ボタン */}
                <Link
                  to="/trips"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  旅行プラン
                </Link>

                {/* ユーザー情報（クリック可能） */}
                <Link
                  to="/account"
                  className="text-sm text-gray-700 hover:text-gray-900 hover:underline transition-colors"
                >
                  {user?.displayName || user?.username || 'ユーザー'}
                </Link>

                {/* ログアウトボタン */}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <>
                {/* ログインボタン */}
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  ログイン
                </Link>

                {/* 登録ボタン */}
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                >
                  新規登録
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
