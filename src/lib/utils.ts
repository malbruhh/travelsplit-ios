import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return formatDate(dateString)
}

/**
 * Triggers subtle tactile haptic vibration if supported by device/browser
 */
export function triggerHaptic(type: "light" | "medium" | "heavy" | "success" | "warning" | "error" = "light") {
  if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
    switch (type) {
      case "light":
        navigator.vibrate(10)
        break
      case "medium":
        navigator.vibrate(25)
        break
      case "heavy":
        navigator.vibrate(50)
        break
      case "success":
        navigator.vibrate([15, 50, 25])
        break
      case "warning":
        navigator.vibrate([30, 40, 30])
        break
      case "error":
        navigator.vibrate([50, 50, 50])
        break
    }
  }
}
