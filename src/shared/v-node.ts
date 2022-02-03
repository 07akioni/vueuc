import {
  Fragment,
  VNodeChild,
  createTextVNode,
  VNode,
  Comment,
  Slots
} from 'vue'

export function getSlot (scope: string, slots: Slots, slotName = 'default'): VNode[] {
  const slot = slots[slotName]
  if (slot === undefined) {
    throw new Error(`[vueuc/${scope}]: slot[${slotName}] is empty.`)
  }
  return slot()
}

// o(n) flatten
export function flatten (
  vNodes: VNodeChild[],
  filterCommentNode: boolean = true,
  result: VNode[] = []
): VNode[] {
  vNodes.forEach((vNode) => {
    if (vNode === null) return
    if (typeof vNode !== 'object') {
      if (typeof vNode === 'string' || typeof vNode === 'number') {
        result.push(createTextVNode(String(vNode)))
      }
      return
    }
    if (Array.isArray(vNode)) {
      flatten(vNode, filterCommentNode, result)
      return
    }
    if (vNode.type === Fragment) {
      if (vNode.children === null) return
      if (Array.isArray(vNode.children)) {
        flatten(vNode.children, filterCommentNode, result)
      }
      // rawSlot
    } else if (vNode.type !== Comment) {
      result.push(vNode)
    }
  })
  return result
}

export function getFirstVNode (
  scope: string,
  slots: Slots,
  slotName = 'default'
): VNode {
  const slot = slots[slotName]
  if (slot === undefined) {
    throw new Error(`[vueuc/${scope}]: slot[${slotName}] is empty.`)
  }
  const content = flatten(slot())
  // vue will normalize the slot, so slot must be an array
  if (content.length === 1) {
    return content[0]
  } else {
    throw new Error(
      `[vueuc/${scope}]: slot[${slotName}] should have exactly one child.`
    )
  }
}
