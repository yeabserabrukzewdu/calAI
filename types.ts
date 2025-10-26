

export interface LogEntry {
  id: string
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
  timestamp: number
}

export interface FoodItem {
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MacroGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface UserProfile {
  name?: string
  gender: string
  age: number
  weight: number
  height: number
  dietaryPreference: string
  activityLevel: string
  goal: string
  intensity: string
  macroGoals: MacroGoals
  bmi: number
  timestamp: number
}
