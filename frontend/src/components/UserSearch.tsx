import React, { useState } from 'react';

interface UserSearchProps {
  currentUserId: string;
  onSendRequest: (userId: string) => Promise<void>;
}

/**
 * ユーザー検索とフレンドリクエスト送信コンポーネント
 * ユーザーIDで検索してフレンドリクエストを送信できる
 */
export const UserSearch: React.FC<UserSearchProps> = ({ currentUserId, onSendRequest }) => {
  const [userId, setUserId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      setMessage({ type: 'error', text: 'ユーザーIDを入力してください' });
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      await onSendRequest(userId.trim());
      setMessage({ type: 'success', text: 'フレンドリクエストを送信しました' });
      setUserId('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSendRequest} className="flex gap-2">
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="ユーザーIDを入力 (例: clmabcdef...)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !userId.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSending ? '送信中...' : 'リクエスト送信'}
        </button>
      </form>

      {/* メッセージ表示 */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 自分のユーザーID表示 */}
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">あなたのユーザーID:</span>
        </p>
        <p className="text-sm text-gray-800 font-mono break-all mt-1">{currentUserId}</p>
      </div>
    </div>
  );
};

export default UserSearch;
