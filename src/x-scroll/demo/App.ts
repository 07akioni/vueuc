import { defineComponent, h } from 'vue'
import { XScroll } from '../../index'

export default defineComponent({
  render () {
    return [
      'Short',
      h(XScroll, null, { default: () => '1234'.repeat(8) }),
      'Long',
      h(XScroll, null, { default: () => '1234'.repeat(64) })
    ]
  }
})
