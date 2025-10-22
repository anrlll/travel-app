import React, { useState } from 'react';
import type { Friend } from '../types/trip';

interface FriendListProps {
  friends: Friend[];
  isLoading?: boolean;
  onRemoveFriend: (friendUserId: string) => Promise<void>;
}

/**
 * フレンド一覧表示コンポーネント
 */
export const FriendList: React.FC<FriendListProps> = ({
  friends,
  isLoading = false,
  onRemoveFriend,
}) => {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (friendUserId: string) => {
    if (!confirm('このフレンドを削除してもよろしいですか？')) {
      return;
    }

    setRemovingId(friendUserId);
    try {
      await onRemoveFriend(friendUserId);
    } catch (error) {
      console.error('フレンド削除エラー:', error);
      alert('フレンドの削除に失敗しました');
    } finally {
      setRemovingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin">⟳</div>
        <p className="text-gray-600 mt-2">読み込み中...</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">フレンドがいません</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{friend.friendUser.displayName}</h3>
            <p className="text-sm text-gray-500">@{friend.friendUser.username}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(friend.createdAt).toLocaleDateString('ja-JP')}にフレンド登録
            </p>
          </div>
          <button
            onClick={() => handleRemove(friend.friendUserId)}
            disabled={removingId === friend.friendUserId}
            className="ml-4 px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removingId === friend.friendUserId ? '削除中...' : '削除'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default FriendList;
