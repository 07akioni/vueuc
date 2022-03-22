export type Easing = (progress: number) => number

export interface FrameMotionOptions {
  onUpdate: (progress: number, timeElapsed: number) => void
  onComplete: (time: number) => void
  /**
   * default: 500
   */
  duration?: number
  /**
   * default: (t) => t
   */
  easing?: Easing
}

export interface FrameMotionController {
  play: () => void
  abort: () => void
}
