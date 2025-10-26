"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import type { FoodItem } from "../types"
import { CameraIcon, UploadIcon, SearchIcon, XIcon } from "./Icons"
import Loader from "./Loader"
import { useTranslation } from "../contexts/LanguageContext"

// Mock functions in case geminiService is not available
const mockAnalyzeMealImage = async (base64Image: string, mimeType: string): Promise<FoodItem[]> => {
    console.warn("geminiService not found, using mock image analysis.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
        { name: "Mock Chicken Salad", portion: "1 bowl", calories: 350, protein: 30, carbs: 10, fat: 20 },
        { name: "Mock Glass of Water", portion: "1 glass", calories: 0, protein: 0, carbs: 0, fat: 0 },
    ];
};

const mockSearchFoodDatabase = async (query: string): Promise<FoodItem | null> => {
    console.warn("geminiService not found, using mock food search.");
    await new Promise(resolve => setTimeout(resolve, 500));
    return { name: `Mock ${query}`, portion: "1 serving", calories: 150, protein: 10, carbs: 20, fat: 5 };
};

// Dynamically import to avoid errors if file doesn't exist
let analyzeMealImage: (base64Image: string, mimeType: string) => Promise<FoodItem[]> = mockAnalyzeMealImage;
let searchFoodDatabase: (query: string) => Promise<FoodItem | null> = mockSearchFoodDatabase;

(async () => {
    try {
        const module = await import("../services/geminiService");
        // @ts-ignore - This is a dynamic import with a fallback
        if (module.identifyFoodFromImage) {
        // @ts-ignore
          analyzeMealImage = module.identifyFoodFromImage;
        }
        // @ts-ignore
        if(module.searchFoodDatabase) {
        // @ts-ignore
          searchFoodDatabase = module.searchFoodDatabase;
        }
    } catch (e) {
        console.warn("Could not load geminiService. Using mock functions.");
    }
})();


type ModalTab = "camera" | "upload" | "search"

interface LogFoodModalProps {
  onClose: () => void
  onAddFood: (foodItems: FoodItem[]) => Promise<void>
  initialTab: ModalTab
}

