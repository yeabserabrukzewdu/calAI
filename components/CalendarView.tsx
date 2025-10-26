"use client"
import { useState, useMemo } from "react"
import type { LogEntry } from "../types"
import { isSameDay } from "../utils/dateUtils"
import { useTranslation } from "../contexts/LanguageContext"

interface CalendarViewProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  loggedFoods: LogEntry[]
}

interface DailyStats {
  date: string
  day: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function CalendarView({ selectedDate, onDateChange, loggedFoods }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)
  const { t, language } = useTranslation();

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const getDaysArray = () => {
    const days: (Date | null)[] = []
    const totalDays = daysInMonth(currentMonth)
    const firstDay = firstDayOfMonth(currentMonth)

    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i))
    return days
  }

  const hasLogs = (date: Date | null) => date && loggedFoods.some((log) => isSameDay(new Date(log.timestamp), date))
  const isToday = (date: Date | null) => date && isSameDay(date, new Date())
  const isSelected = (date: Date | null) => date && isSameDay(date, selectedDate)

  const days = getDaysArray()
  const monthName = currentMonth.toLocaleString(language, { month: "long", year: "numeric" })

  const weeklyData = useMemo(() => {
    const data: DailyStats[] = []
    const startOfWeek = new Date(selectedDate)
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay())

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)

      const dayLogs = loggedFoods.filter((log) => isSameDay(new Date(log.timestamp), date))
      const stats = dayLogs.reduce(
        (acc, log) => ({
          calories: acc.calories + log.calories,
          protein: acc.protein + log.protein,
          carbs: acc.carbs + log.carbs,
          fat: acc.fat + log.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      )

      data.push({
        date: date.toLocaleDateString(language, { month: "short", day: "numeric" }),
        day: date.toLocaleDateString(language, { weekday: "short" }),
        ...stats,
      })
    }

    return data
  }, [selectedDate, loggedFoods, language])

  const weeklyStats = useMemo(() => {
    const totalCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0);
    const daysWithLogs = weeklyData.filter(day => day.calories > 0).length || 1;
    return {
      totalCalories: totalCalories,
      avgCalories: Math.round(totalCalories / daysWithLogs),
      daysLogged: weeklyData.filter((day) => day.calories > 0).length,
    }
  }, [weeklyData])

  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  const goToToday = () => { setCurrentMonth(new Date()); onDateChange(new Date()) }

  const maxCalories = Math.max(...weeklyData.map((d) => d.calories), 2000)
  const maxMacro = Math.max(...weeklyData.flatMap((d) => [d.protein, d.carbs, d.fat]), 100)

  return (
    <div className="w-full p-4 space-y-8 bg-gray-50 rounded-2xl">
      {/* Calendar */}
      <div className="rounded-xl border border-gray-300 bg-white shadow p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">{monthName}</h2>
          <div className="flex gap-2">
            <button onClick={previousMonth} className="rounded-md p-2 hover:bg-blue-100" aria-label={t('previousMonth')}>←</button>
            <button onClick={goToToday} className="rounded-md px-3 py-1 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600">{t('today')}</button>
            <button onClick={nextMonth} className="rounded-md p-2 hover:bg-blue-100" aria-label={t('nextMonth')}>→</button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center font-semibold text-gray-500 text-xs">
          {[t('sun'),t('mon'),t('tue'),t('wed'),t('thu'),t('fri'),t('sat')].map(d => <div key={d}>{d}</div>)}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => (
            <button
              key={idx}
              onClick={() => date && onDateChange(date)}
              disabled={!date}
              className={`relative flex items-center justify-center aspect-square rounded-md text-sm font-medium transition-colors ${
                !date ? "bg-transparent cursor-default" :
                isSelected(date) ? "bg-blue-600 text-white shadow" :
                isToday(date) ? "border-2 border-blue-500 bg-blue-100 text-blue-800 font-semibold" :
                "hover:bg-blue-200 text-gray-800"
              }`}
            >
              {date && date.getDate()}
              {date && hasLogs(date) && (
                <div className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green-500 shadow" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-blue-50 text-center shadow">
          <p className="text-sm font-medium text-gray-600">{t('totalCalories')}</p>
          <p className="text-2xl font-bold text-blue-600">{weeklyStats.totalCalories}</p>
        </div>
        <div className="p-4 rounded-lg bg-green-50 text-center shadow">
          <p className="text-sm font-medium text-gray-600">{t('dailyAvg')}</p>
          <p className="text-2xl font-bold text-green-600">{weeklyStats.avgCalories}</p>
        </div>
        <div className="p-4 rounded-lg bg-purple-50 text-center shadow">
          <p className="text-sm font-medium text-gray-600">{t('daysLogged')}</p>
          <p className="text-2xl font-bold text-purple-600">{weeklyStats.daysLogged}/7</p>
        </div>
      </div>

      {/* Weekly Charts */}
      <div className="space-y-6">
        {/* Daily Calories */}
        <div className="p-6 rounded-lg bg-white shadow">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('dailyCalorieIntake')}</h3>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600 mb-4">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-blue-500"></div><span>{t('proteinLabel')}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-green-500"></div><span>{t('carbsLabel')}</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-amber-500"></div><span>{t('fatLabel')}</span></div>
          </div>
          <div className="flex items-end justify-between h-48 sm:h-64 gap-2">
            {weeklyData.map((day, idx) => {
               const proteinCals = day.protein * 4;
               const carbsCals = day.carbs * 4;
               const fatCals = day.fat * 9;
               const totalMacroCalories = proteinCals + carbsCals + fatCals;
 
               const proteinPercent = totalMacroCalories > 0 ? (proteinCals / totalMacroCalories) * 100 : 0;
               const carbsPercent = totalMacroCalories > 0 ? (carbsCals / totalMacroCalories) * 100 : 0;
               const fatPercent = totalMacroCalories > 0 ? (fatCals / totalMacroCalories) * 100 : 0;
 
              return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-gray-800">{day.calories}</span>
                  <div
                    className="w-full rounded-t-md transition-all hover:opacity-80 flex flex-col-reverse overflow-hidden bg-gray-200"
                    style={{ height: `${Math.max((day.calories / maxCalories) * 100, 6)}%` }}
                    title={`${day.day}: ${day.calories} cal (P:${day.protein}g, C:${day.carbs}g, F:${day.fat}g)`}
                  >
                    <div className="w-full bg-amber-500" style={{ height: `${fatPercent}%` }} title={`${t('fatLabel')}: ${day.fat}g`} />
                    <div className="w-full bg-green-500" style={{ height: `${carbsPercent}%` }} title={`${t('carbsLabel')}: ${day.carbs}g`} />
                    <div className="w-full bg-blue-500" style={{ height: `${proteinPercent}%` }} title={`${t('proteinLabel')}: ${day.protein}g`} />
                  </div>
                <span className="text-xs font-medium text-gray-700">{day.day}</span>
              </div>
            )})}
          </div>
        </div>

        {/* Macro Distribution */}
        <div className="p-6 rounded-lg bg-white shadow space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">{t('macroDistribution')}</h3>
          {["protein","carbs","fat"].map((macro, idx) => {
            const color = macro === "protein" ? "bg-blue-500" : macro === "carbs" ? "bg-green-500" : "bg-amber-500"
            return (
              <div key={idx}>
                <div className="mb-1 text-sm font-medium capitalize text-gray-700">{t(macro.replace(' (g)',''))}</div>
                <div className="flex h-8 items-end gap-1 rounded-md bg-gray-200 p-1">
                  {weeklyData.map((day, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm ${color} transition-all hover:opacity-80`}
                      style={{
                        height: `${Math.max((day[macro as keyof Omit<DailyStats, 'date' | 'day'>] / maxMacro) * 100, 4)}%`,
                      }}
                      title={`${day.day}: ${day[macro as keyof Omit<DailyStats, 'date' | 'day'>]}g`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CalendarView