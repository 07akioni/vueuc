import { defineComponent, renderSlot, h, onMounted, ref, onUpdated, PropType, InjectionKey, reactive, provide } from 'vue'
import { c } from '../../shared'
import Tail from './Tail'

const hiddenAttr = 'v-hidden'

const style = c('[v-hidden]', {
  display: 'none!important'
})

export interface VOverflowInjection {
  rest: any[] | undefined
  overflow: boolean
}

export const overflowInjectionKey: InjectionKey<VOverflowInjection> = Symbol('VOverflow')

export default defineComponent({
  name: 'Overflow',
  props: {
    getTail: Function as PropType<() => HTMLElement | null>,
    updateTail: Function as PropType<(count: number) => void>,
    items: Array
  },
  setup (props) {
    const selfRef = ref<HTMLElement | null>(null)
    const tailRef = ref<HTMLElement | null>(null)
    const overflowContext = reactive<VOverflowInjection>({
      rest: undefined,
      overflow: false
    })
    provide(overflowInjectionKey, overflowContext)
    function deriveTail (): void {
      const {
        value: self
      } = selfRef
      const { getTail } = props
      let tail: HTMLElement | null
      if (getTail !== undefined) tail = getTail()
      else {
        tail = tailRef.value
      }
      if (self === null || tail === null) return
      if (tail.hasAttribute(hiddenAttr)) {
        tail.removeAttribute(hiddenAttr)
      }
      const { children } = self
      const containerWidth = self.offsetWidth
      const childWidths: number[] = []
      let childWidthSum = 0
      let overflow = false
      const len = self.children.length
      const { items } = props
      for (let i = 0; i < len - 1; ++i) {
        const child = children[i]
        if (overflow) {
          if (!child.hasAttribute(hiddenAttr)) {
            child.setAttribute(hiddenAttr, '')
          }
          continue
        } else if (child.hasAttribute(hiddenAttr)) {
          child.removeAttribute(hiddenAttr)
        }
        const childWidth = (child as HTMLElement).offsetWidth
        childWidthSum += childWidth
        childWidths[i] = childWidth
        if (childWidthSum > containerWidth) {
          const { updateTail } = props
          for (let j = i; j >= 0; --j) {
            const restCount = len - 1 - j
            if (updateTail !== undefined) {
              updateTail(restCount)
            } else {
              tail.textContent = `${restCount}`
            }
            const tailWidth = tail.offsetWidth
            childWidthSum -= childWidths[j]
            if (childWidthSum + tailWidth <= containerWidth) {
              overflow = true
              i = j - 1
              if (items !== undefined) {
                overflowContext.rest = items.slice(j, items.length)
              }
              break
            }
          }
        }
      }
      if (!overflow) {
        overflowContext.overflow = false
        tail.setAttribute(hiddenAttr, '')
      } else {
        overflowContext.overflow = true
      }
    }
    style.mount({
      id: 'v-overflow'
    })
    onMounted(deriveTail)
    onUpdated(deriveTail)
    return {
      selfRef,
      tailRef,
      sync: deriveTail
    }
  },
  render () {
    const { $slots } = this
    // It shouldn't have border
    return h('div', {
      class: 'v-overflow',
      ref: 'selfRef'
    }, [
      renderSlot($slots, 'default'),
      // $slots.tail should only has 1 element
      $slots.tail !== undefined
        ? h(Tail, undefined, {
          default: $slots.tail
        })
        : h('span', {
          style: {
            display: 'inline-block'
          },
          ref: 'tailRef'
        })
    ])
  }
})
