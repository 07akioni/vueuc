import { ResizeObserver as PolyfillResizeObserver } from '@juggle/resize-observer'

type ResizeHandler = (entry: ResizeObserverEntry) => void

class ResizeObserverDelegate {
  elHandlersMap: Map<Element, ResizeHandler>
  observer: PolyfillResizeObserver

  constructor () {
    this.handleResize = this.handleResize.bind(this)
    this.observer = new ((typeof window !== 'undefined' &&
      window.ResizeObserver) ||
      PolyfillResizeObserver)(this.handleResize)
    this.elHandlersMap = new Map()
  }

  handleResize (
    this: ResizeObserverDelegate,
    entries: ResizeObserverEntry[]
  ): void {
    for (const entry of entries) {
      const handler = this.elHandlersMap.get(entry.target)
      if (handler !== undefined) {
        handler(entry)
      }
    }
  }

  registerHandler (el: Element, handler: ResizeHandler): void {
    this.elHandlersMap.set(el, handler)
    this.observer.observe(el)
  }

  unregisterHandler (el: Element): void {
    if (!this.elHandlersMap.has(el)) {
      return
    }
    this.elHandlersMap.delete(el)
    this.observer.unobserve(el)
  }
}

export default new ResizeObserverDelegate()
