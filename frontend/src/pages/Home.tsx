import { useAuthStore } from '../stores/authStore';
import Header from '../components/Header';

/**
 * ホームページコンポーネント
 */
export default function Home() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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
