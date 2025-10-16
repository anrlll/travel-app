import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Activity, CreateActivityData, ActivityCategory } from '../types/activity';
import { activityCategoryLabels } from '../types/activity';

// フォームバリデーションスキーマ
const activityFormSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  category: z.enum(['sightseeing', 'restaurant', 'accommodation', 'transport', 'other'], {
    message: 'カテゴリを選択してください',
  }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().max(500, '場所は500文字以内で入力してください').optional(),
  estimatedCost: z.string().optional(),
  description: z.string().max(2000, '説明は2000文字以内で入力してください').optional(),
  notes: z.string().max(5000, 'メモは5000文字以内で入力してください').optional(),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  tripId: string;
  dayNumber: number;
  activity?: Activity | null;
  onSubmit: (data: CreateActivityData) => Promise<void>;
  onCancel: () => void;
}

function ActivityForm({ tripId, dayNumber, activity, onSubmit, onCancel }: ActivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: '',
      category: 'sightseeing',
      startTime: '',
      endTime: '',
      location: '',
      estimatedCost: '',
      description: '',
      notes: '',
    },
  });

  // 編集モードの場合、既存データをフォームにセット
  useEffect(() => {
    if (activity) {
      // ISO形式の日時を datetime-local 形式に変換
      const formatDateTimeLocal = (isoString?: string) => {
        if (!isoString) return '';
        try {
          const date = new Date(isoString);
          // YYYY-MM-DDTHH:mm 形式に変換
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return '';
        }
      };

      reset({
        title: activity.title,
        category: activity.category,
        startTime: formatDateTimeLocal(activity.startTime),
        endTime: formatDateTimeLocal(activity.endTime),
        location: activity.location || '',
        estimatedCost: activity.estimatedCost?.toString() || '',
        description: activity.description || '',
        notes: activity.notes || '',
      });
    }
  }, [activity, reset]);

  // フォーム送信処理
  const handleFormSubmit = async (data: ActivityFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // データ整形
      const submitData: CreateActivityData = {
        dayNumber,
        title: data.title,
        category: data.category as ActivityCategory,
        startTime: data.startTime ? new Date(data.startTime).toISOString() : undefined,
        endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
        location: data.location || undefined,
        estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : undefined,
        description: data.description || undefined,
        notes: data.notes || undefined,
      };

      await onSubmit(submitData);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'アクティビティの保存に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        {activity ? 'アクティビティを編集' : `Day ${dayNumber} - アクティビティを追加`}
      </h3>

      {/* エラー表示 */}
      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        {/* タイトル */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title')}
            type="text"
            id="title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 清水寺を観光"
          />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>

        {/* カテゴリ */}
        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            カテゴリ <span className="text-red-500">*</span>
          </label>
          <select
            {...register('category')}
            id="category"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(activityCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
        </div>

        {/* 時間 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              開始時刻
            </label>
            <input
              {...register('startTime')}
              type="datetime-local"
              id="startTime"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.startTime && (
              <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
              終了時刻
            </label>
            <input
              {...register('endTime')}
              type="datetime-local"
              id="endTime"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
          </div>
        </div>

        {/* 場所 */}
        <div className="mb-4">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            場所
          </label>
          <input
            {...register('location')}
            type="text"
            id="location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 清水寺"
          />
          {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
        </div>

        {/* 予算見積もり */}
        <div className="mb-4">
          <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-2">
            予算見積もり（円）
          </label>
          <input
            {...register('estimatedCost')}
            type="number"
            id="estimatedCost"
            min="0"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例: 1000"
          />
          {errors.estimatedCost && (
            <p className="text-red-500 text-sm mt-1">{errors.estimatedCost.message}</p>
          )}
        </div>

        {/* 説明 */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            説明
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="アクティビティの詳細を記入してください"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* メモ */}
        <div className="mb-4">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            メモ
          </label>
          <textarea
            {...register('notes')}
            id="notes"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="注意事項や持ち物など"
          />
          {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-gray-400"
          >
            {isSubmitting ? '保存中...' : activity ? '更新' : '追加'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ActivityForm;
