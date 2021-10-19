import { useSsrAdapter } from '@css-render/vue3-ssr'
import { defineComponent, h, PropType, ref } from 'vue'
import { c } from '../../shared'
import type { VXScrollInst } from './interface'
export type { VXScrollInst } from './interface'

const styles = c(
  '.v-x-scroll',
  {
    overflow: 'auto',
    scrollbarWidth: 'none'
  },
  [
    c('&::-webkit-scrollbar', {
      width: 0,
      height: 0
    })
  ]
)

export default defineComponent({
  name: 'XScroll',
  props: {
    disabled: Boolean,
    onScroll: Function as PropType<(e: Event) => void>
  },
  setup () {
    const selfRef = ref<HTMLElement | null>(null)
    function handleWheel (e: WheelEvent): void {
      const preventYWheel =
        (e.currentTarget as HTMLElement).offsetWidth <
        (e.currentTarget as HTMLElement).scrollWidth
      if (!preventYWheel || e.deltaY === 0) return;
      (e.currentTarget as HTMLElement).scrollLeft += e.deltaY + e.deltaX
    }

    const ssrAdapter = useSsrAdapter()
    styles.mount({
      id: 'vueuc/x-scroll',
      head: true,
      ssr: ssrAdapter
    })

    const exposedMethods: VXScrollInst = {
      scrollTo (...args: any[]) {
        selfRef.value?.scrollTo(...args)
      }
    }
    return {
      selfRef,
      handleWheel,
      ...exposedMethods
    }
  },
  render () {
    return h(
      'div',
      {
        ref: 'selfRef',
        onScroll: this.onScroll,
        onWheelPassive: this.disabled ? undefined : this.handleWheel,
        class: 'v-x-scroll'
      },
      this.$slots
    )
  }
})
