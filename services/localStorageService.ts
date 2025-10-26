
import type { LogEntry, UserProfile } from "../types"

const STORAGE_KEYS = {
  USER_PROFILE: "userProfile",
  FOOD_LOGS: "foodLogs",
  MACRO_GOALS: "macroGoals",
}

// User Profile Management
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const profile = localStorage.getItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`)
    return profile ? JSON.parse(profile) : null
  } catch (error) {
    console.error("Failed to get user profile:", error)
    return null
  }
}

export const updateUserProfile = async (userId: string, profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const existing = await getUserProfile(userId)
    const updated = { ...(existing || {}), ...profileData, timestamp: Date.now() }
    localStorage.setItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`, JSON.stringify(updated))
  } catch (error) {
    console.error("Failed to update user profile:", error)
    throw error
  }
}

// Food Log Management
export const getLogEntries = async (userId: string): Promise<LogEntry[]> => {
  try {
    const logs = localStorage.getItem(`${STORAGE_KEYS.FOOD_LOGS}_${userId}`)
    return logs ? JSON.parse(logs) : []
  } catch (error) {
    console.error("Failed to get log entries:", error)
    return []
  }
}

export const addLogEntry = async (userId: string, entry: LogEntry): Promise<void> => {
  try {
    const logs = await getLogEntries(userId)
    logs.push(entry)
    localStorage.setItem(`${STORAGE_KEYS.FOOD_LOGS}_${userId}`, JSON.stringify(logs))
    // Manually dispatch storage event for same-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: `${STORAGE_KEYS.FOOD_LOGS}_${userId}`,
      newValue: JSON.stringify(logs),
    }));
  } catch (error) {
    console.error("Failed to add log entry:", error)
    throw error
  }
}

export const deleteLogEntry = async (userId: string, entryId: string): Promise<void> => {
  try {
    const logs = await getLogEntries(userId)
    const filtered = logs.filter((log) => log.id !== entryId)
    localStorage.setItem(`${STORAGE_KEYS.FOOD_LOGS}_${userId}`, JSON.stringify(filtered))
     // Manually dispatch storage event for same-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: `${STORAGE_KEYS.FOOD_LOGS}_${userId}`,
      newValue: JSON.stringify(filtered),
    }));
  } catch (error) {
    console.error("Failed to delete log entry:", error)
    throw error
  }
}

// Subscribe to log entries (simulated with callback)
export const subscribeToLogEntries = (userId: string, callback: (entries: LogEntry[]) => void): (() => void) => {
  // Initial load
  getLogEntries(userId).then(callback)

  // Listen for storage changes (for multi-tab sync)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === `${STORAGE_KEYS.FOOD_LOGS}_${userId}`) {
      const entries = e.newValue ? JSON.parse(e.newValue) : []
      callback(entries)
    }
  }

  window.addEventListener("storage", handleStorageChange)

  // Return unsubscribe function
  return () => {
    window.removeEventListener("storage", handleStorageChange)
  }
}
