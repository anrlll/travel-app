import React, { useState } from 'react';
import type { PendingFriendRequest, SentFriendRequest } from '../types/trip';

interface FriendRequestListProps {
  pendingRequests: PendingFriendRequest[];
  sentRequests: SentFriendRequest[];
  isLoading?: boolean;
  onAccept: (requesterId: string) => Promise<void>;
  onReject: (requesterId: string) => Promise<void>;
}

/**
 * フレンドリクエスト一覧表示コンポーネント
 */
export const FriendRequestList: React.FC<FriendRequestListProps> = ({
  pendingRequests,
  sentRequests,
  isLoading = false,
  onAccept,
  onReject,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const handleAccept = async (requesterId: string) => {
    setProcessingId(requesterId);
    try {
      await onAccept(requesterId);
    } catch (error) {
      console.error('リクエスト受理エラー:', error);
      alert('リクエストの受理に失敗しました');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requesterId: string) => {
    setProcessingId(requesterId);
    try {
      await onReject(requesterId);
    } catch (error) {
      console.error('リクエスト拒否エラー:', error);
      alert('リクエストの拒否に失敗しました');
    } finally {
      setProcessingId(null);
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

  const hasRequests = pendingRequests.length > 0 || sentRequests.length > 0;

  if (!hasRequests) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">フレンドリクエストがありません</p>
      </div>
    );
  }

  return (
    <div>
      {/* タブ */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('received')}
          className={`py-2 px-4 font-medium transition-colors ${
            activeTab === 'received'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          受信 ({pendingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`py-2 px-4 font-medium transition-colors ${
            activeTab === 'sent'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          送信 ({sentRequests.length})
        </button>
      </div>

      {/* 受信したリクエスト */}
      {activeTab === 'received' && (
        <div className="space-y-2">
          {pendingRequests.length === 0 ? (
            <p className="text-center py-8 text-gray-500">受信したリクエストがありません</p>
          ) : (
            pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{request.user.displayName}</h3>
                  <p className="text-sm text-gray-500">@{request.user.username}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(request.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleAccept(request.userId)}
                    disabled={processingId === request.userId}
                    className="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === request.userId ? '処理中...' : '承認'}
                  </button>
                  <button
                    onClick={() => handleReject(request.userId)}
                    disabled={processingId === request.userId}
                    className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === request.userId ? '処理中...' : '拒否'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 送信したリクエスト */}
      {activeTab === 'sent' && (
        <div className="space-y-2">
          {sentRequests.length === 0 ? (
            <p className="text-center py-8 text-gray-500">送信したリクエストがありません</p>
          ) : (
            sentRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{request.friendUser.displayName}</h3>
                  <p className="text-sm text-gray-500">@{request.friendUser.username}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(request.createdAt).toLocaleDateString('ja-JP')}に送信
                  </p>
                </div>
                <div className="ml-4">
                  <span className="px-3 py-1 text-sm text-yellow-600 bg-yellow-100 rounded">
                    待機中
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FriendRequestList;
