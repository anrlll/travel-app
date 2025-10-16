import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Activity } from '../types/activity';
import {
  activityCategoryLabels,
  activityCategoryColors,
  activityCategoryIcons,
} from '../types/activity';

interface ActivityCardProps {
  activity: Activity;
  canEdit: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onToggleComplete: (activityId: string) => void;
}

function ActivityCard({ activity, canEdit, onEdit, onDelete, onToggleComplete }: ActivityCardProps) {
  // 時間フォーマット
  const formatTime = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), 'HH:mm', { locale: ja });
    } catch {
      return null;
    }
  };

  const startTime = formatTime(activity.startTime);
  const endTime = formatTime(activity.endTime);

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 transition-all ${
        activity.isCompleted ? 'border-green-500 opacity-75' : 'border-blue-500'
      }`}
    >
      {/* ヘッダー: チェックボックスとタイトル */}
      <div className="flex items-start gap-3 mb-3">
        <input
          type="checkbox"
          checked={activity.isCompleted}
          onChange={() => onToggleComplete(activity.id)}
          className="mt-1 w-5 h-5 cursor-pointer"
        />
        <div className="flex-1">
          <h4
            className={`text-lg font-semibold ${
              activity.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {activity.title}
          </h4>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            activityCategoryColors[activity.category]
          }`}
        >
          {activityCategoryIcons[activity.category]} {activityCategoryLabels[activity.category]}
        </span>
      </div>

      {/* 時間 */}
      {(startTime || endTime) && (
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {startTime && endTime
              ? `${startTime} 〜 ${endTime}`
              : startTime
              ? `${startTime} 〜`
              : `〜 ${endTime}`}
          </span>
        </div>
      )}

      {/* 場所 */}
      {activity.location && (
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{activity.location}</span>
        </div>
      )}

      {/* 説明 */}
      {activity.description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{activity.description}</p>
      )}

      {/* 予算 */}
      {activity.estimatedCost !== undefined && activity.estimatedCost !== null && (
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>予算: ¥{activity.estimatedCost.toLocaleString()}</span>
          {activity.actualCost !== undefined && activity.actualCost !== null && (
            <span className="ml-2">（実費: ¥{activity.actualCost.toLocaleString()}）</span>
          )}
        </div>
      )}

      {/* アクションボタン */}
      {canEdit && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
          <button
            onClick={() => onEdit(activity)}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            編集
          </button>
          <button
            onClick={() => {
              if (window.confirm('このアクティビティを削除しますか?')) {
                onDelete(activity.id);
              }
            }}
            className="flex-1 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}

export default ActivityCard;
