import { Rect } from './interface'

let viewMeasurer: HTMLElement | null = null

export function elementExists(el: HTMLElement): boolean {
  return el.clientWidth > 0 || el.clientHeight > 0 || document.contains(viewMeasurer)
}

export function ensureViewBoundingRect (): DOMRect {
  if (viewMeasurer === null || !elementExists(viewMeasurer)) {
    viewMeasurer = document.getElementById('v-binder-view-measurer')
    if (viewMeasurer === null) {
      viewMeasurer = document.createElement('div')
      viewMeasurer.id = 'v-binder-view-measurer'
      const { style } = viewMeasurer
      style.position = 'fixed'
      style.left = '0'
      style.right = '0'
      style.top = '0'
      style.bottom = '0'
      style.pointerEvents = 'none'
      style.visibility = 'hidden'
      document.body.appendChild(viewMeasurer)
    }
  }
  return viewMeasurer.getBoundingClientRect()
}

export function getPointRect (x: number, y: number): Rect {
  const viewRect = ensureViewBoundingRect()
  return {
    top: y,
    left: x,
    height: 0,
    width: 0,
    right: viewRect.width - x,
    bottom: viewRect.height - y
  }
}

export function getRect (el: HTMLElement): Rect {
  const elRect = el.getBoundingClientRect()
  const viewRect = ensureViewBoundingRect()
  return {
    left: elRect.left - viewRect.left,
    top: elRect.top - viewRect.top,
    bottom: viewRect.height + viewRect.top - elRect.bottom,
    right: viewRect.width + viewRect.left - elRect.right,
    width: elRect.width,
    height: elRect.height
  }
}

export function getParentNode (node: Node): Node | null {
  // document type
  if (node.nodeType === 9) {
    return null
  }
  return node.parentNode
}

export function getScrollParent (
  node: Node | null
): HTMLElement | Document | null {
  if (node === null) return null

  const parentNode = getParentNode(node)

  if (parentNode === null) {
    return null
  }

  // Document
  if (parentNode.nodeType === 9) {
    return document
  }

  // Element
  if (parentNode.nodeType === 1) {
    // Firefox want us to check `-x` and `-y` variations as well
    const { overflow, overflowX, overflowY } = getComputedStyle(
      parentNode as HTMLElement
    )
    if (/(auto|scroll|overlay)/.test(overflow + overflowY + overflowX)) {
      return parentNode as HTMLElement
    }
  }

  return getScrollParent(parentNode)
}
