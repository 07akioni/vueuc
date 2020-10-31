import { defineComponent, renderSlot } from 'vue'
import delegate from './delegate'
import { warn } from '../../shared'

export default defineComponent({
  name: 'ResizeObserver',
  props: {
    onResize: {
      type: Function,
      default: undefined
    },
    initManually: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      registered: false
    }
  },
  mounted () {
    if (this.initManually) return
    this.init()
  },
  beforeUnmount () {
    if (this.registered) {
      delegate.unregisterHandler(this.$el.nextElementSibling)
    }
  },
  methods: {
    init () {
      const el = this.$el as Element | null | undefined
      if (el === undefined || el === null) {
        warn('resize-observer', '$el does not exist.')
      } else if (el.nextElementSibling !== el.nextSibling) {
        warn('resize-observer', '$el can not be observed (it may be a text node).')
      } else if (el.nextElementSibling !== null) {
        delegate.registerHandler(el.nextElementSibling, this.handleResize)
        this.registered = true
      }
    },
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
