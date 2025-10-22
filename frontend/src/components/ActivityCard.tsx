import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Activity, ActivityParticipant, ActivityTransport } from '../types/activity';
import {
  activityCategoryLabels,
  activityCategoryColors,
  activityCategoryIcons,
} from '../types/activity';
import Button from './Button';
import Tooltip from './Tooltip';

interface ActivityCardProps {
  activity: Activity;
  canEdit: boolean;
  participants?: ActivityParticipant[];
  transport?: ActivityTransport | null;
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  onToggleComplete: (activityId: string) => void;
  // 順序変更用
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: (activityId: string) => void;
  onMoveDown?: (activityId: string) => void;
  // 日移動用
  availableDays?: number[];
  onMoveToDay?: (activityId: string, dayNumber: number) => void;
}

function ActivityCard({
  activity,
  canEdit,
  participants,
  transport,
  onEdit,
  onDelete,
  onToggleComplete,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  availableDays,
  onMoveToDay,
}: ActivityCardProps) {
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
        <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
          {/* 順序変更ボタン - キャンバス作成の場合は無効化 */}
          {(onMoveUp || onMoveDown) && (
            <div className="flex gap-2">
              <Tooltip
                content="このアクティビティはキャンバスモードで作成されたため、順序の入れ替えと日程変更はできません。"
                disabled={!activity.isFromCanvas || isFirst}
                position="top"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMoveUp?.(activity.id)}
                  disabled={isFirst || activity.isFromCanvas}
                >
                  ↑
                </Button>
              </Tooltip>
              <Tooltip
                content="このアクティビティはキャンバスモードで作成されたため、順序の入れ替えと日程変更はできません。"
                disabled={!activity.isFromCanvas || isLast}
                position="top"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMoveDown?.(activity.id)}
                  disabled={isLast || activity.isFromCanvas}
                >
                  ↓
                </Button>
              </Tooltip>
              {/* 日移動ドロップダウン - キャンバス作成の場合は無効化 */}
              {onMoveToDay && availableDays && availableDays.length > 1 && (
                <Tooltip
                  content="このアクティビティはキャンバスモードで作成されたため、順序の入れ替えと日程変更はできません。"
                  disabled={!activity.isFromCanvas}
                  position="top"
                >
                  <select
                    value={activity.dayNumber}
                    onChange={(e) => {
                      const newDay = parseInt(e.target.value);
                      if (newDay !== activity.dayNumber) {
                        onMoveToDay(activity.id, newDay);
                      }
                    }}
                    disabled={activity.isFromCanvas}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {availableDays.map((day) => (
                      <option key={day} value={day}>
                        {day === activity.dayNumber ? `Day ${day} (現在)` : `Day ${day}に移動`}
                      </option>
                    ))}
                  </select>
                </Tooltip>
              )}
            </div>
          )}

          {/* 編集・削除ボタン */}
          <div className="flex justify-end gap-1">
            <Button
              variant="primary"
              size="xs"
              onClick={() => onEdit(activity)}
            >
              編集
            </Button>
            <Button
              variant="danger"
              size="xs"
              onClick={() => {
                if (window.confirm('このアクティビティを削除しますか?')) {
                  onDelete(activity.id);
                }
              }}
            >
              削除
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityCard;
