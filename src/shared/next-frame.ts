let cbs: Function[] = []

function flushCallbacks (): void {
  cbs.forEach(cb => cb())
  cbs = []
}

export function nextFrame (cb: Function): void {
  cbs.push(cb) === 1 && requestAnimationFrame(flushCallbacks)
}

let onceCbs: Function[] = []

function flushOnceCallbacks (): void {
  onceCbs.forEach(cb => cb())
  onceCbs = []
}

export function nextFrameOnce (cb: Function): void {
  onceCbs.push(cb) === 1 && requestAnimationFrame(flushOnceCallbacks)
}
