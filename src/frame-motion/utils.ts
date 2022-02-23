export function validateTime (time: unknown): boolean {
  return time !== null && time !== undefined
}

export function normalizeProgress (progress: number): number {
  return Math.max(0, Math.min(Math.abs(progress), 1))
}

export function calculateProgress (
  timeElapsed: number,
  duration?: number
): number {
  return duration !== undefined ? normalizeProgress(timeElapsed / duration) : 1
}
