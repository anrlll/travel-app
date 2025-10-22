import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTripStore } from '../stores/tripStore';
import { useActivityStore } from '../stores/activityStore';
import { useAuthStore } from '../stores/authStore';
import Header from '../components/Header';
import ActivityCard from '../components/ActivityCard';
import ActivityForm from '../components/ActivityForm';
import BudgetSummary from '../components/BudgetSummary';
import BudgetManager from '../components/BudgetManager';
import Button from '../components/Button';
import TransportCard from '../components/TransportCard';
import type { Activity, CreateActivityData } from '../types/activity';

// ステータスバッジのスタイル
const statusStyles: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-800',
  planning: 'bg-blue-200 text-blue-800',
  confirmed: 'bg-green-200 text-green-800',
  completed: 'bg-purple-200 text-purple-800',
  cancelled: 'bg-red-200 text-red-800',
};

// ステータスの日本語ラベル
const statusLabels: Record<string, string> = {
  draft: '下書き',
  planning: '計画中',
  confirmed: '確定済み',
  completed: '完了',
  cancelled: 'キャンセル',
};

type TabType = 'overview' | 'itinerary' | 'budget';

function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrip, isLoading, error, fetchTripById, deleteTrip, clearCurrentTrip } =
    useTripStore();
  const activityStore = useActivityStore();
  const {
    activities,
    participants,
    transports,
    isLoading: activitiesLoading,
    fetchActivities,
    fetchParticipants,
    fetchTransport,
    addParticipant,
    removeParticipant,
    setTransport,
    deleteTransport,
    createActivity,
    updateActivity,
    deleteActivity,
    toggleActivityCompletion,
    reorderActivity,
    moveActivityToDay,
    batchDeleteActivities,
    batchToggleCompletion,
  } = activityStore;
  const { user } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(1); // 日程タブで選択中の日
  // 選択モード用の状態
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  // 初回マウント時に旅行プラン詳細を取得
  useEffect(() => {
    if (id) {
      fetchTripById(id);
    }

    // クリーンアップ
    return () => {
      clearCurrentTrip();
    };
  }, [id, fetchTripById, clearCurrentTrip]);

  // 旅行プランが取得されたらアクティビティも取得
  useEffect(() => {
    if (id && currentTrip) {
      fetchActivities(id);
    }
  }, [id, currentTrip, fetchActivities]);

  // アクティビティが取得されたら、各アクティビティの参加者と移動手段も取得
  useEffect(() => {
    if (activities.length > 0) {
      activities.forEach((activity) => {
        // すでに取得済みでない場合のみ取得
        if (!participants[activity.id]) {
          fetchParticipants(activity.id).catch(console.error);
        }
        if (transports[activity.id] === undefined) {
          fetchTransport(activity.id).catch(console.error);
        }
      });
    }
  }, [activities, participants, transports, fetchParticipants, fetchTransport]);

  // 日程タブが変更されたときに、その日のアクティビティの移動手段を再取得
  useEffect(() => {
    if (activities.length > 0) {
      const activitiesByDayList = activities.filter((a) => a.dayNumber === selectedDayTab);
      activitiesByDayList.forEach((activity) => {
        fetchTransport(activity.id).catch(console.error);
      });
    }
  }, [selectedDayTab, activities, fetchTransport]);

  // オーナーまたはエディターかどうかを判定
  const canEdit =
    currentTrip &&
    user &&
    currentTrip.members?.some(
      (member) =>
        member.userId === user.id && (member.role === 'owner' || member.role === 'editor')
    );

  // オーナーかどうかを判定
  const isOwner =
    currentTrip &&
    user &&
    currentTrip.members?.some((member) => member.userId === user.id && member.role === 'owner');

  // ステータス変更処理
  const handleStatusChange = async (newStatus: string) => {
    if (!id || !currentTrip) return;

    try {
      setIsUpdatingStatus(true);
      const { updateTrip } = useTripStore.getState();
      await updateTrip(id, { status: newStatus as any });
      // 詳細を再取得
      await fetchTripById(id);
    } catch (error) {
      console.error('ステータス変更エラー:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!id) return;

    try {
      setIsDeleting(true);
      await deleteTrip(id);
      navigate('/trips');
    } catch (error) {
      console.error('削除エラー:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // アクティビティ追加
  const handleAddActivity = (dayNumber: number) => {
    setSelectedDayNumber(dayNumber);
    setEditingActivity(null);
    setShowActivityForm(true);
  };

  // アクティビティ編集
  const handleEditActivity = (activity: Activity) => {
    setSelectedDayNumber(activity.dayNumber);
    setEditingActivity(activity);
    setShowActivityForm(true);
  };

  // アクティビティ削除
  const handleDeleteActivity = async (activityId: string) => {
    try {
      await deleteActivity(activityId);
    } catch (error) {
      console.error('アクティビティ削除エラー:', error);
    }
  };

  // アクティビティ完了トグル
  const handleToggleComplete = async (activityId: string) => {
    try {
      await toggleActivityCompletion(activityId);
    } catch (error) {
      console.error('完了状態変更エラー:', error);
    }
  };

  // アクティビティフォーム送信
  const handleActivitySubmit = async (data: CreateActivityData) => {
    if (!id) return;

    try {
      if (editingActivity) {
        // 更新
        await updateActivity(editingActivity.id, data);
      } else {
        // 新規作成
        await createActivity(id, data);
      }
      setShowActivityForm(false);
      setEditingActivity(null);
    } catch (error) {
      // エラーはストアで処理済み
      throw error;
    }
  };

  // 順序変更ハンドラー
  const handleMoveUp = async (activityId: string) => {
    if (!id) return;

    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const dayActivities = activities
      .filter((a) => a.dayNumber === activity.dayNumber)
      .sort((a, b) => a.order - b.order);

    const currentIndex = dayActivities.findIndex((a) => a.id === activityId);
    if (currentIndex <= 0) return;

    const newOrder = dayActivities[currentIndex - 1].order;

    // スクロール位置を保存
    const scrollPosition = window.scrollY;

    try {
      await reorderActivity(activityId, newOrder);
      // 順序変更後、アクティビティリストを再取得
      await fetchActivities(id);

      // 次のフレームでスクロール位置を復元
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    } catch (error) {
      console.error('順序変更エラー:', error);
    }
  };

  const handleMoveDown = async (activityId: string) => {
    if (!id) return;

    const activity = activities.find((a) => a.id === activityId);
    if (!activity) return;

    const dayActivities = activities
      .filter((a) => a.dayNumber === activity.dayNumber)
      .sort((a, b) => a.order - b.order);

    const currentIndex = dayActivities.findIndex((a) => a.id === activityId);
    if (currentIndex >= dayActivities.length - 1) return;

    const newOrder = dayActivities[currentIndex + 1].order;

    // スクロール位置を保存
    const scrollPosition = window.scrollY;

    try {
      await reorderActivity(activityId, newOrder);
      // 順序変更後、アクティビティリストを再取得
      await fetchActivities(id);

      // 次のフレームでスクロール位置を復元
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    } catch (error) {
      console.error('順序変更エラー:', error);
    }
  };

  // 日移動ハンドラー
  const handleMoveToDay = async (activityId: string, dayNumber: number) => {
    if (!id) return;

    // スクロール位置を保存
    const scrollPosition = window.scrollY;

    try {
      await moveActivityToDay(activityId, dayNumber);
      // 日移動後、アクティビティリストを再取得
      await fetchActivities(id);

      // 次のフレームでスクロール位置を復元
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    } catch (error) {
      console.error('日移動エラー:', error);
    }
  };

  // 一括削除
  const handleBatchDelete = async () => {
    if (!id || selectedActivities.size === 0) return;
    if (!window.confirm(`${selectedActivities.size}件のアクティビティを削除しますか?`)) return;

    try {
      await batchDeleteActivities(id, Array.from(selectedActivities));
      setSelectedActivities(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('一括削除エラー:', error);
    }
  };

  // 一括完了
  const handleBatchComplete = async (isCompleted: boolean) => {
    if (!id || selectedActivities.size === 0) return;

    try {
      await batchToggleCompletion(id, Array.from(selectedActivities), isCompleted);
      setSelectedActivities(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error('一括完了切り替えエラー:', error);
    }
  };

  // アクティビティ選択
  const handleSelectActivity = (activityId: string) => {
    setSelectedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
          <Button
            onClick={() => navigate('/trips')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            旅行プラン一覧に戻る
          </Button>
        </div>
      </div>
    );
  }

  // 旅行プランが見つからない
  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">旅行プランが見つかりません</p>
            <Button
              onClick={() => navigate('/trips')}
              className="text-blue-600 hover:text-blue-700"
            >
              旅行プラン一覧に戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const startDate = currentTrip.startDate ? new Date(currentTrip.startDate) : null;
  const endDate = currentTrip.endDate ? new Date(currentTrip.endDate) : null;

  // 日程の日数を計算
  const numberOfDays =
    startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const days = numberOfDays > 0 ? Array.from({ length: numberOfDays }, (_, i) => i + 1) : [];

  // 日ごとにアクティビティをグループ化
  const activitiesByDay = activities.reduce((acc, activity) => {
    if (!acc[activity.dayNumber]) {
      acc[activity.dayNumber] = [];
    }
    acc[activity.dayNumber].push(activity);
    return acc;
  }, {} as Record<number, Activity[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 戻るボタン */}
        <Button
          onClick={() => navigate('/trips')}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </Button>

        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentTrip.title}</h1>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  statusStyles[currentTrip.status]
                }`}
              >
                {statusLabels[currentTrip.status]}
              </span>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(`/trips/${id}/edit`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  編集
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  削除
                </Button>
              </div>
            )}
          </div>

          {/* 日程 */}
          <div className="flex items-center text-gray-700 mb-3">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>
              {startDate && endDate
                ? `${format(startDate, 'yyyy年M月d日（E）', { locale: ja })} 〜 ${format(
                    endDate,
                    'M月d日（E）',
                    { locale: ja }
                  )} (${numberOfDays}日間)`
                : '日程未定'}
            </span>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex items-center justify-between -mb-px">
              <div className="flex -mb-px">
                <Button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  概要
                </Button>
                <Button
                  onClick={() => setActiveTab('itinerary')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'itinerary'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  日程 {activities.length > 0 && `(${activities.length}件)`}
                </Button>
                <Button
                  onClick={() => setActiveTab('budget')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'budget'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  予算
                </Button>
              </div>
              {canEdit && (
                <Button
                  onClick={() => navigate(`/trips/${id}/canvas`)}
                  className="mr-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                  </svg>
                  キャンバスで編集
                </Button>
              )}
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {/* 概要タブ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 説明 */}
                {currentTrip.description && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">説明</h2>
                    <p className="text-gray-700">{currentTrip.description}</p>
                  </div>
                )}

                {/* 目的地 */}
                {currentTrip.destinations && currentTrip.destinations.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">目的地</h2>
                    <div className="flex flex-wrap gap-2">
                      {currentTrip.destinations.map((destination, index) => (
                        <div
                          key={index}
                          className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium"
                        >
                          {destination.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* メンバー */}
                {currentTrip.members && currentTrip.members.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">メンバー</h2>
                    <div className="space-y-2">
                      {currentTrip.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <span className="text-gray-700">
                            {member.user?.displayName || member.user?.username || member.guestName || 'ユーザー'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {member.role === 'owner' ? 'オーナー' : member.role === 'editor' ? 'エディター' : 'ビューワー'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* タグ */}
                {currentTrip.tags && currentTrip.tags.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">タグ</h2>
                    <div className="flex flex-wrap gap-2">
                      {currentTrip.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* メモ */}
                {currentTrip.notes && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">メモ</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{currentTrip.notes}</p>
                  </div>
                )}

                {/* ステータス変更（オーナーのみ） */}
                {isOwner && (
                  <div className="pt-4 border-t border-gray-200">
                    <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-2">
                      ステータスを変更
                    </label>
                    <select
                      id="status-select"
                      value={currentTrip.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={isUpdatingStatus}
                      className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {isUpdatingStatus && (
                      <p className="text-sm text-gray-500 mt-2">更新中...</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 日程タブ */}
            {activeTab === 'itinerary' && (
              <div>
                {days.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">日程が設定されていません</p>
                    {isOwner && (
                      <Button
                        onClick={() => navigate(`/trips/${id}/edit`)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        旅行プランを編集して日程を設定する
                      </Button>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* 日付タブナビゲーション */}
                    <div className="border-b border-gray-200 mb-6">
                      <nav className="flex flex-wrap gap-2 -mb-px">
                        {days.map((dayNumber) => {
                          const dayDate = startDate
                            ? new Date(startDate.getTime() + (dayNumber - 1) * 24 * 60 * 60 * 1000)
                            : null;

                          return (
                            <Button
                              key={dayNumber}
                              onClick={() => setSelectedDayTab(dayNumber)}
                              className={`px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                                selectedDayTab === dayNumber
                                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="text-center">
                                <div className="font-medium">Day {dayNumber}</div>
                                {dayDate && (
                                  <div className="text-xs mt-1">
                                    {format(dayDate, 'M/d（E）', { locale: ja })}
                                  </div>
                                )}
                              </div>
                            </Button>
                          );
                        })}
                      </nav>
                    </div>

                    {/* 選択された日のアクティビティ表示 */}
                    {activitiesLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div>
                        {/* 選択中の日のヘッダー */}
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-2xl font-bold text-gray-900">
                            Day {selectedDayTab}
                            {startDate && ` - ${format(
                              new Date(startDate.getTime() + (selectedDayTab - 1) * 24 * 60 * 60 * 1000),
                              'M月d日（E）',
                              { locale: ja }
                            )}`}
                          </h3>
                          <div className="flex gap-2">
                            {canEdit && (activitiesByDay[selectedDayTab]?.length || 0) > 0 && (
                              <Button
                                onClick={() => setSelectionMode(!selectionMode)}
                                className={`px-4 py-2 rounded-md transition-colors text-sm ${
                                  selectionMode
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                              >
                                {selectionMode ? '選択モード終了' : '選択モード'}
                              </Button>
                            )}
                            {canEdit && (
                              <Button
                                onClick={() => handleAddActivity(selectedDayTab)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                              >
                                + アクティビティを追加
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* アクティビティリスト */}
                        {(activitiesByDay[selectedDayTab]?.length || 0) === 0 ? (
                          <p className="text-gray-500 text-center py-12 bg-gray-50 rounded-lg">
                            アクティビティがありません
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {activitiesByDay[selectedDayTab].map((activity, index) => {
                              const nextActivity = activitiesByDay[selectedDayTab][index + 1];
                              // 現在のアクティビティに関連付けられた移動手段を取得
                              // （このアクティビティの終了後、次のアクティビティへの移動を表す）
                              const activityTransport = transports[activity.id];

                              return (
                                <React.Fragment key={activity.id}>
                                  <div className="relative">
                                    {/* 選択チェックボックス */}
                                    {selectionMode && (
                                      <div className="absolute top-2 right-2 z-10">
                                        <input
                                          type="checkbox"
                                          checked={selectedActivities.has(activity.id)}
                                          onChange={() => handleSelectActivity(activity.id)}
                                          className="w-5 h-5 cursor-pointer"
                                        />
                                      </div>
                                    )}
                                    <ActivityCard
                                      activity={activity}
                                      canEdit={!!canEdit && !selectionMode}
                                      participants={participants[activity.id]}
                                      transport={undefined}
                                      onEdit={handleEditActivity}
                                      onDelete={handleDeleteActivity}
                                      onToggleComplete={handleToggleComplete}
                                      isFirst={index === 0}
                                      isLast={index === activitiesByDay[selectedDayTab].length - 1}
                                      onMoveUp={handleMoveUp}
                                      onMoveDown={handleMoveDown}
                                      availableDays={days}
                                      onMoveToDay={handleMoveToDay}
                                    />
                                  </div>

                                  {/* 次のアクティビティへの移動情報 */}
                                  {nextActivity && activityTransport && (
                                    <TransportCard
                                      transport={activityTransport}
                                      fromActivity={activity}
                                      toActivity={nextActivity}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 予算タブ */}
            {activeTab === 'budget' && id && (
              <div className="space-y-6">
                <BudgetSummary tripId={id} />
                <BudgetManager tripId={id} canEdit={!!canEdit} />
              </div>
            )}
          </div>
        </div>

        {/* アクティビティフォームモーダル */}
        {showActivityForm && id && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
            <div className="min-h-screen flex justify-center items-center p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full my-8">
                <div className="p-6">
                  <ActivityForm
                    tripId={id}
                    dayNumber={selectedDayNumber}
                    activity={editingActivity}
                    tripMembers={currentTrip?.members}
                    participants={editingActivity ? participants[editingActivity.id] : undefined}
                    transport={editingActivity ? transports[editingActivity.id] : undefined}
                    onSubmit={handleActivitySubmit}
                    onCancel={() => {
                      setShowActivityForm(false);
                      setEditingActivity(null);
                    }}
                    onAddParticipant={
                      editingActivity
                        ? async (memberId) => {
                            await addParticipant(editingActivity.id, memberId);
                          }
                        : undefined
                    }
                    onRemoveParticipant={
                      editingActivity
                        ? async (memberId) => {
                            await removeParticipant(editingActivity.id, memberId);
                          }
                        : undefined
                    }
                    onSetTransport={
                      editingActivity
                        ? async (data) => {
                            await setTransport(editingActivity.id, data);
                          }
                        : undefined
                    }
                    onDeleteTransport={
                      editingActivity
                        ? async () => {
                            await deleteTransport(editingActivity.id);
                          }
                        : undefined
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 一括操作バー */}
        {selectionMode && selectedActivities.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg z-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-700 font-medium">
                  {selectedActivities.size}件選択中
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      const currentDayActivities = activitiesByDay[selectedDayTab]?.map((a) => a.id) || [];
                      setSelectedActivities(new Set(currentDayActivities));
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors text-sm"
                  >
                    すべて選択
                  </Button>
                  <Button
                    onClick={() => setSelectedActivities(new Set())}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors text-sm"
                  >
                    選択解除
                  </Button>
                  <Button
                    onClick={() => handleBatchComplete(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
                  >
                    完了にする
                  </Button>
                  <Button
                    onClick={() => handleBatchComplete(false)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors text-sm"
                  >
                    未完了にする
                  </Button>
                  <Button
                    onClick={handleBatchDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
                  >
                    削除
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 削除確認ダイアログ */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-bold mb-4">旅行プランを削除しますか？</h3>
              <p className="text-gray-600 mb-6">この操作は取り消せません。</p>
              <div className="flex justify-end gap-4">
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:bg-gray-400"
                >
                  {isDeleting ? '削除中...' : '削除'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripDetail;
