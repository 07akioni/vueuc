import {
  defineComponent,
  renderSlot,
  PropType,
  getCurrentInstance,
  onMounted,
  onBeforeUnmount
} from 'vue'
import delegate from './delegate'
import { warn } from '../../shared'

export type VResizeObserverOnResize = (entry: ResizeObserverEntry) => void

export default defineComponent({
  name: 'ResizeObserver',
  props: {
    onResize: Function as PropType<VResizeObserverOnResize>
  },
  setup (props) {
    let registered = false
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const proxy = getCurrentInstance()!.proxy!
    function handleResize (entry: ResizeObserverEntry): void {
      const { onResize } = props
      if (onResize !== undefined) onResize(entry)
    }
    onMounted(() => {
      const el = proxy.$el as Element | undefined
      if (el === undefined) {
        warn('resize-observer', '$el does not exist.')
        return
      }
      if (el.nextElementSibling !== el.nextSibling) {
        if (el.nodeType === 3 && el.nodeValue !== '') {
          warn(
            'resize-observer',
            '$el can not be observed (it may be a text node).'
          )
          return
        }
      }
      if (el.nextElementSibling !== null) {
        delegate.registerHandler(el.nextElementSibling, handleResize)
        registered = true
      }
    })

    onBeforeUnmount(() => {
      if (registered) {
        delegate.unregisterHandler(proxy.$el.nextElementSibling)
      }
    })
  },
  render () {
    return renderSlot(this.$slots, 'default')
  }
})
