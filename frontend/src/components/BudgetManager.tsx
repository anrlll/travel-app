import { useEffect, useState } from 'react';
import Button from "./Button";
import { useBudgetStore } from '../stores/budgetStore';
import { budgetCategoryLabels, type BudgetCategory, type Budget } from '../types/budget';

interface BudgetManagerProps {
  tripId: string;
  canEdit: boolean;
}

function BudgetManager({ tripId, canEdit }: BudgetManagerProps) {
  const { budgets, fetchBudgets, createBudget, updateBudget, deleteBudget, isLoading, error } =
    useBudgetStore();

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: 'food' as BudgetCategory,
    budgetAmount: '',
    isPerPerson: false,
    notes: '',
  });

  useEffect(() => {
    fetchBudgets(tripId).catch(console.error);
  }, [tripId, fetchBudgets]);

  // 編集時にフォームデータを設定
  useEffect(() => {
    if (editingBudget) {
      setFormData({
        category: editingBudget.category,
        budgetAmount: editingBudget.budgetAmount.toString(),
        isPerPerson: editingBudget.isPerPerson,
        notes: editingBudget.notes || '',
      });
      setShowForm(true);
    }
  }, [editingBudget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.budgetAmount);
    if (isNaN(amount) || amount < 0) {
      alert('有効な金額を入力してください');
      return;
    }

    try {
      if (editingBudget) {
        // 更新
        await updateBudget(tripId, editingBudget.category, {
          budgetAmount: amount,
          isPerPerson: formData.isPerPerson,
          notes: formData.notes || undefined,
        });
      } else {
        // 作成
        await createBudget(tripId, {
          category: formData.category,
          budgetAmount: amount,
          isPerPerson: formData.isPerPerson,
          notes: formData.notes || undefined,
        });
      }

      // フォームをリセット（次の利用可能なカテゴリを設定）
      const nextAvailableCategories = Object.keys(budgetCategoryLabels)
        .filter((cat) => cat !== 'total')
        .filter((cat) => !budgets.some((b) => b.category === cat) && cat !== formData.category) as BudgetCategory[];

      setFormData({
        category: nextAvailableCategories[0] || 'food',
        budgetAmount: '',
        isPerPerson: false,
        notes: '',
      });
      setEditingBudget(null);
      setShowForm(false);
    } catch (error) {
      console.error('予算の保存に失敗:', error);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
  };

  const handleDelete = async (category: BudgetCategory) => {
    if (!confirm(`${budgetCategoryLabels[category]}の予算を削除しますか?`)) {
      return;
    }

    try {
      await deleteBudget(tripId, category);
    } catch (error) {
      console.error('予算の削除に失敗:', error);
    }
  };

  const handleCancel = () => {
    // 次の利用可能なカテゴリを設定
    const nextAvailableCategories = Object.keys(budgetCategoryLabels)
      .filter((cat) => cat !== 'total')
      .filter((cat) => !budgets.some((b) => b.category === cat)) as BudgetCategory[];

    setFormData({
      category: nextAvailableCategories[0] || 'food',
      budgetAmount: '',
      isPerPerson: false,
      notes: '',
    });
    setEditingBudget(null);
    setShowForm(false);
  };

  // 利用可能なカテゴリ（既に予算が設定されているカテゴリは除外、totalは除外）
  const availableCategories = Object.keys(budgetCategoryLabels)
    .filter((cat) => cat !== 'total')
    .filter((cat) => !budgets.some((b) => b.category === cat)) as BudgetCategory[];

  if (isLoading && budgets.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* エラー表示 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 予算一覧 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">予算設定</h3>
            {canEdit && !showForm && availableCategories.length > 0 && (
              <Button
                onClick={() => {
                  // 最初の利用可能なカテゴリを設定してフォームを開く
                  setFormData({
                    category: availableCategories[0] || 'food',
                    budgetAmount: '',
                    isPerPerson: false,
                    notes: '',
                  });
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
              >
                + 予算を追加
              </Button>
            )}
          </div>

          {budgets.length === 0 && !showForm ? (
            <p className="text-gray-500 text-center py-8">
              予算が設定されていません
              {canEdit && availableCategories.length > 0 && (
                <span className="block mt-2">
                  <Button
                    onClick={() => {
                      // 最初の利用可能なカテゴリを設定してフォームを開く
                      setFormData({
                        category: availableCategories[0] || 'food',
                        budgetAmount: '',
                        isPerPerson: false,
                        notes: '',
                      });
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    予算を追加する
                  </Button>
                </span>
              )}
            </p>
          ) : (
            <div className="space-y-3">
              {budgets
                .filter((b) => b.category !== 'total')
                .map((budget) => (
                  <div
                    key={budget.id}
                    className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {budgetCategoryLabels[budget.category]}
                        </h4>
                        {budget.isPerPerson && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            1人あたり
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        ¥{budget.budgetAmount.toLocaleString()}
                      </p>
                      {budget.notes && (
                        <p className="text-sm text-gray-500 mt-1">{budget.notes}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(budget)}
                          className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          編集
                        </Button>
                        <Button
                          onClick={() => handleDelete(budget.category)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          削除
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 予算フォーム */}
      {showForm && canEdit && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingBudget ? '予算を編集' : '予算を追加'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* カテゴリ選択（新規作成時のみ） */}
            {!editingBudget && (
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value as BudgetCategory })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {budgetCategoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 予算額 */}
            <div>
              <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700 mb-1">
                予算額 (円) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="budgetAmount"
                value={formData.budgetAmount}
                onChange={(e) => setFormData({ ...formData, budgetAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10000"
                min="0"
                step="100"
                required
              />
            </div>

            {/* 1人あたりかどうか */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPerPerson"
                checked={formData.isPerPerson}
                onChange={(e) => setFormData({ ...formData, isPerPerson: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPerPerson" className="ml-2 text-sm text-gray-700">
                1人あたりの予算として設定
              </label>
            </div>

            {/* メモ */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                メモ
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="予算に関するメモ（任意）"
                maxLength={500}
              />
            </div>

            {/* ボタン */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:bg-gray-400"
              >
                {isLoading ? '保存中...' : editingBudget ? '更新' : '追加'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default BudgetManager;
