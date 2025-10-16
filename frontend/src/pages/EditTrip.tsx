import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTripStore } from '../stores/tripStore';
import Header from '../components/Header';
import Textarea from '../components/Textarea';
import type { UpdateTripData } from '../types/trip';

// フォームバリデーションスキーマ
const editTripSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  description: z.string().max(2000, '説明は2000文字以内で入力してください').optional(),
  startDate: z.string().min(1, '開始日は必須です'),
  endDate: z.string().min(1, '終了日は必須です'),
  destinations: z
    .array(
      z.object({
        name: z.string().min(1, '目的地名は必須です'),
      })
    )
    .min(1, '目的地を1つ以上追加してください'),
  tags: z.string().optional(),
  notes: z.string().max(5000, 'メモは5000文字以内で入力してください').optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(['draft', 'planning', 'confirmed', 'completed', 'cancelled']).optional(),
});

type EditTripFormData = z.infer<typeof editTripSchema>;

// ステータスの日本語ラベル
const statusLabels: Record<string, string> = {
  draft: '下書き',
  planning: '計画中',
  confirmed: '確定済み',
  completed: '完了',
  cancelled: 'キャンセル',
};

function EditTrip() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentTrip, fetchTripById, updateTrip } = useTripStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditTripFormData>({
    resolver: zodResolver(editTripSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      destinations: [{ name: '' }],
      tags: '',
      notes: '',
      isPublic: false,
      status: 'draft',
    },
  });

  // 目的地フィールド配列管理
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'destinations',
  });

  // 旅行プラン詳細を取得してフォームに設定
  useEffect(() => {
    const loadTrip = async () => {
      if (id) {
        setIsLoading(true);
        try {
          await fetchTripById(id);
        } catch (error) {
          console.error('旅行プラン取得エラー:', error);
          setSubmitError('旅行プランの読み込みに失敗しました');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTrip();
  }, [id, fetchTripById]);

  // currentTripが取得されたらフォームに反映
  useEffect(() => {
    if (currentTrip) {
      const startDate = currentTrip.startDate
        ? new Date(currentTrip.startDate).toISOString().split('T')[0]
        : '';
      const endDate = currentTrip.endDate
        ? new Date(currentTrip.endDate).toISOString().split('T')[0]
        : '';

      reset({
        title: currentTrip.title,
        description: currentTrip.description || '',
        startDate,
        endDate,
        destinations: currentTrip.destinations || [{ name: '' }],
        tags: currentTrip.tags ? currentTrip.tags.join(', ') : '',
        notes: currentTrip.notes || '',
        isPublic: currentTrip.isPublic,
        status: currentTrip.status,
      });
    }
  }, [currentTrip, reset]);

  // フォーム送信処理
  const onSubmit = async (data: EditTripFormData) => {
    if (!id) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // タグを配列に変換（カンマ区切り）
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [];

      // ISO 8601形式に変換
      const updateData: UpdateTripData = {
        title: data.title,
        description: data.description || undefined,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        destinations: data.destinations,
        tags: tags.length > 0 ? tags : undefined,
        notes: data.notes || undefined,
        isPublic: data.isPublic || false,
        status: data.status,
      };

      await updateTrip(id, updateData);
      navigate(`/trips/${id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '旅行プランの更新に失敗しました'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 旅行プランが見つからない
  if (!currentTrip) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">旅行プランが見つかりません</p>
            <button
              onClick={() => navigate('/trips')}
              className="text-blue-600 hover:text-blue-700"
            >
              旅行プラン一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/trips/${id}`)}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900">旅行プランを編集</h1>
        </div>

        {/* エラー表示 */}
        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {submitError}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-md p-6">
          {/* タイトル */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              id="title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 京都2泊3日の旅"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* 説明 */}
          <div className="mb-6">
            <Textarea
              {...register('description')}
              id="description"
              rows={4}
              label="説明"
              placeholder="旅行の概要や目的を記入してください"
              error={errors.description?.message}
            />
          </div>

          {/* 日程 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('startDate')}
                type="date"
                id="startDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                終了日 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('endDate')}
                type="date"
                id="endDate"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* 目的地 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目的地 <span className="text-red-500">*</span>
            </label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2 mb-2">
                <input
                  {...register(`destinations.${index}.name`)}
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 京都"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {errors.destinations && (
              <p className="text-red-500 text-sm mt-1">{errors.destinations.message}</p>
            )}
            <button
              type="button"
              onClick={() => append({ name: '' })}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + 目的地を追加
            </button>
          </div>

          {/* ステータス */}
          <div className="mb-6">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              ステータス
            </label>
            <select
              {...register('status')}
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* タグ */}
          <div className="mb-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              タグ（カンマ区切り）
            </label>
            <input
              {...register('tags')}
              type="text"
              id="tags"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 観光, グルメ, 温泉"
            />
          </div>

          {/* メモ */}
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              メモ
            </label>
            <textarea
              {...register('notes')}
              id="notes"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="持ち物、注意事項など"
            />
            {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
          </div>

          {/* 公開設定 */}
          <div className="mb-6">
            <label className="flex items-center">
              <input {...register('isPublic')} type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">この旅行プランを公開する</span>
            </label>
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(`/trips/${id}`)}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? '更新中...' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTrip;
