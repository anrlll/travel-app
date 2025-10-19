/**
 * プラン案一覧コンポーネント - Phase 2.4c
 */

import React, { useState } from 'react';
import type { TripPlanProposal } from '../../types/canvas';

interface ProposalListProps {
  proposals: TripPlanProposal[];
  selectedProposalId: string | null;
  onSelectProposal: (proposalId: string | null) => void;
  onEditProposal: (proposal: TripPlanProposal) => void;
  onDeleteProposal: (proposalId: string) => void;
  onCompareProposals: () => void;
  onDetectProposals: () => void;
  onSelectOfficialProposal: (proposal: TripPlanProposal) => void;
}

export const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  selectedProposalId,
  onSelectProposal,
  onEditProposal,
  onDeleteProposal,
  onCompareProposals,
  onDetectProposals,
  onSelectOfficialProposal,
}) => {
  const [expandedProposalId, setExpandedProposalId] = useState<string | null>(null);

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '未設定';
    return `¥${amount.toLocaleString()}`;
  };

  const formatDistance = (km: number | undefined) => {
    if (km === undefined || km === null) return '未計算';
    return `${km.toFixed(1)} km`;
  };

  const formatProposalDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">📊 プラン案一覧</h2>
        <div className="flex gap-2">
          <button
            onClick={onDetectProposals}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            🔍 再検出
          </button>
          {proposals.length >= 2 && (
            <button
              onClick={onCompareProposals}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              📊 比較
            </button>
          )}
        </div>
      </div>

      {/* プラン案がない場合 */}
      {proposals.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm mb-4">プラン案が検出されていません</p>
          <button
            onClick={onDetectProposals}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            🔍 プラン案を検出
          </button>
        </div>
      )}

      {/* プラン案リスト */}
      {proposals.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {proposals.map((proposal) => {
            const isSelected = selectedProposalId === proposal.id;
            const isExpanded = expandedProposalId === proposal.id;
            const dateLabel = formatProposalDate(proposal.proposalDate);

            return (
              <div
                key={proposal.id}
                className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: proposal.color,
                }}
                onClick={() => onSelectProposal(isSelected ? null : proposal.id)}
              >
                {/* プラン案ヘッダー */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: proposal.color }}
                    />
                    <h3 className="font-bold text-gray-900">{proposal.name}</h3>
                    {proposal.isOfficial && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        ⭐ 正式
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedProposalId(isExpanded ? null : proposal.id);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>

                {/* サマリー */}
                <div className="space-y-1 text-sm">
                  {dateLabel && (
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                      <span>📅</span>
                      <span>{dateLabel}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>📍</span>
                      <span>{proposal.activityCount || 0}箇所</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>💰</span>
                      <span>{formatCurrency(proposal.totalBudget)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>📏</span>
                      <span>{formatDistance(proposal.totalDistanceKm)}</span>
                    </div>
                  </div>
                </div>

                {/* 詳細（展開時） */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {/* アクション */}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProposal(proposal);
                          }}
                          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          ✏️ 編集
                        </button>
                        {!proposal.isOfficial && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`${proposal.name}を削除しますか?`)) {
                                onDeleteProposal(proposal.id);
                              }
                            }}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      {!proposal.isOfficial && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOfficialProposal(proposal);
                          }}
                          className="w-full px-3 py-2 bg-yellow-500 text-white text-sm font-medium rounded hover:bg-yellow-600"
                        >
                          ⭐ 正式プランに設定
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* フッター統計 */}
      {proposals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>合計プラン案:</span>
              <span className="font-bold">{proposals.length}件</span>
            </div>
            <div className="flex justify-between mt-1">
              <span>正式プラン:</span>
              <span className="font-bold">
                {proposals.filter((p) => p.isOfficial).length}件
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
