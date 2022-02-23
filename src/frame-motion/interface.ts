export type Easing = (progress: number) => number

export interface FrameMotionHooks {
  onPlay?: (time: number) => void
  onStop?: (time: number) => void
  onUpdate?: (progress: number, timeElapsed: number) => void
  onComplete?: (time: number) => void
}

export interface FrameMotionOptions extends FrameMotionHooks {
  /**
   * default: 0
   */
  delay: number
  /**
   * default: 0
   */
  interval: number
  /**
   * default: 500
   */
  duration: number
  /**
   * default: (t) => t
   */
  easing: Easing
  /**
   * default: false
   */
  autoplay?: boolean
  scheduler?: FrameMotionScheduler
}

export type FrameMotionUserOptions = Partial<FrameMotionOptions>

export interface FrameMotionScheduler
  extends Omit<FrameMotionHooks, 'onUpdate'> {
  // time scheduler
  getTimeStamp?: () => number
  onNextFrame?: (callback: (currentTime: number) => void) => any
  cancelFrameRequest?: (handle: any) => void

  shouldCallUpdate?: (currentTime: number, timeElapsed: number) => boolean
  onUpdate?: (time: number) => void
  process?: (timeElapsed: number, duration: number, easing: Easing) => number
}

export interface FrameMotionUserControls {
  play: () => void
  stop: () => void
}
