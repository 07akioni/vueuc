/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { defineComponent, inject, withDirectives } from 'vue'
import { BinderInstance } from './interface'
import { getFirstVNode } from '../../shared/v-node'

export default defineComponent({
  name: 'Target',
  setup () {
    const {
      setTargetRef
    } = inject<BinderInstance>('VBinder')!
    const setTargetDirective = {
      mounted: setTargetRef,
      updated: setTargetRef
    }
    return {
      setTargetDirective
    }
  },
  render () {
    const {
      setTargetDirective
    } = this
    return withDirectives(
      getFirstVNode(this.$slots),
      [
        [setTargetDirective]
      ]
    )
  }
})
