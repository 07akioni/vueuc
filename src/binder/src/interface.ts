export interface BinderInstance {
  targetRef: HTMLElement | null
  setTargetRef: (el: HTMLElement | null) => void
  addScrollListener: (listener: () => void) => void
  removeScrollListener: (listener: () => void) => void
  addResizeListener: (listener: () => void) => void
  removeResizeListener: (listener: () => void) => void
}

export type Placement =
  'top'|
  'bottom'|
  'left'|
  'right'|
  'top-start'|
  'top-end'|
  'left-start'|
  'left-end'|
  'right-start'|
  'right-end'|
  'bottom-start'|
  'bottom-end'

export type NonCenterPlacement =
  'top-start'|
  'top-end'|
  'left-start'|
  'left-end'|
  'right-start'|
  'right-end'|
  'bottom-start'|
  'bottom-end'

export interface Rect {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

export type Align = 'start' | 'end' | 'center'

export type Position = 'left' | 'right' | 'top' | 'bottom'

export type TransformOrigin =
  'top left' |
  'top center' |
  'top right' |
  'bottom left' |
  'bottom' |
  'bottom right' |
  'top left' |
  'center left' |
  'bottom left' |
  'top right' |
  'center right' |
  'bottom right'
