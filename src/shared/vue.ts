export function isHideByVShow (el: HTMLElement): boolean {
  let cursor: HTMLElement | null = el
  while (cursor !== null) {
    if (cursor.style.display === 'none') return true
    cursor = cursor.parentElement
  }
  return false
}
