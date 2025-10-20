/**
 * キャンバス上のアクティビティカードコンポーネント
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import Button from '../Button';
import type { CanvasActivityCard } from '../../types/canvas';
import { activityTypeIcons } from '../../types/canvas';

interface ActivityCardNodeData {
  card: CanvasActivityCard;
  onEdit: (card: CanvasActivityCard) => void;
  onDelete: (cardId: string) => void;
  proposalBadges?: Array<{ name: string; color: string }>; // プラン案バッジ
}

export const ActivityCardNode: React.FC<NodeProps<ActivityCardNodeData>> = ({ data }) => {
  const { card, onEdit, onDelete, proposalBadges } = data;

  // アクティビティタイプに応じた色
  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      sightseeing: 'bg-blue-100 border-blue-400',
      restaurant: 'bg-orange-100 border-orange-400',
      accommodation: 'bg-purple-100 border-purple-400',
      transport: 'bg-green-100 border-green-400',
      other: 'bg-gray-100 border-gray-400',
    };
    return colors[type] || colors.other;
  };

  // コスト表示のフォーマット
  const formatCost = (cost?: number) => {
    if (!cost) return null;
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(cost);
  };

  return (
    <div
      className={`min-w-[250px] max-w-[300px] rounded-lg border-2 shadow-md bg-white ${getActivityColor(
        card.activityType
      )} ${card.isCompleted ? 'opacity-60' : ''}`}
    >
      {/* 接続ハンドル（上） */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-gray-400"
      />

      {/* カードヘッダー */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{activityTypeIcons[card.activityType]}</span>
          {card.isCompleted && <span className="text-green-600">✓</span>}
          {/* プラン案バッジ */}
          {proposalBadges && proposalBadges.length > 0 && (
            <div className="flex gap-1">
              {proposalBadges.map((badge) => (
                <span
                  key={badge.name}
                  style={{ backgroundColor: badge.color }}
                  className="text-xs px-1.5 py-0.5 rounded text-white font-bold shadow-sm"
                  title={`プラン案${badge.name}`}
                >
                  {badge.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="編集"
          >
            ✏️
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('このカードを削除しますか？')) {
                onDelete(card.id);
              }
            }}
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            title="削除"
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* カードコンテンツ */}
      <div className="px-3 py-2">
        {/* タイトル */}
        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{card.title}</h3>

        {/* 場所 */}
        {card.location && (
          <div className="text-xs text-gray-600 mb-1 flex items-start gap-1">
            <span>📍</span>
            <span className="line-clamp-1">{card.location}</span>
          </div>
        )}

        {/* 時間 */}
        {(card.startTime || card.endTime) && (
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <span>🕐</span>
            <span>
              {card.startTime || '??:??'} - {card.endTime || '??:??'}
            </span>
          </div>
        )}

        {/* コスト */}
        {card.cost !== undefined && card.cost !== null && (
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <span>💰</span>
            <span className="font-semibold">{formatCost(card.cost)}</span>
          </div>
        )}

        {/* 参加者 */}
        {card.participants && card.participants.length > 0 && (
          <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
            <span>👥</span>
            <span>{card.participants.length}人</span>
          </div>
        )}

        {/* メモ */}
        {card.memo && (
          <div className="mt-2 text-xs text-gray-500 italic line-clamp-2 border-t pt-1">
            {card.memo}
          </div>
        )}
      </div>

      {/* 接続ハンドル（下） */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400"
      />
    </div>
  );
};
