
"use client"

import type React from "react"
import { useTranslation } from "../contexts/LanguageContext"
import { playSound } from "../utils/soundUtils"

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useTranslation()

  const handleLanguageChange = (lang: "en" | "am") => {
    if (language !== lang) {
      setLanguage(lang)
      playSound("select").catch(err => console.error(err))
    }
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-200/80 rounded-full">
      <button
        onClick={() => handleLanguageChange("en")}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-300 ${
          language === "en"
            ? "bg-white text-orange-600 shadow"
            : "text-gray-600 hover:bg-white/50"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange("am")}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-300 ${
          language === "am"
            ? "bg-white text-orange-600 shadow"
            : "text-gray-600 hover:bg-white/50"
        }`}
      >
        አማ
      </button>
    </div>
  )
}

export default LanguageToggle