const LogFoodModal: React.FC<LogFoodModalProps> = ({ onClose, onAddFood, initialTab }) => {
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<FoodItem[] | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment")
  const { t } = useTranslation();

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(
    async (facing: "environment" | "user") => {
      try {
        stopCamera()
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setCameraFacing(facing)
        }
      } catch (err) {
        console.warn(`Could not start ${facing} camera, falling back to default.`, err)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          if (videoRef.current) videoRef.current.srcObject = stream
        } catch (innerErr) {
          console.error("Error accessing camera:", innerErr)
          setError("Unable to access camera. Please ensure camera permissions are granted or try uploading an image.")
          setActiveTab("upload")
        }
      }
    },
    [stopCamera],
  )

  useEffect(() => {
    if (activeTab === "camera") {
      startCamera("environment")
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [activeTab, startCamera, stopCamera])

  const handleImageAnalysis = async (base64Image: string, mimeType: string) => {
    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)
    try {
      const items = await analyzeMealImage(base64Image, mimeType)
      setAnalysisResult(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze image. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext("2d")?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      const base64Image = dataUrl.split(",")[1]
      handleImageAnalysis(base64Image, "image/jpeg")
      stopCamera()
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1]
        handleImageAnalysis(base64String, file.type)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)
    try {
      const item = await searchFoodDatabase(searchQuery)
      setAnalysisResult(item ? [item] : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const resetState = () => {
    setAnalysisResult(null)
    setError(null)
    setSearchQuery("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const changeTab = (tab: ModalTab) => {
    resetState()
    setActiveTab(tab)
  }

  const toggleCameraFacing = () => {
    startCamera(cameraFacing === "environment" ? "user" : "environment")
  }

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex flex-col items-center justify-center py-6 sm:py-8">
          <Loader message="Processing..." />
          <div className="mt-4 text-orange-500 animate-pulse text-sm sm:text-base">Analyzing your input...</div>
        </div>
      )

    if (error)
      return (
        <div className="text-red-600 text-center p-4 sm:p-6 bg-red-50 rounded-xl border border-red-200 text-sm sm:text-base">
          {error}
          <button
            onClick={resetState}
            className="mt-4 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-lg transition-all duration-300 font-medium text-sm"
          >
            Try Again
          </button>
        </div>
      )

    if (analysisResult) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-bold text-green-600">{t('analysisResults')}</h3>
          {analysisResult.length > 0 ? (
            <div className="space-y-3 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-gray-100">
              {analysisResult.map((item, index) => (
                <div
                  key={index}
                  className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
                >
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{item.name}</p>
                  <p className="text-xs sm:text-sm text-orange-600">
                    {item.portion} - {item.calories} kcal
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4 text-sm">No food items identified.</p>
          )}
          <div className="flex gap-3 sm:gap-4 mt-4">
            <button
              onClick={resetState}
              className="flex-1 bg-white hover:bg-gray-50 text-gray-700 py-2 sm:py-3 rounded-lg border border-gray-300 hover:border-gray-400 transition-all duration-300 font-medium text-sm"
            >
              {t('analyzeAnother')}
            </button>
            <button
              onClick={async () => {
                if (analysisResult.length > 0) {
                  await onAddFood(analysisResult);
                  onClose();
                }
              }}
              disabled={analysisResult.length === 0}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 sm:py-3 rounded-lg disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-300 text-sm"
            >
              {t('addToLog')}
            </button>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case "camera":
        return (
          <div className="flex flex-col items-center w-full h-full gap-0 sm:gap-6">
            <div className="relative w-full h-full sm:rounded-2xl sm:rounded-3xl overflow-hidden bg-black flex items-center justify-center">
              <div className="w-full h-full bg-black flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>

              <button
                onClick={toggleCameraFacing}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm p-2 sm:p-3 rounded-full hover:bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-300 transform hover:scale-110"
                aria-label="Switch camera"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              </button>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 sm:gap-3">
              <button onClick={handleCapture} className="relative group">
                {/* Outer glow ring */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 scale-110"></div>

                {/* Main button */}
                <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center shadow-xl hover:shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-300 border-4 border-white">
                  <CameraIcon className="w-7 h-7 sm:w-10 sm:h-10" />
                </div>
              </button>

              <p className="text-xs sm:text-sm text-white font-medium drop-shadow-lg">{t('tapToCapture')}</p>
            </div>
          </div>
        )
      case "upload":
        return (
          <div
            className="w-full bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-dashed border-blue-300 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 hover:border-blue-400 hover:from-blue-100 hover:to-blue-50 transition-all duration-300 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-blue-100 p-3 sm:p-4 rounded-2xl">
              <UploadIcon className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Upload Food Image</h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-xs">
              Drag & drop or tap to select a high-quality image
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            >
              {t('selectImage')}
            </button>
          </div>
        )
      case "search":
        return (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., '1 apple' or 'chicken breast'"
                className="w-full bg-white text-gray-900 p-3 sm:p-4 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:outline-none transition-all duration-300 placeholder-gray-400 text-sm sm:text-base"
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-3 sm:p-4 rounded-xl disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </form>
        )
    }
  }

  const TabButton = ({ tab, icon, label }: { tab: ModalTab; icon: React.ReactNode; label: string }) => (
    <button
      onClick={() => changeTab(tab)}
      className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 font-semibold transition-all duration-300 relative text-xs sm:text-sm
        ${activeTab === tab ? "text-orange-600" : "text-gray-500 hover:text-gray-700"}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {activeTab === tab && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-t-full"></div>
      )}
    </button>
  )

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-lg flex items-center justify-center z-50 p-0">
      <div
        className={`bg-white w-full h-full sm:rounded-3xl sm:shadow-2xl sm:shadow-gray-300/50 sm:max-w-md sm:max-h-[90vh] sm:m-auto text-gray-900 relative flex flex-col border border-gray-200 overflow-hidden`}
      >
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold text-center bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
            {t('logYourMeal')}
          </h2>
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-2 rounded-full transition-all duration-300"
            aria-label="Close modal"
          >
            <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-4 sm:px-6">
          <TabButton tab="camera" icon={<CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />} label={t('camera')} />
          <TabButton tab="upload" icon={<UploadIcon className="w-4 h-4 sm:w-5 sm:h-5" />} label={t('upload')} />
          <TabButton tab="search" icon={<SearchIcon className="w-4 h-4 sm:w-5 sm:h-5" />} label={t('search')} />
        </div>

        <div className={`${activeTab === "camera" ? "flex-1 overflow-hidden" : "p-4 sm:p-6 overflow-y-auto flex-1"}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default LogFoodModal