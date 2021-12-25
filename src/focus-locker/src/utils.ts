/* eslint-disable @typescript-eslint/strict-boolean-expressions */
// ref https://www.w3.org/TR/wai-aria-practices-1.1/examples/dialog-modal/js/dialog.js

export function focusFirstDescendant (element: Node): boolean {
  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i]
    if (attemptFocus(child) || focusFirstDescendant(child)) {
      return true
    }
  }
  return false
}

export function focusLastDescendant (element: Node): boolean {
  for (let i = element.childNodes.length - 1; i >= 0; i--) {
    const child = element.childNodes[i]
    if (attemptFocus(child) || focusLastDescendant(child)) {
      return true
    }
  }
  return false
}

function attemptFocus (element: Node): boolean {
  if (!isFocusable(element)) {
    return false
  }
  try {
    (element as any).focus()
  } catch (e) {}
  return document.activeElement === element
}

function isFocusable (element: Node): boolean {
  if (
    element instanceof HTMLElement &&
    (element.tabIndex > 0 ||
      (element.tabIndex === 0 && element.getAttribute('tabIndex') !== null))
  ) {
    return true
  }

  if ((element as any).disabled) {
    return false
  }

  switch (element.nodeName) {
    case 'A':
      return !!(element as any).href && (element as any).rel !== 'ignore'
    case 'INPUT':
      return (
        (element as any).type !== 'hidden' && (element as any).type !== 'file'
      )
    case 'BUTTON':
    case 'SELECT':
    case 'TEXTAREA':
      return true
    default:
      return false
  }
}
