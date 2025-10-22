import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import * as tripService from '../services/tripService';
import Header from '../components/Header';
import FriendList from '../components/FriendList';
import FriendRequestList from '../components/FriendRequestList';
import UserSearch from '../components/UserSearch';
import type { Friend, PendingFriendRequest, SentFriendRequest } from '../types/trip';

/**
 * プロフィール・フレンド管理ページ
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // ユーザー認証チェック
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  // データ取得
  const fetchData = async () => {
    setIsFetching(true);
    try {
      const [friendsData, pendingData, sentData] = await Promise.all([
        tripService.getFriends(),
        tripService.getPendingFriendRequests(),
        tripService.getSentFriendRequests(),
      ]);

      setFriends(friendsData);
      setPendingRequests(pendingData);
      setSentRequests(sentData);
    } catch (error) {
      console.error('データ取得エラー:', error);
      alert('データの読み込みに失敗しました');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, []);

  const handleRemoveFriend = async (friendUserId: string) => {
    await tripService.removeFriend(friendUserId);
    await fetchData();
  };

  const handleAcceptRequest = async (requesterId: string) => {
    await tripService.acceptFriendRequest(requesterId);
    await fetchData();
  };

  const handleRejectRequest = async (requesterId: string) => {
    await tripService.rejectFriendRequest(requesterId);
    await fetchData();
  };

  const handleSendRequest = async (friendUserId: string) => {
    await tripService.sendFriendRequest(friendUserId);
    await fetchData();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* グローバルヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">フレンド管理</h1>
        </div>
      </div>

      {/* タブセクション（修正前のサイズ） */}
      <div className="max-w-4xl mx-auto px-6 py-0">
        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-3 px-6 font-medium border-b-2 transition-colors ${
              activeTab === 'friends'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            フレンド ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-6 font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            リクエスト ({pendingRequests.length + sentRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-3 px-6 font-medium border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            新規リクエスト
          </button>
        </div>

        {/* フレンドタブ */}
        {activeTab === 'friends' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">フレンド一覧</h2>
              <button
                onClick={() => fetchData()}
                disabled={isFetching}
                className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {isFetching ? '更新中...' : '更新'}
              </button>
            </div>
            <FriendList
              friends={friends}
              isLoading={isLoading && activeTab === 'friends'}
              onRemoveFriend={handleRemoveFriend}
            />
          </div>
        )}

        {/* リクエストタブ */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">フレンドリクエスト</h2>
              <button
                onClick={() => fetchData()}
                disabled={isFetching}
                className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {isFetching ? '更新中...' : '更新'}
              </button>
            </div>
            <FriendRequestList
              pendingRequests={pendingRequests}
              sentRequests={sentRequests}
              isLoading={isLoading && activeTab === 'requests'}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
            />
          </div>
        )}

        {/* 検索タブ */}
        {activeTab === 'search' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">新しいフレンドを追加</h2>
            <UserSearch currentUserId={user.id} onSendRequest={handleSendRequest} />
          </div>
        )}
      </div>
    </div>
  );
}
