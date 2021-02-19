import { defineComponent, h, renderSlot, onBeforeMount } from 'vue'
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
    disabled: Boolean
  },
  setup (props, { slots }) {
    function handleWheel (e: WheelEvent): void {
      const preventYWheel =
        (e.target as HTMLElement).offsetLeft <
        (e.target as HTMLElement).scrollWidth
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
          onWheel: props.disabled ? undefined : handleWheel,
          class: 'v-x-scroll'
        },
        [renderSlot(slots, 'default')]
      )
  }
})
