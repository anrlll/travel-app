import React, { useState } from 'react';
import Button from './Button';

interface AddMemberFormProps {
  onAddUserMember: (email: string, role: string) => Promise<void>;
  onAddGuestMember: (name: string, email: string, role: string) => Promise<void>;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function AddMemberForm({ onAddUserMember, onAddGuestMember }: AddMemberFormProps) {
  const [activeTab, setActiveTab] = useState<'user' | 'guest'>('user');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('viewer');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestRole, setGuestRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddUserMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // バリデーション
    if (!userEmail.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    if (!validateEmail(userEmail)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      await onAddUserMember(userEmail.trim(), userRole);
      setSuccessMessage('メンバーを追加しました');
      setUserEmail('');
      setUserRole('viewer');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メンバー追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGuestMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // バリデーション
    if (!guestName.trim()) {
      setError('ゲスト名を入力してください');
      return;
    }

    if (!guestEmail.trim()) {
      setError('メールアドレスを入力してください');
      return;
    }

    if (!validateEmail(guestEmail)) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      await onAddGuestMember(guestName.trim(), guestEmail.trim(), guestRole);
      setSuccessMessage('ゲストメンバーを追加しました');
      setGuestName('');
      setGuestEmail('');
      setGuestRole('viewer');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ゲスト追加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">メンバーを追加</h3>

      {/* エラー・成功メッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md text-sm mb-4">
          {successMessage}
        </div>
      )}

      {/* タブ */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          type="button"
          onClick={() => setActiveTab('user')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'user'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ユーザーを追加
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guest')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'guest'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ゲストを追加
        </button>
      </div>

      {/* ユーザー追加フォーム */}
      {activeTab === 'user' && (
        <form onSubmit={handleAddUserMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              役割 <span className="text-red-500">*</span>
            </label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="viewer">ビューアー</option>
              <option value="editor">エディター</option>
              <option value="owner">オーナー</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? '追加中...' : '追加'}
          </Button>
        </form>
      )}

      {/* ゲスト追加フォーム */}
      {activeTab === 'guest' && (
        <form onSubmit={handleAddGuestMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ゲスト名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="太郎"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="guest@example.com"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              役割 <span className="text-red-500">*</span>
            </label>
            <select
              value={guestRole}
              onChange={(e) => setGuestRole(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="viewer">ビューアー</option>
              <option value="editor">エディター</option>
              <option value="owner">オーナー</option>
            </select>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? '追加中...' : '追加'}
          </Button>
        </form>
      )}
    </div>
  );
}
