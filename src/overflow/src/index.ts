/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  defineComponent,
  renderSlot,
  h,
  onMounted,
  ref,
  PropType,
  nextTick
} from 'vue'
import { useSsrAdapter } from '@css-render/vue3-ssr'
import { c, cssrAnchorMetaName } from '../../shared'

const hiddenAttr = 'v-hidden'

const style = c('[v-hidden]', {
  display: 'none!important'
})

export interface VOverflowInst {
  sync: () => void
}

export default defineComponent({
  name: 'Overflow',
  props: {
    getCounter: Function as PropType<() => HTMLElement | null>,
    getTail: Function as PropType<() => HTMLElement | null>,
    updateCounter: Function as PropType<(count: number) => void>,
    onUpdateCount: Function as PropType<(count: number) => void>,
    onUpdateOverflow: Function as PropType<(overflow: boolean) => void>
  },
  setup (props, { slots }) {
    const selfRef = ref<HTMLElement | null>(null)
    const counterRef = ref<HTMLElement | null>(null)
    function deriveCounter (options: {
      showAllItemsBeforeCalculate: boolean
    }): void {
      const { value: self } = selfRef
      const { getCounter, getTail } = props
      let counter: HTMLElement | null
      if (getCounter !== undefined) counter = getCounter()
      else {
        counter = counterRef.value
      }
      if (!self || !counter) return
      if (counter.hasAttribute(hiddenAttr)) {
        counter.removeAttribute(hiddenAttr)
      }
      const { children } = self
      if (options.showAllItemsBeforeCalculate) {
        for (const child of children) {
          if (child.hasAttribute(hiddenAttr)) {
            child.setAttribute(hiddenAttr, '')
          }
        }
      }
      const containerWidth = self.offsetWidth
      const childWidths: number[] = []
      const tail = slots.tail ? getTail?.() : null
      let childWidthSum = tail ? tail.offsetWidth : 0
      let overflow = false
      const len = self.children.length - (slots.tail ? 1 : 0)
      for (let i = 0; i < len - 1; ++i) {
        if (i < 0) continue
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
            if (childWidthSum + counterWidth <= containerWidth || j === 0) {
              overflow = true
              i = j - 1
              if (tail) {
                // tail too long or 1st element too long
                // we only consider tail now
                if (i === -1) {
                  tail.style.maxWidth = `${containerWidth - counterWidth}px`
                  tail.style.boxSizing = 'border-box'
                } else {
                  tail.style.maxWidth = ''
                }
              }
              const { onUpdateCount } = props
              if (onUpdateCount) onUpdateCount(restCount)
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
    const ssrAdapter = useSsrAdapter()
    style.mount({
      id: 'vueuc/overflow',
      head: true,
      anchorMetaName: cssrAnchorMetaName,
      ssr: ssrAdapter
    })
    onMounted(() =>
      deriveCounter({
        showAllItemsBeforeCalculate: false
      })
    )
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
    nextTick(() =>
      this.sync({
        showAllItemsBeforeCalculate: false
      })
    )
    // It shouldn't have border
    return h(
      'div',
      {
        class: 'v-overflow',
        ref: 'selfRef'
      },
      [
        renderSlot($slots, 'default'),
        // $slots.counter should only has 1 element
        $slots.counter
          ? $slots.counter()
          : h('span', {
            style: {
              display: 'inline-block'
            },
            ref: 'counterRef'
          }),
        // $slots.tail should only has 1 element
        $slots.tail ? $slots.tail() : null
      ]
    )
  }
})
