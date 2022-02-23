const supportPerformace = typeof performance.now === 'function'

export const getDOMHighResTimeStamp = (): number => performance.now()

export const getDateTimeStamp = (): number => Date.now()

export const getTimeStamp = supportPerformace
  ? getDOMHighResTimeStamp
  : getDateTimeStamp

export const onNextAnimationFrame = (callback: FrameRequestCallback): number =>
  requestAnimationFrame(callback)

export const onNextTimeout = (callback: FrameRequestCallback): NodeJS.Timeout =>
  setTimeout(() => callback, 1000 / 60)

export const onNextFrame = supportPerformace
  ? onNextAnimationFrame
  : onNextTimeout

export function cancelFrameRequest (
  id: NodeJS.Timeout | number,
  isTimeout = false
): void {
  if (isTimeout || !supportPerformace) {
    clearTimeout(id as NodeJS.Timeout)
  } else {
    cancelAnimationFrame(id as number)
  }
}
