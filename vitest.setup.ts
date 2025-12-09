let _isJsdom: boolean | undefined

function isJsdom(): boolean {
  if (_isJsdom === undefined) {
    _isJsdom
      = navigator.userAgent.includes('Node.js')
        || navigator.userAgent.includes('jsdom')
  }
  return _isJsdom
}

class _ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function _matchMedia(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }
}

if (isJsdom() && typeof window !== 'undefined') {
  window.matchMedia = _matchMedia
}