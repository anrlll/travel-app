import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/Header';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * アカウント管理ページコンポーネント
 *
 * ユーザーのアカウント情報を表示します。
 */
export default function Account() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  /**
   * ログアウト処理
   */
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">ユーザー情報が見つかりません</p>
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

        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">アカウント管理</h1>
          <p className="text-gray-600 mt-2">アカウント情報を確認できます</p>
        </div>

        {/* アカウント情報カード */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">基本情報</h2>

          <div className="space-y-4">
            {/* ユーザーID */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 pb-4">
              <dt className="text-sm font-medium text-gray-500 w-48">ユーザーID</dt>
              <dd className="text-sm text-gray-900 mt-1 sm:mt-0 font-mono">{user.id}</dd>
            </div>

            {/* メールアドレス */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 pb-4">
              <dt className="text-sm font-medium text-gray-500 w-48">メールアドレス</dt>
              <dd className="text-sm text-gray-900 mt-1 sm:mt-0">{user.email}</dd>
            </div>

            {/* ユーザー名 */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 pb-4">
              <dt className="text-sm font-medium text-gray-500 w-48">ユーザー名</dt>
              <dd className="text-sm text-gray-900 mt-1 sm:mt-0">{user.username}</dd>
            </div>

            {/* 表示名 */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 pb-4">
              <dt className="text-sm font-medium text-gray-500 w-48">表示名</dt>
              <dd className="text-sm text-gray-900 mt-1 sm:mt-0">
                {user.displayName || '未設定'}
              </dd>
            </div>

            {/* 言語設定 */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 pb-4">
              <dt className="text-sm font-medium text-gray-500 w-48">言語設定</dt>
              <dd className="text-sm text-gray-900 mt-1 sm:mt-0">
                {user.locale === 'ja' ? '日本語' : user.locale === 'en' ? '英語' : user.locale}
              </dd>
            </div>

            {/* プロフィール画像 */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 pb-4">
              <dt className="text-sm font-medium text-gray-500 w-48">プロフィール画像</dt>
              <dd className="text-sm text-gray-900 mt-1 sm:mt-0">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="プロフィール画像"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500">未設定</span>
                )}
              </dd>
            </div>

            {/* 登録日 */}
            <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-200 pb-4">
              <dt className="text-sm font-medium text-gray-500 w-48">登録日</dt>
              <dd className="text-sm text-gray-900 mt-1 sm:mt-0">
                {user.createdAt
                  ? format(new Date(user.createdAt), 'yyyy年M月d日（E）HH:mm', { locale: ja })
                  : '不明'}
              </dd>
            </div>

            {/* 最終更新日 */}
            <div className="flex flex-col sm:flex-row sm:items-center pb-4">
              <dt className="text-sm font-medium text-gray-500 w-48">最終更新日</dt>
              <dd className="text-sm text-gray-900 mt-1 sm:mt-0">
                {user.updatedAt
                  ? format(new Date(user.updatedAt), 'yyyy年M月d日（E）HH:mm', { locale: ja })
                  : '不明'}
              </dd>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">アカウント操作</h2>

          <div className="space-y-4">
            {/* ログアウトボタン */}
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              ログアウト
            </button>

            {/* 将来的に追加予定の機能 */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">今後追加予定の機能：</p>
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                <li>プロフィール編集</li>
                <li>パスワード変更</li>
                <li>メールアドレス変更</li>
                <li>アカウント削除</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
