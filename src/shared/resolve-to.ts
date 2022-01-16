export function resolveTo (selector: string | (() => HTMLElement | null)): HTMLElement | null {
  if (typeof selector === 'string') {
    return document.querySelector(selector)
  }
  return selector()
}
