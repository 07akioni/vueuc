import { defineComponent, renderSlot, PropType } from 'vue'
import delegate from './delegate'
import { warn } from '../../shared'

export type VResizeObserverOnResize = (entry: ResizeObserverEntry) => void

export default defineComponent({
  name: 'ResizeObserver',
  props: {
    onResize: Function as PropType<VResizeObserverOnResize>
  },
  data () {
    return {
      registered: false
    }
  },
  mounted () {
    const el = this.$el as Element | undefined
    if (el === undefined) {
      warn('resize-observer', '$el does not exist.')
    } else if (el.nextElementSibling !== el.nextSibling) {
      warn('resize-observer', '$el can not be observed (it may be a text node).')
    } else if (el.nextElementSibling !== null) {
      delegate.registerHandler(el.nextElementSibling, this.handleResize)
      this.registered = true
    }
  },
  beforeUnmount () {
    if (this.registered) {
      delegate.unregisterHandler(this.$el.nextElementSibling)
    }
  },
  methods: {
    handleResize (entry: ResizeObserverEntry) {
      const {
        onResize
      } = this
      if (onResize !== undefined) onResize(entry)
    }
  },
  render () {
    return renderSlot(this.$slots, 'default')
  }
})
