/**
 * プラン案一覧コンポーネント - Phase 2.4c
 */

import React, { useState } from 'react';
import Button from '../Button';
import type { TripPlanProposal } from '../../types/canvas';

interface ProposalListProps {
  proposals: TripPlanProposal[];
  selectedProposalId: string | null;
  onSelectProposal: (proposalId: string | null) => void;
  onEditProposal: (proposal: TripPlanProposal) => void;
  onUpdateProposalName: (proposal: TripPlanProposal) => void;
  onDeleteProposal: (proposalId: string) => void;
  onCompareProposals: () => void;
  onDetectProposals: () => void;
  onSelectOfficialProposal: (proposal: TripPlanProposal) => void;
  onUnselectOfficialProposal: (proposal: TripPlanProposal) => void;
  onUpdateProposalDate: (proposalId: string, proposalDate: string) => void;
  tripStartDate?: string;
  tripEndDate?: string;
}

export const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  selectedProposalId,
  onSelectProposal,
  onEditProposal,
  onUpdateProposalName,
  onDeleteProposal,
  onCompareProposals,
  onDetectProposals,
  onSelectOfficialProposal,
  onUnselectOfficialProposal,
  onUpdateProposalDate,
  tripStartDate,
  tripEndDate,
}) => {
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);
  const [editingProposalName, setEditingProposalName] = useState<string>('');

  // 利用可能な日程リストを生成
  const getAvailableDates = (): Array<{ value: string; label: string }> => {
    if (!tripStartDate || !tripEndDate) {
      return [];
    }

    const dates: Array<{ value: string; label: string }> = [];
    const start = new Date(tripStartDate);
    const end = new Date(tripEndDate);

    let current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = current.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      dates.push({ value: dateStr, label });
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const availableDates = getAvailableDates();

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
          <Button
            onClick={onDetectProposals}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            🔍 再検出
          </Button>
          {proposals.length >= 2 && (
            <Button
              onClick={onCompareProposals}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
            >
              📊 比較
            </Button>
          )}
        </div>
      </div>

      {/* プラン案がない場合 */}
      {proposals.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm mb-4">プラン案が検出されていません</p>
          <Button
            onClick={onDetectProposals}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            🔍 プラン案を検出
          </Button>
        </div>
      )}

      {/* プラン案リスト */}
      {proposals.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {/* プラン案をソート: 正式プランを最上位に、その次に日程昇順で並び替え */}
          {[...proposals]
            .sort((a, b) => {
              // 1. 正式プランを優先（最上部に表示）
              if (a.isOfficial !== b.isOfficial) {
                return a.isOfficial ? -1 : 1; // isOfficial が true のものを上に
              }

              // 2. 日程が設定されている場合、昇順でソート
              const dateA = a.proposalDate ? new Date(a.proposalDate).getTime() : Number.MAX_VALUE;
              const dateB = b.proposalDate ? new Date(b.proposalDate).getTime() : Number.MAX_VALUE;

              return dateA - dateB; // 日付が早い順
            })
            .map((proposal) => {
            const isSelected = selectedProposalId === proposal.id;
            const isEditing = editingProposalId === proposal.id;
            const dateLabel = formatProposalDate(proposal.proposalDate);

            return (
              <div
                key={proposal.id}
                className={`border-2 rounded-lg p-3 transition-all ${
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
                    {isEditing ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingProposalName}
                        onChange={(e) => setEditingProposalName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingProposalName !== proposal.name && editingProposalName.trim()) {
                              onUpdateProposalName({
                                ...proposal,
                                name: editingProposalName,
                              });
                            }
                            setEditingProposalId(null);
                          } else if (e.key === 'Escape') {
                            setEditingProposalId(null);
                          }
                        }}
                        onBlur={() => {
                          if (editingProposalName !== proposal.name && editingProposalName.trim()) {
                            onUpdateProposalName({
                              ...proposal,
                              name: editingProposalName,
                            });
                          }
                          setEditingProposalId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 border border-blue-500 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    ) : (
                      <h3
                        className="font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingProposalId(proposal.id);
                          setEditingProposalName(proposal.name);
                        }}
                      >
                        {proposal.name}
                      </h3>
                    )}
                    {proposal.isOfficial && (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        ⭐ 正式
                      </span>
                    )}
                  </div>
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

                {/* 詳細情報 */}
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                    {/* 日程選択 */}
                    <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        日程:
                      </label>
                      <select
                        value={proposal.proposalDate || ''}
                        onChange={(e) => {
                          onUpdateProposalDate(proposal.id, e.target.value);
                        }}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={availableDates.length === 0 || proposal.isOfficial}
                      >
                        <option value="">日程を選択</option>
                        {availableDates.map((date) => (
                          <option key={date.value} value={date.value}>
                            {date.label}
                          </option>
                        ))}
                      </select>
                      {availableDates.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          旅行プランの日程を設定してください
                        </p>
                      )}
                      {proposal.isOfficial && (
                        <p className="text-xs text-gray-500 mt-1">
                          正式プランの日程を変更するには、まず正式プランを解除してください
                        </p>
                      )}
                    </div>

                    {/* アクション */}
                    <div className="flex flex-col gap-2 pt-2">
                      {/* 削除ボタン */}
                      {!proposal.isOfficial && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`${proposal.name}を削除しますか?`)) {
                              onDeleteProposal(proposal.id);
                            }
                          }}
                          className="w-full px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          🗑️ 削除
                        </Button>
                      )}
                      {/* 正式プラン設定/解除ボタン */}
                      {!proposal.isOfficial ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOfficialProposal(proposal);
                          }}
                          disabled={!proposal.proposalDate}
                          className={`w-full px-3 py-2 text-sm font-medium rounded ${
                            proposal.proposalDate
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          title={
                            proposal.proposalDate
                              ? '正式プランに設定'
                              : '日程を選択してください'
                          }
                        >
                          ⭐ 正式プランに設定
                        </Button>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnselectOfficialProposal(proposal);
                          }}
                          className="w-full px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700"
                          title="正式プランを解除"
                        >
                          ⭕ 正式プランを解除
                        </Button>
                      )}
                    </div>
                </div>
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
