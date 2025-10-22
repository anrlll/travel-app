import React, { useState, useEffect } from 'react';
import Button from './Button';
import * as tripService from '../services/tripService';
import type { Friend } from '../types/trip';

interface AddMemberFormProps {
  onAddUserMember: (email: string, role: string) => Promise<void>;
  onAddGuestMember: (name: string, email: string, role: string) => Promise<void>;
  existingMemberUserIds?: string[];
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function AddMemberForm({ onAddUserMember, onAddGuestMember, existingMemberUserIds = [] }: AddMemberFormProps) {
  const [activeTab, setActiveTab] = useState<'user' | 'guest'>('user');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [userRole, setUserRole] = useState('viewer');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestRole, setGuestRole] = useState('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFriends, setIsFetchingFriends] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // フレンド一覧を取得
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendsData = await tripService.getFriends();
        setFriends(friendsData);
      } catch (err) {
        console.error('フレンド一覧取得エラー:', err);
      } finally {
        setIsFetchingFriends(false);
      }
    };

    if (activeTab === 'user') {
      setIsFetchingFriends(true);
      fetchFriends();
    }
  }, [activeTab]);

  const handleAddUserMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // バリデーション
    if (!selectedFriendId) {
      setError('フレンドを選択してください');
      return;
    }

    // 選択されたフレンドのメールアドレスを取得
    const selectedFriend = friends.find((f) => f.id === selectedFriendId);
    if (!selectedFriend) {
      setError('フレンドが見つかりません');
      return;
    }

    setIsLoading(true);
    try {
      await onAddUserMember(selectedFriend.friendUser.email, userRole);
      setSuccessMessage('メンバーを追加しました');
      setSelectedFriendId('');
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
    <div className="space-y-4">
      {/* エラー・成功メッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* タブ */}
      <div className="flex gap-0 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('user')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'user'
              ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ユーザーを追加
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('guest')}
          className={`px-6 py-3 font-medium text-sm transition-colors ${
            activeTab === 'guest'
              ? 'text-blue-600 border-b-2 border-blue-600 -mb-0.5'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          ゲストを追加
        </button>
      </div>

      {/* ユーザー追加フォーム */}
      {activeTab === 'user' && (
        <form onSubmit={handleAddUserMember} className="space-y-3">
          {isFetchingFriends ? (
            <div className="py-6 text-center text-gray-500">
              <div className="inline-block animate-spin text-lg mb-2">⟳</div>
              <p>フレンドを読み込み中...</p>
            </div>
          ) : friends.length === 0 ? (
            <div className="py-6 text-center text-gray-600 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium">フレンドがいません</p>
              <p className="text-sm mt-2">
                <a href="/profile" className="text-blue-600 hover:text-blue-700 font-medium">
                  プロフィールページ
                </a>
                からフレンドを追加してください。
              </p>
            </div>
          ) : (
            <>
              <div>
                {(() => {
                  const availableFriends = friends.filter(
                    (friend) => !existingMemberUserIds.includes(friend.friendUser.id)
                  );

                  return (
                    <>
                      {availableFriends.length === 0 ? (
                        <div className="py-3 text-center text-gray-600 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                          すべてのフレンドがメンバーに追加済みです
                        </div>
                      ) : (
                        <select
                          value={selectedFriendId}
                          onChange={(e) => setSelectedFriendId(e.target.value)}
                          disabled={isLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                          <option value="">フレンドを選択...</option>
                          {availableFriends.map((friend) => (
                            <option key={friend.id} value={friend.id}>
                              {friend.friendUser.displayName} (@{friend.friendUser.username})
                            </option>
                          ))}
                        </select>
                      )}
                    </>
                  );
                })()}
              </div>

              <div>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="viewer">ビューアー</option>
                  <option value="editor">エディター</option>
                  <option value="owner">オーナー</option>
                </select>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoading || !selectedFriendId}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  {isLoading ? '追加中...' : '追加'}
                </Button>
              </div>
            </>
          )}
        </form>
      )}

      {/* ゲスト追加フォーム */}
      {activeTab === 'guest' && (
        <form onSubmit={handleAddGuestMember} className="space-y-3">
          <div>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="ゲスト名"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="メールアドレス"
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <select
              value={guestRole}
              onChange={(e) => setGuestRole(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="viewer">ビューアー</option>
              <option value="editor">エディター</option>
              <option value="owner">オーナー</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            >
              {isLoading ? '追加中...' : '追加'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
