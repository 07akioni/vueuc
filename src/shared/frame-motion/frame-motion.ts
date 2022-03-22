import {
  cancelFrame,
  getTimeStamp,
  requestFrame,
  calculateProgress,
  normalizeProgress
} from './utils'
import { easings } from './easing'
import type {
  Easing,
  FrameMotionController,
  FrameMotionOptions
} from './interface'

export function createFrameMotion ({
  duration = 500,
  easing = easings.linear,
  onComplete,
  onUpdate
}: FrameMotionOptions): FrameMotionController {
  let completed = false
  let timeElapsed = 0
  let startTime: number | null = null
  let frameId: number | null = null

  const getProcess = (
    timeElapsed: number,
    duration: number,
    easing: Easing
  ): number => {
    return easing(calculateProgress(timeElapsed, duration))
  }

  const play = (): void => {
    if (completed) {
      return
    }
    const currentTime = (startTime = getTimeStamp())
    const doWork = (): void => {
      requestFrame(() => work(currentTime))
    }
    doWork()
  }

  const work = (currentTime: number): void => {
    if (completed) {
      return
    }
    if (startTime === null) {
      throw new Error('[vueuc/frame-motion]: startTime is null')
    }
    timeElapsed = currentTime - startTime
    const progress = normalizeProgress(
      getProcess(timeElapsed, duration, easing)
    )
    onUpdate(progress, timeElapsed)
    if (progress >= 1 || timeElapsed >= duration) {
      completed = true
      onComplete(currentTime)
      return
    }
    frameId = requestFrame(work)
  }

  const stop = (): void => {
    if (!completed) {
      // abort the motion
      completed = true
    }
    if (frameId !== null) {
      cancelFrame(frameId)
      frameId = null
    }
  }

  return {
    play,
    stop
  }
}
