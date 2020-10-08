let cbs: Function[] = []

function flushCallbacks () {
  cbs.forEach(cb => cb())
  cbs = []
}

export function nextFrame (cb: Function) {
  cbs.push(cb) === 1 && requestAnimationFrame(flushCallbacks)
}
