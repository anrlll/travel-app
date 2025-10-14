import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * ProtectedRouteのプロパティ型定義
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 認証保護されたルートコンポーネント
 *
 * 認証されていないユーザーをログインページにリダイレクトします。
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
