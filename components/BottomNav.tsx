"use client"

import type React from "react"
import { useTranslation } from "../contexts/LanguageContext";

type Section = "main" | "insights" | "calendar" | "profile"
type ModalTab = "camera" | "upload" | "search"

interface BottomNavProps {
  active: Section
  onChange: (s: Section) => void
  onOpenModal: (tab: ModalTab) => void
}

const Icon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case "home":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V11.5z"
          />
        </svg>
      )
    case "insights":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M11 3v18M4 12h14" />
        </svg>
      )
    case "calendar":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )
    case "profile":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.121 17.804A9 9 0 1118.88 6.196 9 9 0 015.12 17.804zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )
    case "camera":
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 7h3l2-2h6l2 2h3a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
          />
          <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      )
    default:
      return null
  }
}

const BottomNav: React.FC<BottomNavProps> = ({ active, onChange, onOpenModal }) => {
  const { t } = useTranslation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none pb-safe">
      <div className="pointer-events-auto bg-white/95 backdrop-blur rounded-t-3xl px-3 py-3 sm:px-4 sm:py-4 sm:rounded-2xl sm:bottom-6 sm:mx-4 flex gap-1 sm:gap-2 items-center shadow-lg border border-gray-200 w-full sm:max-w-4xl sm:w-auto overflow-visible">
        <div className="w-full rounded-xl px-1 sm:px-2 py-1 flex gap-1 sm:gap-2 items-center justify-between">
          <button
            onClick={() => onChange("main")}
            className={`flex-1 flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 active:scale-95 ${
              active === "main" ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon name="home" className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-xs mt-0.5 font-semibold hidden sm:block">{t('main')}</span>
          </button>

          <button
            onClick={() => onChange("insights")}
            className={`flex-1 flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 active:scale-95 ${
              active === "insights" ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon name="insights" className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-xs mt-0.5 font-semibold hidden sm:block">{t('insights')}</span>
          </button>

          <button
            onClick={() => onOpenModal?.("camera")}
            className="flex-none bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full p-5 sm:p-6 -mt-9 sm:-mt-14 shadow-2xl sm:shadow-orange-500/50 hover:shadow-orange-500/70 hover:shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-300 touch-none ring-4 ring-orange-200 hover:ring-orange-300"
          >
            <Icon name="camera" className="w-7 h-7 sm:w-9 sm:h-9" />
          </button>

          <button
            onClick={() => onChange("calendar")}
            className={`flex-1 flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 active:scale-95 ${
              active === "calendar" ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon name="calendar" className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-xs mt-0.5 font-semibold hidden sm:block">{t('calendar')}</span>
          </button>

          <button
            onClick={() => onChange("profile")}
            className={`flex-1 flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg transition-all duration-300 active:scale-95 ${
              active === "profile" ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon name="profile" className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-xs sm:text-xs mt-0.5 font-semibold hidden sm:block">{t('profile')}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default BottomNav