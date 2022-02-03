import { Teleport, h, toRef, computed, defineComponent, PropType } from 'vue'
import { useFalseUntilTruthy } from 'vooks'
import { getSlot } from '../../shared/v-node'

export default defineComponent({
  name: 'LazyTeleport',
  props: {
    to: {
      type: [String, Object] as PropType<string | HTMLElement>,
      default: undefined
    },
    disabled: Boolean,
    show: {
      type: Boolean,
      required: true
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
      ? this.disabled
        ? getSlot('lazy-teleport', this.$slots)
        : h(
          Teleport,
          {
            disabled: this.disabled,
            to: this.mergedTo
          },
          getSlot('lazy-teleport', this.$slots)
        )
      : null
  }
})
