/**
 * 正式プラン選択ダイアログ - Phase 2.4c-4
 * キャンバスプラン案を正式プランとして設定するための確認ダイアログ
 */

import React from 'react';
import Button from "../Button";
import type { TripPlanProposal } from '../../types/canvas';

interface OfficialPlanSelectionDialogProps {
  proposal: TripPlanProposal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onEditDates: () => void;
}

export const OfficialPlanSelectionDialog: React.FC<OfficialPlanSelectionDialogProps> = ({
  proposal,
  isOpen,
  onClose,
  onConfirm,
  onEditDates,
}) => {
  if (!isOpen || !proposal) return null;

  const hasSchedule = !!proposal.proposalDate;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '未設定';
    return `¥${amount.toLocaleString()}`;
  };

  const formatDistance = (km: number | undefined) => {
    if (km === undefined || km === null) return '未計算';
    return `${km.toFixed(1)} km`;
  };

  const formatProposalDate = () => {
    if (!proposal.proposalDate) return null;
    const date = new Date(proposal.proposalDate);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const proposalDateLabel = formatProposalDate();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: proposal.color }}
              />
              <h2 className="text-xl font-bold text-gray-900">{proposal.name}</h2>
            </div>
            <Button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">このプラン案を正式プランとして設定します</p>
        </div>

        {/* 内容 */}
        <div className="px-6 py-4 space-y-4">
          {/* 日程チェック */}
          {!hasSchedule && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-bold text-red-900 mb-1">日付が設定されていません</h3>
                  <p className="text-sm text-red-700 mb-3">
                    正式プランに設定するには、適用する日付を設定する必要があります。
                  </p>
                  <Button
                    onClick={onEditDates}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    編集して日付を設定
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 変換内容プレビュー */}
          {hasSchedule && (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-3">📋 変換内容プレビュー</h3>
                <div className="space-y-2 text-sm">
                  {proposalDateLabel && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">📅 適用日:</span>
                      <span className="font-medium text-gray-900">{proposalDateLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-700">📍 訪問箇所:</span>
                    <span className="font-medium text-gray-900">{proposal.activityCount || 0}箇所</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">💰 総予算:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(proposal.totalBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">📏 総移動距離:</span>
                    <span className="font-medium text-gray-900">{formatDistance(proposal.totalDistanceKm)}</span>
                  </div>
                </div>
              </div>

              {/* 警告 */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-900 mb-1">ご注意ください</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 既存の正式プランは下書きに変更されます</li>
                      <li>• キャンバスデータが従来型のプラン構造に変換されます</li>
                      <li>• アクティビティカードが旅程として登録されます</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* アクション */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </Button>
          {hasSchedule && (
            <Button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              ⭐ 正式プランに設定
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
