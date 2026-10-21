import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function riskClassName(label) {
  if (!label) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  const l = label.toLowerCase()
  if (l === 'extreme') return 'bg-red-500/15 text-red-400 border-red-500/30'
  if (l === 'high') return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
  if (l === 'moderate') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
}
