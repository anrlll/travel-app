import { forwardRef, TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

const baseClassName =
  'w-full px-3 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-h-[120px] resize-y leading-relaxed';

/**
 * 再利用可能なテキストエリア。フォームでの説明やメモに最適化。
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || undefined;
    const describedBy = [hint ? `${inputId}-hint` : undefined, error ? `${inputId}-error` : undefined]
      .filter(Boolean)
      .join(' ');

    return (
      <div>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={`${baseClassName} ${className}`.trim()}
          {...props}
        />
        {hint && (
          <p id={`${inputId}-hint`} className="text-xs text-gray-500 mt-1">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-red-500 text-sm mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;


