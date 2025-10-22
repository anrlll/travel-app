import React from 'react';
import Button from './Button';
import type { TripMember } from '../types/trip';

interface MemberListProps {
  members: TripMember[];
  currentUserRole?: string;
  onDeleteMember: (memberId: string) => Promise<void>;
  onChangeRole: (memberId: string, newRole: string) => Promise<void>;
}

// 役割の日本語ラベル
const roleLabels: Record<string, string> = {
  owner: 'オーナー',
  editor: 'エディター',
  viewer: 'ビューアー',
  member: 'メンバー',
};

export default function MemberList({
  members,
  currentUserRole,
  onDeleteMember,
  onChangeRole,
}: MemberListProps) {
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // ownerのみが操作可能
  const canManage = currentUserRole === 'owner';

  const handleDeleteClick = async (memberId: string) => {
    if (isDeleting) return;
    setIsDeleting(memberId);
    setError(null);

    try {
      await onDeleteMember(memberId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メンバー削除に失敗しました');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!canManage) return;
    setError(null);

    try {
      await onChangeRole(memberId, newRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : '役割変更に失敗しました');
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        メンバーがいません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-semibold text-gray-700">名前</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">役割</th>
              <th className="text-left py-2 px-3 font-semibold text-gray-700">参加日時</th>
              {canManage && <th className="text-left py-2 px-3 font-semibold text-gray-700">操作</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {member.user?.displayName || member.guestName || '不明'}
                    </div>
                    {member.user?.email && (
                      <div className="text-gray-500 text-xs">{member.user.email}</div>
                    )}
                    {member.guestEmail && (
                      <div className="text-gray-500 text-xs">{member.guestEmail}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3">
                  {canManage ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isDeleting === member.id}
                    >
                      <option value="owner">オーナー</option>
                      <option value="editor">エディター</option>
                      <option value="viewer">ビューアー</option>
                    </select>
                  ) : (
                    <span className="text-gray-700">{roleLabels[member.role] || member.role}</span>
                  )}
                </td>
                <td className="py-3 px-3 text-gray-600">
                  {new Date(member.joinedAt).toLocaleDateString('ja-JP')}
                </td>
                {canManage && (
                  <td className="py-3 px-3">
                    <Button
                      type="button"
                      onClick={() => handleDeleteClick(member.id)}
                      disabled={isDeleting === member.id}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 text-sm"
                    >
                      {isDeleting === member.id ? '削除中...' : '削除'}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
