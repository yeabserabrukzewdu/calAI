import type { LogEntry, MacroGoals } from "../types"
import { useTranslation } from '../contexts/LanguageContext'

interface MacroTrackerProps {
  loggedFoods: LogEntry[]
  goals: MacroGoals
}

const ProgressBar = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {Math.round(value)} / {max}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}

const MacroTracker = ({ loggedFoods, goals }: MacroTrackerProps) => {
  const { t } = useTranslation();
  const totals = loggedFoods.reduce(
    (acc, item) => {
      acc.calories += item.calories
      acc.protein += item.protein
      acc.carbs += item.carbs
      acc.fat += item.fat
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-900">{t('macros')}</h2>
      <div className="space-y-4">
        <ProgressBar value={totals.calories} max={goals.calories} label={t('calories')} color="bg-blue-500" />
        <ProgressBar value={totals.protein} max={goals.protein} label={t('protein')} color="bg-orange-500" />
        <ProgressBar value={totals.carbs} max={goals.carbs} label={t('carbs')} color="bg-green-500" />
        <ProgressBar value={totals.fat} max={goals.fat} label={t('fat')} color="bg-purple-500" />
      </div>
    </div>
  )
}

export default MacroTracker