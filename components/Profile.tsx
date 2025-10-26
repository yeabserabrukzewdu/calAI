
"use client"

import type React from "react"
import type { MacroGoals, UserProfile } from "../types"
import { Dispatch, SetStateAction } from "react"
import { SettingsIcon, LogOutIcon } from "./Icons"
import { useTranslation } from "../contexts/LanguageContext"

interface ProfileProps {
  userProfile: UserProfile | null
  currentUserId: string | null
  isAnonymousUser: boolean
  goals: MacroGoals
  onGoalsChange: Dispatch<SetStateAction<MacroGoals>>
}

const Profile: React.FC<ProfileProps> = ({ 
  userProfile,
  currentUserId,
  isAnonymousUser,
  goals, 
  onGoalsChange 
}) => {
  const { t } = useTranslation();

  const handleGoalChange = (key: keyof MacroGoals, value: number) => {
    if (isNaN(value) || value < 0) return;
    const updatedGoals = { ...goals, [key]: value }
    onGoalsChange(updatedGoals)
  }

  const handleClearData = () => {
    if (confirm(t('confirmClearData'))) {
      localStorage.clear()
      window.location.reload()
    }
  }

  const userName = userProfile?.name;

  return (
    <div className="w-full animate-slide-up">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-orange-50 to-white p-6 sm:p-8 rounded-3xl shadow-md border border-orange-100 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-2xl sm:text-3xl font-bold text-white">
              {userName ? userName.charAt(0).toUpperCase() : '📱'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {userName ? t('welcomeUser').replace('{name}', userName) : t('yourProfile')}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {isAnonymousUser ? t('anonymousMode') : t('cloudSynced')}
            </p>
          </div>
        </div>
      </div>

      {/* Macro Goals Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-md border border-gray-200 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dailyMacroGoals')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Calories Goal */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('calories')}</label>
            <div className="relative">
              <input
                type="number"
                value={goals.calories}
                onChange={(e) => handleGoalChange("calories", parseInt(e.target.value))}
                className="w-full bg-gradient-to-br from-orange-50 to-white text-gray-900 px-4 py-3 rounded-xl border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-all duration-300 font-semibold text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{t('kcalUnit')}</span>
            </div>
          </div>

          {/* Protein Goal */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('protein').replace(' (g)','')}</label>
            <div className="relative">
              <input
                type="number"
                value={goals.protein}
                onChange={(e) => handleGoalChange("protein", parseInt(e.target.value))}
                className="w-full bg-gradient-to-br from-green-50 to-white text-gray-900 px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all duration-300 font-semibold text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{t('gramUnit')}</span>
            </div>
          </div>

          {/* Carbs Goal */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('carbs').replace(' (g)','')}</label>
            <div className="relative">
              <input
                type="number"
                value={goals.carbs}
                onChange={(e) => handleGoalChange("carbs", parseInt(e.target.value))}
                className="w-full bg-gradient-to-br from-blue-50 to-white text-gray-900 px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-300 font-semibold text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{t('gramUnit')}</span>
            </div>
          </div>

          {/* Fat Goal */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('fat').replace(' (g)','')}</label>
            <div className="relative">
              <input
                type="number"
                value={goals.fat}
                onChange={(e) => handleGoalChange("fat", parseInt(e.target.value))}
                className="w-full bg-gradient-to-br from-red-50 to-white text-gray-900 px-4 py-3 rounded-xl border-2 border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition-all duration-300 font-semibold text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">{t('gramUnit')}</span>
            </div>
          </div>
        </div>

        {/* Info Text */}
        <p className="text-xs sm:text-sm text-gray-500 mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          💡 {t('goalsInfo')}
        </p>
      </div>

      {/* Data Management Section */}
      <div className="bg-gradient-to-br from-red-50 to-white p-6 sm:p-8 rounded-3xl shadow-md border border-red-100">
        <div className="flex items-center gap-3 mb-4">
          <LogOutIcon className="w-6 h-6 text-red-600" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('dataManagement')}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          {t('dataInfo')}
          {currentUserId && !isAnonymousUser && t('cloudSynced')}
        </p>
        <button
          onClick={handleClearData}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 text-white font-bold py-3 sm:py-4 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base sm:text-lg"
        >
          <LogOutIcon className="w-5 h-5" />
          {t('clearAllData')}
        </button>
      </div>
    </div>
  )
}

export default Profile
