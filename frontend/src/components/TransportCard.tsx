import type { ActivityTransport, Activity } from '../types/activity';
import { transportTypeLabels, transportTypeIcons } from '../types/activity';

interface TransportCardProps {
  transport: ActivityTransport;
  fromActivity?: Activity; // 出発アクティビティ（オプション）
  toActivity: Activity;    // 到着アクティビティ
}

/**
 * アクティビティ間の移動情報を表示するカード
 * アクティビティカードの間に挿入して、タイムライン的な表示を実現
 */
function TransportCard({ transport, fromActivity, toActivity }: TransportCardProps) {
  // デバッグ用ログ
  console.log('🚗 TransportCard:', {
    transportType: transport.transportType,
    availableTypes: Object.keys(transportTypeLabels),
    hasLabel: !!transportTypeLabels[transport.transportType],
    hasIcon: !!transportTypeIcons[transport.transportType],
    fullTransport: transport,
  });

  return (
    <div className="flex justify-center my-3">
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 inline-flex items-center gap-3 text-sm">
        {/* 矢印アイコン */}
        <div className="flex flex-col items-center text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {/* 移動手段 */}
        <div className="flex items-center gap-2">
          <span className="text-lg">{transportTypeIcons[transport.transportType] || '🚀'}</span>
          <span className="font-medium text-gray-700">
            {transportTypeLabels[transport.transportType] || transport.transportType || 'その他'}
          </span>
        </div>

        {/* 移動時間 */}
        {transport.durationMinutes && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{transport.durationMinutes}分</span>
          </>
        )}

        {/* 移動距離 */}
        {transport.distanceKm && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{Number(transport.distanceKm)}km</span>
          </>
        )}

        {/* 費用 */}
        {transport.cost && Number(transport.cost) > 0 && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">¥{Number(transport.cost).toLocaleString()}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default TransportCard;
