import { getDateTimeStamp, onNextTimeout } from './helper'
import type { FrameMotionOptions, FrameMotionScheduler } from '../interface'

export const timer = (options: FrameMotionOptions): FrameMotionScheduler => {
  const { interval } = options
  return {
    onNextFrame: onNextTimeout,
    getTimeStamp: getDateTimeStamp,
    cancelFrameRequest: clearTimeout,
    shouldCallUpdate: (currentTime, timeElapsed) => {
      return timeElapsed >= interval
    }
  }
}
