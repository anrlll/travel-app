/**
 * カード間の接続線コンポーネント
 */

import React from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath } from '@xyflow/react';
import type { CardConnection } from '../../types/canvas';
import { transportTypeIcons } from '../../types/canvas';

interface ConnectionEdgeData {
  connection: CardConnection;
  onEdit?: (connection: CardConnection) => void;
  onDelete?: (connectionId: string) => void;
}

export const ConnectionEdge: React.FC<EdgeProps<ConnectionEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const { connection, onEdit, onDelete } = data || {};

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // 移動手段に応じた色
  const getTransportColor = (type?: string) => {
    const colors: Record<string, string> = {
      walk: '#10B981', // green
      car: '#3B82F6', // blue
      train: '#8B5CF6', // purple
      bus: '#F59E0B', // yellow
      plane: '#EF4444', // red
      other: '#6B7280', // gray
    };
    return colors[type || 'other'];
  };

  const strokeColor = connection ? getTransportColor(connection.transportType) : '#6B7280';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: 2,
        }}
      />

      {/* 接続情報のラベル */}
      {connection && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="bg-white rounded-md shadow-md border border-gray-200 px-2 py-1 text-xs flex items-center gap-2">
              {/* 移動手段アイコン */}
              {connection.transportType && (
                <span className="text-base">
                  {transportTypeIcons[connection.transportType]}
                </span>
              )}

              {/* 所要時間 */}
              {connection.durationMinutes && (
                <span className="text-gray-700">
                  {connection.durationMinutes}分
                </span>
              )}

              {/* 距離 */}
              {connection.distanceKm && (
                <span className="text-gray-500">
                  {connection.distanceKm.toFixed(1)}km
                </span>
              )}

              {/* コスト */}
              {connection.cost && (
                <span className="text-gray-700 font-semibold">
                  ¥{connection.cost.toLocaleString()}
                </span>
              )}

              {/* 編集・削除ボタン */}
              <div className="flex gap-1 border-l pl-2">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(connection);
                    }}
                    className="text-gray-500 hover:text-blue-600"
                    title="編集"
                  >
                    ✏️
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('この接続を削除しますか？')) {
                        onDelete(connection.id);
                      }
                    }}
                    className="text-gray-500 hover:text-red-600"
                    title="削除"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
