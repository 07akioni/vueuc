export type Easing = (progress: number) => number

export interface FrameMotionHooks {
  onPlay?: (time: number) => void
  onStop?: (time: number) => void
  onUpdate?: (progress: number, timeElapsed: number) => void
  onComplete?: (time: number) => void
}

export interface FrameMotionOptions extends FrameMotionHooks {
  /**
   * default: 500
   */
  duration?: number
  /**
   * default: (t) => t
   */
  easing?: Easing
}

export interface FrameMotionScheduler
  extends Omit<FrameMotionHooks, 'onUpdate'> {
  // time scheduler
  getTimeStamp?: () => number
  requestFrame?: (callback: (currentTime: number) => void) => any
  cancelFrame?: (handle: any) => void

  shouldCallUpdate?: (currentTime: number, timeElapsed: number) => boolean
  onUpdate?: (time: number) => void
  process?: (timeElapsed: number, duration: number, easing: Easing) => number
}

export interface FrameMotionController {
  play: () => void
  stop: () => void
}
