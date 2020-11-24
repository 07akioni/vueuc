import {
  h,
  defineComponent
} from 'vue'
import { placements } from '../src/placements'

export default defineComponent({
  props: {
    placement: {
      type: String
    },
    onChange: {
      type: Function
    }
  },
  render () {
    return h('div', { style: { padding: '12px' } }, placements.map(placement =>
      h('label', [
        h('input', {
          type: 'radio',
          value: placement,
          key: placement,
          checked: this.placement === placement,
          onChange: () => {
            const { onChange } = this
            if (onChange !== undefined) {
              onChange(placement)
            }
          }
        }),
        placement
      ])
    ))
  }
})
