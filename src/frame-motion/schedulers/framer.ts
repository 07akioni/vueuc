import { onNextAnimationFrame, getDOMHighResTimeStamp } from './helper'
import type { FrameMotionScheduler } from '../interface'

export const framer = (): FrameMotionScheduler => {
  return {
    onNextFrame: onNextAnimationFrame,
    getTimeStamp: getDOMHighResTimeStamp,
    cancelFrameRequest: (handle: number) => cancelAnimationFrame(handle)
  }
}
