"use client"

import { useState, useEffect, useCallback } from "react"
import type { LogEntry, MacroGoals } from "../types"
import Loader from "./Loader"
import { useTranslation } from "../contexts/LanguageContext"

// Mock function in case geminiService is not available
const mockGetPersonalizedInsights = async (loggedFoods: LogEntry[], goals: MacroGoals): Promise<string> => {
    console.warn("geminiService not found, using mock insights.");
    await new Promise(resolve => setTimeout(resolve, 500));
    if (loggedFoods.length === 0) return "Log some food to get insights.";
    const totalCalories = loggedFoods.reduce((sum, food) => sum + food.calories, 0);
    return `You've logged ${loggedFoods.length} items today for a total of ${totalCalories} calories. Keep it up! (This is mock data).`;
};

// Dynamically import to avoid errors if file doesn't exist
let getPersonalizedInsights: (loggedFoods: LogEntry[], goals: MacroGoals) => Promise<string> = mockGetPersonalizedInsights;
try {
  const geminiService = await import("../services/geminiService");
  getPersonalizedInsights = geminiService.getPersonalizedInsights;
} catch (e) {
  console.warn("Could not load geminiService. Using mock function.");
}


interface InsightsProps {
  loggedFoods: LogEntry[]
  goals: MacroGoals
}

const Insights = ({ loggedFoods, goals }: InsightsProps) => {
  const [insights, setInsights] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation();

  const fetchInsights = useCallback(async () => {
    if (loggedFoods.length === 0) {
      setInsights("Log some food to get your personalized insights for the day!")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await getPersonalizedInsights(loggedFoods, goals)
      setInsights(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch insights.")
    } finally {
      setIsLoading(false)
    }
  }, [loggedFoods, goals])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-900">{t('aiInsights')}</h2>
      {isLoading ? (
        <Loader message="Generating your insights..." />
      ) : error ? (
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">{error}</div>
      ) : (
        <div
          className="prose prose-sm text-gray-700 max-w-none"
          dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, "<br />") }}
        />
      )}
      <button
        onClick={fetchInsights}
        disabled={isLoading}
        className="mt-4 w-full bg-orange-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? t('refreshing') : t('getFreshInsights')}
      </button>
    </div>
  )
}

export default Insights