"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import CalendarView from "./components/CalendarView"
import MacroTracker from "./components/MacroTracker"
import Insights from "./components/Insights"
import LogFoodModal from "./components/LogFoodModal"
import LogFoodActions from "./components/LogFoodActions"
import BottomNav from "./components/BottomNav"
import Profile from "./components/Profile"
import UserQuizModal from "./components/UserQuizModal"
import type { FoodItem, MacroGoals, LogEntry, UserProfile } from "./types"
import {
  addLogEntry,
  deleteLogEntry,
  subscribeToLogEntries,
  getUserProfile,
  updateUserProfile,
} from "./services/localStorageService"
import { isSameDay } from "./utils/dateUtils"
import { XIcon, PlusIcon } from "./components/Icons"
import { useToast, ToastContainer } from "./components/toast"
import { useTranslation } from "./contexts/LanguageContext"
import LanguageToggle from "./components/LanguageToggle"
import WarningModal from "./components/WarningModal"

type ModalTab = "camera" | "upload" | "search"

const STORAGE_USER_ID = "local-user"

const App: React.FC = () => {
  const [userInitialized, setUserInitialized] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loggedFoods, setLoggedFoods] = useState<LogEntry[]>([])
  const [goals, setGoals] = useState<MacroGoals>({ calories: 2000, protein: 150, carbs: 250, fat: 65 })
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; initialTab: ModalTab }>({
    isOpen: false,
    initialTab: "camera",
  })
  const [activeSection, setActiveSection] = useState<"main" | "insights" | "calendar" | "profile">("main")
  const [showQuizModal, setShowQuizModal] = useState(false)
  const { toasts, showToast, removeToast } = useToast()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const { t } = useTranslation();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const unsubRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const profile = await getUserProfile(STORAGE_USER_ID)
        if (!profile) {
          setShowQuizModal(true) // Show quiz if no profile exists
        } else {
          setUserProfile(profile)
          if (profile.macroGoals) {
            setGoals(profile.macroGoals)
          }
        }
      } catch (e) {
        console.error("Failed to initialize user", e)
        showToast(t('initProfileError'), "error")
      }
      setUserInitialized(true)
    }

    initializeUser()
  }, [])

  // Page transition effect
  useEffect(() => {
    setIsTransitioning(true)
    const timeout = setTimeout(() => setIsTransitioning(false), 300)
    return () => clearTimeout(timeout)
  }, [activeSection])

  useEffect(() => {
    if (!userInitialized) return
    const saveGoals = async () => {
      try {
        await updateUserProfile(STORAGE_USER_ID, { macroGoals: goals })
      } catch (e) {
        console.error("Failed to save goals", e)
        showToast(t('saveGoalsError'), "error")
      }
    }

    saveGoals()
  }, [goals, userInitialized])

  useEffect(() => {
    unsubRef.current = subscribeToLogEntries(STORAGE_USER_ID, (entries) => {
      setLoggedFoods(entries)
    })
    return () => {
      unsubRef.current?.()
    }
  }, [])

  const handleAddFood = async (foods: FoodItem[]) => {
    if (!foods || foods.length === 0) return

    const calorieGoal = goals.calories;
    const newFoodCalories = foods.reduce((sum, food) => sum + food.calories, 0);
    const currentFoodsForDate = loggedFoods.filter((item) => 
        item.timestamp && isSameDay(new Date(item.timestamp), selectedDate)
    );
    const currentCalories = currentFoodsForDate.reduce((sum, food) => sum + food.calories, 0);

    const willExceed = currentCalories < calorieGoal && (currentCalories + newFoodCalories) >= calorieGoal;

    const newEntries: LogEntry[] = []
    try {
      for (const food of foods) {
        const entry: LogEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: food.name,
          portion: food.portion || '1 serving',
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          timestamp: selectedDate.getTime(), // Log for the selected date
        };
        await addLogEntry(STORAGE_USER_ID, entry)
        newEntries.push(entry);
      }
      // The subscription will automatically update the state. No optimistic update needed.
      showToast(t('itemsAddedSuccess').replace('{count}', String(newEntries.length)), "success");

      if (willExceed) {
          setWarningMessage(t('calorieLimitWarning'));
          setShowWarningModal(true);
      }
    } catch (e) {
      console.error("Failed to add food logs:", e);
      showToast(t('addFoodError'), "error");
    }
  }

  const handleRemoveFood = async (id: string) => {
    try {
      await deleteLogEntry(STORAGE_USER_ID, id)
      // The subscription will automatically update the state. No optimistic update needed.
      showToast(t('itemRemovedSuccess'), "success")
    } catch (e) {
      console.error("Failed to remove food log", e)
      showToast(t('removeFoodError'), "error")
    }
  }

  const handleOpenModal = (tab: ModalTab) => {
    setModalConfig({ isOpen: true, initialTab: tab })
  }

  const handleCloseModal = () => {
    setModalConfig({ isOpen: false, initialTab: "camera" })
  }

  const handleNavChange = (section: "main" | "insights" | "calendar" | "profile") => {
    setActiveSection(section)
  }

  const dailyLoggedFoods = loggedFoods.filter((item) => {
      const ts = item.timestamp
      return typeof ts === "number" ? isSameDay(new Date(ts), new Date()) : true
  })

  return (
    <div className="min-h-screen bg-gray-100 pb-28 sm:pb-8">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <WarningModal 
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        message={warningMessage}
      />
      <div
        className={`container mx-auto p-4 sm:p-6 transition-opacity duration-300 ${isTransitioning ? "opacity-50" : "opacity-100"}`}
      >
        <header className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-orange-500">{t('appName')}</h1>
          <LanguageToggle />
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeSection === "main" && (
            <div className="lg:col-span-2 flex items-center justify-center min-h-[60vh]">
              <LogFoodActions onAction={handleOpenModal} />
            </div>
          )}

          {activeSection === "insights" && (
            <div className="lg:col-span-2">
              <Insights loggedFoods={loggedFoods} goals={goals} />
            </div>
          )}

          {activeSection === "calendar" && (
            <>
              <div className="lg:col-span-2">
                <CalendarView selectedDate={selectedDate} onDateChange={setSelectedDate} loggedFoods={loggedFoods} />
              </div>

              <div className="lg:col-span-1">
                <MacroTracker
                  loggedFoods={loggedFoods.filter((item) => {
                    const ts = item.timestamp
                    return typeof ts === "number" ? isSameDay(new Date(ts), selectedDate) : true
                  })}
                  goals={goals}
                />

                <div className="bg-gray-50 p-6 rounded-2xl shadow-md border border-gray-200 mt-6 animate-slide-up">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-orange-600">{t('foodLogFor')} {selectedDate.toLocaleDateString()}</h2>
                    <button
                      onClick={() => handleOpenModal("search")}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-300"
                    >
                      <PlusIcon className="w-4 h-4 inline-block mr-1" /> {t('add')}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-100">
                    {loggedFoods.filter((item) => {
                      const ts = item.timestamp
                      return typeof ts === "number" ? isSameDay(new Date(ts), selectedDate) : true
                    }).length > 0 ? (
                      loggedFoods
                        .filter((item) => {
                          const ts = item.timestamp
                          return typeof ts === "number" ? isSameDay(new Date(ts), selectedDate) : true
                        })
                        .map((item) => (
                          <div
                            key={item.id}
                            className="bg-white p-4 rounded-lg grid grid-cols-3 items-center gap-2 border border-gray-200 hover:border-orange-300 transition-all duration-300"
                          >
                            <div className="col-span-2">
                              <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.portion} - {item.calories} kcal
                              </p>
                            </div>
                            <div className="text-right text-xs text-gray-600 flex items-center justify-end">
                              P:{item.protein} C:{item.carbs} F:{item.fat}
                              <button
                                onClick={() => handleRemoveFood(item.id)}
                                className="text-gray-400 hover:text-red-600 ml-3 transition-colors flex-shrink-0"
                              >
                                <XIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-gray-400 text-center py-8">{t('noFoodLogged')}</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeSection === "profile" && (
            <div className="lg:col-span-2">
              <Profile
                userProfile={userProfile}
                currentUserId={STORAGE_USER_ID}
                isAnonymousUser={false}
                goals={goals}
                onGoalsChange={setGoals}
              />
            </div>
          )}

          {(activeSection === "main" || activeSection === "insights") && (
            <div className="space-y-6">
              <MacroTracker loggedFoods={dailyLoggedFoods} goals={goals} />
            </div>
          )}
        </main>

        {modalConfig.isOpen && (
          <LogFoodModal onClose={handleCloseModal} onAddFood={handleAddFood} initialTab={modalConfig.initialTab} />
        )}

        {showQuizModal && (
          <UserQuizModal
            onClose={() => setShowQuizModal(false)}
            onComplete={(newProfile) => {
              setUserProfile(newProfile);
              setGoals(newProfile.macroGoals);
              setShowQuizModal(false);
              showToast(t('profileCreatedSuccess'), "success");
            }}
          />
        )}

        {!modalConfig.isOpen && !showQuizModal && (
          <BottomNav active={activeSection} onChange={handleNavChange} onOpenModal={handleOpenModal} />
        )}
      </div>
    </div>
  )
}

export default App