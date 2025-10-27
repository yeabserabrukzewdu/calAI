
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion";
import { updateUserProfile } from "../services/localStorageService"
import { XIcon } from "./Icons"
import { useTranslation } from "../contexts/LanguageContext"
import { playSound } from "../utils/soundUtils"
import type { MacroGoals, UserProfile } from "../types"

interface UserQuizModalProps {
  onClose: () => void
  onComplete: (profile: UserProfile) => void
}

interface QuizData {
  name: string;
  gender: string
  age: number | null
  weight: number | null
  height: number | null
  dietaryPreference: string
  activityLevel: string
  goal: string
  intensity: string
  calorieGoal: number | null
  proteinGoal: number | null
  carbsGoal: number | null
  fatGoal: number | null
}


const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
}

const getBMISuggestion = (bmi: number): string => {
  if (bmi < 18.5) return "gain"
  if (bmi >= 18.5 && bmi < 25) return "maintain"
  return "lose"
}

const calculateNutritionGoals = (data: QuizData): MacroGoals => {
  const { gender, age, weight, height, activityLevel, goal, intensity } = data
  if (!age || !weight || !height || !activityLevel || !goal) {
    return { calories: 2000, protein: 150, carbs: 250, fat: 65 }
  }

  const bmr = 10 * weight + 6.25 * height - 5 * age + (gender === "female" ? -161 : 5)

  const activityMultipliers: { [key: string]: number } = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
  }
  let calories = Math.round(bmr * (activityMultipliers[activityLevel] || 1.2))

  const intensityMultipliers: { [key: string]: number } = {
    mild: 250,
    moderate: 500,
    aggressive: 750,
  }
  const adjustment = intensityMultipliers[intensity] || 0
  if (goal === "lose") {
    calories -= adjustment
  } else if (goal === "gain") {
    calories += adjustment
  }
  calories = Math.max(1200, calories)

  let proteinRatio = 0.3
  let carbsRatio = 0.4
  let fatRatio = 0.3

  if (data.dietaryPreference === "keto") {
    proteinRatio = 0.25
    carbsRatio = 0.05
    fatRatio = 0.7
  } else if (data.dietaryPreference === "vegan") {
    proteinRatio = 0.25
    carbsRatio = 0.5
    fatRatio = 0.25
  }

  const protein = Math.round((calories * proteinRatio) / 4)
  const carbs = Math.round((calories * carbsRatio) / 4)
  const fat = Math.round((calories * fatRatio) / 9)

  return { calories, protein, carbs, fat }
}

const OptionButton = ({
  label,
  value,
  checked,
  onChange,
  icon,
}: {
  label: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  icon?: string
}) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 font-semibold text-left flex items-center gap-3 ${
      checked
        ? "border-orange-500 bg-gradient-to-br from-orange-50 to-orange-100/50 text-orange-900 shadow-lg shadow-orange-200/50"
        : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/30"
    }`}
  >
    <div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
        checked ? "border-orange-500 bg-orange-500" : "border-gray-300"
      }`}
    >
      {checked && <div className="w-2 h-2 bg-white rounded-full" />}
    </div>
    {icon && <span className="text-xl">{icon}</span>}
    <span>{label}</span>
  </button>
)

