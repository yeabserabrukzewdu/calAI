"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { playSound } from "../utils/soundUtils"

export type ToastType = "error" | "success" | "warning" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

const Toast: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = {
    error: "bg-red-50 border-red-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  }[toast.type]

  const textColor = {
    error: "text-red-800",
    success: "text-green-800",
    warning: "text-yellow-800",
    info: "text-blue-800",
  }[toast.type]

  const iconColor = {
    error: "text-red-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  }[toast.type]

  const icons = {
    error: "✕",
    success: "✓",
    warning: "⚠",
    info: "ℹ",
  }

  return (
    <div className={`${bgColor} border rounded-lg p-4 flex items-start gap-3 shadow-lg animate-slide-up`} role="alert">
      <span className={`${iconColor} font-bold text-lg flex-shrink-0`}>{icons[toast.type]}</span>
      <p className={`${textColor} text-sm font-medium flex-1`}>{toast.message}</p>
      <button
        onClick={onClose}
        className={`${iconColor} hover:opacity-70 flex-shrink-0 font-bold`}
        aria-label="Close notification"
      >
        ✕
      </button>
    </div>
  )
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: ToastType = "info") => {
    playSound('notification');
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, showToast, removeToast }
}

export const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-32 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  )
}
