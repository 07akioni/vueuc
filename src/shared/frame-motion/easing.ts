import type { Easing } from './interface'

export const easings: Record<string, Easing> = {
  linear: (t: number) => t
} as const
