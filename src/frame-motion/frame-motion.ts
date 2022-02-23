import {
  framer,
  timer,
  cancelFrameRequest,
  getTimeStamp,
  onNextFrame
} from './schedulers'
import { easings } from './easing'
import type {
  FrameMotionScheduler,
  FrameMotionUserControls,
  FrameMotionUserOptions
} from './interface'
import { calculateProgress, normalizeProgress } from './utils'

type ScheduleRequireKey =
  | 'getTimeStamp'
  | 'onNextFrame'
  | 'cancelFrameRequest'
  | 'process'
type Schedule = Omit<FrameMotionScheduler, ScheduleRequireKey> &
Required<Pick<FrameMotionScheduler, ScheduleRequireKey>>

export function frameMotion (
  userOptions: FrameMotionUserOptions
): FrameMotionUserControls {
  const options = {
    delay: 0,
    interval: 0,
    duration: 500,
    easing: easings.linear,
    autoplay: false,
    ...userOptions
  }

  const {
    duration,
    interval,
    delay,
    autoplay,
    easing,
    onPlay,
    onStop,
    onComplete,
    onUpdate
  } = options

  const schedule: Schedule = {
    getTimeStamp,
    onNextFrame,
    cancelFrameRequest,
    process: (timeElapsed, duration, easing) => {
      return easing(calculateProgress(timeElapsed, duration))
    },
    ...(options.scheduler ??
      // When the interval is fixed, setTimeout tends to be more accurate
      (interval > 0 ? timer(options) : framer()))
  }

  let startTime: number | null = null
  let timeElapsed = 0

  let delayTimer: NodeJS.Timeout | null = null
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

      work(currentTime)
    }

    if (isContinue) {
      stopping = false
      // When restarting, we need to make up for the time that's gone by.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      startTime -= timeElapsed
      doWork()
    } else {
      if (delayTimer !== null) {
        // in delay
        return
      }

      if (delay > 0) {
        delayTimer = setTimeout(doWork, delay)
      } else {
        doWork()
      }
    }
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

    if (progress === 1) {
      completed = true
      schedule.onComplete?.(currentTime)
      onComplete?.(currentTime)
      return
    }

    frameId = schedule.onNextFrame(work)
  }

  const stop = (): void => {
    if (!stopping && !completed) {
      const stopTime = schedule.getTimeStamp()
      stopping = true

      if (delayTimer !== null) {
        clearTimeout(delayTimer)
        delayTimer = null
      }

      if (frameId !== null) {
        schedule.cancelFrameRequest(frameId)
        frameId = null
      }

      schedule.onStop?.(stopTime)
      onStop?.(stopTime)
    }
  }

  if (autoplay) {
    play()
  }

  return {
    play,
    stop
  }
}
