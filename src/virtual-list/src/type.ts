// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type ItemData = Record<string, any>

export interface VScrollToOptions extends ScrollToOptions {
  index?: number
  key?: number | string
  position?: 'top' | 'bottom'
  debounce?: boolean
}
