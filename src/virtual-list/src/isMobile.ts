let maybeTouch: boolean | undefined = undefined

export function ensureMaybeTouch(): boolean {
  if (maybeTouch === undefined) {
    maybeTouch = window.matchMedia("(pointer:coarse)").matches
  }
  return maybeTouch
}