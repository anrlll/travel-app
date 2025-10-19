import { ButtonHTMLAttributes, ReactNode } from 'react';

// ボタンのバリアント（色・スタイル）
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';

// ボタンのサイズ
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  fullWidth?: boolean;
}

// バリアントごとのスタイル
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  outline: 'bg-transparent border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
};

// サイズごとのスタイル
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1.5 text-xs rounded',
  sm: 'px-3 py-2 text-sm rounded-md',
  md: 'px-4 py-2 text-base rounded-md',
  lg: 'px-6 py-3 text-lg rounded-lg',
};

function Button({
  variant,
  size,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // variant と size が指定されている場合のみ、プリセットスタイルを適用
  const usePresetStyles = variant !== undefined || size !== undefined;

  const baseStyles = usePresetStyles
    ? 'font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
    : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const widthStyles = fullWidth ? 'w-full' : '';

  const combinedClassName = [
    baseStyles,
    variant ? variantStyles[variant] : '',
    size ? sizeStyles[size] : '',
    widthStyles,
    disabledStyles,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={combinedClassName}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
