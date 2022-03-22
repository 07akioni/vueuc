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

// frame utils
const supportPerformace =
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  !!performance && typeof performance.now === 'function'

const getDOMHighResTimeStamp = (): number => performance.now()

const getDateTimeStamp = (): number => Date.now()

export const getTimeStamp = supportPerformace
  ? getDOMHighResTimeStamp
  : getDateTimeStamp

const onNextAnimationFrame = (callback: FrameRequestCallback): number =>
  requestAnimationFrame(callback)

const onNextTimeout = (callback: FrameRequestCallback): number =>
  window.setTimeout(() => callback, 1000 / 60)

export const requestFrame = supportPerformace
  ? onNextAnimationFrame
  : onNextTimeout

export function cancelFrame (id: number, isTimeout = false): void {
  if (isTimeout || !supportPerformace) {
    window.clearTimeout(id)
  } else {
    window.cancelAnimationFrame(id)
  }
}
