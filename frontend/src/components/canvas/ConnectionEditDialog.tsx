/**
 * 接続線編集ダイアログ - Phase 2.4: 接続線編集機能
 */

import React, { useState, useEffect } from 'react';
import type { CardConnection } from '../../types/canvas';
import { transportTypeLabels, transportTypeIcons } from '../../types/canvas';

interface ConnectionEditDialogProps {
  connection: CardConnection | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConnectionUpdateData) => Promise<void>;
}

export interface ConnectionUpdateData {
  transportType?: string;
  durationMinutes?: number;
  distanceKm?: number;
  cost?: number;
}

export const ConnectionEditDialog: React.FC<ConnectionEditDialogProps> = ({
  connection,
  isOpen,
  onClose,
  onSave,
}) => {
  const [transportType, setTransportType] = useState<string>('walk');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // 接続情報が変更されたらフォームを更新
  useEffect(() => {
    if (connection) {
      setTransportType(connection.transportType || 'walk');
      setDurationMinutes(connection.durationMinutes?.toString() || '');
      setDistanceKm(connection.distanceKm?.toString() || '');
      setCost(connection.cost?.toString() || '');
    }
  }, [connection]);

  const handleSave = async () => {
    if (!connection) return;

    setIsSaving(true);
    try {
      const data: ConnectionUpdateData = {
        transportType,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
        distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
        cost: cost ? parseFloat(cost) : undefined,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error('接続線の更新エラー:', error);
      // エラーの詳細ログを出力
      if (error instanceof Error) {
        console.error('エラーメッセージ:', error.message);
        if ('response' in error) {
          console.error('レスポンスデータ:', (error as any).response?.data);
        }
      }
      alert('接続線の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // フォームをリセット
    if (connection) {
      setTransportType(connection.transportType || 'walk');
      setDurationMinutes(connection.durationMinutes?.toString() || '');
      setDistanceKm(connection.distanceKm?.toString() || '');
      setCost(connection.cost?.toString() || '');
    }
    onClose();
  };

  if (!isOpen || !connection) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">移動情報を編集</h2>
        </div>

        {/* フォーム */}
        <div className="px-6 py-4 space-y-4">
          {/* 移動手段 */}
          <div>
            <label htmlFor="transportType" className="block text-sm font-medium text-gray-700 mb-2">
              移動手段
            </label>
            <select
              id="transportType"
              value={transportType}
              onChange={(e) => setTransportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(transportTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {transportTypeIcons[value as keyof typeof transportTypeIcons]} {label}
                </option>
              ))}
            </select>
          </div>

          {/* 所要時間 */}
          <div>
            <label htmlFor="durationMinutes" className="block text-sm font-medium text-gray-700 mb-2">
              所要時間（分）
            </label>
            <input
              type="number"
              id="durationMinutes"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="30"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 距離 */}
          <div>
            <label htmlFor="distanceKm" className="block text-sm font-medium text-gray-700 mb-2">
              距離（km）
            </label>
            <input
              type="number"
              id="distanceKm"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="5.2"
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 費用 */}
          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
              費用（円）
            </label>
            <input
              type="number"
              id="cost"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="500"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};
