import { defineComponent, renderSlot, h, onMounted, ref, PropType, nextTick } from 'vue'
import { c } from '../../shared'

const hiddenAttr = 'v-hidden'

const style = c('[v-hidden]', {
  display: 'none!important'
})

export interface VOverflowRef {
  sync: () => void
}

export default defineComponent({
  name: 'Overflow',
  props: {
    getCounter: Function as PropType<() => HTMLElement | null>,
    getTail: Function as PropType<() => HTMLElement | null>,
    updateCounter: Function as PropType<(count: number) => void>,
    onUpdateOverflow: Function as PropType<(overflow: boolean) => void>
  },
  setup (props, { slots }) {
    const selfRef = ref<HTMLElement | null>(null)
    const counterRef = ref<HTMLElement | null>(null)
    function deriveCounter (): void {
      const {
        value: self
      } = selfRef
      const { getCounter, getTail } = props
      let counter: HTMLElement | null
      if (getCounter !== undefined) counter = getCounter()
      else {
        counter = counterRef.value
      }
      if (self === null || counter === null) return
      if (counter.hasAttribute(hiddenAttr)) {
        counter.removeAttribute(hiddenAttr)
      }
      const { children } = self
      const containerWidth = self.offsetWidth
      const childWidths: number[] = []
      let childWidthSum = slots.tail === undefined ? 0 : (getTail?.()?.offsetWidth ?? 0)
      let overflow = false
      const len = self.children.length - (slots.tail === undefined ? 0 : 1)
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
          const { updateCounter } = props
          for (let j = i; j >= 0; --j) {
            const restCount = len - 1 - j
            if (updateCounter !== undefined) {
              updateCounter(restCount)
            } else {
              counter.textContent = `${restCount}`
            }
            const counterWidth = counter.offsetWidth
            childWidthSum -= childWidths[j]
            if (childWidthSum + counterWidth <= containerWidth) {
              overflow = true
              i = j - 1
              break
            }
          }
        }
      }
      const { onUpdateOverflow } = props
      if (!overflow) {
        if (onUpdateOverflow !== undefined) {
          onUpdateOverflow(false)
        }
        counter.setAttribute(hiddenAttr, '')
      } else {
        if (onUpdateOverflow !== undefined) {
          onUpdateOverflow(true)
        }
      }
    }
    style.mount({
      id: 'v-overflow'
    })
    onMounted(deriveCounter)
    // besides onMounted, other case should be manually triggered, or we shoud watch items
    return {
      selfRef,
      counterRef,
      sync: deriveCounter
    }
  },
  render () {
    const { $slots } = this
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    nextTick(this.sync)
    // It shouldn't have border
    return h('div', {
      class: 'v-overflow',
      ref: 'selfRef'
    }, [
      renderSlot($slots, 'default'),
      // $slots.counter should only has 1 element
      $slots.counter !== undefined
        ? $slots.counter()
        : h('span', {
          style: {
            display: 'inline-block'
          },
          ref: 'counterRef'
        }),
      // $slots.tail should only has 1 element
      $slots.tail !== undefined
        ? $slots.tail()
        : null
    ])
  }
})
