/* eslint-disable @typescript-eslint/strict-boolean-expressions */
// ref https://www.w3.org/TR/wai-aria-practices-1.1/examples/dialog-modal/js/dialog.js

function isHTMLElement (node: Node): node is HTMLElement {
  return node instanceof HTMLElement
}

export function focusFirstDescendant (node: Node): boolean {
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i]
    if (isHTMLElement(child)) {
      if (attemptFocus(child) || focusFirstDescendant(child)) {
        return true
      }
    }
  }
  return false
}

export function focusLastDescendant (element: Node): boolean {
  for (let i = element.childNodes.length - 1; i >= 0; i--) {
    const child = element.childNodes[i]
    if (isHTMLElement(child)) {
      if (attemptFocus(child) || focusLastDescendant(child)) {
        return true
      }
    }
  }
  return false
}

function attemptFocus (element: HTMLElement): boolean {
  if (!isFocusable(element)) {
    return false
  }
  try {
    element.focus({ preventScroll: true })
  } catch (e) {}
  return document.activeElement === element
}

function isFocusable (element: HTMLElement): boolean {
  if (
    element.tabIndex > 0 ||
    (element.tabIndex === 0 && element.getAttribute('tabIndex') !== null)
  ) {
    return true
  }

  if (element.getAttribute('disabled')) {
    return false
  }

  switch (element.nodeName) {
    case 'A':
      return (
        !!(element as HTMLAnchorElement).href &&
        (element as HTMLAnchorElement).rel !== 'ignore'
      )
    case 'INPUT':
      return (
        (element as HTMLInputElement).type !== 'hidden' &&
        (element as HTMLInputElement).type !== 'file'
      )
    case 'BUTTON':
    case 'SELECT':
    case 'TEXTAREA':
      return true
    default:
      return false
  }
}
