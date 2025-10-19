/**
 * プラン案編集ダイアログ - Phase 2.4c
 */

import React, { useState, useEffect } from 'react';
import Button from "../Button";
import type { TripPlanProposal } from '../../types/canvas';

interface ProposalEditDialogProps {
  proposal: TripPlanProposal | null;
  tripStartDate?: string; // 旅行全体の開始日 (ISO 8601)
  tripEndDate?: string; // 旅行全体の終了日 (ISO 8601)
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    color: string;
    proposalDate?: string;
  }) => void;
}

const PRESET_COLORS = [
  { name: 'ブルー', value: '#3B82F6' },
  { name: 'グリーン', value: '#10B981' },
  { name: 'パープル', value: '#A855F7' },
  { name: 'オレンジ', value: '#F97316' },
  { name: 'レッド', value: '#EF4444' },
  { name: 'シアン', value: '#06B6D4' },
  { name: 'ピンク', value: '#EC4899' },
  { name: 'イエロー', value: '#F59E0B' },
];

export const ProposalEditDialog: React.FC<ProposalEditDialogProps> = ({
  proposal,
  tripStartDate,
  tripEndDate,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [proposalDate, setProposalDate] = useState('');

  // 旅行日程内の日付リストを生成
  const availableDates = (): Array<{ date: Date; label: string }> => {
    console.log('availableDates呼び出し:', { tripStartDate, tripEndDate });

    if (!tripStartDate || !tripEndDate) {
      console.log('日程が未設定');
      return [];
    }

    const dates: Array<{ date: Date; label: string }> = [];
    const start = new Date(tripStartDate);
    const end = new Date(tripEndDate);

    console.log('日程範囲:', { start, end });

    let current = new Date(start);
    while (current <= end) {
      const dateObj = new Date(current);
      const label = dateObj.toLocaleDateString('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      dates.push({ date: dateObj, label });
      current.setDate(current.getDate() + 1);
    }

    console.log('生成された日付リスト:', dates);
    return dates;
  };

  useEffect(() => {
    if (proposal) {
      setName(proposal.name);
      setColor(proposal.color);

      if (proposal.proposalDate) {
        const date = new Date(proposal.proposalDate);
        setProposalDate(date.toISOString().split('T')[0]);
      } else {
        setProposalDate('');
      }
    }
  }, [proposal]);

  const handleSave = () => {
    if (!name.trim()) {
      alert('プラン案名を入力してください');
      return;
    }

    // YYYY-MM-DD形式をISO 8601形式に変換
    let proposalDateISO: string | undefined = undefined;
    if (proposalDate) {
      const date = new Date(proposalDate);
      proposalDateISO = date.toISOString();
    }

    console.log('保存データ:', {
      name: name.trim(),
      color,
      proposalDate: proposalDateISO,
    });

    onSave({
      name: name.trim(),
      color,
      proposalDate: proposalDateISO,
    });

    onClose();
  };

  if (!isOpen || !proposal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          プラン案を編集
        </h2>

        <div className="space-y-4">
          {/* プラン案名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プラン案名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 王道観光ルート"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* カラー選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カラー
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_COLORS.map((preset) => (
                <Button
                  key={preset.value}
                  onClick={() => setColor(preset.value)}
                  className={`p-2 rounded-md border-2 transition-all ${
                    color === preset.value
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {color === preset.value && (
                    <span className="text-white text-lg">✓</span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* 日程選択（1日単位） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📅 適用する日付
            </label>
            {availableDates().length > 0 ? (
              <select
                value={proposalDate}
                onChange={(e) => setProposalDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">日付を選択してください</option>
                {availableDates().map(({ date, label }) => (
                  <option key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-500">
                ℹ️ 旅行の日程が設定されていません
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              このプラン案が適用される日を選択してください
            </p>
          </div>

          {/* プレビュー */}
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600 mb-2">プレビュー:</div>
            <div
              className="border-2 rounded-lg p-3"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: color,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-bold">{name || 'プラン案名'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* アクション */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存
          </Button>
        </div>
      </div>
    </div>
  );
};
