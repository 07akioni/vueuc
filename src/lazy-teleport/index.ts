import { Teleport, h, toRef, computed, defineComponent, PropType } from 'vue'
import { useFalseUntilTruthy } from 'vooks'
import { getSlot } from '../shared/v-node'

export default defineComponent({
  name: 'LazyTeleport',
  props: {
    to: {
      type: [String, Object] as PropType<string | HTMLElement>,
      default: undefined
    },
    disabled: {
      type: Boolean,
      default: false
    },
    show: {
      type: Boolean,
      required: true
    },
    adjustTo: {
      type: Boolean,
      default: false
    }
  },
  setup (props) {
    return {
      showTeleport: useFalseUntilTruthy(toRef(props, 'show')),
      mergedTo: computed(() => {
        const { to } = props
        return to ?? 'body'
      })
    }
  },
  render () {
    return this.showTeleport
      ? (
        this.disabled
          ? getSlot(this.$slots)
          : h(Teleport, {
            disabled: this.disabled,
            to: this.mergedTo
          }, [
            getSlot(this.$slots)
          ]))
      : null
  }
})
