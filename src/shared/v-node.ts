import { Slots, VNode } from 'vue'

export function getSlot (slots: Slots, slotName = 'default'): VNode[] {
  const slot = slots[slotName]
  if (slot === undefined) {
    throw new Error(`[vueuc/binder]: slot[${slotName}] is empty.`)
  }
  return slot()
}

export function getFirstVNode (slots: Slots, slotName = 'default'): VNode {
  const slot = slots[slotName]
  if (slot === undefined) {
    throw new Error(`[vueuc/binder]: slot[${slotName}] is empty.`)
  }
  const content = slot()
  // vue will normalize the slot, so slot must be an array
  if (content.length === 1) {
    return content[0]
  } else {
    throw new Error(`[vueuc/binder]: slot[${slotName}] should have exactly one child.`)
  }
}