const UserQuizModal: React.FC<UserQuizModalProps> = ({ onClose, onComplete }) => {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<"left" | "right">("left")
  const { t, setLanguage } = useTranslation()
  const [quizData, setQuizData] = useState<QuizData>({
    name: "",
    gender: "",
    age: null,
    weight: null,
    height: null,
    dietaryPreference: "",
    activityLevel: "",
    goal: "",
    intensity: "",
    calorieGoal: null,
    proteinGoal: null,
    carbsGoal: null,
    fatGoal: null,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const totalSteps = 12

  const handleNext = async () => {
    if (step === totalSteps) {
      if (
        !quizData.name ||
        !quizData.gender ||
        !quizData.age ||
        !quizData.weight ||
        !quizData.height ||
        !quizData.dietaryPreference ||
        !quizData.activityLevel ||
        !quizData.goal ||
        (quizData.goal !== "maintain" && !quizData.intensity)
      ) {
        setError("Please fill out all fields.")
        return
      }
      setIsLoading(true)
      try {
        const userId = "local-user" 
        const goals = calculateNutritionGoals(quizData)
        const newProfile: UserProfile = {
          name: quizData.name,
          gender: quizData.gender,
          age: quizData.age,
          weight: quizData.weight,
          height: quizData.height,
          dietaryPreference: quizData.dietaryPreference,
          activityLevel: quizData.activityLevel,
          goal: quizData.goal,
          intensity: quizData.intensity,
          macroGoals: goals,
          bmi: calculateBMI(quizData.weight, quizData.height),
          timestamp: Date.now(),
        }

        await updateUserProfile(userId, newProfile)
        onComplete(newProfile)
        onClose()
      } catch (err) {
        setError("Failed to save profile. Try again.")
        console.error("Quiz save error:", err)
      } finally {
        setIsLoading(false)
      }
    } else {
      setDirection("left")
      setStep(step + 1)
      setError(null)
    }
  }

  const handleBack = () => {
    setDirection("right")
    setStep(step - 1)
    setError(null)
  }

  const handleLanguageSelect = (lang: 'en' | 'am') => {
    setLanguage(lang)
    playSound('select')
    handleNext()
  }

  const handleInputChange = (field: keyof QuizData, value: string | number) => {
    setQuizData((prev) => ({ ...prev, [field]: value }))
    setError(null)
    if (["gender", "dietaryPreference", "activityLevel", "goal", "intensity"].includes(field)) {
      playSound('select')
      handleNext()
    }
  }

  const bmi = quizData.weight && quizData.height ? calculateBMI(quizData.weight, quizData.height) : null
  const bmiSuggestion = bmi ? getBMISuggestion(bmi) : ""

  useEffect(() => {
    if (step === 9 || (step === 11 && quizData.goal === "maintain") || step === totalSteps) {
      const timer = setTimeout(() => {
        handleNext()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [step, quizData.goal])
  
  useEffect(() => {
    if (step === 10 && bmiSuggestion && !quizData.goal) {
       handleInputChange("goal", bmiSuggestion)
    }
  }, [step, bmiSuggestion])


  return (
  <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50 h-screen w-screen overflow-hidden">
  <AnimatePresence mode="wait" initial={false} custom={direction}>
    <motion.div
      key={step}
      custom={direction}
      initial={{ x: direction === "left" ? 300 : -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction === "left" ? -300 : 300, opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="relative bg-white rounded-2xl p-8 w-full h-full max-w-4xl shadow-2xl border border-gray-200 overflow-y-auto"
    >
      {/* your existing modal content goes here */}

        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              {t("welcomeQuiz")}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{t("quizIntro")}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg transition-all duration-300 transform hover:scale-110"
            aria-label="Skip quiz and enter app"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('step')}</span>
            <span className="text-sm font-bold text-orange-600">{step}/{totalSteps}</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold animate-slide-up flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="flex-1">
              <p>{error}</p>
              <button onClick={() => setError(null)} className="text-xs text-red-600 underline mt-1 hover:text-red-800">
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('chooseLanguage')}</h3>
                <div className="space-y-3">
                  <OptionButton
                    label="English"
                    value="en"
                    checked={false}
                    onChange={() => handleLanguageSelect('en')}
                    icon="🇬🇧"
                  />
                  <OptionButton
                    label="አማርኛ (Amharic)"
                    value="am"
                    checked={false}
                    onChange={() => handleLanguageSelect('am')}
                    icon="🇪🇹"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('whatsYourName')}?</h3>
                <input
                  type="text"
                  value={quizData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white text-gray-900 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300 font-semibold text-lg"
                  aria-label="Name input"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('gender')}</h3>
                <div className="space-y-3">
                  <OptionButton
                    label={t('male')}
                    value="male"
                    checked={quizData.gender === "male"}
                    onChange={(val) => handleInputChange("gender", val)}
                    icon="👨"
                  />
                  <OptionButton
                    label={t('female')}
                    value="female"
                    checked={quizData.gender === "female"}
                    onChange={(val) => handleInputChange("gender", val)}
                    icon="👩"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('age')}?</h3>
                <input
                  type="number"
                  value={quizData.age || ""}
                  onChange={(e) => handleInputChange("age", Number.parseInt(e.target.value) || null)}
                  placeholder={t('age')}
                  className="w-full p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white text-gray-900 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300 font-semibold text-lg"
                  aria-label="Age input"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('weightKg')}?</h3>
                <input
                  type="number"
                  step="0.1"
                  value={quizData.weight || ""}
                  onChange={(e) => handleInputChange("weight", Number.parseFloat(e.target.value) || null)}
                  placeholder={t('weightKg')}
                  className="w-full p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white text-gray-900 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300 font-semibold text-lg"
                  aria-label="Weight input"
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('heightCm')}?</h3>
                <input
                  type="number"
                  value={quizData.height || ""}
                  onChange={(e) => handleInputChange("height", Number.parseFloat(e.target.value) || null)}
                  placeholder={t('heightCm')}
                  className="w-full p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white text-gray-900 border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all duration-300 font-semibold text-lg"
                  aria-label="Height input"
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('dietaryPref')}</h3>
              <div className="space-y-3">
                {[
                  { value: "omnivore", label: "Omnivore", icon: "🍖" },
                  { value: "vegetarian", label: "Vegetarian", icon: "🥗" },
                  { value: "vegan", label: "Vegan", icon: "🌱" },
                  { value: "gluten-free", label: "Gluten-Free", icon: "🌾" },
                  { value: "keto", label: "Keto", icon: "🥑" },
                ].map((pref) => (
                  <OptionButton
                    
                    label={pref.label}
                    value={pref.value}
                    checked={quizData.dietaryPreference === pref.value}
                    onChange={(val) => handleInputChange("dietaryPreference", val)}
                    icon={pref.icon}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('activityLevel')}</h3>
              <div className="space-y-3">
                {[
                  { value: "sedentary", label: t('sedentary'), icon: "🪑" },
                  { value: "light", label: t('lightlyActive'), icon: "🚶" },
                  { value: "moderate", label: t('moderatelyActive'), icon: "🏃" },
                  { value: "active", label: t('active'), icon: "💪" },
                ].map(({ value, label, icon }) => (
                  <OptionButton
                   
                    label={label}
                    value={value}
                    checked={quizData.activityLevel === value}
                    onChange={(val) => handleInputChange("activityLevel", val)}
                    icon={icon}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('yourBMI')}</h3>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-xl border-2 border-orange-200">
                <div className="text-center">
                  <p className="text-5xl font-bold text-orange-600">{bmi || "N/A"}</p>
                  <p className="text-gray-700 font-semibold mt-2">{t('bmiLabel')}</p>
                  <p className="text-gray-600 text-sm mt-3">
                    {bmiSuggestion === "gain" && t('bmiSuggestGain')}
                    {bmiSuggestion === "maintain" && t('bmiSuggestMaintain')}
                    {bmiSuggestion === "lose" && t('bmiSuggestLose')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('primaryGoal')}</h3>
              <div className="space-y-3">
                {[
                  { value: "lose", label: t('loseWeight'), icon: "📉" },
                  { value: "maintain", label: t('maintainWeight'), icon: "⚖️" },
                  { value: "gain", label: t('gainWeight'), icon: "📈" },
                ].map((goal) => (
                  <OptionButton
                    
                    label={goal.label}
                    value={goal.value}
                    checked={quizData.goal === goal.value}
                    onChange={(val) => handleInputChange("goal", val)}
                    icon={goal.icon}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 11 && quizData.goal !== "maintain" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('goalIntensity')}</h3>
              <div className="space-y-3">
                {[
                  { value: "mild", label: t('intensityMild'), icon: "🐢" },
                  { value: "moderate", label: t('intensityModerate'), icon: "🚴" },
                  { value: "aggressive", label: t('intensityAggressive'), icon: "🚀" },
                ].map((intensity) => (
                  <OptionButton
                    
                    label={intensity.label}
                    value={intensity.value}
                    checked={quizData.intensity === intensity.value}
                    onChange={(val) => handleInputChange("intensity", val)}
                    icon={intensity.icon}
                  />
                ))}
              </div>
            </div>
          )}

          {step === 11 && quizData.goal === "maintain" && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('yourGoal')}</h3>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-xl border-2 border-blue-200">
                <p className="text-gray-700 font-semibold">⚖️ {t('maintainWeight')}</p>
              </div>
            </div>
          )}

          {step === 12 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('yourDailyGoals')}</h3>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-xl border-2 border-orange-200">
                <p className="text-gray-700 font-semibold mb-4">{t('basedOnProfile')}:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">{t('calories')}</p>
                    <p className="text-2xl font-bold text-orange-600">{calculateNutritionGoals(quizData).calories}</p>
                    <p className="text-xs text-gray-500">{t('kcalUnit')}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">{t('protein').replace(' (g)','')}</p>
                    <p className="text-2xl font-bold text-green-600">{calculateNutritionGoals(quizData).protein}</p>
                    <p className="text-xs text-gray-500">{t('gramUnit')}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">{t('carbs').replace(' (g)','')}</p>
                    <p className="text-2xl font-bold text-blue-600">{calculateNutritionGoals(quizData).carbs}</p>
                    <p className="text-xs text-gray-500">{t('gramUnit')}</p>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 font-semibold">{t('fat').replace(' (g)','')}</p>
                    <p className="text-2xl font-bold text-purple-600">{calculateNutritionGoals(quizData).fat}</p>
                    <p className="text-xs text-gray-500">{t('gramUnit')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {step > 1 && step !== 9 && step !== totalSteps && (
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
                aria-label="Go to previous step"
              >
                {t('back')}
              </button>
            )}
            {(step >= 2 && step <= 6) && (
              <button
                onClick={handleNext}
                disabled={isLoading || !quizData[step === 2 ? "name" : step === 4 ? "age" : step === 5 ? "weight" : "height"]}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                aria-label="Go to next step"
              >
                {isLoading ? "Saving..." : t('next')}
              </button>
            )}
            {step === totalSteps && (
              <button
                onClick={handleNext}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                aria-label="Finish quiz and enter app"
              >
                {isLoading ? "Saving..." : t('finish')}
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full text-gray-600 hover:text-orange-600 font-semibold text-sm transition-colors py-2"
            aria-label="Skip quiz and enter app"
          >
            {t('skipQuiz')}
          </button>
        </div>
          </motion.div>
  </AnimatePresence>
</div>

   
  )
}

export default UserQuizModal
