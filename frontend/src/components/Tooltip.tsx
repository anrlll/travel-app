import { ReactNode, useState } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: TooltipPosition;
  disabled?: boolean; // trueの場合、ツールチップを表示しない
}

// ポジションごとのスタイル
const positionStyles: Record<TooltipPosition, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

// 矢印のスタイル（オプション - 将来的に実装可能）
// const arrowStyles: Record<TooltipPosition, string> = {
//   top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900',
//   bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900',
//   left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900',
//   right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900',
// };

/**
 * ツールチップコンポーネント
 *
 * @param content - ツールチップに表示する文字列
 * @param children - ツールチップを表示するトリガー要素
 * @param position - ツールチップの表示位置（デフォルト: 'top'）
 * @param disabled - trueの場合、ツールチップを表示しない
 */
function Tooltip({
  content,
  children,
  position = 'top',
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  // disabled=trueの場合、ツールチップ機能なしで子要素のみをレンダリング
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {/* トリガー要素 */}
      {children}

      {/* ツールチップ */}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap transition-opacity duration-200 ${positionStyles[position]}`}
          role="tooltip"
          aria-hidden={!isVisible}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
