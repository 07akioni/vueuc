import { defineComponent, h, onBeforeMount, PropType } from 'vue'
import { c } from '../../shared'

const styles = c('.v-x-scroll', {
  overflow: 'auto',
  scrollbarWidth: 'none'
}, [
  c('&::-webkit-scrollbar', {
    width: 0,
    height: 0
  })
])

export default defineComponent({
  name: 'XScroll',
  props: {
    disabled: Boolean,
    onScroll: Function as PropType<(e: Event) => void>
  },
  setup (props, { slots }) {
    function handleWheel (e: WheelEvent): void {
      const preventYWheel =
        (e.currentTarget as HTMLElement).offsetWidth <
        (e.currentTarget as HTMLElement).scrollWidth
      if (!preventYWheel || e.deltaY === 0) return;
      (e.currentTarget as HTMLElement).scrollLeft += e.deltaY + e.deltaX
      e.preventDefault()
    }
    onBeforeMount(() => {
      styles.mount({ id: 'v-x-scroll' })
    })
    return () =>
      h(
        'div',
        {
          onScroll: props.onScroll,
          onWheel: props.disabled ? undefined : handleWheel,
          class: 'v-x-scroll'
        },
        slots.default?.()
      )
  }
})
