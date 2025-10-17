import { useEffect } from 'react';
import { useBudgetStore } from '../stores/budgetStore';
import { budgetCategoryLabels } from '../types/budget';

interface BudgetSummaryProps {
  tripId: string;
}

function BudgetSummary({ tripId }: BudgetSummaryProps) {
  const { comparison, fetchBudgetComparison, isLoading, error } = useBudgetStore();

  useEffect(() => {
    fetchBudgetComparison(tripId).catch((err) => {
      console.error('予算比較データ取得エラー:', err);
    });
  }, [tripId, fetchBudgetComparison]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">エラー</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">予算データがありません</p>
      </div>
    );
  }

  const { totalBudget, totalActual, totalDifference, categories, memberCount } = comparison;
  const usagePercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const isOverBudget = totalDifference < 0;

  return (
    <div className="space-y-6">
      {/* 全体サマリー */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">予算サマリー</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">予算総額</p>
            <p className="text-2xl font-bold text-gray-900">
              ¥{totalBudget.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">実費総額</p>
            <p className="text-2xl font-bold text-gray-900">
              ¥{totalActual.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">差額</p>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {isOverBudget ? '-' : '+'}¥{Math.abs(totalDifference).toLocaleString()}
            </p>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>予算使用率</span>
            <span>{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePercentage > 100 ? 'bg-red-600' : usagePercentage > 80 ? 'bg-yellow-500' : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        {memberCount > 1 && (
          <p className="text-sm text-gray-500 mt-2">
            メンバー数: {memberCount}人
          </p>
        )}
      </div>

      {/* カテゴリ別詳細 */}
      {categories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">カテゴリ別詳細</h3>
          <div className="space-y-4">
            {categories.map((cat) => {
              const categoryUsagePercentage = cat.budgetAmount > 0 ? (cat.actualAmount / cat.budgetAmount) * 100 : 0;
              const isOverCategoryBudget = cat.difference < 0;

              return (
                <div key={cat.category} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {budgetCategoryLabels[cat.category]}
                        {cat.isPerPerson && <span className="text-sm text-gray-500 ml-2">(1人あたり)</span>}
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        ¥{cat.actualAmount.toLocaleString()} / ¥{cat.budgetAmount.toLocaleString()}
                      </p>
                      <p className={`text-sm font-medium ${isOverCategoryBudget ? 'text-red-600' : 'text-green-600'}`}>
                        {isOverCategoryBudget ? '-' : '+'}¥{Math.abs(cat.difference).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        categoryUsagePercentage > 100
                          ? 'bg-red-600'
                          : categoryUsagePercentage > 80
                          ? 'bg-yellow-500'
                          : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(categoryUsagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetSummary;
