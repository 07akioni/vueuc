import { defineComponent, inject } from 'vue'

import { overflowInjectionKey } from './index'

export default defineComponent({
  name: 'OverflowTail',
  setup (_, { slots }) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const overflowContext = inject(overflowInjectionKey, null)!
    return () => {
      return slots.default !== undefined ? slots.default(overflowContext) : null
    }
  }
})
