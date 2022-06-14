let maybeTouch: boolean | undefined = undefined

export function ensureMaybeTouch(): boolean {
  if (maybeTouch === undefined) {
    maybeTouch = window.matchMedia("(pointer:coarse)").matches
  }
  return maybeTouch
}

let wheelScale: number | undefined = undefined

export function ensureWheelScale(): number {
  if (wheelScale === undefined) {
    wheelScale = 'chrome' in window 
      ? window.devicePixelRatio 
      : 1
  }
  return wheelScale
}