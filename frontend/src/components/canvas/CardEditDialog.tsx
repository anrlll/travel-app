/**
 * カード編集ダイアログ
 */

import React, { useState, useEffect } from 'react';
import type { CanvasActivityCard, CreateCardData, ActivityType, BudgetCategory } from '../../types/canvas';
import { activityTypeLabels, budgetCategoryLabels } from '../../types/canvas';

interface CardEditDialogProps {
  isOpen: boolean;
  card?: CanvasActivityCard | null;
  initialPosition?: { x: number; y: number };
  onSave: (data: CreateCardData) => Promise<void>;
  onClose: () => void;
}

export const CardEditDialog: React.FC<CardEditDialogProps> = ({
  isOpen,
  card,
  initialPosition,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<CreateCardData>({
    positionX: initialPosition?.x || 0,
    positionY: initialPosition?.y || 0,
    title: '',
    activityType: 'sightseeing',
    location: '',
    startTime: '',
    endTime: '',
    cost: undefined,
    budgetCategory: undefined,
    memo: '',
    isCollapsed: false,
    isCompleted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // カードデータの初期化
  useEffect(() => {
    if (card) {
      setFormData({
        positionX: card.positionX,
        positionY: card.positionY,
        title: card.title,
        activityType: card.activityType,
        location: card.location || '',
        startTime: card.startTime || '',
        endTime: card.endTime || '',
        cost: card.cost,
        budgetCategory: card.budgetCategory,
        memo: card.memo || '',
        isCollapsed: card.isCollapsed,
        isCompleted: card.isCompleted,
      });
    } else if (initialPosition) {
      setFormData({
        positionX: initialPosition.x,
        positionY: initialPosition.y,
        title: '',
        activityType: 'sightseeing',
        location: '',
        startTime: '',
        endTime: '',
        cost: undefined,
        budgetCategory: undefined,
        memo: '',
        isCollapsed: false,
        isCompleted: false,
      });
    }
  }, [card, initialPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('カードの保存に失敗:', error);
      alert('カードの保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {card ? 'カードを編集' : '新しいカードを作成'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 東京スカイツリー"
              required
            />
          </div>

          {/* アクティビティタイプ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.activityType}
              onChange={(e) =>
                setFormData({ ...formData, activityType: e.target.value as ActivityType })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.entries(activityTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 場所 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">場所</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 東京都墨田区押上"
            />
          </div>

          {/* 時間 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">開始時刻</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">終了時刻</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* コストと予算カテゴリ */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">コスト（円）</label>
              <input
                type="number"
                value={formData.cost || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cost: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">予算カテゴリ</label>
              <select
                value={formData.budgetCategory || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budgetCategory: e.target.value as BudgetCategory || undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択なし</option>
                {Object.entries(budgetCategoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
            <textarea
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="詳細情報やメモを入力..."
            />
          </div>

          {/* チェックボックス */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isCompleted}
                onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">完了済み</span>
            </label>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
