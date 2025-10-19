/**
 * プラン案比較コンポーネント - Phase 2.4c
 */

import React from 'react';
import Button from "../Button";
import type { TripPlanProposal } from '../../types/canvas';

interface ProposalComparisonProps {
  proposals: TripPlanProposal[];
  isOpen: boolean;
  onClose: () => void;
}

export const ProposalComparison: React.FC<ProposalComparisonProps> = ({
  proposals,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return `¥${amount.toLocaleString()}`;
  };

  const formatDistance = (km: number | undefined) => {
    if (km === undefined || km === null) return '-';
    return `${km.toFixed(1)} km`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 最小・最大値の検出（ハイライト用）
  const budgets = proposals.map((p) => p.totalBudget || 0).filter((b) => b > 0);
  const distances = proposals.map((p) => p.totalDistanceKm || 0).filter((d) => d > 0);
  const counts = proposals.map((p) => p.activityCount || 0);

  const minBudget = Math.min(...budgets);
  const maxBudget = Math.max(...budgets);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const minCount = Math.min(...counts);
  const maxCount = Math.max(...counts);

  const getHighlightClass = (value: number | undefined, min: number, max: number) => {
    if (value === undefined || value === null || value === 0) return '';
    if (value === min) return 'bg-green-100 font-bold';
    if (value === max) return 'bg-red-100 font-bold';
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">📊 プラン案比較</h2>
          <Button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </Button>
        </div>

        {/* 比較テーブル */}
        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 bg-gray-50 font-bold text-gray-700">
                    項目
                  </th>
                  {proposals.map((proposal) => (
                    <th
                      key={proposal.id}
                      className="text-center py-3 px-4 bg-gray-50"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: proposal.color }}
                          />
                          <span className="font-bold">{proposal.name}</span>
                          {proposal.isOfficial && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              ⭐
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 日程 */}
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium text-gray-700">📅 適用日</td>
                  {proposals.map((proposal) => (
                    <td key={proposal.id} className="py-3 px-4 text-center">
                      {proposal.proposalDate ? formatDate(proposal.proposalDate) : '未設定'}
                    </td>
                  ))}
                </tr>

                {/* アクティビティ数 */}
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium text-gray-700">📍 訪問箇所</td>
                  {proposals.map((proposal) => (
                    <td
                      key={proposal.id}
                      className={`py-3 px-4 text-center ${getHighlightClass(
                        proposal.activityCount,
                        minCount,
                        maxCount
                      )}`}
                    >
                      {proposal.activityCount || 0}箇所
                    </td>
                  ))}
                </tr>

                {/* 総予算 */}
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium text-gray-700">💰 総予算</td>
                  {proposals.map((proposal) => (
                    <td
                      key={proposal.id}
                      className={`py-3 px-4 text-center ${getHighlightClass(
                        proposal.totalBudget,
                        minBudget,
                        maxBudget
                      )}`}
                    >
                      {formatCurrency(proposal.totalBudget)}
                    </td>
                  ))}
                </tr>

                {/* 総移動距離 */}
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 font-medium text-gray-700">📏 総移動距離</td>
                  {proposals.map((proposal) => (
                    <td
                      key={proposal.id}
                      className={`py-3 px-4 text-center ${getHighlightClass(
                        proposal.totalDistanceKm,
                        minDistance,
                        maxDistance
                      )}`}
                    >
                      {formatDistance(proposal.totalDistanceKm)}
                    </td>
                  ))}
                </tr>

              </tbody>
            </table>
          </div>

          {/* 凡例 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-2">💡 ハイライト凡例:</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
                  <span>最小値（最安・最短）</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
                  <span>最大値（最高・最長）</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <Button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};
