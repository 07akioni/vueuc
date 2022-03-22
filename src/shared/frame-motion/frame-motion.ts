import {
  cancelFrame,
  getTimeStamp,
  requestFrame,
  calculateProgress,
  normalizeProgress
} from './utils'
import { easings } from './easing'
import type {
  FrameMotionScheduler,
  FrameMotionController,
  FrameMotionOptions
} from './interface'

type ScheduleRequireKey =
  | 'getTimeStamp'
  | 'requestFrame'
  | 'cancelFrame'
  | 'process'
type Schedule = Omit<FrameMotionScheduler, ScheduleRequireKey> &
Required<Pick<FrameMotionScheduler, ScheduleRequireKey>>

export function createFrameMotion ({
  duration = 500,
  easing = easings.linear,
  onPlay,
  onStop,
  onComplete,
  onUpdate
}: FrameMotionOptions): FrameMotionController {
  const schedule: Schedule = {
    getTimeStamp,
    requestFrame,
    cancelFrame,
    process: (timeElapsed, duration, easing) => {
      return easing(calculateProgress(timeElapsed, duration))
    }
  }

  let startTime: number | null = null
  let timeElapsed = 0

  let frameId: any = null

  let stopping = false
  let completed = false

  const play = (): void => {
    // stop to play
    const isContinue = startTime !== null
    if (completed || (isContinue && !stopping)) {
      return
    }

    const currentTime = (startTime = schedule.getTimeStamp())

    const doWork = (): void => {
      schedule.onPlay?.(currentTime)
      onPlay?.(currentTime)

      schedule.requestFrame(() => work(currentTime))
    }

    if (isContinue) {
      stopping = false
      // When restarting, we need to make up for the time that's gone by.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      startTime -= timeElapsed
    }
    doWork()
  }

  const work = (currentTime: number): void => {
    if (stopping || completed) {
      return
    }
    if (startTime === null) {
      startTime = currentTime
    }

    timeElapsed = currentTime - startTime
    const progress = normalizeProgress(
      schedule.process(timeElapsed, duration, easing)
    )

    const shouldCallUpdate =
      schedule.shouldCallUpdate?.(currentTime, timeElapsed) ?? true
    if (shouldCallUpdate) {
      onUpdate?.(progress, timeElapsed)
    }

    if (progress >= 1 || timeElapsed >= duration) {
      completed = true
      schedule.onComplete?.(currentTime)
      onComplete?.(currentTime)
      return
    }

    frameId = schedule.requestFrame(work)
  }

  const stop = (): void => {
    if (!stopping && !completed) {
      const stopTime = schedule.getTimeStamp()
      stopping = true

      if (frameId !== null) {
        schedule.cancelFrame(frameId)
        frameId = null
      }

      schedule.onStop?.(stopTime)
      onStop?.(stopTime)
    }
  }

  return {
    play,
    stop
  }
}
