import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// QueryClientのインスタンス作成
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">TravelApp</h1>
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="rounded-lg bg-white px-5 py-6 shadow sm:px-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                旅行計画を支援するアプリへようこそ
              </h2>
              <p className="mt-4 text-gray-600">
                TravelAppは旅行の計画、予算管理、思い出の記録を簡単にするWebアプリケーションです。
              </p>
              <div className="mt-6 flex gap-4">
                <button className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
                  旅行プランを作成
                </button>
                <button className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">
                  既存プランを見る
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
